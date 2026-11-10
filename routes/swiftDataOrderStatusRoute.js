import axios from "axios";
import express from "express";
import rateLimit from "express-rate-limit";

const swiftDataOrderStatusPolling = express.Router();

const MAX_IDENTIFIERS = 200;           // SwiftData's limit per request

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 90,                           // use `max: 90` on express-rate-limit v6
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Wait a moment." }
});

// ---------- SwiftData v2 bulk status ----------
async function querySwift(identifiers) {
  const apiKey = process.env.SWIFT_API_KEY;
  if (!apiKey) throw Object.assign(new Error("SWIFT_API_KEY is not configured"), { config: true });

  const base = (process.env.SWIFT_BASE_URL || "https://api.swiftdata-link.com/v2")
    .replace(/\/+$/, "");

  const response = await axios.post(
    `${base}/orders/status`,
    { identifiers },
    {
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      timeout: 15000
    }
  );

  const payload = response.data?.data ?? response.data ?? {};

  const orders = Array.isArray(payload.orders) ? [...payload.orders] : [];

  // groups: keep the group itself (matchable by its reference) and its lines
  if (Array.isArray(payload.groups)) {
    for (const item of payload.groups) {
      if (item?.group) orders.push({ ...item.group, isGroup: true });
      if (Array.isArray(item?.orders)) orders.push(...item.orders);
    }
  }

  return { orders, missing: Array.isArray(payload.missing) ? payload.missing : [] };
}

// ---------- only status data leaves the server ----------
function safeOrder(o) {
  return {
    publicId: o.publicId ?? null,
    clientReference: o.clientReference ?? null,
    reference: o.reference ?? null,
    orderId: o.publicId || o.orderId || o.id || o.reference || null,
    status: o.status || o.orderStatus || null,
    network: o.network ?? null,
    sizeLabel: o.sizeLabel ?? null,
    isGroup: Boolean(o.isGroup),
    updatedAt: o.updatedAt ?? null,
    createdAt: o.createdAt ?? null
  };
}

const refsOf = o =>
  [o?.publicId, o?.clientReference, o?.reference, o?.orderId, o?.id]
    .filter(v => v != null)
    .map(v => String(v).trim().toLowerCase());

function failure(res, error) {
  const upstream = error.response?.status;

  console.error("SwiftData status error:", {
    message: error.message,
    upstreamStatus: upstream,
    upstreamBody: error.response?.data
  });

  // never forward the provider's 401/403 to the browser
  return res.status(error.config ? 500 : 502).json({
    success: false,
    message: error.config ? "Status service is not configured." : "Status provider unavailable. Try again."
  });
}

// ======================
// POST /  (bulk, used by the frontend poller)
// body: { identifiers: ["...", "..."] }
// ======================
swiftDataOrderStatusPolling.post("/", limiter, async (req, res) => {
  const raw = Array.isArray(req.body?.identifiers) ? req.body.identifiers : [];

  const identifiers = [...new Set(
    raw.filter(v => typeof v === "string")
       .map(v => v.trim())
       .filter(v => v && v.length <= 80)
  )].slice(0, MAX_IDENTIFIERS);

  if (!identifiers.length)
    return res.json({ success: true, orders: [], groups: [], missing: [] });

  try {
    const { orders, missing } = await querySwift(identifiers);

    // surface statuses nobody has mapped yet
    for (const o of orders) {
      const s = String(o.status || "").toLowerCase();
      if (s && !["pending", "processing", "processed", "delivered", "completed", "failed", "refunded", "cancelled"].includes(s))
        console.warn("SwiftData returned an unfamiliar status:", s);
    }

    res.json({ success: true, orders: orders.map(safeOrder), groups: [], missing });
  } catch (error) {
    failure(res, error);
  }
});

// ======================
// GET /:orderIdOrRef  (single order, kept for older callers)
// ======================
swiftDataOrderStatusPolling.get("/:orderIdOrRef", limiter, async (req, res) => {
  const id = String(req.params.orderIdOrRef || "").trim();

  if (!id || id.length > 80)
    return res.status(400).json({ success: false, message: "Please provide an order ID or reference." });

  try {
    const { orders, missing } = await querySwift([id]);

    const wanted = id.toLowerCase();
    const order = orders.find(o => refsOf(o).includes(wanted));

    if (!order)
      return res.status(404).json({
        success: false,
        message: "No matching order was returned by SwiftData.",
        identifier: id,
        missing
      });

    const s = safeOrder(order);

    res.json({
      success: true,
      order: { ...s, size: s.sizeLabel, timestamp: s.updatedAt || s.createdAt }
    });
  } catch (error) {
    failure(res, error);
  }
});

export default swiftDataOrderStatusPolling;