import express from "express";
import axios from "axios";
import { admin, db } from "../firebaseAdmin.js";

const syncOrderRoute = express.Router();

// ======================================
// SYNC SWIFT STATUS TO FIRESTORE
// ======================================
syncOrderRoute.get("/sync-order/:orderId", async (req, res) => {

  const { orderId } = req.params;

  if (!orderId) {

    return res.status(400).json({
      success: false,
      message: "Missing order ID"
    });

  }

  try {

    // ======================================
    // FETCH STATUS FROM SWIFT
    // ======================================
    const base =
      (process.env.SWIFT_BASE_URL ||
      "https://swiftdata-link.com")
      .replace(/\/$/, "");

    const swiftUrl =
      `${base}/order/status/${encodeURIComponent(orderId)}`;

    const response = await axios.get(swiftUrl, {

      headers: {
        "x-api-key": process.env.SWIFT_API_KEY,
        "Content-Type": "application/json",
      },

      timeout: 10000,

    });

    if (!response.data?.success) {

      return res.status(400).json({
        success: false,
        message: "Swift fetch failed"
      });

    }

    // ======================================
    // SWIFT ORDER DATA
    // ======================================
    const swiftOrder =
      response.data.order;

    const newStatus =
      String(
        swiftOrder.status || "pending"
      ).toLowerCase();

    // ======================================
    // FIND ORDER IN FIRESTORE
    // ======================================
    const snapshot =
      await db
        .collection("orders")
        .where("orderId", "==", orderId)
        .limit(1)
        .get();

    if (snapshot.empty) {

      return res.status(404).json({
        success: false,
        message: "Order not found"
      });

    }

    // ======================================
    // UPDATE FIRESTORE
    // ======================================
    const firestoreDocId =
      snapshot.docs[0].id;

      const firestoreOrder = snapshot.docs[0].data();

      // Don't overwrite if admin manually set the status
      if(firestoreOrder.statusSource === "admin"){
        return res.json({
          success: true,
          message: 'Order locked by admin. swift update skipped.',
          status: firestoreOrder.status,
        })
      }

    await db
      .collection("orders")
      .doc(firestoreDocId)
      .update({

        status: newStatus,

        statusSource: 'swift',

        swiftResponse: swiftOrder,

        updatedAt: new Date(),

      });

    // ======================================
    // SUCCESS RESPONSE
    // ======================================
    return res.json({

      success: true,

      message:
        "Order synced successfully",

      status: newStatus,

      order: swiftOrder,

    });

  } catch (error) {

    console.error(
      "🔥 Sync Error:",
      error.response?.data || error.message
    );

    return res.status(500).json({

      success: false,

      message: "Sync failed",

      error:
        error.response?.data ||
        error.message,

    });

  }

});

export default syncOrderRoute;