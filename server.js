// src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

// Routes
import storeRouter from "./routes/storesRoute.js";
import paystackWebhookRouter from "./routes/paystackWebhookRouter.js";

import { verifySellingPrice } from "./frontend/sellingPrice.js";
import subscriptionRouter from "./routes/subscriptionRouter.js";
import adminRoute from "./routes/adminOrderUpdate.js";
import syncOrderRoute from "./routes/syncOrderStatus.js";
import validateRecipientRoute from "./routes/validateRecipient.js";
import restrictionsRoute from "./routes/restrictions.js";
import {
  getSwiftDataCatalog,
  findSwiftDataPackage,
} from "./services/swiftDataCatalog.js";
import exclusiveAgentRoute from "./routes/exclusivePage.js";
import afaRegisterRouter from "./routes/afaRegisterRoute.js";
import afaStatusRouter from "./routes/afaStatusRouter.js";
import getVoucherRouter from "./routes/getVouchersRoute.js";
import postVoucherRouter from "./routes/postVoucherRouter.js";
// Status polling
import swiftDataOrderStatusPolling from "./routes/swiftDataOrderStatusRoute.js";

import { getDataMartMashupPackages } from "./services/dataMartService.js";

/* =========================================
   VENDOR MANAGEMENT
========================================= */
import vendorManagementRouter from "./routes/vendorManagementRoute.js";
import { handleDataMartBuyDataRequest } from "./services/dataMartBundler.js";

/* =========================================
   DATAMART SERVICE
========================================= */
import { getDataMartOrderStatus } from "./services/dataMartService.js";
import {
  getDataMartOrderByProviderReference,
  updateDataMartOrder,
} from "./services/dataMartOrderRepository.js";

import webhookRouter from "./routes/dataMartWebhookRoute.js";

/* =========================================
   DATAMART RECIPIENT VERIFICATION
========================================= */
import dataMartRecipientVerificationRoute from "./routes/dataMartRecipientVerificationRoute.js";
import vendorSettingsRouter from "./routes/vendorSettingsRoute.js";
import vendorStatusRouter from "./routes/vendorStatus.js";

//=============================
// ECODATA STORE ROUTES
//=============================

// AUTH.USER
import { requireAuth, initializeClerk } from "./middleware/clerkAuth.js";
import { getAuth } from "@clerk/express";

// AUTH.USER.PROFILE
import accountRouter from "./routes/accountRoute.js";
import profileRouter from "./routes/profileRoute.js";

// AUTH.SELLER (PROFILE & LOGICS)
import sellerProfileRouter from "./routes/sellerProfileRoute.js";
import sellerLogoRouter from "./routes/sellerLogoRoute.js";
import sellerProductsRouter from "./routes/sellerProducts.js";
import createProductRouter from "./routes/product.js";
import sellerSettingsRouter from "./routes/sellerSettingsRoute.js";

// AUTH.ADMIN
import { admin, db } from "./firebaseAdmin.js";
import { startOrderSyncJob } from "./cron/syncOrders.js";
import { requiredAdmin } from "./middleware/clerkAuth.js";
import adminTestRouter from "./routes/adminTestRoute.js";
import adminAccessDashboardRouter from "./routes/adminDashboardRoute.js";
import adminSellersRouter from "./routes/adminSellersMap.js";

//MOBILE APP IMPORTS
import mobileRouter from "./routes/mobileMe.js";
import { getMobileSellingPrice } from "./services/mobileSellingPrices.js";
import { submitMobileDataMartOrder } from "./services/mobileProviderFulfillment.js";
import { createMobileOrderPolling } from "./services/mobileOrderPolling.js";
import { updateMobileNeonOrder } from "./services/updateMobileNeonOrders.js";
import { type } from "os";

const MOBILE_RETURN_URL =
  process.env.MOBILE_RETURN_URL ||
  "https://ecodata-app.onrender.com/api/mobile/paystack-return";

dotenv.config();

startOrderSyncJob();

// --dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express
const app = express();

// Middleware
app.use(cors());

// capture raw body
app.use(
  bodyParser.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.set("trust proxy", 1); // Render sits behind a proxy
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "frontend")));

// ROUTES
app.use("/api/validate-recipient", validateRecipientRoute);
app.use("/api/restrictions/validate", restrictionsRoute);
app.use("/api/paystack/webhook", paystackWebhookRouter);

//================================
// SWIFTDATA CATALOG CHECK
//================================
app.get("/api/swiftdata/v2/catalog", async (req, res) => {
  try {
    const offers = await getSwiftDataCatalog(req.query.network);

    return res.json({
      success: true,
      offers,
    });
  } catch (error) {
    console.error("SwiftData v2 catalogue error:", {
      status: error.providerHttpStatus ?? error.response?.status,
      code: error.providerResponse?.error?.code,
      message: error.message,
    });

    return res
      .status(error.providerHttpStatus || error.response?.status || 502)
      .json({
        success: false,
        code: error.providerResponse?.error?.code || null,
        message:
          error.providerResponse?.error?.message ||
          "Unable to retrieve SwiftData packages.",
      });
  }
});

app.use("/api/admin", adminRoute);
app.use("/api/admin", syncOrderRoute);
app.use("/api/verify-payment", exclusiveAgentRoute);
app.use("/api/afa", afaRegisterRouter(verifyPaystack));
app.use("/api/afa/status", afaStatusRouter);
// GET  /:id
app.use("/api/live-order-status", swiftDataOrderStatusPolling);
// POST /  (the poller)
app.use("/api/v2/orders/status", swiftDataOrderStatusPolling);
app.use("/api/vouchers", getVoucherRouter);
app.use("/api/vouchers", postVoucherRouter);

// ecodata store upp.use()
app.use(initializeClerk);

//========================
// VENDOR MANAGEMENT ROUTES
//========================
app.use("/api/admin/vendor", vendorManagementRouter);
app.use("/api/vendor-status", vendorStatusRouter);
app.use("/api/admin/vendor", vendorSettingsRouter);
app.use("/api/verify-recipient", dataMartRecipientVerificationRoute);
app.use("/webhook", webhookRouter);

