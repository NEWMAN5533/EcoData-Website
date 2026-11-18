import express from "express";
import { db } from "../firebaseAdmin.js";
import crypto from "crypto";

const storesRouter = express.Router();

storesRouter.post("/create-store", async (req, res) => {
  try {
    const {
      businessName,
      whatsapp,
      location,
      storeType
    } = req.body;

    // ✅ VALIDATION
    if (!businessName || !whatsapp || !storeType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // ==========================
    // 🔥 GENERATE UNIQUE STORE ID
    // ==========================
    const storeId = crypto.randomBytes(4).toString("hex");

    // ==========================
    // 🔗 STORE LINK
    // ==========================
    const baseUrl = process.env.ECO_BASE_URL || "https://ecodata-app.onrender.com/";
    const storeLink = `${baseUrl}/store.html?store=${storeId}`;

    // ==========================
    // 💾 SAVE TO FIREBASE
    // ==========================
    await db.collection("stores").doc(storeId).set({
      storeId,
      businessName,
      whatsapp,
      location: location || "",
      storeType,

      createdAt: new Date(),

      // 🔐 Subscription defaults
      subscriptionActive: false,
      plan: "free",
      maxProducts: 5
    });

    // ==========================
    // ✅ RESPONSE
    // ==========================
    res.json({
      success: true,
      storeId,
      storeLink
    });

  } catch (err) {
    console.error("🔥 create-store error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

export default storesRouter;