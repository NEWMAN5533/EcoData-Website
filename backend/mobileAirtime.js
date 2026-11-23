import { getAuth } from "@clerk/express";
import crypto from "node:crypto";
import sql from "./db.js";

const SWIFT = "https://api.swiftdata-link.com";
const AIRTIME_RATE = 1.0195; // customer pays face value plus the 1.95% Paystack fee. Keep equal to the app
const MIN_AIRTIME = 1;
const MAX_AIRTIME = 500;
const VENDOR_NET = { mtn: "mtn", telecel: "telecel", airteltigo: "at" };

const r2 = (n) => Math.round(n * 100) / 100;
const airtimeCharge = (amount) => r2(amount * AIRTIME_RATE);

const STATUS_MAP = {
  processed: "delivered",
  completed: "delivered",
  delivered: "delivered",
  success: "delivered",
  successful: "delivered",
  failed: "failed",
  cancelled: "failed",
  canceled: "failed",
  rejected: "failed",
  refunded: "refunded",
  pending: "processing",
  processing: "processing",
  retrying: "processing",
  queued: "processing",
  waiting: "processing",
};
const mapStatus = (raw) =>
  STATUS_MAP[
    String(raw ?? "pending")
      .trim()
      .toLowerCase()
  ] ?? "processing";

const swiftHeaders = () => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${process.env.SWIFT_API_KEY}`, // calls use
});

// POST /v2/airtime. The request has no reference, so this is never retried.
async function callSwiftAirtime(line) {
  if (!process.env.SWIFT_API_KEY)
    return { kind: "rejected", reason: "SwiftData airtime is not configured" };

  let res, json;
  try {
    res = await fetch(`${SWIFT}/v2/airtime`, {
      method: "POST",
      headers: swiftHeaders(),
      body: JSON.stringify({
        network: VENDOR_NET[line.network],
        phone: line.phone,
        amountMajor: String(Number(Number(line.amount).toFixed(2))), // "10" or "10.5"
      }),
      signal: AbortSignal.timeout(30_000),
    });
    json = await res.json().catch(() => null);
  } catch (e) {
    return { kind: "uncertain", reason: e.message }; // a timeout does not prove it was refused
  }

  if (json?.success === true && json.data?.publicId) {
    return {
      kind: "ok",
      publicId: String(json.data.publicId),
      status: mapStatus(json.data.status),
      providerStatus: String(json.data.status ?? "pending"),
      chargeMinor: Number(json.data.chargeMinor) || null,
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

// Steps after a verified payment. Saves first, so a paid top-up can never go missing.
export async function fulfillMobileAirtime(reference, userId, paidPesewas) {
  const claimed = await sql`
    UPDATE checkouts SET status = 'processing', updated_at = NOW()
    WHERE reference = ${reference} AND clerk_user_id = ${userId} AND kind = 'airtime'
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
  const charged = Number(claimed[0].amount);

  try {
    await sql`
      INSERT INTO airtime_orders (clerk_user_id, checkout_ref, network, phone, amount, charged, status)
      VALUES (${userId}, ${reference}, ${line.network}, ${line.phone}, ${line.amount}, ${charged}, 'processing')
      ON CONFLICT (checkout_ref) DO NOTHING`;

    const r = await callSwiftAirtime(line);

    if (r.kind === "ok") {
      await sql`
        UPDATE airtime_orders
        SET vendor_ref = ${r.publicId}, status = ${r.status}, provider_status = ${r.providerStatus},
            cost_minor = ${r.chargeMinor}, updated_at = NOW(),
            delivered_at = CASE WHEN ${r.status} = 'delivered' THEN NOW() ELSE delivered_at END
        WHERE checkout_ref = ${reference}`;
      await sql`UPDATE checkouts SET status = 'fulfilled', updated_at = NOW() WHERE reference = ${reference}`;
      return { status: "fulfilled", message: "Airtime is on its way." };
    }

    if (r.kind === "rejected") {
      console.error(`[mobile airtime] refused for ${reference}:`, r.reason);
      await sql`UPDATE airtime_orders SET status = 'failed', provider_status = ${r.reason}, updated_at = NOW() WHERE checkout_ref = ${reference}`;
      await sql`UPDATE checkouts SET status = 'failed', refund_due = ${charged}, updated_at = NOW() WHERE reference = ${reference}`;
      return {
        status: "failed",
        message:
          "The network could not send this top-up. You will be refunded.",
      };
    }

    console.error(`[mobile airtime] uncertain for ${reference}:`, r.reason);
    await sql`UPDATE airtime_orders SET status = 'review', updated_at = NOW() WHERE checkout_ref = ${reference}`;
    await sql`UPDATE checkouts SET status = 'review', updated_at = NOW() WHERE reference = ${reference}`;
    return {
      status: "review",
      message: "Payment received. The top-up is being checked.",
    };
  } catch (error) {
    console.error("[mobile airtime] fulfilment error:", error.message);
    await sql`UPDATE checkouts SET status = 'review', updated_at = NOW() WHERE reference = ${reference} AND status = 'processing'`;
    return {
      status: "review",
      message: "Payment received. The top-up needs a manual check.",
    };
  }
}

