import sql from "./db.js";
import { SWIFT_BASE, swiftHeaders } from "./swiftdata.js";

// The mobile routes run inside the website server, so call its own vendor routes on localhost
const SELF = `http://127.0.0.1:${process.env.PORT || 3000}`;
const DATAMART_PREFIX = "Ia553341879ecodata-";

const NAMES = { mtn: "MTN", telecel: "Telecel", airteltigo: "AirtelTigo" };
const DEFAULT_MS = {
  normal: 12 * 60_000,
  express: 3 * 60_000,
  verified: 6 * 60_000,
  instant_bundle: 45_000,
}; // until the first delivery

const STATUS_MAP = {
  completed: "delivered",
  delivered: "delivered",
  success: "delivered",
  successful: "delivered",
  processed: "delivered", // SwiftData's word for a finished order
  failed: "failed",
  cancelled: "failed",
  canceled: "failed",
  rejected: "failed",
  refunded: "refunded",
  pending: "processing",
  waiting: "processing",
  processing: "processing",
  retrying: "processing",
  in_progress: "processing",
  "in progress": "processing",
  unknown: "processing",
};
const normalizeStatus = (raw) =>
  STATUS_MAP[
    String(raw ?? "processing")
      .trim()
      .toLowerCase()
  ] ?? "processing";







const MIN_REF_MS = 20_000; // a delivery faster than this is treated as a timing glitch
const MAX_REF_MS = 2 * 3_600_000; // one stuck order must not make every ring crawl

// How long the latest delivered order of each package really took
export async function turnarounds() {
  const rows = await sql`
    SELECT DISTINCT ON (package) package,
           EXTRACT(EPOCH FROM (delivered_at - created_at)) * 1000 AS ms
    FROM orders
    WHERE status = 'delivered' AND delivered_at IS NOT NULL AND delivered_at > created_at
    ORDER BY package, delivered_at DESC`;

  const out = { ...DEFAULT_MS }; // used until the first delivery of a package
  for (const r of rows) {
    const ms = Number(r.ms);
    const min = r.package === "instant_bundle" ? 2_000 : MIN_REF_MS;
    if (ms >= min) out[r.package] = Math.min(ms, MAX_REF_MS);
  }
  return out;
}






// delivered_at uses the vendor's own update time when it gives one
async function applyStatus(id, raw, vendorTime) {
  const status = normalizeStatus(raw);
  if (status === "processing") return;
  const ts =
    vendorTime && !Number.isNaN(Date.parse(vendorTime))
      ? new Date(vendorTime).toISOString()
      : new Date().toISOString();
  await sql`
    UPDATE orders SET status = ${status}, provider_status = ${raw}, updated_at = NOW(),
      delivered_at = CASE WHEN ${status} = 'delivered'
        THEN COALESCE(delivered_at, GREATEST(created_at, ${ts}::timestamptz)) ELSE delivered_at END
    WHERE id = ${id}`;
}

