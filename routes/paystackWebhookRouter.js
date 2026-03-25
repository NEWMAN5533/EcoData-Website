import express from "express";
import crypto from "crypto";
import { admin, db } from "../firebaseAdmin.js";
import { handleBuyDataRequest } from "../server.js"

const paystackWebhookRouter = express.Router();
const db = admin.firestore();

paystackWebhookRouter.post("/paystack/webhook", async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;

    const hash = crypto
      .createHmac("sha512", secret)
      .update(req.rawBody)
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      console.log("❌ Invalid signature");
      return res.sendStatus(401);
    }

    const event = req.body;

    // =========================
    // ✅ PAYMENT SUCCESS
    // =========================
    if (event.event === "charge.success") {
      const data = event.data;

      const reference = data.reference;
      const metadata = data.metadata || {};

      console.log("💰 Payment success:", reference);

      // =========================
      // 🟣 1. SUBSCRIPTION PAYMENT
      // =========================
      if (metadata.storeId && metadata.plan) {
        const { storeId, plan, maxProducts } = metadata;

        await db.collection("stores").doc(storeId).update({
          plan,
          maxProducts,
          subscriptionActive: true,
          subscribedAt: new Date(),
        });

        console.log("✅ Store upgraded:", storeId);
      }

      // =========================
      // 🔵 2. BUNDLE PAYMENT (IMPORTANT)
      // =========================
    if (metadata.type === "bundle") {
  const { network, recipient, pkg, size } = metadata;

  await handleBuyDataRequest({
    network,
    recipient,
    pkg,
    size,
    paymentReference: reference
  });

  console.log("📦 Bundle processed instantly (no API call)");
}
    }

    res.sendStatus(200);

  } catch (err) {
    console.error("🔥 Webhook error:", err);
    res.sendStatus(500);
  }
});

export default paystackWebhookRouter;