// Asks SwiftData about open top-ups, at most once per order every 8 seconds
async function syncAirtime() {
  const claimed = await sql`
    UPDATE airtime_orders SET synced_at = NOW()
    WHERE id IN (
      SELECT id FROM airtime_orders
      WHERE status = 'processing' AND vendor_ref IS NOT NULL AND created_at > NOW() - INTERVAL '2 days'
        AND (synced_at IS NULL OR synced_at < NOW() - INTERVAL '8 seconds')
      ORDER BY created_at LIMIT 20)
    RETURNING id, vendor_ref, checkout_ref, charged`;

  await Promise.all(
    claimed.map(async (row) => {
      const res = await fetch(
        `${SWIFT}/v2/airtime/${encodeURIComponent(row.vendor_ref)}`,
        {
          headers: swiftHeaders(),
          signal: AbortSignal.timeout(8000),
        },
      ).catch(() => null);
      const json = res?.ok ? await res.json().catch(() => null) : null;
      if (!json?.success) return;

      const raw = String(json.data?.status ?? "")
        .trim()
        .toLowerCase();
      const status = mapStatus(raw);
      if (status === "processing") return;

      const t = json.data?.updatedAt;
      const doneAt =
        t && !Number.isNaN(Date.parse(t))
          ? new Date(t).toISOString()
          : new Date().toISOString();

      await sql`
        UPDATE airtime_orders
        SET status = ${status}, provider_status = ${raw}, updated_at = NOW(),
            delivered_at = CASE WHEN ${status} = 'delivered' THEN COALESCE(delivered_at, GREATEST(created_at, ${doneAt}::timestamptz)) ELSE delivered_at END
        WHERE id = ${row.id}`;

      if (status === "failed" || status === "refunded") {
        await sql`UPDATE checkouts SET refund_due = ${row.charged}, updated_at = NOW() WHERE reference = ${row.checkout_ref} AND refund_due = 0`;
      }
    }),
  );
}

const syncAirtimeSoon = () =>
  Promise.race([
    syncAirtime().catch((e) =>
      console.error("[mobile airtime sync]", e.message),
    ),
    new Promise((r) => setTimeout(r, 3000)),
  ]);

// Progress from the latest delivered top-up's real time (same idea as data)
async function airtimeRefMs() {
  const [r] = await sql`
    SELECT EXTRACT(EPOCH FROM (delivered_at - created_at)) * 1000 AS ms
    FROM airtime_orders
    WHERE status = 'delivered' AND delivered_at IS NOT NULL AND delivered_at > created_at
    ORDER BY delivered_at DESC LIMIT 1`;
  const ms = Number(r?.ms);
  return ms >= 5_000 ? Math.min(ms, 30 * 60_000) : 60_000;
}

