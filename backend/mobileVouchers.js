import { getAuth } from "@clerk/express";
import crypto from "node:crypto";
import sql from "./db.js";

const SWIFT = "https://api.swiftdata-link.com";
const VOUCHER_RATE = 1.0195; // SwiftData's price plus the 1.95% Paystack fee. Add your own margin here
const MAX_QTY = 10;
const r2 = (n) => Math.round(n * 100) / 100;

// ---- PINs are encrypted before they are saved ----
const KEY = process.env.VOUCHER_PIN_KEY
  ? Buffer.from(process.env.VOUCHER_PIN_KEY, "hex")
  : null;
const keyOk = () => !!KEY && KEY.length === 32;

function encryptPins(pins) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([
    c.update(JSON.stringify(pins), "utf8"),
    c.final(),
  ]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
}
function decryptPins(text) {
  const [iv, tag, enc] = text.split(".").map((x) => Buffer.from(x, "base64"));
  const d = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  d.setAuthTag(tag);
  return JSON.parse(Buffer.concat([d.update(enc), d.final()]).toString("utf8"));
}

const swiftHeaders = () => ({
  "Content-Type": "application/json",
  Accept: "application/json",
   "X-API-Key": process.env.SWIFT_API_KEY,  // use the same header your website's SwiftData calls use
});

const STATUS_MAP = {
  completed: "completed",
  processed: "completed",
  success: "completed",
  successful: "completed",
  delivered: "completed",
  failed: "failed",
  cancelled: "failed",
  canceled: "failed",
  rejected: "failed",
  refunded: "failed",
  pending: "processing",
  processing: "processing",
  retrying: "processing",
  queued: "processing",
};
const mapStatus = (raw) =>
  STATUS_MAP[
    String(raw ?? "pending")
      .trim()
      .toLowerCase()
  ] ?? "processing";

// ---- Catalogue, kept for 30 seconds so the screen stays quick ----
const normalize = (t) => ({
  id: String(t.id),
  name: String(t.name),
  slug: String(t.slug ?? ""),
  description: String(t.description ?? ""),
  costMinor: Number(t.priceMinor) || 0,
  price: r2((Number(t.priceMinor) / 100) * VOUCHER_RATE),
  available: Number(t.available) || 0,
});

