import { getAuth } from "@clerk/express";
import crypto from "node:crypto";
import sql from "./db.js";
import { SWIFT_BASE, swiftConfigured, swiftHeaders, swiftWalletAvailableMinor } from "./swiftdata.js";

const INSTANT_RATE = 1.0195; // customer pays the price plus the 1.95% Paystack fee. Add your own margin here
const r2 = (n) => Math.round(n * 100) / 100;

const NAMES = { mtn: "MTN", telecel: "Telecel", airteltigo: "AirtelTigo" };
const PREFIXES = {
  mtn: ["024", "025", "053", "054", "055", "059"],
  telecel: ["020", "050"],
  airteltigo: ["026", "027", "056", "057"],
};

// SwiftData names the network in its own words
const networkId = (name) => {
  const n = String(name || "").toLowerCase();
  if (n.includes("mtn")) return "mtn";
  if (n.includes("telecel") || n.includes("vodafone")) return "telecel";
  if (n.includes("airtel") || n.includes("tigo") || n === "at") return "airteltigo";
  return null;
};

const STATUS_MAP = {
  processed: "delivered", completed: "delivered", delivered: "delivered", success: "delivered", successful: "delivered",
  failed: "failed", cancelled: "failed", canceled: "failed", rejected: "failed",
  refunded: "refunded",
  pending: "processing", processing: "processing", retrying: "processing", queued: "processing", waiting: "processing",
};
const mapStatus = (raw) => STATUS_MAP[String(raw ?? "pending").trim().toLowerCase()] ?? "processing";

const normalize = (p) => ({
  id: Number(p.id),
  name: String(p.name ?? ""),
  network: networkId(p.network),
  isFlexi: !!p.isFlexi,
  costMinor: p.priceMinor != null ? Number(p.priceMinor) : null, // fixed packages only
  price: p.priceMinor != null ? r2((Number(p.priceMinor) / 100) * INSTANT_RATE) : null, // what the customer pays
  payableRatio: p.payableRatio != null ? Number(p.payableRatio) : null,
  minAmount: p.minAmountMajor != null ? Number(p.minAmountMajor) : null,
  maxAmount: p.maxAmountMajor != null ? Number(p.maxAmountMajor) : null,
  dataAmount: p.dataAmount ? String(p.dataAmount) : null,
  validity: p.validity ? String(p.validity) : null,
});

// The catalogue is kept for 30 seconds so the screen stays quick
let cache = { at: 0, data: null };
async function getInstantCatalog(maxAgeMs = 30_000) {
  if (cache.data && Date.now() - cache.at < maxAgeMs) return cache.data;
  try {
    const res = await fetch(`${SWIFT_BASE}/v2/instant-bundles`, { headers: swiftHeaders(), signal: AbortSignal.timeout(10_000) });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success || !json.data) throw new Error(`HTTP ${res.status}`);
    const d = json.data;
    cache = {
      at: Date.now(),
      data: {
        available: !!d.available,
        flexiPayRatio: d.flexiPayRatio != null ? Number(d.flexiPayRatio) : null,
        packages: (d.packages ?? []).map(normalize).filter((p) => p.network && Number.isInteger(p.id)),
      },
    };
  } catch (e) {
    console.error("[mobile instant] catalogue failed:", e.message);
    if (!cache.data || Date.now() - cache.at > 10 * 60_000) throw e; // otherwise serve the last copy
  }
  return cache.data;
}

// PIECE 4: callSwiftInstant and fulfillMobileInstant go here

