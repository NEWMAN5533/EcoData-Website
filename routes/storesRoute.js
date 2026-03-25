import express from "express";
import { db } from "../frontend/firebaseAdmin";

const router = express.Router();

router.post("/create-store", async (req, res) => {
  try {
    const { userId,  storeName } = req.body;

    if( !userId || !storeName ) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Generate unique storeId
    const storeId = storeName.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();

    await db.collection("stores").doc(storeId).set({
      userId,
      storeName,
      storeId,
      createdAt: new Date(),

      // Subscription defaults

      subscriptionActive: false,
      maxProduct: 0,
    });

    res.json({
      success: true,
      storeId,
      storeLink: `https//ecodata-app.onrender.com/store.html?store=${storeId}`
    });


  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }

});

export default router;