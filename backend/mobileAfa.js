import { getAuth } from "@clerk/express";
import crypto from "node:crypto";
import sql from "./db.js";

const SWIFT = "https://api.swiftdata-link.com";
const AFA_FEE = 19.5; // what the customer pays. Keep equal to the app
const MTN_PREFIXES = ["024", "025", "053", "054", "055", "059"];

const STATUS_MAP = {
  registered: "registered",
  approved: "registered",
  completed: "registered",
  success: "registered",
  successful: "registered",
  processed: "registered",
  failed: "rejected",
  rejected: "rejected",
  cancelled: "rejected",
  canceled: "rejected",
  declined: "rejected",
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
  "X-API-Key": process.env.SWIFT_API_KEY, // use the same header your website's SwiftData calls use
  "Content-Type": "application/json",
  Accept: "application/json",
});

// Checks every field on the server. Returns the clean line, or a message to show.
function validate(body) {
  const name = String(body?.name || "")
    .trim()
    .replace(/\s+/g, " ");
  const phone = String(body?.phone || "").trim();
  const idNumber = String(body?.idNumber || "")
    .trim()
    .toUpperCase();
  const occupation = String(body?.occupation || "").trim();
  const location = String(body?.location || "").trim();
  const region = String(body?.region || "").trim();
  const dateOfBirth = String(body?.dateOfBirth || "").trim();

  if (name.split(" ").length < 2 || name.length > 120)
    return { error: "Enter the first and last name." };
  if (!/^0\d{9}$/.test(phone) || !MTN_PREFIXES.includes(phone.slice(0, 3)))
    return { error: "AFA needs an MTN number." };
  if (!/^GHA-\d{9}-\d$/.test(idNumber))
    return { error: "Enter a valid Ghana Card number (GHA-XXXXXXXXX-X)." };
  if (location.length < 2 || location.length > 100)
    return { error: "Enter the location." };
  if (region.length < 2 || region.length > 60)
    return { error: "Choose a region." };
  if (occupation.length > 80) return { error: "The occupation is too long." };

  const d = new Date(`${dateOfBirth}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) ||
    Number.isNaN(d.getTime()) ||
    d.toISOString().slice(0, 10) !== dateOfBirth ||
    d > new Date() ||
    d.getUTCFullYear() < 1900
  )
    return { error: "Enter a valid date of birth." };

  return {
    line: {
      type: "afa",
      name,
      phone,
      idNumber,
      occupation,
      location,
      region,
      dateOfBirth,
    },
  };
}

// POST /v2/afa. The request has no reference, so this is never retried.
async function callSwiftAfa(line) {
  if (!process.env.SWIFT_API_KEY)
    return { kind: "rejected", reason: "SwiftData AFA is not configured" };

  const body = {
    name: line.name,
    phone: line.phone,
    idNumber: line.idNumber,
    location: line.location,
    region: line.region,
    dateOfBirth: line.dateOfBirth,
  };
  if (line.occupation) body.occupation = line.occupation;

  let res, json;
  try {
    res = await fetch(`${SWIFT}/v2/afa`, {
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
    return {
      kind: "ok",
      publicId: String(json.data.publicId),
      status: mapStatus(json.data.status),
      providerStatus: String(json.data.status ?? "pending"),
      priceMinor: Number(json.data.priceMinor) || null,
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

// After a verified payment. Saves first, so a paid registration can never go missing.
export async function fulfillMobileAfa(reference, userId, paidPesewas) {
  const claimed = await sql`
    UPDATE checkouts SET status = 'processing', updated_at = NOW()
    WHERE reference = ${reference} AND clerk_user_id = ${userId} AND kind = 'afa'
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
  const fee = Number(claimed[0].amount);

  // The Ghana Card number and date of birth are wiped from the checkout once the vendor has answered
  const scrub = () =>
    sql`UPDATE checkouts SET lines = ${JSON.stringify([{ type: "afa", scrubbed: true }])}::jsonb WHERE reference = ${reference}`;

  try {
    const masked = `${line.idNumber.slice(0, 4)}•••••${line.idNumber.slice(-6)}`;
    await sql`
      INSERT INTO afa_registrations (clerk_user_id, checkout_ref, name, phone, id_masked, occupation, location, region, fee, status)
      VALUES (${userId}, ${reference}, ${line.name}, ${line.phone}, ${masked}, ${line.occupation || null}, ${line.location}, ${line.region}, ${fee}, 'processing')
      ON CONFLICT (checkout_ref) DO NOTHING`;

    const r = await callSwiftAfa(line);

    if (r.kind === "ok") {
      await sql`
        UPDATE afa_registrations
        SET vendor_ref = ${r.publicId}, status = ${r.status}, provider_status = ${r.providerStatus},
            cost_minor = ${r.priceMinor}, updated_at = NOW(),
            approved_at = CASE WHEN ${r.status} = 'approved' THEN NOW() ELSE approved_at END
        WHERE checkout_ref = ${reference}`;
      await sql`UPDATE checkouts SET status = 'fulfilled', updated_at = NOW() WHERE reference = ${reference}`;
      await scrub();
      return { status: "fulfilled", message: "Registration submitted." };
    }

    if (r.kind === "rejected") {
      console.error(`[mobile afa] refused for ${reference}:`, r.reason);
      await sql`UPDATE afa_registrations SET status = 'rejected', provider_status = ${r.reason}, updated_at = NOW() WHERE checkout_ref = ${reference}`;
      await sql`UPDATE checkouts SET status = 'failed', refund_due = ${fee}, updated_at = NOW() WHERE reference = ${reference}`;
      await scrub();
      return {
        status: "failed",
        message: "The registration was refused. You will be refunded.",
      };
    }

    // Uncertain: the details stay in the checkout so you can check it by hand
    console.error(`[mobile afa] uncertain for ${reference}:`, r.reason);
    await sql`UPDATE afa_registrations SET status = 'review', updated_at = NOW() WHERE checkout_ref = ${reference}`;
    await sql`UPDATE checkouts SET status = 'review', updated_at = NOW() WHERE reference = ${reference}`;
    return {
      status: "review",
      message: "Payment received. The registration is being checked.",
    };
  } catch (error) {
    console.error("[mobile afa] fulfilment error:", error.message);
    await sql`UPDATE checkouts SET status = 'review', updated_at = NOW() WHERE reference = ${reference} AND status = 'processing'`;
    return {
      status: "review",
      message: "Payment received. The registration needs a manual check.",
    };
  }
}

// Asks SwiftData about open registrations, at most once per registration every 10 seconds
async function syncAfa() {
  const claimed = await sql`
    UPDATE afa_registrations SET synced_at = NOW()
    WHERE id IN (
      SELECT id FROM afa_registrations
      WHERE status = 'processing' AND vendor_ref IS NOT NULL AND created_at > NOW() - INTERVAL '14 days'
        AND (synced_at IS NULL OR synced_at < NOW() - INTERVAL '10 seconds')
      ORDER BY created_at LIMIT 20)
    RETURNING id, vendor_ref, checkout_ref, fee`;

  await Promise.all(
    claimed.map(async (row) => {
      const res = await fetch(
        `${SWIFT}/v2/afa/${encodeURIComponent(row.vendor_ref)}`,
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

      await sql`
        UPDATE afa_registrations
        SET status = ${status}, provider_status = ${raw}, updated_at = NOW(),
            approved_at = CASE WHEN ${status} = 'approved' THEN COALESCE(approved_at, NOW()) ELSE approved_at END
        WHERE id = ${row.id}`;

      if (status === "rejected") {
        await sql`UPDATE checkouts SET refund_due = ${row.fee}, updated_at = NOW() WHERE reference = ${row.checkout_ref} AND refund_due = 0`;
      }
    }),
  );
}

const syncAfaSoon = () =>
  Promise.race([
    syncAfa().catch((e) => console.error("[mobile afa sync]", e.message)),
    new Promise((r) => setTimeout(r, 3000)),
  ]);

const uiStatus = (s) =>
  s === "approved" ? "approved" : s === "rejected" ? "rejected" : "processing";

export function registerMobileAfaRoutes(
  app,
  { verifyMobilePayment, paymentMatches },
) {
  // Step 1: validate everything, check the number is free, save a pending checkout
  app.post("/api/mobile/afa/checkout", async (req, res) => {
    try {
      const { userId } = getAuth(req);
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: "Please sign in to continue." });

      const v = validate(req.body);
      if (v.error)
        return res.status(400).json({ success: false, message: v.error });
      const line = v.line;

      const [users, existing] = await Promise.all([
        sql`SELECT email FROM public.ecodata_users WHERE clerk_user_id = ${userId} LIMIT 1`,
        sql`SELECT 1 FROM afa_registrations WHERE phone = ${line.phone} AND status IN ('processing', 'approved', 'review') LIMIT 1`,
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
      if (existing.length)
        return res
          .status(409)
          .json({
            success: false,
            message: "This number already has an AFA registration.",
          });

      const reference =
        "ECF" +
        crypto.randomUUID().replace(/-/g, "").slice(0, 20).toUpperCase();

      await sql`
        INSERT INTO checkouts (reference, clerk_user_id, lines, amount, status, refund_due, kind, created_at, updated_at)
        VALUES (${reference}, ${userId}, ${JSON.stringify([line])}::jsonb, ${AFA_FEE}, 'pending', 0, 'afa', NOW(), NOW())`;

      // The app opens Paystack with this reference, so the server does not initialize it
      return res.json({ success: true, reference, amount: AFA_FEE, email });
    } catch (error) {
      console.error("[EcoData mobile afa checkout]", error.message); // never log the request body: it has the Ghana Card
      return res
        .status(500)
        .json({
          success: false,
          message: "Unable to start checkout. Please try again.",
        });
    }
  });

  // After payment: verify with Paystack, then submit to SwiftData
  app.post("/api/mobile/afa/confirm", async (req, res) => {
    try {
      const { userId } = getAuth(req);
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: "Please sign in to continue." });

      const reference = String(req.body?.reference || "").trim();
      if (!/^ECF[A-F0-9]{20}$/.test(reference))
        return res
          .status(400)
          .json({ success: false, message: "Invalid payment reference." });

      const [checkout] = await sql`
        SELECT reference, amount, status FROM checkouts
        WHERE reference = ${reference} AND clerk_user_id = ${userId} AND kind = 'afa' LIMIT 1`;
      if (!checkout)
        return res
          .status(404)
          .json({ success: false, message: "Checkout not found." });

      if (checkout.status !== "pending") {
        return res.json({
          success: checkout.status === "fulfilled",
          status: checkout.status,
          reference,
          message: "This registration has already been handled.",
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

      const result = await fulfillMobileAfa(
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
        "[EcoData mobile afa confirm]",
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

  // Finishes a registration that was paid but never confirmed (app closed, connection dropped)
  app.post("/api/mobile/afa/reconcile", async (req, res) => {
    try {
      const { userId } = getAuth(req);
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: "Please sign in to continue." });

      const rows = await sql`
        SELECT reference, amount FROM checkouts
        WHERE clerk_user_id = ${userId} AND kind = 'afa' AND status = 'pending'
          AND created_at > NOW() - INTERVAL '24 hours' AND created_at < NOW() - INTERVAL '20 seconds'
        ORDER BY created_at DESC LIMIT 5`;

      const results = [];
      for (const row of rows) {
        try {
          const tx = await verifyMobilePayment(row.reference);
          if (paymentMatches(row, tx)) {
            const r = await fulfillMobileAfa(
              row.reference,
              userId,
              Math.round(Number(tx.amount)),
            );
            results.push({ reference: row.reference, status: r.status });
          }
        } catch (e) {
          console.error("[mobile afa reconcile]", row.reference, e.message);
        }
      }
      return res.json({ success: true, results });
    } catch (error) {
      console.error("[EcoData mobile afa reconcile]", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Unable to reconcile right now." });
    }
  });

  // The user's registrations and the totals for the screen
  app.get("/api/mobile/afa", async (req, res) => {
    try {
      const { userId } = getAuth(req);
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: "Please sign in to continue." });

      await syncAfaSoon();

      const [rows, counts] = await Promise.all([
        sql`SELECT * FROM afa_registrations WHERE clerk_user_id = ${userId} ORDER BY created_at DESC LIMIT 100`,
        sql`
          SELECT COUNT(*) FILTER (WHERE status IN ('processing','review'))::int AS open,
                 COUNT(*) FILTER (WHERE status = 'approved')::int AS approved
          FROM afa_registrations WHERE clerk_user_id = ${userId}`,
      ]);

      const last = rows.find((r) => r.vendor_ref)?.vendor_ref ?? null;
      return res.json({
        success: true,
        fee: AFA_FEE,
        items: rows.map((r) => ({
          id: r.vendor_ref || "AFA_" + String(r.id).slice(-8).toUpperCase(),
          name: r.name,
          phone: r.phone,
          status: uiStatus(r.status),
          fee: Number(r.fee),
          at: new Date(r.created_at).getTime(),
        })),
        stats: {
          open: Number(counts[0]?.open || 0),
          approved: Number(counts[0]?.approved || 0),
          lastFiling: last,
        },
      });
    } catch (error) {
      console.error("[EcoData mobile afa]", error.message);
      return res
        .status(500)
        .json({
          success: false,
          message: "Unable to load your registrations right now.",
        });
    }
  });
}