export function registerMobileInstantRoutes(app, { verifyMobilePayment, paymentMatches }) {
  // The shelf: SwiftData's packages with the customer's price
  app.get("/api/mobile/instant/catalog", async (req, res) => {
    try {
      const { userId } = getAuth(req);
      if (!userId) return res.status(401).json({ success: false, message: "Please sign in to continue." });

      const c = await getInstantCatalog();
      return res.json({
        success: true,
        available: c.available,
        packages: c.packages.map(({ id, name, network, isFlexi, price, minAmount, maxAmount, dataAmount, validity }) => ({
          id, name, network, isFlexi, price, minAmount, maxAmount, dataAmount, validity,
        })),
      });
    } catch (error) {
      return res.status(502).json({ success: false, message: "Instant bundles are unavailable right now. Please try again." });
    }
  });

  // PIECE 3: the checkout route goes here
  // Step 1: check the package, number and price, then save a pending checkout
  app.post("/api/mobile/instant/checkout", async (req, res) => {
    try {
      const { userId } = getAuth(req);
      if (!userId) return res.status(401).json({ success: false, message: "Please sign in to continue." });

      const packageId = Number(req.body?.packageId);
      const phone = String(req.body?.phone || "").trim();
      const amountMajor = r2(Number(req.body?.amountMajor));
      const expectedTotal = Number(req.body?.expectedTotal);

      if (!Number.isInteger(packageId)) return res.status(400).json({ success: false, message: "Choose a package." });
      if (!/^0\d{9}$/.test(phone)) return res.status(400).json({ success: false, message: "Enter a valid 10-digit phone number." });

      let catalog;
      try {
        catalog = await getInstantCatalog(15_000);
      } catch {
        return res.status(502).json({ success: false, message: "Instant bundles are unavailable right now. Please try again." });
      }
      if (!catalog.available) return res.status(503).json({ success: false, message: "Instant bundles are not available right now." });

      const pkg = catalog.packages.find((p) => p.id === packageId);
      if (!pkg) return res.status(404).json({ success: false, message: "That package is no longer listed." });

      if (!PREFIXES[pkg.network].includes(phone.slice(0, 3))) {
        return res.status(400).json({ success: false, message: `This number is not on ${NAMES[pkg.network]}. Check the number or choose another network.` });
      }

      // The price comes from the catalogue, never from the app
      let base, costMinor;
      if (pkg.isFlexi) {
        const min = pkg.minAmount ?? 1;
        const max = pkg.maxAmount ?? 1000;
        if (!Number.isFinite(amountMajor) || amountMajor < min || amountMajor > max) {
          return res.status(400).json({ success: false, message: `Enter an amount between GHS ${min} and GHS ${max}.` });
        }
        base = amountMajor;
        costMinor = Math.ceil(amountMajor * 100 * (pkg.payableRatio ?? catalog.flexiPayRatio ?? 1));
      } else {
        if (pkg.costMinor == null) return res.status(409).json({ success: false, message: "This package has no price right now." });
        base = pkg.costMinor / 100;
        costMinor = pkg.costMinor;
      }

      const total = r2(base * INSTANT_RATE);
      if (Number.isFinite(expectedTotal) && Math.abs(expectedTotal - total) > 0.011) {
        return res.status(409).json({ success: false, message: "The price changed. Refresh and try again." });
      }

      // Three quick checks at the same time
      const [users, active, walletMinor] = await Promise.all([
        sql`SELECT email FROM public.ecodata_users WHERE clerk_user_id = ${userId} LIMIT 1`,
        sql`SELECT 1 FROM orders
            WHERE phone = ${phone} AND status IN ('processing', 'pending', 'unknown')
              AND created_at > NOW() - INTERVAL '30 minutes' LIMIT 1`,
        swiftWalletAvailableMinor(),
      ]);

      const email = String(users[0]?.email || "").trim();
      if (!email) return res.status(409).json({ success: false, message: "Your account email is unavailable. Please update your account." });
      if (active.length) return res.status(409).json({ success: false, message: "This number already has an active order." });

      // Never take a payment that SwiftData could not fulfil
      if (walletMinor !== null && walletMinor < costMinor) {
        console.error("[mobile instant] provider wallet too low for package", packageId);
        return res.status(503).json({ success: false, message: "Instant bundles are temporarily unavailable. Please try again later." });
      }

      const line = {
        type: "instant",
        packageId,
        name: pkg.name,
        network: pkg.network,
        phone,
        isFlexi: pkg.isFlexi,
        amountMajor: pkg.isFlexi ? amountMajor : null,
        size: pkg.isFlexi ? "Flexi" : pkg.dataAmount || "Instant", // the Orders screen shows this
        price: r2(base),
      };
      const reference = "ECI" + crypto.randomUUID().replace(/-/g, "").slice(0, 20).toUpperCase();

      await sql`
        INSERT INTO checkouts (reference, clerk_user_id, lines, amount, status, refund_due, kind, created_at, updated_at)
        VALUES (${reference}, ${userId}, ${JSON.stringify([line])}::jsonb, ${total}, 'pending', 0, 'instant', NOW(), NOW())`;

      // The app opens Paystack with this reference, so the server does not initialize it
      return res.json({ success: true, reference, amount: total, email });
    } catch (error) {
      console.error("[EcoData mobile instant checkout]", error.message);
      return res.status(500).json({ success: false, message: "Unable to start checkout. Please try again." });
    }
  });



  // After payment: verify with Paystack, then send the order to SwiftData
  app.post("/api/mobile/instant/confirm", async (req, res) => {
    try {
      const { userId } = getAuth(req);
      if (!userId) return res.status(401).json({ success: false, message: "Please sign in to continue." });

      const reference = String(req.body?.reference || "").trim();
      if (!/^ECI[A-F0-9]{20}$/.test(reference)) return res.status(400).json({ success: false, message: "Invalid payment reference." });

      const [checkout] = await sql`
        SELECT reference, amount, status FROM checkouts
        WHERE reference = ${reference} AND clerk_user_id = ${userId} AND kind = 'instant' LIMIT 1`;
      if (!checkout) return res.status(404).json({ success: false, message: "Checkout not found." });

      if (checkout.status !== "pending") {
        return res.json({ success: checkout.status === "fulfilled", status: checkout.status, reference, message: "This order has already been handled." });
      }

      const tx = await verifyMobilePayment(reference);
      if (!paymentMatches(checkout, tx)) {
        return res.json({ success: false, status: "pending", reference, message: "Payment has not been confirmed yet." });
      }

      const result = await fulfillMobileInstant(reference, userId, Math.round(Number(tx.amount)));
      return res.json({ success: result.status === "fulfilled", status: result.status, reference, message: result.message });
    } catch (error) {
      console.error("[EcoData mobile instant confirm]", error.response?.data || error.message);
      return res.status(500).json({ success: false, message: "Unable to confirm payment right now." });
    }
  });



  // PIECE 4: the confirm and reconcile routes go here
    // POST /v2/instant-bundles. There is no client reference, so this is never retried.
async function callSwiftInstant(line) {
  if (!swiftConfigured()) return { kind: "rejected", reason: "SwiftData is not configured" };

  const body = { packageId: line.packageId, phone: line.phone };
  if (line.isFlexi) body.amountMajor = String(Number(Number(line.amountMajor).toFixed(2)));

  let res, json;
  try {
    res = await fetch(`${SWIFT_BASE}/v2/instant-bundles`, {
      method: "POST", headers: swiftHeaders(), body: JSON.stringify(body), signal: AbortSignal.timeout(30_000),
    });
    json = await res.json().catch(() => null);
  } catch (e) {
    return { kind: "uncertain", reason: e.message }; // a timeout does not prove it was refused
  }

  if (json?.success === true && json.data?.publicId) {
    const d = json.data;
    const status = mapStatus(d.status);
    if (status === "failed" || status === "refunded") return { kind: "rejected", reason: `Provider status: ${d.status}` };
    return {
      kind: "ok",
      publicId: String(d.publicId),
      status,
      providerStatus: String(d.status ?? "pending"),
      costMinor: d.costMinor != null ? Number(d.costMinor) : null,
    };
  }

  // "Service not configured" means nothing was processed
  if (res.status === 503 && json?.error?.code === "SERVICE_UNAVAILABLE") {
    return { kind: "rejected", reason: String(json.error.message ?? "Service unavailable") };
  }
  if (res.status >= 500 || res.status === 408 || res.status === 499 || !json) {
    return { kind: "uncertain", reason: `HTTP ${res.status}` };
  }
  return { kind: "rejected", reason: String(json?.error?.message ?? json?.message ?? `HTTP ${res.status}`) };
  }
  

  // Finishes an order that was paid but never confirmed (app closed, connection dropped)
  app.post("/api/mobile/instant/reconcile", async (req, res) => {
    try {
      const { userId } = getAuth(req);
      if (!userId) return res.status(401).json({ success: false, message: "Please sign in to continue." });

      const rows = await sql`
        SELECT reference, amount FROM checkouts
        WHERE clerk_user_id = ${userId} AND kind = 'instant' AND status = 'pending'
          AND created_at > NOW() - INTERVAL '24 hours' AND created_at < NOW() - INTERVAL '20 seconds'
        ORDER BY created_at DESC LIMIT 5`;

      const results = [];
      for (const row of rows) {
        try {
          const tx = await verifyMobilePayment(row.reference);
          if (paymentMatches(row, tx)) {
            const r = await fulfillMobileInstant(row.reference, userId, Math.round(Number(tx.amount)));
            results.push({ reference: row.reference, status: r.status });
          }
        } catch (e) {
          console.error("[mobile instant reconcile]", row.reference, e.message);
        }
      }
      return res.json({ success: true, results });
    } catch (error) {
      console.error("[EcoData mobile instant reconcile]", error.message);
      return res.status(500).json({ success: false, message: "Unable to reconcile right now." });
    }
  });

}


