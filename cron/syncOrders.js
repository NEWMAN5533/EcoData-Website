import cron from "node-cron";
import axios from "axios";
import { db } from "../firebaseAdmin.js";

const DATAMART_PREFIX = process.env.DATAMART_REF_PREFIX || "Ia553341879ecodata-";

// Same backend (same process), so localhost works in production too
const SELF_BASE =
  process.env.SELF_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

const DATAMART_STATUS_MAP = {
  completed: "delivered",
  delivered: "delivered",
  success: "delivered",
  successful: "delivered",

  failed: "failed",
  cancelled: "failed",
  canceled: "failed",
  rejected: "failed",

  refunded: "refunded",

  pending: "pending",
  waiting: "pending",
  processing: "processing",
  in_progress: "processing",
  "in progress": "processing",
  unknown: "pending"
};

const DATAMART_TERMINAL = new Set(["delivered", "failed", "refunded"]);

let syncRunning = false;

// ---------- SWIFT (unchanged logic) ----------
async function syncSwiftOrder(docSnap, order) {
  if (!order.orderId) return;

  const base = (process.env.SWIFT_BASE_URL || "https://swiftdata-link.com")
    .replace(/\/$/, "");

  const response = await axios.get(`${base}/order/status/${order.orderId}`, {
    headers: { "x-api-key": process.env.SWIFT_API_KEY }
  });

  const swiftOrder = response.data?.order;
  if (!swiftOrder) return;

  const swiftStatus = String(swiftOrder.status || "pending").toLowerCase();

  if (swiftStatus !== order.status) {
    await docSnap.ref.update({
      status: swiftStatus,
      statusSource: "swift",
      swiftResponse: swiftOrder,
      updatedAt: new Date()
    });
    console.log(`✅ [swift] ${order.orderId}: ${order.status} -> ${swiftStatus}`);
  }
}

// ---------- DATAMART ----------
async function syncDataMartOrder(docSnap, order) {
  const currentStatus = String(order.status || "").toLowerCase();

  // Nothing left to learn from the provider
  if (DATAMART_TERMINAL.has(currentStatus)) return;

  const reference =
    order.providerOrderReference ||
    (order.paymentReference
      ? `${DATAMART_PREFIX}${order.paymentReference}`
      : null);

  if (!reference) {
    console.warn(`[datamart] ${docSnap.id} has no reference, skipped`);
    return;
  }

  const response = await axios.get(
    `${SELF_BASE}/api/datamart/order-status/${encodeURIComponent(reference)}`,
    { headers: { Accept: "application/json" }, timeout: 15000 }
  );

  const result = response.data;
  if (result?.success !== true) return;

  const providerOrder = result.order || result.data || {};

  const rawStatus = String(
    providerOrder.status || providerOrder.orderStatus || "processing"
  ).trim().toLowerCase();

  const status = DATAMART_STATUS_MAP[rawStatus] || rawStatus;

  if (status !== currentStatus || order.providerStatus !== rawStatus) {
    await docSnap.ref.update({
      status,
      providerStatus: rawStatus,
      providerOrderReference: reference,
      statusSource: "datamart",
      datamartResponse: providerOrder,
      updatedAt: new Date()
    });
    console.log(`✅ [datamart] ${reference}: ${currentStatus} -> ${status}`);
  }
}

export function startOrderSyncJob() {
  cron.schedule("*/9 * * * *", async () => {
    if (syncRunning) {
      console.log("⏭️ Previous sync still running, skipping");
      return;
    }
    syncRunning = true;

    console.log("🔄 Running order sync job:", new Date());

    try {
      const snapshot = await db
        .collection("orders")
        .where("status", "in", ["pending", "processing", "delivered", "failed", "cancelled"])
        .get();

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const recentOrders = snapshot.docs.filter(doc => {
        const data = doc.data();
        if (!data.createdAt) return false;

        const createdAt = data.createdAt?.toDate
          ? data.createdAt.toDate()
          : new Date(data.createdAt);

        return createdAt >= yesterday;
      });

      for (const docSnap of recentOrders) {
        const order = docSnap.data();

        if (order.statusSource === "admin") {
          console.log(`${order.orderId || docSnap.id} locked by admin`);
          continue;
        }

        try {
          const provider = String(order.provider || "").toLowerCase();

          if (provider === "datamart") {
            await syncDataMartOrder(docSnap, order);
          } else {
            await syncSwiftOrder(docSnap, order);
          }
        } catch (err) {
          console.error(`❌ Failed sync ${order.orderId || docSnap.id}`, err.message);
        }
      }
    } catch (err) {
      console.error("🔥 Cron sync failed", err.message);
    } finally {
      syncRunning = false;
    }
  });
}
