import sql from "./db.js";

// The mobile routes run inside the website server, so call its own vendor routes on localhost
const SELF = `http://127.0.0.1:${process.env.PORT || 3000}`;
const DATAMART_PREFIX = "Ia553341879ecodata-";

const NAMES = { mtn: "MTN", telecel: "Telecel", airteltigo: "AirtelTigo" };
const DEFAULT_MS = {
  normal: 12 * 60_000,
  express: 3 * 60_000,
  verified: 6 * 60_000,
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

// The real time of the last delivered order for each package
export async function turnarounds() {
  const rows = await sql`
    SELECT DISTINCT ON (package) package,
           EXTRACT(EPOCH FROM (delivered_at - created_at)) * 1000 AS ms
    FROM orders
    WHERE status = 'delivered' AND delivered_at IS NOT NULL
    ORDER BY package, delivered_at DESC`;

  const out = { ...DEFAULT_MS };
  for (const r of rows)
    if (Number(r.ms) > 30_000) out[r.package] = Number(r.ms);
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
async function syncOpenOrders() {
  const claimed = await sql`
    UPDATE orders SET synced_at = NOW()
    WHERE id IN (
      SELECT id FROM orders
      WHERE status = 'processing' AND created_at > NOW() - INTERVAL '3 days'
        AND (synced_at IS NULL OR synced_at < NOW() - INTERVAL '10 seconds')
      ORDER BY created_at LIMIT 60)
    RETURNING id, vendor, order_id, provider_ref, payment_ref`;
  if (!claimed.length) return;

  await Promise.all([
    syncSwift(claimed.filter((r) => r.vendor === "swiftdata")),
    syncMart(claimed.filter((r) => r.vendor === "datamart")),
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

// Turns a database row into what the app shows. Progress comes from the last delivered order's time.
export function toTracked(r, ta, mask) {
  const at = new Date(r.created_at).getTime();
  const status =
    r.status === "delivered"
      ? "delivered"
      : r.status === "failed" || r.status === "refunded"
        ? "failed"
        : "processing";
  const total = ta[r.package] ?? DEFAULT_MS.normal;
  const elapsed = Date.now() - at;

  return {
    id: mask
      ? "EC" + String(r.id).slice(-5).toUpperCase()
      : String(r.order_id || r.id),
    network: r.network,
    networkName: NAMES[r.network] ?? r.network,
    size: r.size,
    price: Number(r.price ?? 0),
    phone: mask ? `${r.phone.slice(0, 3)}•••${r.phone.slice(-4)}` : r.phone, // the full number never leaves the server
    delivery: r.package,
    status,
    progress:
      status === "delivered"
        ? 1
        : Math.min(Math.max(elapsed / total, 0.05), 0.95),
    etaMin:
      status === "processing"
        ? Math.max(Math.ceil((total - elapsed) / 60_000), 1)
        : null,
    at,
    doneAt: r.delivered_at ? new Date(r.delivered_at).getTime() : undefined,
  };
}