// After a verified payment. The order is saved first, in the same table as data orders.
export async function fulfillMobileInstant(reference, userId, paidPesewas) {
  const claimed = await sql`
    UPDATE checkouts SET status = 'processing', updated_at = NOW()
    WHERE reference = ${reference} AND clerk_user_id = ${userId} AND kind = 'instant'
      AND status = 'pending' AND ROUND(amount * 100) = ${paidPesewas}
    RETURNING lines, amount`;

  if (!claimed.length) {
    const [c] = await sql`SELECT status FROM checkouts WHERE reference = ${reference} AND clerk_user_id = ${userId} LIMIT 1`;
    return { status: c?.status || "not_found", message: "This checkout has already been handled." };
  }

  const line = claimed[0].lines?.[0];
  const paid = Number(claimed[0].amount);

  try {
    await sql`
      INSERT INTO orders (id, clerk_user_id, checkout_ref, line_no, package, package_name, vendor,
                          network, size, price, phone, payment_ref, status, created_at)
      VALUES (${crypto.randomUUID()}, ${userId}, ${reference}, 1, 'instant_bundle', 'instant_bundle', 'swiftdata',
              ${line.network}, ${line.size}, ${line.price}, ${line.phone}, ${reference}, 'processing', NOW())
      ON CONFLICT (checkout_ref, line_no) DO NOTHING`;

    const r = await callSwiftInstant(line);

    if (r.kind === "ok") {
      const cost = r.costMinor != null ? r.costMinor / 100 : null;
      const profit = cost != null ? r2(Number(line.price) - cost) : null;
      await sql`
        UPDATE orders
        SET order_id = ${r.publicId}, vendor_ref = ${r.publicId}, status = ${r.status},
            provider_status = ${r.providerStatus}, cost_price = ${cost}, profit = ${profit}, updated_at = NOW(),
            delivered_at = CASE WHEN ${r.status} = 'delivered' THEN NOW() ELSE delivered_at END
        WHERE checkout_ref = ${reference} AND line_no = 1`;
      await sql`UPDATE checkouts SET status = 'fulfilled', updated_at = NOW() WHERE reference = ${reference}`;
      return { status: "fulfilled", message: "Your instant bundle is on its way." };
    }

    if (r.kind === "rejected") {
      console.error(`[mobile instant] refused for ${reference}:`, r.reason);
      await sql`UPDATE orders SET status = 'failed', provider_status = ${r.reason}, updated_at = NOW() WHERE checkout_ref = ${reference} AND line_no = 1`;
      await sql`UPDATE checkouts SET status = 'failed', refund_due = ${paid}, updated_at = NOW() WHERE reference = ${reference}`;
      return { status: "failed", message: "The bundle could not be sent. You will be refunded." };
    }

    console.error(`[mobile instant] uncertain for ${reference}:`, r.reason);
    await sql`UPDATE orders SET status = 'review', updated_at = NOW() WHERE checkout_ref = ${reference} AND line_no = 1`;
    await sql`UPDATE checkouts SET status = 'review', updated_at = NOW() WHERE reference = ${reference}`;
    return { status: "review", message: "Payment received. Your order is being checked." };
  } catch (error) {
    console.error("[mobile instant] fulfilment error:", error.message);
    await sql`UPDATE checkouts SET status = 'review', updated_at = NOW() WHERE reference = ${reference} AND status = 'processing'`;
    return { status: "review", message: "Payment received. Your order needs a manual check." };
  }
}