// SwiftData: one bulk status call through the website's own route
async function syncSwift(rows) {
  if (!rows.length) return;
  const identifiers = [
    ...new Set(
      rows.flatMap((r) => [r.order_id, r.payment_ref]).filter(Boolean),
    ),
  ];

  const res = await fetch(`${SELF}/api/v2/orders/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ identifiers }),
    signal: AbortSignal.timeout(8000),
  });
  const json = res.ok ? await res.json().catch(() => null) : null;
  if (!json?.success) return;

  const d = json.data ?? json;
  const found = [
    ...(d.orders ?? []),
    ...(d.groups ?? []).flatMap((g) => g.orders ?? []),
  ];

  const byKey = new Map();
  for (const o of found) {
    for (const k of [
      o.publicId,
      o.orderId,
      o.reference,
      o.clientReference,
      o.paymentReference,
    ])
      if (k) byKey.set(String(k), o);
  }

  await Promise.all(
    rows.map((r) => {
      const hit =
        byKey.get(String(r.order_id)) ??
        (r.order_id ? undefined : byKey.get(String(r.payment_ref)));
      return hit
        ? applyStatus(
            r.id,
            String(hit.status ?? "")
              .trim()
              .toLowerCase(),
            hit.updatedAt,
          )
        : null;
    }),
  );
}

// DataMart: the website checks each order on its own status route
async function syncMart(rows) {
  await Promise.all(
    rows.map(async (r) => {
      const ref =
        r.provider_ref ||
        (r.payment_ref ? `${DATAMART_PREFIX}${r.payment_ref}` : "");
      if (!ref) return;
      const res = await fetch(
        `${SELF}/api/datamart/order-status/${encodeURIComponent(ref)}`,
        {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(8000),
        },
      ).catch(() => null);
      const json = res?.ok ? await res.json().catch(() => null) : null;
      if (json?.success !== true) return;

      const o = json.order || json.data || {};
      const raw = String(o.status || o.orderStatus || "")
        .trim()
        .toLowerCase();
      if (raw) await applyStatus(r.id, raw, o.updatedAt ?? o.completedAt);
    }),
  );
}

// Checks open orders at most once every 10 seconds each
// Instant bundles: one status call each, straight to SwiftData
async function syncInstant(rows) {
  await Promise.all(
    rows.map(async (r) => {
      if (!r.order_id) return;
      const res = await fetch(`${SWIFT_BASE}/v2/instant-bundles/${encodeURIComponent(r.order_id)}`, {
        headers: swiftHeaders(),
        signal: AbortSignal.timeout(8000),
      }).catch(() => null);
      const json = res?.ok ? await res.json().catch(() => null) : null;
      const d = json?.success ? json.data : null;
      if (!d) return;

      const raw = String(d.status ?? "").trim().toLowerCase();
      const status = normalizeStatus(raw);
      if (status === "processing") return;

      await applyStatus(r.id, raw, d.updatedAt);

      // The status payload carries what the order cost and earned
      if (d.costMinor != null) {
        const cost = Number(d.costMinor) / 100;
        const profit = d.profitMinor != null ? Number(d.profitMinor) / 100 : null;
        await sql`UPDATE orders SET cost_price = ${cost}, profit = COALESCE(${profit}, profit) WHERE id = ${r.id}`;
      }
      if (status === "failed" || status === "refunded") {
        await sql`UPDATE checkouts SET refund_due = amount, updated_at = NOW() WHERE reference = ${r.checkout_ref} AND refund_due = 0`;
      }
    }),
  );
}

// Checks open orders at most once every 10 seconds each
async function syncOpenOrders() {
  const claimed = await sql`
    UPDATE orders SET synced_at = NOW()
    WHERE id IN (
      SELECT id FROM orders
      WHERE status = 'processing' AND created_at > NOW() - INTERVAL '3 days'
        AND (synced_at IS NULL OR synced_at < NOW() - INTERVAL '10 seconds')
      ORDER BY created_at LIMIT 60)
    RETURNING id, vendor, package, order_id, provider_ref, payment_ref, checkout_ref`;
  if (!claimed.length) return;

  const instant = claimed.filter((r) => r.package === "instant_bundle");
  const rest = claimed.filter((r) => r.package !== "instant_bundle");

  await Promise.all([
    syncSwift(rest.filter((r) => r.vendor === "swiftdata")),
    syncMart(rest.filter((r) => r.vendor === "datamart")),
    syncInstant(instant),
  ]);
}



// Never throws, and never holds up a request for more than 3 seconds
export const syncSoon = () =>
  Promise.race([
    syncOpenOrders().catch((e) =>
      console.error("[mobile order sync]", e.message),
    ),
    new Promise((r) => setTimeout(r, 3000)),
  ]);






  // 95% at the reference time. A late order creeps towards 99%, and only a delivery reaches 100%.
export const progressAt = (ageMs, refMs) =>
  ageMs <= refMs
    ? Math.max((ageMs / refMs) * 0.95, 0.03)
    : Math.min(0.95 + 0.04 * (1 - refMs / ageMs), 0.99);


  export function toTracked(r, ta, mask) {
  const at = new Date(r.created_at).getTime();
  const refMs = ta[r.package] ?? DEFAULT_MS.normal; // the latest delivered order's time in this package
  const ageMs = Math.max(Date.now() - at, 0);

  const done = r.status === "delivered";
  const failed = r.status === "failed" || r.status === "refunded";
  const open = !done && !failed;
  const late = open && ageMs > refMs;
  const etaSec = open ? (late ? 0 : Math.max(Math.ceil((refMs - ageMs) / 1000), 1)) : null;

  return {
    id: mask ? "EC" + String(r.id).slice(-5).toUpperCase() : String(r.order_id || r.id),
    network: r.network,
    networkName: NAMES[r.network] ?? r.network,
    size: r.size,
    price: Number(r.price ?? 0),
    phone: mask ? `${r.phone.slice(0, 3)}•••${r.phone.slice(-4)}` : r.phone, // the full number never leaves the server
    delivery: r.package,
    status: done ? "delivered" : failed ? "failed" : "processing",
    progress: done ? 1 : failed ? Math.min(ageMs / refMs, 0.95) : progressAt(ageMs, refMs),
    refMs,
    ageMs, // age when sent: the app counts on from here, not from its own clock
    etaSec,
    etaMin: etaSec != null && !late ? Math.ceil(etaSec / 60) : null,
    late,
    at,
    doneAt: r.delivered_at ? new Date(r.delivered_at).getTime() : undefined,
  };
}
