import express from "express";
import axios from "axios";
import { admin, db } from "../firebaseAdmin.js";

const syncOrderRoute = express.Router();

// ================================
// SYNC SWIFT STATUS TO FIRESTORE
// ================================
syncOrderRoute.get("/:reference", async (req, res) => {

  try {

    const { reference } = req.params;

    if (!reference) {

      return res.status(400).json({
        success: false,
        message: "Missing reference"
      });

    }

    // ========================
    // SWIFT STATUS REQUEST
    // ========================
    const swiftBase =
      (process.env.SWIFT_BASE_URL ||
      "https://swiftdata-link.com")
      .replace(/\/$/, "");

    const swiftUrl =
      `${swiftBase}/order/status/${reference}`;

    const response = await axios.get(
      swiftUrl,
      {
        headers: {
          "x-api-key":
            process.env.SWIFT_API_KEY,

          "Content-Type":
            "application/json",
        },

        timeout: 10000,
      }
    );

    const order =
      response.data?.order;

    if (!order) {

      return res.status(404).json({
        success: false,
        message: "Order not found from Swift"
      });

    }

    // ========================
    // NORMALIZE STATUS
    // ========================
    const status =
      String(
        order.status || "pending"
      ).toLowerCase();

    // ========================
    // UPDATE FIRESTORE
    // ========================
    await db.collection("orders")
      .doc(reference)
      .set({

        status,

        swiftOrderId:
          order.orderId || null,

        swiftReference:
          order.reference || reference,

        updatedAt:
          admin.firestore.FieldValue.serverTimestamp(),

      }, { merge: true });

    return res.json({
      success: true,
      reference,
      status,
    });

  } catch (err) {

    console.error(
      "🔥 Sync status error:",
      err.response?.data || err.message
    );

    return res.status(500).json({
      success: false,
      error:
        err.response?.data || err.message,
    });

  }

});

export default syncOrderRoute;