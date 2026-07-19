import cron from "node-cron";
import axios from "axios";
import { db } from "../firebaseAdmin.js";

export function startOrderSyncJob() {

  // Every 10 minutes
  cron.schedule("*/10 * * * *", async () => {

    console.log("🔄 Running Swift sync job:", new Date());

    try {

   // ======================================
// FETCH PENDING & PROCESSING ORDERS
// ======================================
const snapshot = await db
  .collection("orders")
  .where("status", "in", ["pending", "processing", "delivered", "failed", "cancelled"])
  .get();

// ======================================
// KEEP ONLY LAST 24 HOURS
// ======================================
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

        if(order.statusSource === "admin"){
          console.log(`${order.orderId} locked by admin`);
          continue;
        }

        if (!order.orderId) continue;

        try {

          const base =
            (process.env.SWIFT_BASE_URL ||
            "https://swiftdata-link.com")
            .replace(/\/$/, "");

          const response = await axios.get(
            `${base}/order/status/${order.orderId}`,
            {
              headers: {
                "x-api-key":
                  process.env.SWIFT_API_KEY
              }
            }
          );

          const swiftOrder =
            response.data?.order;

          if (!swiftOrder) continue;

          const swiftStatus =
            String(
              swiftOrder.status || "pending"
            ).toLowerCase();

          if (swiftStatus !== order.status) {

            await docSnap.ref.update({

              status: swiftStatus,
              statusSource: "swift",
              swiftResponse: swiftOrder,

              updatedAt: new Date(),

            });

            console.log(
              `✅ ${order.orderId}: ${order.status} -> ${swiftStatus}`
            );

          }

        } catch (err) {

          console.error(
            `❌ Failed sync ${order.orderId}`,
            err.message
          );

        }

      }

    } catch (err) {

      console.error(
        "🔥 Cron sync failed",
        err.message
      );

    }

  });

}