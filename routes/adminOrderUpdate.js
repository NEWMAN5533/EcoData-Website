import express from "express";
import { db } from "../firebaseAdmin.js";

const adminRoute = express.Router();

// ==============================
// ADMIN UPDATE ORDER STATUS
// ==============================
adminRoute.post("/update-order-status", async (req, res) => {

  try {

    const { orderId, status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        message: "Missing orderId or status"
      });
    }

    // VALID STATUSES
    const allowedStatuses = [
      "pending",
      "processing",
      "delivered",
      "failed"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    // UPDATE FIRESTORE
    await db.collection("orders")
      .doc(orderId)
      .update({
        status,
        updatedAt: new Date(),
      });

    return res.json({
      success: true,
      message: "Order status updated"
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

});

export default adminRoute;
