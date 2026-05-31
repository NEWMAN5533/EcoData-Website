import cron from "node-cron";
import axios from "axios";
import { db } from "../firebaseAdmin.js";

export function startOrderSyncJob() {

  // Every 5 minutes
  cron.schedule("* * * * *", async () => {

    console.log("🔄 Running Swift sync job:", new Date());

    try {

      const snapshot = await db
        .collection("orders")
        .where("status", "in", [
          "pending",
          "processing"
        ])
        .get();

      for (const docSnap of snapshot.docs) {

        const order = docSnap.data();

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
