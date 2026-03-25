import express from "express";
import fetch from "node-fetch";
import { db } from "../frontend/firebase-config.js";

const subscriptionRouter = express.Router();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

subscriptionRouter.post("/initiate-subscription", async (req, res) => {
  try {
    const { email, storeId, plan } = req.body;

    if (!storeId || !plan) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // ✅ ALL PLANS (INCLUDING FREE)
    const plans = {
      free: { amount: 0, maxProducts: 5 },
      basic: { amount: 2000, maxProducts: 10 },
      pro: { amount: 5000, maxProducts: 50 },
      premium: { amount: 10000, maxProducts: 200 }
    };

    const selectedPlan = plans[plan];

    if (!selectedPlan) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    // ==========================
    // ✅ FREE PLAN (NO PAYMENT)
    // ==========================
    if (plan === "free") {
      await db.collection("stores").doc(storeId).update({
        plan: "free",
        maxProducts: selectedPlan.maxProducts,
        subscriptionActive: true,
        subscribedAt: new Date()
      });

      return res.json({
        success: true,
        free: true
      });
    }

    // ==========================
    // 💰 PAID PLANS (PAYSTACK)
    // ==========================
    if (!email) {
      return res.status(400).json({ error: "Email required for payment" });
    }

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        amount: selectedPlan.amount,
        metadata: {
          storeId,
          plan,
          maxProducts: selectedPlan.maxProducts
        }
      })
    });

    const data = await response.json();

    if (!data.status) {
      return res.status(400).json({ error: "Payment init failed" });
    }

    res.json({
      success: true,
      paymentUrl: data.data.authorization_url
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default subscriptionRouter;