app.use("/api/initiate-subscription", subscriptionRouter);
app.use("/api/create-store", storeRouter);

app.use("/api/creator/products", createProductRouter);
app.use("/api/creator/dashboard", createProductRouter);
app.use("/api/creator/withdrawals", createProductRouter);
app.use("/api/creator/sales", createProductRouter);

// CLERK AUTHENTICATION TEST
app.use("/api/account", accountRouter);

app.get("/api/auth/me", requireAuth, (req, res) => {
  const { userId } = getAuth(req);

  return res.status(200).json({
    success: true,
    message: "Authentication successful,",
    user: {
      clerkUserId: userId,
    },
  });
});

// MOBILE APP USE
app.use("/api/me", mobileRouter);

// Adjust the import path to match your actual file.

app.get("/api/datamart/mashup/packages", async (req, res) => {
  try {
    const catalogue = await getDataMartMashupPackages();

    return res.json({
      success: true,
      ...catalogue,
    });
  } catch (error) {
    const status =
      error.providerHttpStatus === 403
        ? 403
        : error.providerHttpStatus === 429
          ? 429
          : 502;

    return res.status(status).json({
      success: false,
      code: error.providerResponse?.code || "MASHUP_CATALOGUE_ERROR",
      message:
        error.providerResponse?.message ||
        "Unable to load MashUp packages right now.",
    });
  }
});

// CHECK AUTHENTICATION ENDS

// USER PROFILE ROUTE
app.use("/api/profile", profileRouter);
// SELLER PROFILE ROUTE
app.use("/api/seller", sellerProfileRouter);
app.use("/api/seller/logo", sellerLogoRouter);
app.use("/api/seller/products", sellerProductsRouter);
app.use("/api/seller-settings", sellerSettingsRouter);

// ADMIN ROUTES
app.use("/api/admin", adminTestRouter);
app.use("/api/admin", adminAccessDashboardRouter);
app.use("/api/admin/sellers", adminSellersRouter);

// 🚨 Prevent duplicate orders (Memory Cache)
const processedOrders = new Map();

/*
  Structure:
  processedOrders.set(paymentReference, {
      status: "success" | "failed",
      response: {...}   // SwiftData response
  });
*/

