import express from "express";
import axios from "axios";
import crypto from "crypto";
import { admin, db } from "../firebaseAdmin.js";
import { handleSwiftDataBuyDataRequest } from "../server.js";
import { pool } from "../backend/db.js";
import { purchaseWithDataMart } from "../services/dataMartService.js";

const paystackWebhookRouter = express.Router();

async function handleAgentStorePayment({ reference, metadata, transaction }) {
  const checkoutId = String(metadata?.checkoutId || "");

  if (!checkoutId) {
    throw new Error("Agent Store checkoutId is missing.");
  }

  // Paystack amounts are in pesewas.
  if (
    transaction?.status !== "success" ||
    transaction?.reference !== reference ||
    String(transaction?.currency || "").toUpperCase() !== "GHS"
  ) {
    throw new Error("Agent Store payment verification failed.");
  }

  const checkoutResult = await pool.query(
    `SELECT
       c.*,
       s.status AS store_status
     FROM agent_store_checkouts c
     JOIN agent_stores s ON s.id = c.store_id
     WHERE c.id = $1
     LIMIT 1`,
    [checkoutId],
  );

  if (!checkoutResult.rows.length) {
    throw new Error("Agent Store checkout was not found.");
  }

  const checkout = checkoutResult.rows[0];

  if (checkout.payment_reference !== reference) {
    throw new Error("Payment reference does not match checkout.");
  }

  const expectedPesewas = Math.round(
    Number(checkout.expected_payment_amount) * 100,
  );

  if (
    !Number.isFinite(expectedPesewas) ||
    Number(transaction.amount) !== expectedPesewas
  ) {
    throw new Error("Payment amount does not match checkout.");
  }

  if (checkout.store_status !== "active") {
    throw new Error("Agent Store is not active.");
  }

  // Already fulfilled or currently being handled.
  if (["processing", "delivered"].includes(checkout.status)) {
    return {
      duplicate: true,
      status: checkout.status,
    };
  }

  if (checkout.status === "failed" || checkout.status === "refunded") {
    throw new Error(
      `Checkout cannot be fulfilled from status ${checkout.status}.`,
    );
  }

  if (
    metadata?.storeId &&
    String(metadata.storeId !== String(checkout.store_id))
  ) {
    throw new Error("Agent store metadata does not match checkout.");
  }

  // Claim the checkout atomically before contacting DataMart.
  // Only one webhook execution can win this transition.
  const claim = await pool.query(
    `UPDATE agent_store_checkouts
     SET status = 'processing',
         updated_at = NOW()
     WHERE id = $1
       AND payment_reference = $2
       AND status IN ('pending_payment', 'paid')
     RETURNING *`,
    [checkoutId, reference],
  );

  if (!claim.rows.length) {
    return {
      duplicate: true,
      status: "processing_or_already_claimed",
    };
  }

  const order = claim.rows[0];

  // Use a stable key for retries of the same checkout.
  const idempotencyKey = `agent-${order.id}`;

  try {
    const purchase = await purchaseWithDataMart({
      phoneNumber: order.recipient,
      network: order.network,
      capacity: Number(order.size_gb),
      idempotencyKey,
    });

    const providerReference = purchase?.orderReference || purchase?.purchaseId;

    if (!providerReference) {
      throw new Error("DataMart did not return a provider order reference.");
    }

    const savedOrder = await pool.query(
      `UPDATE agent_store_checkouts
   SET provider_order_reference = $1,
       status = 'processing',
       updated_at = NOW()
   WHERE id = $2
     AND status = 'processing'
   RETURNING id`,
      [providerReference, order.id],
    );

    if (!savedOrder.rows.length) {
      throw new Error("Unable to save the DataMart order reference.");
    }

    console.log("Agent Store DataMart order submitted:", {
      checkoutId: order.id,
      paymentReference: reference,
      providerOrderReference: providerReference,
      providerStatus: purchase.orderStatus,
    });

    return {
      success: true,
      status: "processing",
      providerOrderReference: providerReference,
    };
  } catch (error) {
    // Keep the checkout in processing for reconciliation.
    // The provider may have accepted the request even if the
    // HTTP response was lost. Do not blindly mark it failed.
    console.error("Agent Store DataMart submission error:", {
      checkoutId: order.id,
      paymentReference: reference,
      message: error.message,
      providerStatus: error.providerHttpStatus,
      providerResponse: error.providerResponse,
    });

    throw error;
  }
}

async function verifyPaystackTransaction(reference) {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  }

  const response = await axios.get(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${secret}`,
        Accept: "application/json",
      },
      timeout: 15000,
    },
  );

  const body = response.data;
  const transaction = body?.data;

  if (
    body?.status !== true ||
    transaction?.status !== "success" ||
    transaction?.reference !== reference
  ) {
    throw new Error("Paystack transaction could not be verified.");
  }

  return transaction;
}

paystackWebhookRouter.post("/paystack/webhook", async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const signature = req.headers["x-paystack-signature"];

    if (!secret || !Buffer.isBuffer(req.rawBody) || !signature) {
      console.error("Paystack webhook configuration or raw body is missing.");
      return res.sendStatus(400);
    }

    const expectedHash = crypto
      .createHmac("sha512", secret)
      .update(req.rawBody)
      .digest();

    const suppliedHash = Buffer.from(String(signature), "hex");

    if (
      suppliedHash.length !== expectedHash.length ||
      !crypto.timingSafeEqual(suppliedHash, expectedHash)
    ) {
      console.warn("Invalid Paystack webhook signature.");
      return res.sendStatus(401);
    }
    const event = req.body;

    // =========================
    // ✅ PAYMENT SUCCESS
    // =========================
    if (event.event === "charge.success") {
      const data = event.data;
      const reference = data.reference;
      const metadata = data.metadata || {};

      if (metadata.type === "agent_store") {
        const transaction = await verifyPaystackTransaction(reference);

        await handleAgentStorePayment({
          reference,
          metadata,
          transaction,
        });

        // Acknowledge successful handling.
        return res.sendStatus(200);
      }

      console.log(" WEBHOOK RECEIVED:", {
        reference: event.data.reference,
        amount: event.data.amount,
        status: event.data.status,
      });

      // =========================
      // 🟣 1. SUBSCRIPTION PAYMENT
      // =========================
      if (metadata.storeId && metadata.plan) {
        const { storeId, plan, maxProducts } = metadata;

        await db.collection("stores").doc(storeId).update({
          plan,
          maxProducts,
          subscriptionActive: true,
          subscribedAt: new Date(),
        });

        console.log("✅ Store upgraded:", storeId);
      }

      // =========================
      // 🔵 2. BUNDLE PAYMENT (IMPORTANT)
      // =========================
      if (metadata.type === "bundle") {
        const { network, recipient, pkg, size } = metadata;

        await handleSwiftDataBuyDataRequest({
          network,
          recipient,
          pkg,
          size,
          paymentReference: reference,
        });

        console.log(" WEBHOOK ORDER CREATED:", reference);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(" WEBHOOK ERROR:", err);
    res.sendStatus(500);
  }
});

export default paystackWebhookRouter;
