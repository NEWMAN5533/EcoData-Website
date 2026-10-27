import express from "express";
import crypto from "crypto";

import {
  getDataMartOrderByProviderReference,
  updateDataMartOrder,
} from "../services/dataMartOrderRepository.js";

const webhookRouter = express.Router();

// ==========================================
// VERIFY DATAMART WEBHOOK SIGNATURE
// ==========================================
function verifyDataMartSignature(req) {
  const secret = process.env.DATAMART_WEBHOOK_SECRET;
  const signature = req.get("X-DataMart-Signature");

  if (
    !secret ||
    !signature ||
    !req.body ||
    typeof req.body !== "object"
  ) {
    return false;
  }

  try {
    // Matches DataMart's published Node.js example.
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    // SHA-256 HMAC signatures are 64 hexadecimal characters.
    if (!/^[a-fA-F0-9]{64}$/.test(signature)) {
      return false;
    }

    const receivedBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    return (
      receivedBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
    );
  } catch (error) {
    console.error(
      "DataMart signature verification error:",
      error.message
    );

    return false;
  }
}

// ==========================================
// MAP DATAMART EVENTS TO ECODATA STATUSES
// ==========================================
function mapWebhookStatus(event, dataStatus) {
  const eventName = String(event || "")
    .trim()
    .toLowerCase();

  const status = String(dataStatus || "")
    .trim()
    .toLowerCase();

  // Prefer the explicit event name over data.status.
  // This prevents "order.completed" being interpreted
  // as processing when data.status contains an old value.
  const eventStatuses = {
    "order.created": "processing",
    "order.processing": "processing",
    "order.waiting": "processing",
    "order.completed": "completed",
    "order.failed": "failed",
    "order.refunded": "refunded",
  };

  if (eventStatuses[eventName]) {
    return eventStatuses[eventName];
  }

  const statusMap = {
    created: "processing",
    waiting: "processing",
    pending: "processing",
    processing: "processing",

    completed: "completed",
    success: "completed",
    successful: "completed",
    delivered: "completed",

    failed: "failed",
    cancelled: "failed",
    canceled: "failed",
    rejected: "failed",

    refunded: "refunded",
  };

  return statusMap[status] || null;
}

// ==========================================
// PREVENT OLD EVENTS FROM REVERTING FINAL STATUS
// ==========================================
function shouldIgnoreStatusUpdate(currentStatus, nextStatus) {
  const current = String(currentStatus || "")
    .trim()
    .toLowerCase();

  const finalStatuses = ["completed", "failed", "refunded"];
  const nonFinalStatuses = ["pending", "processing"];

  // Never downgrade a final status to a pending status.
  if (
    finalStatuses.includes(current) &&
    nonFinalStatuses.includes(nextStatus)
  ) {
    return true;
  }

  // A completed or refunded order should not be changed
  // to failed by a later-arriving failure event.
  if (
    ["completed", "refunded"].includes(current) &&
    nextStatus === "failed"
  ) {
    return true;
  }

  // A refunded order remains refunded if an older
  // completion event arrives afterwards.
  if (
    current === "refunded" &&
    nextStatus === "completed"
  ) {
    return true;
  }

  // Allow failed -> completed in case DataMart later
  // confirms that the order was actually delivered.
  // Allow completion/failure -> refunded for a refund event.
  return false;
}

webhookRouter.post("/", (req, res) => {
  // 1. Verify the signature before acknowledging the event.
  if (!verifyDataMartSignature(req)) {
    console.warn("Rejected EcoData webhook: invalid signature.");

    return res.status(401).json({
      received: false,
      message: "Invalid webhook signature.",
    });
  }

  // 2. Validate the payload.
  const { event, data } = req.body || {};

  if (
    typeof event !== "string" ||
    !data ||
    typeof data !== "object" ||
    !data.orderReference
  ) {
    return res.status(400).json({
      received: false,
      message: "Missing event or order reference.",
    });
  }

  const orderReference = String(data.orderReference).trim();

  if (!orderReference) {
    return res.status(400).json({
      received: false,
      message: "Invalid order reference.",
    });
  }

  // Snapshot the payload before background processing.
  const payload = JSON.parse(JSON.stringify(req.body));

  console.log("EcoData webhook accepted:", {
    event,
    orderReference,
  });

  // 3. Acknowledge DataMart immediately.
  res.status(200).json({
    received: true,
    message: "Webhook acknowledged.",
  });

  // 4. Process the order after sending the response.
  setImmediate(() => {
    processDataMartWebhook(event, payload).catch((error) => {
      console.error("Background DataMart webhook processing failed:", {
        event,
        orderReference,
        message: error.message,
      });
    });
  });
});

// ==========================================
// PROCESS WEBHOOK IN BACKGROUND
// ==========================================
async function processDataMartWebhook(event, payload) {
  const { data } = payload;
  const orderReference = String(data.orderReference).trim();

  try {
    const order = await getDataMartOrderByProviderReference(
      orderReference
    );

    if (!order) {
      console.error("EcoData webhook order not found:", {
        event,
        orderReference,
      });

      return;
    }

    const nextStatus = mapWebhookStatus(event, data.status);

    if (!nextStatus) {
      console.log("Unsupported EcoData event ignored:", {
        event,
        orderReference,
        providerStatus: data.status || null,
      });

      return;
    }

    const currentStatus = String(order.orderStatus || "")
      .trim()
      .toLowerCase();

    if (shouldIgnoreStatusUpdate(currentStatus, nextStatus)) {
      console.log("EcoData status update ignored:", {
        orderReference,
        currentStatus,
        incomingStatus: nextStatus,
      });

      return;
    }

    const updatedOrder = await updateDataMartOrder(
      order.paymentReference,
      {
        orderStatus: nextStatus,
        providerOrderReference: orderReference,
        providerTransactionReference:
          data.transactionId ?? undefined,
        providerPurchaseId: data.orderId ?? undefined,
        providerPrice: data.price ?? undefined,
        providerResponse: payload,
        lastError:
          nextStatus === "failed"
            ? "EcoData reported that the order failed."
            : null,
      }
    );

    console.log("Ecodata webhook processed:", {
      event,
      orderReference,
      paymentReference: order.paymentReference,
      orderStatus: updatedOrder?.orderStatus || nextStatus,
    });
  } catch (error) {
    console.error("EcoData background update failed:", {
      event,
      orderReference,
      message: error.message,
    });
  }
}

export default webhookRouter;
