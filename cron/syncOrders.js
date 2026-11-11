import cron from "node-cron";
import axios from "axios";
import { db } from "../firebaseAdmin.js";


// ---------- config ----------
const SWIFT_BASE = (
  process.env.SWIFT_BASE_URL || "https://api.swiftdata-link.com/v2"
).replace(/\/+$/, "");
const ECO_BASE = (
  process.env.ECO_BASE_URL || `http://localhost:${process.env.PORT || 3000}`
).replace(/\/+$/, "");
const DATAMART_PREFIX =
  process.env.DATAMART_REF_PREFIX || "Ia553341879ecodata-";
const WINDOW_HOURS = 72;
const SWIFT_BATCH = 100; // SwiftData allows 200 per request

// ---------- statuses ----------
const FINAL = new Set(["delivered", "failed", "refunded"]);
const MAP = {
  completed: "delivered",
  delivered: "delivered",
  success: "delivered",
  successful: "delivered",
  processed: "delivered",
  sent: "delivered",
  failed: "failed",
  cancelled: "failed",
  canceled: "failed",
  rejected: "failed",
  error: "failed",
  refunded: "refunded",
  pending: "pending",
  waiting: "pending",
  queued: "pending",
  processing: "processing",
  in_progress: "processing",
  "in progress": "processing",
};

function norm(raw) {
  const s = String(raw || "")
    .trim()
    .toLowerCase();
  if (s && !MAP[s])
    console.warn("⚠️ Unfamiliar provider status (kept as processing):", s);
  return MAP[s] || "processing";
}

const toMs = (v) =>
  v?.toDate ? v.toDate().getTime() : v ? new Date(v).getTime() : 0;

// ---------- one safe writer for both providers ----------
async function applyStatus(docSnap, rawStatus, source, extra = {}) {
  const raw = String(rawStatus || "")
    .trim()
    .toLowerCase();
  if (!raw) return;

  const status = norm(raw);

  // re-read just before writing: an admin or the last run may have changed it
  const fresh = (await docSnap.ref.get()).data();
  if (!fresh || fresh.statusSource === "admin" || FINAL.has(fresh.status))
    return;

  const update = { lastCheckedAt: new Date() };

  if (status !== fresh.status || fresh.providerStatus !== raw) {
    Object.assign(update, {
      status,
      providerStatus: raw,
      statusSource: source,
      updatedAt: new Date(),
      ...extra,
      ...(status === "delivered" ? { deliveredAt: new Date() } : {}),
    });
  }

  await docSnap.ref.update(update);

  if (update.status) {
    console.log(
      `✅ [${source}] ${fresh.orderId || docSnap.id}: ${fresh.status} -> ${status}`,
    );

    if (status === "delivered") {
      try {
        await creditSpinProgress(docSnap.ref);
      } catch (e) {
        console.error("Spin credit failed:", docSnap.id, e.message);
      }
    }
  }
}

// ---------- DATAMART (through your own status route) ----------
async function syncDataMart(docs) {
  for (const docSnap of docs) {
    const o = docSnap.data();
    const reference =
      o.providerOrderReference ||
      (o.paymentReference ? `${DATAMART_PREFIX}${o.paymentReference}` : null);

    if (!reference) {
      console.warn(`[datamart] ${docSnap.id} has no reference`);
      continue;
    }

    try {
      const res = await axios.get(
        `${ECO_BASE}/api/datamart/order-status/${encodeURIComponent(reference)}`,
        { timeout: 15000, validateStatus: (s) => s < 500 },
      );
      if (res.status !== 200 || res.data?.success !== true) continue;

      const po = res.data.order || res.data.data || {};
      await applyStatus(docSnap, po.status || po.orderStatus, "datamart", {
        providerOrderReference: reference,
        datamartResponse: po,
      });
    } catch (err) {
      // 5xx means DataMart is down: stop for this run, nothing is marked failed
      console.error(
        "⏸️ [datamart] provider unavailable, skipping the rest:",
        err.response?.status || err.message,
      );
      return;
    }
  }
}

// ---------- SWIFTDATA v2 (one request for up to 100 orders) ----------
async function syncSwift(docs) {
  for (let i = 0; i < docs.length; i += SWIFT_BATCH) {
    const chunk = docs.slice(i, i + SWIFT_BATCH);

    const ids = [
      ...new Set(
        chunk.flatMap((d) => {
          const o = d.data();
          return [o.orderId, o.paymentReference]
            .filter((v) => typeof v === "string" && v.trim())
            .map((v) => v.trim());
        }),
      ),
    ];

    try {
      const res = await axios.post(
        `${SWIFT_BASE}/orders/status`,
        { identifiers: ids },
        {
          headers: {
            "X-API-Key": process.env.SWIFT_API_KEY,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 20000,
        },
      );

      const payload = res.data?.data ?? res.data ?? {};
      const orders = Array.isArray(payload.orders) ? [...payload.orders] : [];

      const byRef = new Map();
      for (const so of orders)
        for (const k of [
          so.publicId,
          so.clientReference,
          so.reference,
          so.orderId,
          so.id,
        ])
          if (k != null) byRef.set(String(k).trim().toLowerCase(), so);

      for (const docSnap of chunk) {
        const o = docSnap.data();
        const match =
          byRef.get(
            String(o.orderId || "")
              .trim()
              .toLowerCase(),
          ) ||
          byRef.get(
            String(o.paymentReference || "")
              .trim()
              .toLowerCase(),
          );

        if (!match) continue; // unknown to the API (for example bought on their website)

        await applyStatus(docSnap, match.status || match.orderStatus, "swift", {
          swiftResponse: {
            publicId: match.publicId ?? null,
            status: match.status ?? null,
            updatedAt: match.updatedAt ?? null,
          },
        });
      }
    } catch (err) {
      console.error(
        "❌ [swift] batch failed:",
        err.response?.status,
        err.response?.data?.message || err.message,
      );
    }
  }
}

// ---------- the job ----------
let running = false;

async function syncOrders() {
  if (running) {
    console.log("⏭️ Previous sync still running, skipping");
    return;
  }
  running = true;
  console.log("🔄 Order sync started:", new Date().toISOString());

  try {
    // only unfinished orders: small, and needs no composite index
    const snap = await db
      .collection("orders")
      .where("status", "in", ["pending", "processing"])
      .get();
    const cutoff = Date.now() - WINDOW_HOURS * 3600 * 1000;

    const dm = [],
      sw = [];

    for (const d of snap.docs) {
      const o = d.data();
      if (o.statusSource === "admin") continue;
      if (toMs(o.createdAt) < cutoff) continue;

      const provider = String(o.provider || "").toLowerCase();
      const isEdo = String(o.orderId || "").startsWith("EDO-");

      if (provider === "datamart" || (isEdo && o.paymentReference)) dm.push(d);
      else if (!isEdo && (o.orderId || o.paymentReference)) sw.push(d);
    }

    console.log(
      `📊 To check: ${dm.length} datamart, ${sw.length} swift (of ${snap.size} unfinished)`,
    );

    await syncDataMart(dm);
    await syncSwift(sw);
  } catch (err) {
    console.error("🔥 Order sync failed:", err.message);
  } finally {
    running = false;
    console.log("🏁 Order sync finished");
  }
}

export function startOrderSyncJob() {
  cron.schedule("*/9 * * * *", syncOrders); // every 9 minutes

  setTimeout(syncOrders, 20000); // one run shortly after every boot or wake-up
  console.log("⏰ Order sync scheduled");
}
