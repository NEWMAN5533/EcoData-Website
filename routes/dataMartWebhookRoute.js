
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

// ==========================================
// DATAMART WEBHOOK ENDPOINT
// POST /webhook
// ==========================================
webhookRouter.post("/", async (req, res) => {
  const receivedAt = Date.now();

  // ------------------------------------------
  // 1. Validate signature
  // ------------------------------------------
  if (!verifyDataMartSignature(req)) {
    console.warn("Rejected DataMart webhook: invalid signature.", {
      event: req.body?.event || null,
      hasSecret: Boolean(process.env.DATAMART_WEBHOOK_SECRET),
      hasSignature: Boolean(
        req.get("X-DataMart-Signature")
      ),
    });

    return res.status(401).json({
      received: false,
      message: "Invalid webhook signature.",
    });
  }

  // ------------------------------------------
  // 2. Validate payload
  // ------------------------------------------
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

  const providerOrderReference = String(
    data.orderReference
  ).trim();

  if (!providerOrderReference) {
    return res.status(400).json({
      received: false,
      message: "Invalid order reference.",
    });
  }

  console.log("DataMart webhook received:", {
    event,
    orderReference: providerOrderReference,
    providerStatus: data.status || null,
  });

  try {
    // ------------------------------------------
    // 3. Find the matching EcoData order
    // ------------------------------------------
    const lookupStartedAt = Date.now();

    const order = await getDataMartOrderByProviderReference(
      providerOrderReference
    );

    console.log("DataMart order lookup finished:", {
      orderReference: providerOrderReference,
      found: Boolean(order),
      durationMs: Date.now() - lookupStartedAt,
    });

    if (!order) {
      console.warn("No matching EcoData order for DataMart webhook:", {
        event,
        orderReference: providerOrderReference,
      });

      // Return 404 so the mismatch can be investigated.
      // Check that the reference sent to this function is
      // the same reference saved in the database.
      return res.status(404).json({
        received: false,
        message: "Matching DataMart order not found.",
      });
    }

    // ------------------------------------------
    // 4. Map provider status
    // ------------------------------------------
    const nextStatus = mapWebhookStatus(
      event,
      data.status
    );

    if (!nextStatus) {
      console.warn("Ignoring unsupported DataMart event:", {
        event,
        orderReference: providerOrderReference,
        providerStatus: data.status || null,
      });

      // Acknowledge unsupported events to prevent retries
      // for events this endpoint is not designed to process.
      return res.status(200).json({
        received: true,
        ignored: true,
        message: "Unsupported event ignored.",
      });
    }

    const currentStatus = String(
      order.orderStatus || ""
    )
      .trim()
      .toLowerCase();

    // ------------------------------------------
    // 5. Protect existing final statuses
    // ------------------------------------------
    if (shouldIgnoreStatusUpdate(currentStatus, nextStatus)) {
      console.log("DataMart status update ignored:", {
        orderReference: providerOrderReference,
        currentStatus,
        incomingStatus: nextStatus,
      });

      return res.status(200).json({
        received: true,
        ignored: true,
        orderStatus: currentStatus,
        message: "Status update would overwrite a protected final status.",
      });
    }

    // ------------------------------------------
    // 6. Update the stored EcoData order
    // ------------------------------------------
    const updateStartedAt = Date.now();

    const updatedOrder = await updateDataMartOrder(
      order.paymentReference,
      {
        orderStatus: nextStatus,

        providerOrderReference,

        providerTransactionReference:
          data.transactionId ?? undefined,

        providerPurchaseId:
          data.orderId ?? undefined,

        providerPrice:
          data.price ?? undefined,

        providerResponse: req.body,

        lastError:
          nextStatus === "failed"
            ? "DataMart reported that the order failed."
            : null,
      }
    );

    console.log("DataMart order update finished:", {
      orderReference: providerOrderReference,
      paymentReference: order.paymentReference,
      orderStatus: updatedOrder?.orderStatus || nextStatus,
      durationMs: Date.now() - updateStartedAt,
      totalDurationMs: Date.now() - receivedAt,
    });

    // ------------------------------------------
    // 7. Acknowledge successful processing
    // ------------------------------------------
    return res.status(200).json({
      received: true,
      orderStatus: updatedOrder?.orderStatus || nextStatus,
    });
  } catch (error) {
    console.error("DataMart webhook processing failed:", {
      event,
      orderReference: providerOrderReference,
      message: error.message,
      totalDurationMs: Date.now() - receivedAt,
    });

    // A 500 response signals that processing failed.
    // DataMart may retry, depending on its retry policy.
    return res.status(500).json({
      received: false,
      message: "Unable to process DataMart webhook.",
    });
  }
});

export default webhookRouter;