async function verifyPaystack(paymentReference, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const verification = await axios.get(
        `https://api.paystack.co/transaction/verify/${paymentReference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
          timeout: 15000,
        },
      );

      console.log(`✅ Paystack verified on attempt ${attempt}`);

      return verification;
    } catch (err) {
      console.log(`⚠️ Paystack verify attempt ${attempt}/${retries} failed`);

      if (attempt === retries) {
        throw err;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

// Mobile: one quick look. "Not found" only means the buyer has not paid (yet), and the app asks again.
async function verifyMobilePayment(reference) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const r = await axios.get(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
          timeout: 8000,
        },
      );
      return r?.data?.status === true ? r.data.data : null; // the transaction, or null
    } catch (err) {
      const code = err.response?.status;
      if (code === 400 || code === 404) return null; // not paid yet, or not created yet
      if (attempt === 2) throw err; // network error, timeout, 429 or 5xx: the route answers 500
      await new Promise((resolve) => setTimeout(resolve, 700));
    }
  }
}

/* =========================================
   SWIFTDATA V2 — BUY DATA
   POST /orders
========================================= */

export async function handleSwiftDataBuyDataRequest({
  network,
  recipient,
  pkg,
  size,
  paymentReference,
}) {
  const reference = String(paymentReference || "").trim();
  const phone = String(recipient || "").trim();

  const capacity = Number(size);

  // 1. Validate required fields.
  if (
    !network ||
    !phone ||
    !reference ||
    size === undefined ||
    size === null ||
    !Number.isFinite(capacity) ||
    capacity <= 0
  ) {
    return {
      ok: false,
      status: 400,
      body: {
        success: false,
        message: "Missing or invalid order fields.",
      },
    };
  }

  // 2. Prevent duplicate requests.
  // A previous timeout or in-progress request must not
  // trigger another provider purchase automatically.
  const existingOrder = processedOrders.get(reference);

  if (existingOrder) {
    if (
      existingOrder.status === "processing" ||
      existingOrder.status === "unknown"
    ) {
      return {
        ok: true,
        status: 202,
        body: {
          success: true,
          pendingReconciliation: true,
          message:
            "This payment is already being processed or checked. Please do not submit it again.",
          order: existingOrder.response,
        },
      };
    }

    return {
      ok: existingOrder.status === "completed",
      status: existingOrder.status === "completed" ? 200 : 409,
      body:
        existingOrder.status === "completed"
          ? {
              success: true,
              message: "Order already processed.",
              order: existingOrder.response,
            }
          : {
              success: false,
              message:
                "This payment reference has already been processed or requires reconciliation. Please contact support if necessary.",
              order: existingOrder.response,
            },
    };
  }

  // Reserve the payment reference synchronously before
  // awaiting Paystack or SwiftData.
  processedOrders.set(reference, {
    status: "processing",
    response: {
      paymentReference: reference,
      orderStatus: "processing",
    },
  });

  try {
    // 3. Verify payment with Paystack.
    const verification = await verifyPaystack(reference);
    const transaction = verification?.data?.data;

    if (
      transaction?.status !== "success" ||
      transaction.reference !== reference
    ) {
      processedOrders.set(reference, {
        status: "failed",
        response: {
          paymentReference: reference,
          message: "Payment verification failed.",
        },
      });

      return {
        ok: false,
        status: 400,
        body: {
          success: false,
          message: "Payment verification failed or reference mismatched.",
        },
      };
    }

    // 4. Validate the amount in pesewas.
    const amountPesewas = Number(transaction.amount);

    if (!Number.isFinite(amountPesewas) || amountPesewas <= 0) {
      processedOrders.set(reference, {
        status: "failed",
        response: {
          paymentReference: reference,
          message: "Invalid payment amount.",
        },
      });

      return {
        ok: false,
        status: 400,
        body: {
          success: false,
          message: "Invalid payment amount.",
        },
      };
    }

    const amountGHS = amountPesewas / 100;

    // Preserve EcoData's existing selling-price validation.
    const priceCheck = verifySellingPrice(network, size, amountGHS);

    if (!priceCheck.valid) {
      processedOrders.set(reference, {
        status: "failed",
        response: {
          paymentReference: reference,
          message: priceCheck.message,
        },
      });

      return {
        ok: false,
        status: 400,
        body: {
          success: false,
          message: priceCheck.message,
        },
      };
    }

    console.log("SwiftData v2 payment verified:", {
      paymentReference: reference,
      priceType: priceCheck.priceType,
      expectedPrice: priceCheck.expectedPrice,
      actualAmountGHS: amountGHS,
    });

    // 5. Configure the v2 base URL.
    // Set SWIFT_BASE_URL in Render to:
    // https://api.swiftdata-link.com/v2
    const swiftBase = (
      process.env.SWIFT_BASE_URL || "https://api.swiftdata-link.com/v2"
    ).replace(/\/+$/, "");

    const apiKey = process.env.SWIFT_API_KEY;

    if (!apiKey) {
      // No provider request has been made, so this is not
      // an uncertain provider purchase.
      processedOrders.set(reference, {
        status: "failed",
        response: {
          paymentReference: reference,
          message: "SwiftData API key is not configured.",
        },
      });

      return {
        ok: false,
        status: 500,
        body: {
          success: false,
          message: "Data provider is not configured.",
        },
      };
    }

    // 6. Find the correct package in the SwiftData v2 catalogue.
    const selectedPackage = await findSwiftDataPackage(network, size, pkg);

    const orderData = {
      msisdn: phone,
      data: selectedPackage.sizeLabel,
      reference,
    };

    if (selectedPackage.offerSlug) {
      orderData.offerSlug = selectedPackage.offerSlug;
    } else if (selectedPackage.offerId) {
      orderData.offerId = selectedPackage.offerId;
    } else {
      throw new Error("No valid SwiftData offer identifier was found.");
    }

    console.log("Submitting SwiftData v2 order:", {
      paymentReference: reference,
      network,
      data: selectedPackage.sizeLabel,
      offerSlug: selectedPackage.offerSlug,
      offerId: selectedPackage.offerId,
    });

    // 7. Submit the order to SwiftData v2.
    const swiftRes = await axios.post(`${swiftBase}/orders`, orderData, {
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 20000,
    });

    const providerBody = swiftRes.data;
    const providerOrder = providerBody?.data;

    if (providerBody?.success !== true || !providerOrder) {
      processedOrders.set(reference, {
        status: "unknown",
        response: {
          paymentReference: reference,
          providerResponse: providerBody || null,
        },
      });

      return {
        ok: false,
        status: 502,
        body: {
          success: false,
          pendingReconciliation: true,
          message:
            "The provider response could not be confirmed. Please do not retry this payment.",
        },
      };
    }

    // SwiftData accepting an order does not necessarily mean
    // the bundle has already been delivered.
    const order = {
      ...providerOrder,
      paymentReference: reference,
      network,
      recipient: phone,
      size: capacity,
      offerSlug: selectedPackage.offerSlug || null,
      offerId: selectedPackage.offerId || null,
    };

    processedOrders.set(reference, {
      status: "processing",
      response: order,
    });

    console.log("SwiftData v2 order accepted:", {
      paymentReference: reference,
      providerReference:
        providerOrder.reference || providerOrder.clientReference || null,
      providerStatus:
        providerOrder.status || providerOrder.orderStatus || "processing",
    });

    return {
      ok: true,
      status: 201,
      body: {
        success: true,
        message: "Bundle order submitted successfully.",
        order,
      },
    };
  } catch (err) {
    const providerStatus = err.response?.status ?? null;
    const providerBody = err.response?.data ?? null;

    console.error("SwiftData v2 purchase error:", {
      paymentReference: reference,
      providerStatus,
      providerCode: providerBody?.error?.code ?? null,
      message: err.message,
    });

    // Once the provider request may have been sent, a timeout,
    // network failure, or server error can leave the purchase
    // outcome uncertain. Never blindly retry the purchase.
    const uncertain =
      !err.response ||
      err.code === "ECONNABORTED" ||
      err.code === "ETIMEDOUT" ||
      providerStatus >= 500 ||
      providerStatus === 499;

    if (uncertain) {
      const savedResponse = {
        paymentReference: reference,
        providerStatus,
        providerCode: providerBody?.error?.code ?? null,
        message:
          "The provider outcome is uncertain. Reconcile the order before retrying.",
      };

      processedOrders.set(reference, {
        status: "unknown",
        response: savedResponse,
      });

      return {
        ok: false,
        status: 504,
        body: {
          success: false,
          pendingReconciliation: true,
          message:
            "We could not confirm the order status. Please do not pay again or retry this order yet.",
          order: savedResponse,
        },
      };
    }

    // Definite provider rejection.
    processedOrders.set(reference, {
      status: "failed",
      response: {
        paymentReference: reference,
        providerStatus,
        providerResponse: providerBody,
      },
    });

    return {
      ok: false,
      status:
        providerStatus >= 400 && providerStatus < 500 ? providerStatus : 502,
      body: {
        success: false,
        message:
          providerBody?.error?.message || "SwiftData rejected the order.",
        code: providerBody?.error?.code || null,
      },
    };
  }
}

// POST route
app.post("/api/buy-data", async (req, res) => {
  const { network, recipient, package: pkg, size, paymentReference } = req.body;
  const result = await handleSwiftDataBuyDataRequest({
    network,
    recipient,
    pkg,
    size,
    paymentReference,
  });

  console.log("🔥 handleSwiftDataBuyDataRequest result:", result);

  return res.status(result.status).json(result.body);
});

// GET route
app.get("/api/buy-data", async (req, res) => {
  const {
    network,
    recipient,
    package: pkg,
    size,
    paymentReference,
  } = req.query;
  const result = await handleSwiftDataBuyDataRequest({
    network,
    recipient,
    pkg,
    size,
    paymentReference,
  });
  return res.status(result.status).json(result.body);
});

/**
 * SwiftData bulk status helper
 * SWIFT_BASE_URL should be:
 * https://api.swiftdata-link.com/v2
 */
async function fetchSwiftDataBulkStatus(identifiers) {
  const base = process.env.SWIFT_BASE_URL?.replace(/\/+$/, "");
  const apiKey = process.env.SWIFT_API_KEY;

  if (!base || !apiKey) {
    throw new Error("SwiftData base URL or API key is not configured.");
  }

  const response = await axios.post(
    `${base}/orders/status`,
    { identifiers },
    {
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 15000,
    },
  );

  return response.data;
}

// New bulk status route
app.post("/api/v2/orders/status", async (req, res) => {
  try {
    const { identifiers } = req.body || {};

    if (
      !Array.isArray(identifiers) ||
      identifiers.length === 0 ||
      identifiers.some((id) => typeof id !== "string" || !id.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "A non-empty identifiers array is required.",
      });
    }

    if (identifiers.length > 200) {
      return res.status(400).json({
        success: false,
        message: "A maximum of 200 identifiers can be checked per request.",
      });
    }

    // Remove duplicate references and trim whitespace.
    const uniqueIdentifiers = [...new Set(identifiers.map((id) => id.trim()))];

    const data = await fetchSwiftDataBulkStatus(uniqueIdentifiers);

    if (data?.success === false) {
      return res.status(502).json({
        success: false,
        message: data.message || "SwiftData status lookup failed.",
        details: data,
      });
    }

    // Preserve the provider's separate orders, groups and missing buckets.
    const result = data?.data ?? data;

    return res.json({
      success: true,
      orders: result?.orders ?? [],
      groups: result?.groups ?? [],
      missing: result?.missing ?? [],
    });
  } catch (error) {
    console.error(
      "SwiftData bulk status error:",
      error.response?.data || error.message,
    );

    return res.status(error.response?.status || 502).json({
      success: false,
      message: "Error fetching SwiftData order statuses.",
      error: error.response?.data || error.message,
    });
  }
});

// Backward-compatible single-order route.
// Existing frontend calls can continue using this URL.
app.get("/api/v2/orders/status/:orderIdOrRef", async (req, res) => {
  const orderIdOrRef = req.params.orderIdOrRef?.trim();

  if (!orderIdOrRef) {
    return res.status(400).json({
      success: false,
      message: "Missing order ID or reference.",
    });
  }

  try {
    const data = await fetchSwiftDataBulkStatus([orderIdOrRef]);
    const result = data?.data ?? data;

    if (data?.success === false) {
      return res.status(502).json({
        success: false,
        message: data.message || "Failed to fetch order status.",
        details: data,
      });
    }

    const orders = result?.orders ?? [];
    const groups = result?.groups ?? [];
    const missing = result?.missing ?? [];

    // Preserve the old { success, order } response shape.
    if (orders.length > 0) {
      return res.json({
        success: true,
        order: orders[0],
      });
    }

    // The identifier may refer to a bulk-purchase group.
    if (groups.length > 0) {
      return res.json({
        success: true,
        group: groups[0],
      });
    }

    return res.status(404).json({
      success: false,
      message: "SwiftData did not find this order or group.",
      missing,
    });
  } catch (error) {
    console.error(
      "SwiftData single status error:",
      error.response?.data || error.message,
    );

    return res.status(error.response?.status || 502).json({
      success: false,
      message: "Error fetching SwiftData order status.",
      error: error.response?.data || error.message,
    });
  }
});

/* =========================================
   DATAMART PURCHASE ROUTE
   POST /api/datamart/buy-data
========================================= */

app.post("/api/datamart/buy-data", async (req, res) => {
  const { network, recipient, package: pkg, size, paymentReference } = req.body;

  try {
    const result = await handleDataMartBuyDataRequest(
      {
        network,
        recipient,
        pkg,
        size,
        paymentReference,
      },
      {
        verifyPaystack,
        processedOrders,
      },
    );

    console.log(
      "DataMart purchase result:",
      result.status,
      result.body?.message,
    );

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("DataMart route error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process the DataMart order.",
    });
  }
});

app.get("/api/datamart/order-status/:reference", async (req, res) => {
  const reference = String(req.params.reference || "").trim();

  if (!reference) {
    return res.status(400).json({
      success: false,
      message: "DataMart order reference is required.",
    });
  }

  try {
    // Fetch the latest status directly from DataMart.
    const result = await getDataMartOrderStatus(reference);

    if (result?.status !== "success" || !result?.data) {
      return res.status(502).json({
        success: false,
        provider: "datamart",
        message: "DataMart returned an invalid status response.",
      });
    }

    const providerOrder = result.data;

    // DataMart returns orderStatus inside result.data.
    const rawStatus = String(providerOrder.orderStatus || "")
      .trim()
      .toLowerCase();

    const statusMap = {
      completed: "completed",
      delivered: "completed",
      success: "completed",
      successful: "completed",
      failed: "failed",
      cancelled: "failed",
      canceled: "failed",
      rejected: "failed",
      refunded: "refunded",
      pending: "processing",
      waiting: "processing",
      processing: "processing",
      in_progress: "processing",
      "in progress": "processing",
    };

    const normalizedStatus = statusMap[rawStatus];

    if (!normalizedStatus) {
      console.warn("Unknown DataMart order status:", rawStatus);

      return res.json({
        success: true,
        provider: "datamart",
        source: "provider",
        order: {
          orderReference: providerOrder.reference || reference,
          status: "processing",
          providerStatus: rawStatus || null,
        },
      });
    }

    return res.json({
      success: true,
      provider: "datamart",
      source: "provider",
      order: {
        orderReference: providerOrder.reference || reference,
        status: normalizedStatus,
        providerStatus: rawStatus,
        updatedAt: providerOrder.updatedAt || null,
      },
    });
  } catch (error) {
    console.error("DataMart status route failed:", {
      reference,
      httpStatus: error.providerHttpStatus,
      providerResponse: error.providerResponse,
      message: error.message,
    });

    return res.status(502).json({
      success: false,
      provider: "datamart",
      message: "Unable to retrieve the latest DataMart order status.",
    });
  }
});

/* =========================================
   ECODATA MOBILE CHECKOUT
   Separate from the existing website flow
========================================= */

// Use the existing backend/db.js import.
// If server.js already imports sql from this file,
// DO NOT add a duplicate import.
// ========================================
// MOBILE CHECKOUT
//=========================================
app.post("/api/mobile/checkout", async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please sign in again.",
      });
    }



   /**
 * Validate the checkout reference received from the mobile app.
 * Preserve the original reference; do not transform it.
 */

  const { reference, lines } = req.body ?? {};

   console.log("[Mobile checkout] Route reached");
console.log("[Mobile checkout] Method:", req.method);
console.log("[Mobile checkout] Content-Type:", req.headers["content-type"]);
console.log("[Mobile checkout] Body received:", req.body);
console.log(
  "[Mobile checkout] Reference received:",
  req.body?.reference
);

console.log("========== ECODATA MOBILE CHECKOUT ==========");
console.log("[Checkout] Received reference:", reference);
console.log("[Checkout] Reference type:", typeof reference);
console.log("[Checkout] Matches expected format:",
  typeof reference === "string" &&
  /^ECM[A-Z0-9]{10,40}$/.test(reference)
);
console.log("=============================================");
    

    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No checkout items provided.",
      });
    }

    // Do not trust prices submitted by the app.
    const pricedLines = lines.map((line) => {
      const price = getMobileSellingPrice(
        line.network,
        line.size,
        line.package,
      );

      if (!Number.isFinite(price) || price <= 0) {
        throw new Error("Invalid package or price.");
      }

      return {
        ...line,
        price,
      };
    });

    const total = Number(
      pricedLines.reduce((sum, line) => sum + line.price, 0).toFixed(2),
    );

    const users = await sql`
      SELECT email
      FROM public.ecodata_users
      WHERE clerk_user_id = ${userId}
      LIMIT 1
    `;

    if (!users.length || !users[0].email) {
      return res.status(400).json({
        success: false,
        message: "Your account email could not be found.",
      });
    }


    return res.json({
      success: true,
      reference: inserted[0].reference,
      amount: Math.round(Number(inserted[0].amount) * 100),
      email: users[0].email,
      currency: "GHS",
    });
  } catch (error) {
    console.error("[Mobile checkout]", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to create checkout.",
    });
  }
});
//===================================
// CHECKOUT CONFIRMATION
//===================================
function paymentMatches(checkout, tx) {
  return (
    tx?.status === "success" &&
    tx?.reference === checkout.reference &&
    tx?.currency === "GHS" &&
    Number(tx?.amount) === Math.round(Number(checkout.amount) * 100)
  );
}
app.post("/api/mobile/checkout/confirm", async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please sign in to continue.",
      });
    }

    const { reference, lines } = req.body ?? {};

    if (typeof reference !== "string" || !reference.trim()) {
      return res.status(400).json({
        success: false,
        message: "Paystack payment reference is required.",
      });
    }

    const paymentReference = reference.trim();

    if (!Array.isArray(lines) || lines.length === 0 || lines.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Valid checkout lines are required.",
      });
    }

    for (const line of lines) {
      if (
        !line ||
        typeof line.network !== "string" ||
        typeof line.package !== "string" ||
        !String(line.size ?? "").trim() ||
        typeof line.phone !== "string" ||
        !/^\d{10}$/.test(line.phone)
      ) {
        return res.status(400).json({
          success: false,
          message: "One or more checkout lines are invalid.",
        });
      }
    }

    // Calculate trusted prices on the server.
    const pricedLines = lines.map((line) => {
      const price = getMobileSellingPrice(
        line.network,
        line.size,
        line.package,
      );

      if (!Number.isFinite(price) || price <= 0) {
        throw new Error("Invalid package or price.");
      }

      return {
        package: line.package,
        network: line.network,
        size: line.size,
        phone: line.phone,
        price,
      };
    });

    const total = Number(
      pricedLines.reduce((sum, line) => sum + line.price, 0).toFixed(2),
    );

    // Verify the transaction with Paystack before saving anything.
    const tx = await verifyMobilePayment(paymentReference);

    if (!tx) {
      return res.status(402).json({
        success: false,
        status: "pending",
        reference: paymentReference,
        message: "Payment has not been confirmed yet.",
      });
    }

    if (
      tx.status !== "success" ||
      tx.reference !== paymentReference ||
      String(tx.currency).toUpperCase() !== "GHS" ||
      !Number.isSafeInteger(Number(tx.amount)) ||
      Number(tx.amount) !== Math.round(total * 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Verified payment details do not match this order.",
      });
    }

    // Ensure the reference cannot be reused by a different user or checkout.
    const inserted = await sql`
      INSERT INTO public.checkouts (
        reference,
        clerk_user_id,
        lines,
        amount,
        status,
        created_at,
        updated_at
      )
      VALUES (
        ${paymentReference},
        ${userId},
        ${JSON.stringify(pricedLines)}::jsonb,
        ${total},
        'pending',
        NOW(),
        NOW()
      )
      ON CONFLICT (reference) DO NOTHING
      RETURNING reference, amount, status
    `;

    if (!inserted.length) {
      const [existing] = await sql`
        SELECT reference, clerk_user_id, amount, status
        FROM public.checkouts
        WHERE reference = ${paymentReference}
        LIMIT 1
      `;

      if (
        !existing ||
        existing.clerk_user_id !== userId ||
        Math.round(Number(existing.amount) * 100) !== Number(tx.amount)
      ) {
        return res.status(409).json({
          success: false,
          message: "This payment reference is already associated with another checkout.",
        });
      }

      // Idempotent retry: don't submit an already handled checkout again.
      if (existing.status !== "pending") {
        return res.json({
          success: ["fulfilled", "processing"].includes(existing.status),
          status: existing.status,
          reference: paymentReference,
          message:
            existing.status === "review"
              ? "Payment received, but delivery needs review. Do not pay again."
              : "This checkout has already been handled.",
        });
      }
    }

    // Atomically claim and fulfill the saved checkout.
    const result = await fulfillMobileCheckout(
      paymentReference,
      userId,
      Number(tx.amount),
    );

    return res.json({
      success: ["fulfilled", "processing"].includes(result.status),
      status: result.status,
      reference: paymentReference,
      message: result.message,
      orders: result.orders ?? [],
    });
  } catch (error) {
    console.error(
      "[EcoData mobile checkout confirmation]",
      error.response?.data || error.message,
    );

    return res.status(500).json({
      success: false,
      message: "Unable to confirm payment right now. If you were charged, do not pay again.",
    });
  }
});








app.post("/api/mobile/confirm-payment", async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please sign in again.",
      });
    }

    const { reference, lines } = req.body ?? {};

    if (
      typeof reference !== "string" ||
      !reference.trim() ||
      !Array.isArray(lines) ||
      lines.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment reference and checkout items are required.",
      });
    }

    // 1. Verify the actual Paystack transaction.
    const transaction = await verifyMobilePayment(reference.trim());

    if (!transaction) {
      return res.status(202).json({
        success: false,
        pending: true,
        message: "Payment is not confirmed yet. Please check again shortly.",
      });
    }

    if (
      transaction.status !== "success" ||
      transaction.reference !== reference.trim() ||
      String(transaction.currency).toUpperCase() !== "GHS"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment could not be verified.",
      });
    }

    // 2. Recalculate prices on the server; never trust app-submitted prices.
    const pricedLines = lines.map((line) => {
      const price = getMobileSellingPrice(
        line.network,
        line.size,
        line.package,
      );

      if (!Number.isFinite(price) || price <= 0) {
        throw new Error("Invalid bundle or price.");
      }

      if (!line.phone || !line.network || !line.size || !line.package) {
        throw new Error("A checkout item is missing required details.");
      }

      return {
        network: String(line.network),
        size: String(line.size),
        package: String(line.package),
        phone: String(line.phone),
        price,
      };
    });

    const total = Number(
      pricedLines
        .reduce((sum, line) => sum + line.price, 0)
        .toFixed(2),
    );

    // Paystack reports amounts in pesewas; Neon stores the total in GHS.
    const paidAmountPesewas = Number(transaction.amount);
    const expectedPesewas = Math.round(total * 100);

    if (
      !Number.isSafeInteger(paidAmountPesewas) ||
      paidAmountPesewas !== expectedPesewas
    ) {
      return res.status(400).json({
        success: false,
        message: "The verified payment amount does not match the order total.",
      });
    }

    // 3. Save the checkout only after successful payment verification.
    // The reference here is the actual Paystack reference.
    const inserted = await sql`
      INSERT INTO public.checkouts (
        reference,
        clerk_user_id,
        lines,
        amount,
        status,
        created_at,
        updated_at
      )
      VALUES (
        ${reference.trim()},
        ${userId},
        ${JSON.stringify(pricedLines)}::jsonb,
        ${total},
        'pending',
        NOW(),
        NOW()
      )
      ON CONFLICT (reference) DO NOTHING
      RETURNING reference, amount, status
    `;

    if (!inserted.length) {
      // A retry may arrive after the first request already saved the checkout.
      const existing = await sql`
        SELECT reference, amount, status
        FROM public.checkouts
        WHERE reference = ${reference.trim()}
          AND clerk_user_id = ${userId}
        LIMIT 1
      `;

      if (!existing.length) {
        return res.status(409).json({
          success: false,
          message: "This payment reference is already associated with another checkout.",
        });
      }

      if (
        Math.round(Number(existing[0].amount) * 100) !== paidAmountPesewas
      ) {
        return res.status(409).json({
          success: false,
          message: "The saved checkout amount does not match the payment.",
        });
      }

      if (existing[0].status !== "pending") {
        return res.json({
          success: true,
          reference: existing[0].reference,
          status: existing[0].status,
          message: "This payment has already been processed.",
        });
      }
    }

    // 4. Claim the pending checkout and submit its orders.
    const result = await fulfillMobileCheckout(
      reference.trim(),
      userId,
      paidAmountPesewas,
    );

    return res.status(result.status === "not_found" ? 404 : 200).json({
      success: Boolean(result.success),
      reference: reference.trim(),
      status: result.status,
      message: result.message,
      orders: result.orders ?? [],
    });
  } catch (error) {
    console.error("[Mobile confirm payment]", error);

    return res.status(500).json({
      success: false,
      message: "Unable to confirm payment and process your order. Please retry.",
    });
  }
});


//================================
// FULFILL CHECKOUT
//================================
async function fulfillMobileCheckout(reference, userId, paidAmountPesewas) {
  // Atomically claim this checkout. Only one request can claim it.
  const claimed = await sql`
    UPDATE checkouts
    SET status = 'processing', updated_at = NOW()
    WHERE reference = ${reference}
      AND clerk_user_id = ${userId}
      AND status = 'pending'
      AND ROUND(amount * 100) = ${paidAmountPesewas}
    RETURNING reference, clerk_user_id, lines, amount
  `;

  if (!claimed.length) {
    const existing = await sql`
      SELECT status
      FROM checkouts
      WHERE reference = ${reference}
        AND clerk_user_id = ${userId}
      LIMIT 1
    `;

    return {
      status: existing[0]?.status || "not_found",
      message: "This checkout has already been claimed or cannot be processed.",
    };
  }

  const checkout = claimed[0];
  const lines = checkout.lines;

  try {
    if (!Array.isArray(lines) || lines.length === 0) {
      throw new Error("Checkout contains no order lines.");
    }

    // Normal/DataMart orders must be checked out individually.
    if (
      lines.length > 1 &&
      lines.some((line) => String(line.package).toLowerCase() === "normal")
    ) {
      throw new Error("Normal delivery orders must be processed individually.");
    }

    // Persist every order before attempting provider fulfillment, in one statement
    const rows = lines.map((line, i) => {
      const lineNo = i + 1;
      const vendor =
        String(line.package).toLowerCase() === "normal"
          ? "datamart"
          : "swiftdata";
      return {
        lineNo,
        vendor,
        paymentRef:
          vendor === "datamart" ? reference : `${reference}-${lineNo}`,
        package: String(line.package),
        network: String(line.network),
        size: String(line.size),
        price: Number(line.price),
        phone: String(line.phone),
      };
    });

    await sql`
      INSERT INTO orders (
        id, clerk_user_id, checkout_ref, line_no, package, vendor,
        network, size, price, phone, payment_ref, status, created_at
      )
      SELECT
        gen_random_uuid(), ${userId}::text, ${reference}::text, t.line_no, t.package, t.vendor,
        t.network, t.size, t.price, t.phone, t.payment_ref, 'processing', NOW()
      FROM unnest(
        ${rows.map((r) => r.lineNo)}::int[],
        ${rows.map((r) => r.package)}::text[],
        ${rows.map((r) => r.vendor)}::text[],
        ${rows.map((r) => r.network)}::text[],
        ${rows.map((r) => r.size)}::text[],
        ${rows.map((r) => r.price)}::numeric[],
        ${rows.map((r) => r.phone)}::text[],
        ${rows.map((r) => r.paymentRef)}::text[]
      ) AS t(line_no, package, vendor, network, size, price, phone, payment_ref)
      ON CONFLICT (checkout_ref, line_no) DO NOTHING
    `;
    // Process up to 5 vendor orders concurrently.
    const runLine = async (line, index) => {
      const lineNo = index + 1;
      const vendor =
        String(line.package).toLowerCase() === "normal"
          ? "datamart"
          : "swiftdata";

      try {
        if (vendor === "datamart") {
          const savedOrder = await fulfillMobileDataMartLine({
            checkoutReference: reference,
            lineNo,
            line,
          });

          return {
            lineNo,
            vendor,
            status: savedOrder.status,
            vendorReference: savedOrder.vendor_ref,
          };
        }

        const providerOrder = await submitMobileSwiftDataOrder({
          network: line.network,
          recipient: line.phone,
          pkg: line.package,
          size: line.size,

          // Keep this reference stable for this checkout line.
          paymentReference: `${reference}-${lineNo}`,
        });

        const savedOrder = await updateMobileNeonOrder({
          checkoutReference: reference,
          lineNo,
          vendor: "swiftdata",
          vendorReference: providerOrder.vendorReference,
          status: providerOrder.status,
        });

        return {
          lineNo,
          vendor,
          status: savedOrder.status,
          vendorReference: savedOrder.vendor_ref,
        };
      } catch (error) {
        console.error(
          `Mobile provider error for ${reference}, line ${lineNo}:`,
          error.message,
        );

        // A timeout does not prove that the provider rejected the order.
        // Do not automatically resubmit an uncertain purchase.
        try {
          await updateMobileNeonOrder({
            checkoutReference: reference,
            lineNo,
            vendor,
            status: "review",
          });
        } catch (dbError) {
          console.error("Could not update Neon order status:", dbError.message);
        }

        return {
          lineNo,
          vendor,
          status: "review",
          message: "Provider outcome requires reconciliation.",
        };
      }
    };

    const results = [];

    for (let i = 0; i < lines.length; i += 5) {
      const batch = lines.slice(i, i + 5);

      const batchResults = await Promise.all(
        batch.map((line, k) => runLine(line, i + k)),
      );

      results.push(...batchResults);
    }

    const allAccepted = results.every((result) =>
      ["processing", "pending", "delivered"].includes(result.status),
    );
    const checkoutStatus = allAccepted ? "fulfilled" : "review";

    // Each refused line's share of what was paid
    const subtotal = lines.reduce((s, l) => s + Number(l.price), 0);
    const refundDue = results
      .filter((r) => r.status === "failed" || r.status === "refunded")
      .reduce((sum, r) => {
        const l = lines[r.lineNo - 1];
        return sum + Number(checkout.amount) * (Number(l.price) / subtotal);
      }, 0);

    await sql`
      UPDATE checkouts
      SET status = ${checkoutStatus},
          refund_due = ${Math.round(refundDue * 100) / 100},
          updated_at = NOW()
      WHERE reference = ${reference}
        AND clerk_user_id = ${userId}
        AND status = 'processing'
    `;

    return {
      status: checkoutStatus,
      success: allAccepted,
      message: allAccepted
        ? "Payment confirmed and all orders submitted to their providers."
        : "Payment confirmed. Some orders need provider reconciliation.",
      orders: results,
    };
  } catch (error) {
    console.error("Mobile fulfillment error:", error);

    await sql`
      UPDATE checkouts
      SET status = 'review', updated_at = NOW()
      WHERE reference = ${reference}
        AND clerk_user_id = ${userId}
        AND status = 'processing'
    `;

    return {
      status: "review",
      message: "Payment received. The order needs a manual review.",
    };
  }
}

//===================================
// SUBMIT MOBILE ORDER
//===================================
async function submitMobileSwiftDataOrder({
  network,
  recipient,
  pkg,
  size,
  paymentReference,
}) {
  const phone = String(recipient ?? "").trim();
  const packageName = String(pkg ?? "")
    .trim()
    .toLowerCase();
  const reference = String(paymentReference ?? "").trim();

  if (!network || !phone || !packageName || !reference || !size) {
    throw new Error("Invalid mobile SwiftData order details.");
  }

  const swiftBase = (
    process.env.SWIFT_BASE_URL || "https://api.swiftdata-link.com/v2"
  ).replace(/\/+$/, "");

  if (!process.env.SWIFT_API_KEY) {
    throw new Error("SwiftData API key is not configured.");
  }

  const selectedPackage = await findSwiftDataPackage(
    network,
    size,
    packageName,
  );

  if (!selectedPackage) {
    throw new Error("The selected SwiftData package is unavailable.");
  }

  const payload = {
    msisdn: phone,
    data: String(selectedPackage.sizeLabel),
    reference,
  };

  if (selectedPackage.offerSlug) {
    payload.offerSlug = selectedPackage.offerSlug;
  } else if (selectedPackage.offerId) {
    payload.offerId = selectedPackage.offerId;
  } else {
    throw new Error("The selected SwiftData package has no offer identifier.");
  }

  // Do not automatically retry this purchase after a timeout.
  // A timeout may happen after SwiftData has accepted the order.
  const response = await axios.post(`${swiftBase}/orders`, payload, {
    headers: {
      "X-API-Key": process.env.SWIFT_API_KEY,
      "Content-Type": "application/json",
    },
    timeout: 20000,
  });

  const body = response.data;
  const data = body?.data ?? body;

  if (body?.success === false || data?.success === false) {
    throw new Error(
      data?.message || body?.message || "SwiftData rejected the order.",
    );
  }

  const vendorReference =
    data?.orderReference ??
    data?.reference ??
    data?.orderId ??
    data?.id ??
    null;

  if (!vendorReference) {
    // The request may have been accepted even if the response shape
    // did not contain a recognizable reference.
    throw new Error(
      "SwiftData response did not contain an order reference; reconciliation is required.",
    );
  }

  const rawStatus = String(
    data?.status ?? data?.orderStatus ?? "processing",
  ).toLowerCase();

  const status = [
    "failed",
    "failure",
    "cancelled",
    "canceled",
    "rejected",
  ].includes(rawStatus)
    ? "failed"
    : ["delivered", "completed", "success", "successful"].includes(rawStatus)
      ? "delivered"
      : ["pending", "processing", "accepted", "queued"].includes(rawStatus)
        ? "processing"
        : "review";

  return {
    vendorReference: String(vendorReference),
    status,
  };
}

//======================================
// PROVIDER FULFILLMENT
//======================================
async function fulfillMobileDataMartLine({ checkoutReference, lineNo, line }) {
  // Mark the existing Neon record before submitting to the provider.
  await updateMobileNeonOrder({
    checkoutReference,
    lineNo,
    vendor: "datamart",
    status: "processing",
  });

  const providerOrder = await submitMobileDataMartOrder({
    network: line.network,
    recipient: line.phone,
    size: line.size,
    paymentReference: `${checkoutReference}-${lineNo}`,
  });

  const providerStatus = String(providerOrder.orderStatus ?? "unknown")
    .trim()
    .toLowerCase();

  const status = ["completed", "success", "successful", "delivered"].includes(
    providerStatus,
  )
    ? "delivered"
    : ["failed", "cancelled", "canceled", "rejected"].includes(providerStatus)
      ? "failed"
      : "processing";

  return updateMobileNeonOrder({
    checkoutReference,
    lineNo,
    vendor: "datamart",
    vendorReference:
      providerOrder.providerOrderReference ||
      providerOrder.transactionReference ||
      providerOrder.purchaseId ||
      null,
    status,
  });
}

/**
 * Update an existing mobile order using its checkout reference
 * and line number. Never creates a second order row.
 */

// ========================================
// NORMALIZE PROVIDER RAW STATUS
//=========================================
function normalizeMobileProviderStatus(rawStatus) {
  const status = String(rawStatus ?? "")
    .trim()
    .toLowerCase();

  if (["delivered", "completed", "successful", "success"].includes(status)) {
    return "delivered";
  }

  if (
    ["failed", "failure", "rejected", "cancelled", "canceled"].includes(status)
  ) {
    return "failed";
  }

  if (["pending", "queued", "accepted"].includes(status)) {
    return "pending";
  }

  if (["processing", "in_progress", "in progress"].includes(status)) {
    return "processing";
  }

  return "review";
}

// ========================================
// MOBILE RECONCILE
//=========================================
async function reconcileMobileSwiftDataOrder(order) {
  const vendorReference = String(order.vendor_ref ?? "").trim();

  if (!vendorReference) {
    return {
      lineNo: order.line_no,
      status: "review",
      message: "No saved SwiftData reference; manual investigation required.",
    };
  }

  // Status lookup only. This does not purchase or resubmit anything.
  const response = await fetchSwiftDataBulkStatus([vendorReference]);

  if (response?.success === false) {
    throw new Error(response.message || "SwiftData status lookup failed.");
  }

  const result = response?.data ?? response;
  const providerOrders = result?.orders ?? [];

  // Do not treat "missing" as failed: it may be an identifier mismatch.
  const providerOrder = providerOrders.find((item) => {
    const identifiers = [
      item?.orderReference,
      item?.reference,
      item?.orderId,
      item?.id,
    ]
      .filter(Boolean)
      .map(String);

    return identifiers.includes(vendorReference);
  });

  if (!providerOrder) {
    return {
      lineNo: order.line_no,
      status: "review",
      message:
        "SwiftData did not return a matching order; no resubmission made.",
    };
  }

  const nextStatus = normalizeMobileProviderStatus(
    providerOrder.status ??
      providerOrder.orderStatus ??
      providerOrder.order_status,
  );

  const saved = await updateMobileNeonOrder({
    checkoutReference: order.checkout_ref,
    lineNo: order.line_no,
    vendor: "swiftdata",
    vendorReference,
    status: nextStatus,
  });

  return {
    lineNo: saved.line_no,
    vendor: saved.vendor,
    vendorReference: saved.vendor_ref,
    status: saved.status,
  };
}

// ========================================
// ADMIN RECONCILE
//=========================================
app.post(
  "/api/admin/mobile-orders/reconcile",
  requiredAdmin,
  async (req, res) => {
    try {
      const limit = Math.min(
        Math.max(Number.parseInt(req.body?.limit, 10) || 50, 1),
        200,
      );

      const orders = await sql`
        SELECT
          id,
          checkout_ref,
          line_no,
          vendor,
          vendor_ref,
          status
        FROM orders
        WHERE checkout_ref LIKE 'ECM%'
          AND vendor = 'swiftdata'
          AND status IN ('review', 'processing', 'pending', 'unknown')
          AND vendor_ref IS NOT NULL
        ORDER BY created_at ASC
        LIMIT ${limit}
      `;

      const results = [];

      for (const order of orders) {
        try {
          const result = await reconcileMobileSwiftDataOrder(order);
          results.push({
            checkoutReference: order.checkout_ref,
            ...result,
          });
        } catch (error) {
          console.error(
            "Mobile SwiftData reconciliation failed:",
            order.checkout_ref,
            order.line_no,
            error.message,
          );

          results.push({
            checkoutReference: order.checkout_ref,
            lineNo: order.line_no,
            status: "review",
            message: "Status lookup failed; order was not resubmitted.",
          });
        }
      }

      return res.json({
        success: true,
        checked: results.length,
        results,
      });
    } catch (error) {
      console.error("Mobile reconciliation endpoint error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to reconcile mobile orders.",
      });
    }
  },
);

// Frontend fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// ENDS//