const progressAt = (ageMs, refMs) =>
  ageMs <= refMs
    ? Math.max((ageMs / refMs) * 0.95, 0.03)
    : Math.min(0.95 + 0.04 * (1 - refMs / ageMs), 0.99);

const uiStatus = (s) =>
  s === "delivered"
    ? "sent"
    : s === "failed" || s === "refunded"
      ? "failed"
      : "pending";

export function registerMobileAirtimeRoutes(
  app,
  { verifyMobilePayment, paymentMatches },
) {
  // Step 1: validate, price on the server, save a pending checkout
  app.post("/api/mobile/airtime/checkout", async (req, res) => {
    try {
      const { userId } = getAuth(req);
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: "Please sign in to continue." });

      const network = String(req.body?.network || "")
        .trim()
        .toLowerCase();
      const phone = String(req.body?.phone || "").trim();
      const amount = r2(Number(req.body?.amount));

      if (!VENDOR_NET[network])
        return res
          .status(400)
          .json({ success: false, message: "Choose a network." });
      if (!/^0\d{9}$/.test(phone))
        return res
          .status(400)
          .json({
            success: false,
            message: "Enter a valid 10-digit phone number.",
          });
      if (
        !Number.isFinite(amount) ||
        amount < MIN_AIRTIME ||
        amount > MAX_AIRTIME
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message: `Enter an amount between GHS ${MIN_AIRTIME} and GHS ${MAX_AIRTIME}.`,
          });
      }

      const [users, recent] = await Promise.all([
        sql`SELECT email FROM public.ecodata_users WHERE clerk_user_id = ${userId} LIMIT 1`,
        sql`SELECT 1 FROM airtime_orders
            WHERE clerk_user_id = ${userId} AND phone = ${phone} AND amount = ${amount}
              AND created_at > NOW() - INTERVAL '60 seconds' LIMIT 1`,
      ]);

      const email = String(users[0]?.email || "").trim();
      if (!email)
        return res
          .status(409)
          .json({
            success: false,
            message:
              "Your account email is unavailable. Please update your account.",
          });
      if (recent.length)
        return res
          .status(409)
          .json({
            success: false,
            message:
              "You just sent this top-up. Wait a minute before sending it again.",
          });

      const charged = airtimeCharge(amount);
      const reference =
        "ECA" +
        crypto.randomUUID().replace(/-/g, "").slice(0, 20).toUpperCase();

      await sql`
        INSERT INTO checkouts (reference, clerk_user_id, lines, amount, status, refund_due, kind, created_at, updated_at)
        VALUES (${reference}, ${userId}, ${JSON.stringify([{ type: "airtime", network, phone, amount }])}::jsonb,
                ${charged}, 'pending', 0, 'airtime', NOW(), NOW())`;

      // The app opens Paystack with this reference, so the server does not initialize it
      return res.json({ success: true, reference, amount: charged, email });
    } catch (error) {
      console.error("[EcoData mobile airtime checkout]", error.message);
      return res
        .status(500)
        .json({
          success: false,
          message: "Unable to start checkout. Please try again.",
        });
    }
  });

  // Steps after payment: verify with Paystack, then send the airtime
  app.post("/api/mobile/airtime/confirm", async (req, res) => {
    try {
      const { userId } = getAuth(req);
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: "Please sign in to continue." });

      const reference = String(req.body?.reference || "").trim();
      if (!/^ECA[A-F0-9]{20}$/.test(reference))
        return res
          .status(400)
          .json({ success: false, message: "Invalid payment reference." });

      const [checkout] = await sql`
        SELECT reference, amount, status FROM checkouts
        WHERE reference = ${reference} AND clerk_user_id = ${userId} AND kind = 'airtime' LIMIT 1`;
      if (!checkout)
        return res
          .status(404)
          .json({ success: false, message: "Checkout not found." });

      if (checkout.status !== "pending") {
        return res.json({
          success: checkout.status === "fulfilled",
          status: checkout.status,
          reference,
          message: "This top-up has already been handled.",
        });
      }

      const tx = await verifyMobilePayment(reference);
      if (!paymentMatches(checkout, tx)) {
        return res.json({
          success: false,
          status: "pending",
          reference,
          message: "Payment has not been confirmed yet.",
        });
      }

      const result = await fulfillMobileAirtime(
        reference,
        userId,
        Math.round(Number(tx.amount)),
      );
      return res.json({
        success: result.status === "fulfilled",
        status: result.status,
        reference,
        message: result.message,
      });
    } catch (error) {
      console.error(
        "[EcoData mobile airtime confirm]",
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

  // Finishes a top-up that was paid but never confirmed (app closed, connection dropped)
  app.post("/api/mobile/airtime/reconcile", async (req, res) => {
    try {
      const { userId } = getAuth(req);
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: "Please sign in to continue." });

      const rows = await sql`
        SELECT reference, amount FROM checkouts
        WHERE clerk_user_id = ${userId} AND kind = 'airtime' AND status = 'pending'
          AND created_at > NOW() - INTERVAL '24 hours' AND created_at < NOW() - INTERVAL '20 seconds'
        ORDER BY created_at DESC LIMIT 5`;

      const results = [];
      for (const row of rows) {
        try {
          const tx = await verifyMobilePayment(row.reference);
          if (paymentMatches(row, tx)) {
            const r = await fulfillMobileAirtime(
              row.reference,
              userId,
              Math.round(Number(tx.amount)),
            );
            results.push({ reference: row.reference, status: r.status });
          }
        } catch (e) {
          console.error("[mobile airtime reconcile]", row.reference, e.message);
        }
      }
      return res.json({ success: true, results });
    } catch (error) {
      console.error("[EcoData mobile airtime reconcile]", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Unable to reconcile right now." });
    }
  });

  // History and the four totals for the Airtime screen
  app.get("/api/mobile/airtime", async (req, res) => {
    try {
      const { userId } = getAuth(req);
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: "Please sign in to continue." });

      await syncAirtimeSoon();

      const [rows, refMs, stats] = await Promise.all([
        sql`SELECT * FROM airtime_orders WHERE clerk_user_id = ${userId} ORDER BY created_at DESC LIMIT 100`,
        airtimeRefMs(),
        sql`
          SELECT
            COUNT(*) FILTER (WHERE created_at >= date_trunc('day', NOW()))::int AS today_count,
            COALESCE(SUM(amount) FILTER (WHERE created_at >= date_trunc('day', NOW()) AND status NOT IN ('failed','refunded')), 0) AS today_face,
            COALESCE(SUM(charged) FILTER (WHERE created_at >= date_trunc('day', NOW()) AND status NOT IN ('failed','refunded')), 0) AS today_charged,
            COUNT(*) FILTER (WHERE status IN ('processing','review'))::int AS pending,
            COUNT(*) FILTER (WHERE status = 'delivered')::int AS sent,
            COUNT(*) FILTER (WHERE status IN ('failed','refunded'))::int AS failed
          FROM airtime_orders WHERE clerk_user_id = ${userId}`,
      ]);

      const s = stats[0] || {};
      return res.json({
        success: true,
        items: rows.map((r) => {
          const at = new Date(r.created_at).getTime();
          const status = uiStatus(r.status);
          return {
            id: String(r.id),
            phone: r.phone,
            network: r.network,
            amount: Number(r.amount),
            status,
            at,
            progress:
              status === "sent"
                ? 1
                : status === "failed"
                  ? 0.4
                  : progressAt(Math.max(Date.now() - at, 0), refMs),
          };
        }),
        stats: {
          todayCount: Number(s.today_count || 0),
          todayFace: Number(s.today_face || 0),
          todayCharged: Number(s.today_charged || 0),
          pending: Number(s.pending || 0),
          sent: Number(s.sent || 0),
          failed: Number(s.failed || 0),
        },
      });
    } catch (error) {
      console.error("[EcoData mobile airtime]", error.message);
      return res
        .status(500)
        .json({
          success: false,
          message: "Unable to load your airtime right now.",
        });
    }
  });
}