let cache = { at: 0, items: null };
async function getCatalog(maxAgeMs = 30_000) {
  if (cache.items && Date.now() - cache.at < maxAgeMs) return cache.items;
  try {
    const res = await fetch(`${SWIFT}/v2/vouchers`, {
      headers: swiftHeaders(),
      signal: AbortSignal.timeout(10_000),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success || !Array.isArray(json.data))
      throw new Error(`HTTP ${res.status}`);
    cache = { at: Date.now(), items: json.data.map(normalize) };
  } catch (e) {
    console.error("[mobile vouchers] catalogue failed:", e.message);
    if (!cache.items || Date.now() - cache.at > 10 * 60_000) throw e; // otherwise serve the last copy
  }
  return cache.items;
}

// POST /v2/vouchers/purchase. The request has no reference, so this is never retried.
async function callSwiftPurchase(line, contacts) {
  if (!process.env.SWIFT_API_KEY)
    return {
      kind: "rejected",
      reason: "SwiftData vouchers are not configured",
    };

  const body = { typeId: line.typeId, qty: line.qty };
  if (contacts.phone) body.phone = contacts.phone; // the pack goes to the buyer, not to your account contacts
  if (contacts.email) body.email = contacts.email;

  let res, json;
  try {
    res = await fetch(`${SWIFT}/v2/vouchers/purchase`, {
      method: "POST",
      headers: swiftHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    json = await res.json().catch(() => null);
  } catch (e) {
    return { kind: "uncertain", reason: e.message }; // a timeout does not prove it was refused
  }

  if (json?.success === true && json.data?.publicId) {
    const d = json.data;
    const status = mapStatus(d.status);
    if (status === "failed")
      return { kind: "rejected", reason: `Provider status: ${d.status}` };
    return {
      kind: "ok",
      publicId: String(d.publicId),
      status,
      providerStatus: String(d.status ?? ""),
      pins: Array.isArray(d.pins) ? d.pins.map(String) : [],
      costMinor: Number(d.priceMinor) || null,
    };
  }
  if (res.status >= 500 || res.status === 408 || !json)
    return { kind: "uncertain", reason: `HTTP ${res.status}` };
  return {
    kind: "rejected",
    reason: String(
      json?.message ?? json?.error?.message ?? `HTTP ${res.status}`,
    ),
  };
}

// GET /v2/vouchers/purchases/:publicId, which also re-reveals the PINs
async function fetchPurchase(publicId) {
  const res = await fetch(
    `${SWIFT}/v2/vouchers/purchases/${encodeURIComponent(publicId)}`,
    {
      headers: swiftHeaders(),
      signal: AbortSignal.timeout(10_000),
    },
  ).catch(() => null);
  const json = res?.ok ? await res.json().catch(() => null) : null;
  if (!json?.success || !json.data) return null;
  return {
    status: mapStatus(json.data.status),
    raw: String(json.data.status ?? ""),
    pins: Array.isArray(json.data.pins) ? json.data.pins.map(String) : [],
  };
}

// After a verified payment. Saves first, so a paid purchase can never go missing.
export async function fulfillMobileVoucher(reference, userId, paidPesewas) {
  const claimed = await sql`
    UPDATE checkouts SET status = 'processing', updated_at = NOW()
    WHERE reference = ${reference} AND clerk_user_id = ${userId} AND kind = 'voucher'
      AND status = 'pending' AND ROUND(amount * 100) = ${paidPesewas}
    RETURNING lines, amount`;

  if (!claimed.length) {
    const [c] =
      await sql`SELECT status FROM checkouts WHERE reference = ${reference} AND clerk_user_id = ${userId} LIMIT 1`;
    return {
      status: c?.status || "not_found",
      message: "This checkout has already been handled.",
    };
  }

  const line = claimed[0].lines?.[0];
  const total = Number(claimed[0].amount);

  try {
    const [u] =
      await sql`SELECT email, phone FROM public.ecodata_users WHERE clerk_user_id = ${userId} LIMIT 1`;
    const phone = String(u?.phone || "").trim();
    const contacts = {
      email: String(u?.email || "").trim(),
      phone: /^0\d{9}$/.test(phone) ? phone : "",
    };

    await sql`
      INSERT INTO voucher_purchases (clerk_user_id, checkout_ref, type_id, type_name, qty, unit_price, total, status)
      VALUES (${userId}, ${reference}, ${line.typeId}, ${line.name}, ${line.qty}, ${line.unit}, ${total}, 'processing')
      ON CONFLICT (checkout_ref) DO NOTHING`;

    const r = await callSwiftPurchase(line, contacts);

    if (r.kind === "ok") {
      const pinsEnc = r.pins.length ? encryptPins(r.pins) : null;
      await sql`
        UPDATE voucher_purchases
        SET vendor_ref = ${r.publicId}, status = ${r.status}, provider_status = ${r.providerStatus},
            cost_minor = ${r.costMinor}, pins_enc = COALESCE(${pinsEnc}, pins_enc), updated_at = NOW()
        WHERE checkout_ref = ${reference}`;
      await sql`UPDATE checkouts SET status = 'fulfilled', updated_at = NOW() WHERE reference = ${reference}`;
      return { status: "fulfilled", message: "Your voucher pack is ready." };
    }

    if (r.kind === "rejected") {
      console.error(`[mobile vouchers] refused for ${reference}:`, r.reason);
      await sql`UPDATE voucher_purchases SET status = 'failed', provider_status = ${r.reason}, updated_at = NOW() WHERE checkout_ref = ${reference}`;
      await sql`UPDATE checkouts SET status = 'failed', refund_due = ${total}, updated_at = NOW() WHERE reference = ${reference}`;
      return {
        status: "failed",
        message: "The voucher could not be bought. You will be refunded.",
      };
    }

    console.error(`[mobile vouchers] uncertain for ${reference}:`, r.reason);
    await sql`UPDATE voucher_purchases SET status = 'review', updated_at = NOW() WHERE checkout_ref = ${reference}`;
    await sql`UPDATE checkouts SET status = 'review', updated_at = NOW() WHERE reference = ${reference}`;
    return {
      status: "review",
      message: "Payment received. Your purchase is being checked.",
    };
  } catch (error) {
    console.error("[mobile vouchers] fulfilment error:", error.message); // never log pins
    await sql`UPDATE checkouts SET status = 'review', updated_at = NOW() WHERE reference = ${reference} AND status = 'processing'`;
    return {
      status: "review",
      message: "Payment received. Your purchase needs a manual check.",
    };
  }
}

// Picks up purchases that were still processing, and completed ones whose PINs were not saved yet
async function syncVouchers() {
  const claimed = await sql`
    UPDATE voucher_purchases SET synced_at = NOW()
    WHERE id IN (
      SELECT id FROM voucher_purchases
      WHERE vendor_ref IS NOT NULL AND created_at > NOW() - INTERVAL '3 days'
        AND (status = 'processing' OR (status = 'completed' AND pins_enc IS NULL))
        AND (synced_at IS NULL OR synced_at < NOW() - INTERVAL '8 seconds')
      ORDER BY created_at LIMIT 20)
    RETURNING id, vendor_ref, checkout_ref, total`;

  await Promise.all(
    claimed.map(async (row) => {
      const p = await fetchPurchase(row.vendor_ref);
      if (!p || (p.status === "processing" && !p.pins.length)) return;
      const pinsEnc = p.pins.length ? encryptPins(p.pins) : null;
      await sql`
        UPDATE voucher_purchases
        SET status = ${p.status}, provider_status = ${p.raw}, pins_enc = COALESCE(${pinsEnc}, pins_enc), updated_at = NOW()
        WHERE id = ${row.id}`;
      if (p.status === "failed") {
        await sql`UPDATE checkouts SET refund_due = ${row.total}, updated_at = NOW() WHERE reference = ${row.checkout_ref} AND refund_due = 0`;
      }
    }),
  );
}

const syncVouchersSoon = () =>
  Promise.race([
    syncVouchers().catch((e) =>
      console.error("[mobile vouchers sync]", e.message),
    ),
    new Promise((r) => setTimeout(r, 3000)),
  ]);

export function registerMobileVoucherRoutes(
  app,
  { verifyMobilePayment, paymentMatches },
) {
  // The shelf: SwiftData's catalogue with the customer's price
  app.get("/api/mobile/vouchers/catalog", async (req, res) => {
    try {
      const { userId } = getAuth(req);
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: "Please sign in to continue." });

      const items = await getCatalog();
      return res.json({
        success: true,
        items: items.map(
          ({ id, name, slug, description, price, available }) => ({
            id,
            name,
            slug,
            description,
            price,
            available,
          }),
        ),
      });
    } catch (error) {
      return res
        .status(502)
        .json({
          success: false,
          message: "Vouchers are unavailable right now. Please try again.",
        });
    }
  });

  // Step 1: check stock and price, save a pending checkout
  app.post("/api/mobile/vouchers/checkout", async (req, res) => {
    try {
      const { userId } = getAuth(req);
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: "Please sign in to continue." });
      if (!keyOk())
        return res
          .status(503)
          .json({
            success: false,
            message: "Vouchers are temporarily unavailable.",
          });

      const typeId = String(req.body?.typeId || "").trim();
      const qty = Number(req.body?.qty);
      const expectedUnit = Number(req.body?.expectedUnit);
      if (!typeId)
        return res
          .status(400)
          .json({ success: false, message: "Choose a voucher." });
      if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
        return res
          .status(400)
          .json({
            success: false,
            message: `Choose between 1 and ${MAX_QTY}.`,
          });
      }

      let catalog, users;
      try {
        [catalog, users] = await Promise.all([
          getCatalog(15_000),
          sql`SELECT email FROM public.ecodata_users WHERE clerk_user_id = ${userId} LIMIT 1`,
        ]);
      } catch {
        return res
          .status(502)
          .json({
            success: false,
            message: "Vouchers are unavailable right now. Please try again.",
          });
      }

      const type = catalog.find((t) => t.id === typeId);
      if (!type)
        return res
          .status(404)
          .json({
            success: false,
            message: "That voucher is no longer listed.",
          });
      if (type.available <= 0)
        return res
          .status(409)
          .json({ success: false, message: "That voucher is sold out." });
      if (type.available < qty)
        return res
          .status(409)
          .json({ success: false, message: `Only ${type.available} left.` });
      if (
        Number.isFinite(expectedUnit) &&
        Math.abs(expectedUnit - type.price) > 0.001
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message: "The price changed. Refresh and try again.",
          });
      }

      const email = String(users[0]?.email || "").trim();
      if (!email)
        return res
          .status(409)
          .json({
            success: false,
            message:
              "Your account email is unavailable. Please update your account.",
          });

      const total = r2(type.price * qty);
      const reference =
        "ECV" +
        crypto.randomUUID().replace(/-/g, "").slice(0, 20).toUpperCase();

      await sql`
        INSERT INTO checkouts (reference, clerk_user_id, lines, amount, status, refund_due, kind, created_at, updated_at)
        VALUES (${reference}, ${userId}, ${JSON.stringify([{ type: "voucher", typeId, name: type.name, qty, unit: type.price, costMinor: type.costMinor }])}::jsonb,
                ${total}, 'pending', 0, 'voucher', NOW(), NOW())`;

      // The app opens Paystack with this reference, so the server does not initialize it
      return res.json({ success: true, reference, amount: total, email });
    } catch (error) {
      console.error("[EcoData mobile vouchers checkout]", error.message);
      return res
        .status(500)
        .json({
          success: false,
          message: "Unable to start checkout. Please try again.",
        });
    }
  });

  // After payment: verify with Paystack, then buy from SwiftData
  app.post("/api/mobile/vouchers/confirm", async (req, res) => {
    try {
      const { userId } = getAuth(req);
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: "Please sign in to continue." });

      const reference = String(req.body?.reference || "").trim();
      if (!/^ECV[A-F0-9]{20}$/.test(reference))
        return res
          .status(400)
          .json({ success: false, message: "Invalid payment reference." });

      const [checkout] = await sql`
        SELECT reference, amount, status FROM checkouts
        WHERE reference = ${reference} AND clerk_user_id = ${userId} AND kind = 'voucher' LIMIT 1`;
      if (!checkout)
        return res
          .status(404)
          .json({ success: false, message: "Checkout not found." });

      let status = checkout.status;
      let message = "This purchase has already been handled.";

      if (status === "pending") {
        const tx = await verifyMobilePayment(reference);
        if (!paymentMatches(checkout, tx)) {
          return res.json({
            success: false,
            status: "pending",
            reference,
            message: "Payment has not been confirmed yet.",
          });
        }
        const result = await fulfillMobileVoucher(
          reference,
          userId,
          Math.round(Number(tx.amount)),
        );
        status = result.status;
        message = result.message;
      }

      const [p] =
        await sql`SELECT id FROM voucher_purchases WHERE checkout_ref = ${reference} LIMIT 1`;
      return res.json({
        success: status === "fulfilled",
        status,
        reference,
        message,
        purchaseId: p?.id ?? null,
      });
    } catch (error) {
      console.error(
        "[EcoData mobile vouchers confirm]",
        error.response?.data || error.message,
      );
      return res
        .status(500)
        .json({
          success: false,
          message: "Unable to confirm payment right now.",
        });
    }
  });

  // Finishes a purchase that was paid but never confirmed (app closed, connection dropped)
  app.post("/api/mobile/vouchers/reconcile", async (req, res) => {
    try {
      const { userId } = getAuth(req);
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: "Please sign in to continue." });

      const rows = await sql`
        SELECT reference, amount FROM checkouts
        WHERE clerk_user_id = ${userId} AND kind = 'voucher' AND status = 'pending'
          AND created_at > NOW() - INTERVAL '24 hours' AND created_at < NOW() - INTERVAL '20 seconds'
        ORDER BY created_at DESC LIMIT 5`;

      const results = [];
      for (const row of rows) {
        try {
          const tx = await verifyMobilePayment(row.reference);
          if (paymentMatches(row, tx)) {
            const r = await fulfillMobileVoucher(
              row.reference,
              userId,
              Math.round(Number(tx.amount)),
            );
            results.push({ reference: row.reference, status: r.status });
          }
        } catch (e) {
          console.error(
            "[mobile vouchers reconcile]",
            row.reference,
            e.message,
          );
        }
      }
      return res.json({ success: true, results });
    } catch (error) {
      console.error("[EcoData mobile vouchers reconcile]", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Unable to reconcile right now." });
    }
  });

  // The Issued list: no PINs here
  app.get("/api/mobile/vouchers/purchases", async (req, res) => {
    try {
      const { userId } = getAuth(req);
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: "Please sign in to continue." });

      await syncVouchersSoon();
      const rows =
        await sql`SELECT id, type_name, qty, total, status, created_at FROM voucher_purchases WHERE clerk_user_id = ${userId} ORDER BY created_at DESC LIMIT 100`;

      return res.json({
        success: true,
        items: rows.map((r) => ({
          id: String(r.id),
          voucherName: r.type_name,
          qty: Number(r.qty),
          total: Number(r.total),
          at: new Date(r.created_at).getTime(),
          status: r.status,
        })),
      });
    } catch (error) {
      console.error("[EcoData mobile vouchers purchases]", error.message);
      return res
        .status(500)
        .json({
          success: false,
          message: "Unable to load your vouchers right now.",
        });
    }
  });

  // The PINs of one pack. Only its owner can read them, and only when they open it.
  app.get("/api/mobile/vouchers/purchases/:id", async (req, res) => {
    try {
      const { userId } = getAuth(req);
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: "Please sign in to continue." });

      const id = String(req.params.id || "");
      if (!/^[0-9a-f-]{36}$/i.test(id))
        return res
          .status(400)
          .json({ success: false, message: "Invalid pack." });

      const [row] = await sql`
        SELECT id, vendor_ref, status, pins_enc FROM voucher_purchases
        WHERE id = ${id} AND clerk_user_id = ${userId} LIMIT 1`;
      if (!row)
        return res
          .status(404)
          .json({ success: false, message: "Pack not found." });
      if (row.status !== "completed")
        return res.json({ success: true, status: row.status, pins: [] });

      let pins = null;
      if (row.pins_enc && keyOk()) {
        try {
          pins = decryptPins(row.pins_enc);
        } catch {
          pins = null;
        }
      }
      if (!pins && row.vendor_ref) {
        // Not saved, or unreadable: SwiftData can reveal them again
        const p = await fetchPurchase(row.vendor_ref);
        if (p?.pins.length) {
          pins = p.pins;
          if (keyOk())
            await sql`UPDATE voucher_purchases SET pins_enc = ${encryptPins(pins)}, updated_at = NOW() WHERE id = ${row.id}`;
        }
      }

      res.set("Cache-Control", "no-store");
      return res.json({ success: true, status: "completed", pins: pins ?? [] });
    } catch (error) {
      console.error("[EcoData mobile vouchers pins]", error.message); // never log pins
      return res
        .status(500)
        .json({
          success: false,
          message: "Unable to load your PINs right now.",
        });
    }
  });
}
