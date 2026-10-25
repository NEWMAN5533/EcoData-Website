import express from "express";
import crypto from "crypto";

import {
  getDataMartOrderByProviderReference,
  updateDataMartOrder,
} from "../services/dataMartOrderRepository.js";

const webhookRouter = express.Router();

function verifyDataMartSignature(req) {
  const secret = process.env.DATAMART_WEBHOOK_SECRET;
  const signature = req.get("X-DataMart-Signature");

  if (!secret || !signature || !req.body) {
    return false;
  }

  // Matches the JSON.stringify(req.body) approach
  // in DataMart's published Node.js example.
  const expected = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  const receivedBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return (
    receivedBuffer.length === expectedBuffer.length &&
    receivedBuffer.length > 0 &&
    crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

function mapWebhookStatus(event, dataStatus) {
  const value = String(
    dataStatus || event || ""
  ).trim().toLowerCase();

  if (
    value === "order.completed" ||
    ["completed", "success", "successful", "delivered"].includes(value)
  ) {
    return "completed";
  }

  if (
    value === "order.refunded" ||
    value === "refunded"
  ) {
    return "refunded";
  }

  if (
    value === "order.failed" ||
    ["failed", "cancelled", "canceled", "rejected"].includes(value)
  ) {
    return "failed";
  }

  if (
    value === "order.waiting" ||
    value === "order.processing" ||
    value === "order.created" ||
    ["waiting", "pending", "processing", "created"].includes(value)
  ) {
    return "processing";
  }

  return null;
}

webhookRouter.post("/", async (req, res) => {
  if (!verifyDataMartSignature(req)) {
    console.warn("Rejected DataMart webhook: invalid signature.");

    return res.status(401).json({
      received: false,
      message: "Invalid webhook signature.",
    });
  }

  const { event, data } = req.body || {};

  if (!event || !data || !data.orderReference) {
    return res.status(400).json({
      received: false,
      message: "Missing event or order reference.",
    });
  }

  try {
    const order = await getDataMartOrderByProviderReference(
      data.orderReference
    );

    if (!order) {
      console.warn("DataMart webhook order not found:", {
        event,
        orderReference: data.orderReference,
      });

      return res.status(404).json({
        received: false,
        message: "Matching DataMart order not found.",
      });
    }

    const nextStatus = mapWebhookStatus(event, data.status);

    if (!nextStatus) {
      console.warn("Unsupported DataMart webhook event:", event);

      // Acknowledge valid but unsupported events to avoid
      // repeatedly delivering an event this handler cannot process.
      return res.status(200).json({
        received: true,
        ignored: true,
      });
    }

    // Do not let an old processing/waiting event downgrade
    // an order that has already reached a final status.
    const currentStatus = String(order.orderStatus || "").toLowerCase();

    if (
      ["completed", "failed", "refunded"].includes(currentStatus) &&
      ["pending", "processing"].includes(nextStatus)
    ) {
      return res.status(200).json({
        received: true,
        ignored: true,
        message: "A final order status is already recorded.",
      });
    }

    // A refund is a later financial event and may follow completion.
    // A completed event may also correct an earlier failed status.
    const updatedOrder = await updateDataMartOrder(
      order.paymentReference,
      {
        orderStatus: nextStatus,
        providerOrderReference: data.orderReference,
        providerTransactionReference: data.transactionId ?? undefined,
        providerPurchaseId: data.orderId ?? undefined,
        providerPrice: data.price ?? undefined,
        providerResponse: req.body,
        lastError:
          nextStatus === "failed"
            ? "DataMart reported that the order failed."
            : null,
      }
    );

    console.log("DataMart webhook processed:", {
      event,
      orderReference: data.orderReference,
      paymentReference: order.paymentReference,
      orderStatus: updatedOrder.orderStatus,
    });

    return res.status(200).json({
      received: true,
      orderStatus: updatedOrder.orderStatus,
    });
  } catch (error) {
    console.error("DataMart webhook processing failed:", error.message);

    return res.status(500).json({
      received: false,
      message: "Unable to process DataMart webhook.",
    });
  }
});

export default webhookRouter;