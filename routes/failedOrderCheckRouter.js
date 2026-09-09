import axios from "axios";
import express from "express";

const failedOrderCheckRouter = express.Router();

//======================
// SEARCH LIVE ORDER STATUS
//======================
failedOrderCheckRouter.get("/:orderIdOrRef", async (req, res) => {

  const orderIdOrRef =
    String(req.params.orderIdOrRef || "").trim();

  //=====================
  // VALIDATE ORDER-ID
  //=====================
  if (!orderIdOrRef) {
    return res.status(400).json({
      success: false,
      message: "Please provide an order ID or reference."
    });
  }

  try {

    //========================
    // SWIFT BASE URL
    //========================
    const base = (
      process.env.SWIFT_BASE_URL ||
      "https://swiftdata-link.com"
    ).replace(/\/$/, "");

    //========================
    // SWIFT ORDER STATUS URL
    //========================
    const swiftUrl =
      `${base}/order/status/${encodeURIComponent(orderIdOrRef)}`;

    console.log("Checking SwiftData:", swiftUrl);

    //========================
    // REQUEST SWIFT
    //========================
console.log(
  "Swift API key loaded:",
  Boolean(process.env.SWIFT_API_KEY)
);
    const response = await axios.get(swiftUrl, {
      headers: {
        "x-api-key": process.env.SWIFT_API_KEY,
        "Content-Type": "application/json"
      },
      timeout: 10000
    });

    console.log(
      "SwiftData response:",
      response.data
    );

    //===========================
    // VALIDATE SWIFT RESPONSE
    //===========================
    if (
      !response.data?.success ||
      !response.data?.order
    ) {
      return res.status(404).json({
        success: false,
        message:
          response.data?.message ||
          "Order not found."
      });
    }

    const order = response.data.order;

    //============================
    // RETURN REQUIRED FIELDS
    //============================
    return res.json({
      success: true,

      order: {
        orderId: order.orderId || null,
        recipient: order.recipient || null,
        size: order.volume || order.size || null,
        status: order.status || null,
        timestamp: order.timestamp || null
      }
    });

   } catch (error) {

  console.error("========== LIVE ORDER STATUS ERROR ==========");
  console.error("Message:", error.message);
  console.error("Status:", error.response?.status);
  console.error("SwiftData response:", error.response?.data);
  console.error("SwiftData headers:", error.response?.headers);
  console.error("==============================================");

  if (error.response) {
    return res.status(error.response.status || 500).json({
      success: false,
      message:
        error.response.data?.message ||
        error.response.data?.error ||
        "Unable to retrieve order status.",
      swiftError: error.response.data
    });
  }

  return res.status(500).json({
    success: false,
    message: "Unable to connect to the live order service.",
    error: error.message
  });
}
});

export default failedOrderCheckRouter;