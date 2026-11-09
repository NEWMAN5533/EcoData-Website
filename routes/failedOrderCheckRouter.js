import axios from "axios";
import express from "express";

const failedOrderCheckRouter = express.Router();

// ======================
// SEARCH LIVE ORDER STATUS
// Frontend still calls GET /:orderIdOrRef
// SwiftData is queried using POST /orders/status
// ======================
failedOrderCheckRouter.get("/:orderIdOrRef", async (req, res) => {
  const orderIdOrRef = String(req.params.orderIdOrRef || "").trim();

  if (!orderIdOrRef) {
    return res.status(400).json({
      success: false,
      message: "Please provide an order ID or reference.",
    });
  }

  const apiKey = process.env.SWIFT_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: "SwiftData API key is not configured.",
    });
  }

  try {
    // ========================
    // SWIFTDATA V2 BASE URL
    // ========================
    const base = (
      process.env.SWIFT_BASE_URL ||
      "https://api.swiftdata-link.com/v2"
    ).replace(/\/+$/, "");

    const swiftUrl = `${base}/orders/status`;

    console.log("Checking SwiftData bulk status:", {
      url: swiftUrl,
      identifier: orderIdOrRef,
    });

    // ========================
    // REQUEST SWIFTDATA
    // ========================
    const response = await axios.post(
      swiftUrl,
      {
        identifiers: [orderIdOrRef],
      },
      {
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 15000,
      }
    );

    console.log(
      "SWIFTDATA BULK STATUS RESPONSE:",
      JSON.stringify(response.data, null, 2)
    );

    const payload = response.data?.data ?? response.data;

    // ========================
    // EXTRACT RETURNED ORDERS
    // ========================
    const orders = Array.isArray(payload?.orders)
      ? [...payload.orders]
      : [];

    // Bulk responses may also contain orders grouped together.
    if (Array.isArray(payload?.groups)) {
      for (const item of payload.groups) {
        if (item?.group) {
          orders.push(item.group);
        }

        if (Array.isArray(item?.orders)) {
          orders.push(...item.orders);
        }
      }
    }

    // Match the requested identifier to a provider order.
    const requested = orderIdOrRef.toLowerCase();

    const order = orders.find((item) => {
      const identifiers = [
        item?.publicId,
        item?.clientReference,
        item?.reference,
        item?.orderId,
        item?.id,
      ];

      return identifiers.some(
        (value) =>
          value != null &&
          String(value).trim().toLowerCase() === requested
      );
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "No matching order was returned by SwiftData.",
        identifier: orderIdOrRef,
        missing: payload?.missing ?? [],
      });
    }

    // ========================
    // RETURN FRONTEND FIELDS
    // ========================
    return res.json({
      success: true,
      order: {
        ...order,
        orderId:
          order.publicId ||
          order.orderId ||
          order.id ||
          order.reference ||
          null,
        recipient:
          order.beneficiaryMsisdn ||
          order.recipient ||
          order.msisdn ||
          null,
        size:
          order.sizeLabel ||
          order.volume ||
          order.size ||
          null,
        status:
          order.status ||
          order.orderStatus ||
          null,
        timestamp:
          order.updatedAt ||
          order.createdAt ||
          order.timestamp ||
          null,
      },
    });
  } catch (error) {
    console.error("========== LIVE ORDER STATUS ERROR ==========");
    console.error("Message:", error.message);
    console.error("Status:", error.response?.status);
    console.error("SwiftData response:", error.response?.data);
    console.error("==============================================");

    return res.status(error.response?.status || 500).json({
      success: false,
      message:
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        error.message ||
        "Unable to retrieve order status.",
    });
  }
});

export default failedOrderCheckRouter;