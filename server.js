// src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";

// Routes
import storeRouter from "./routes/storesRoute.js";
import paystackWebhookRouter from "./routes/paystackWebhookRouter.js";

import { verifySellingPrice } from "./frontend/sellingPrice.js";
import subscriptionRouter from "./routes/subscriptionRouter.js";
import adminRoute from "./routes/adminOrderUpdate.js";
import syncOrderRoute from "./routes/syncOrderStatus.js";
import validateRecipientRoute from "./routes/validateRecipient.js";
import restrictionsRoute from "./routes/restrictions.js";
import { getSwiftDataCatalog, findSwiftDataPackage } from "./services/swiftDataCatalog.js";
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
  updateDataMartOrder
} from "./services/dataMartOrderRepository.js";

import webhookRouter from "./routes/dataMartWebhookRoute.js";


/* =========================================
   DATAMART RECIPIENT VERIFICATION
========================================= */
import dataMartRecipientVerificationRoute
  from "./routes/dataMartRecipientVerificationRoute.js";
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
import adminTestRouter from "./routes/adminTestRoute.js";
import adminAccessDashboardRouter from "./routes/adminDashboardRoute.js";
import adminSellersRouter from "./routes/adminSellersMap.js";




//MOBILE APP IMPORTS
import { mobileRouter } from "./routes/mobileMe.js";
import { getMobileSellingPrice } from "./services/mobileSellingPrices.js";
import  sql, { pool } from "./backend/db.js";




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
app.use(bodyParser.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));


app.set("trust proxy", 1);                     // Render sits behind a proxy
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
      offers
    });
  } catch (error) {
    console.error("SwiftData v2 catalogue error:", {
      status: error.providerHttpStatus ?? error.response?.status,
      code: error.providerResponse?.error?.code,
      message: error.message
    });

    return res.status(error.providerHttpStatus || error.response?.status || 502).json({
      success: false,
      code: error.providerResponse?.error?.code || null,
      message:
        error.providerResponse?.error?.message ||
        "Unable to retrieve SwiftData packages."
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
app.use("/api/creator/dashboard", createProductRouter );
app.use("/api/creator/withdrawals", createProductRouter);
app.use("/api/creator/sales", createProductRouter);







// CLERK AUTHENTICATION TEST
app.use("/api/account", accountRouter);

app.get("/api/auth/me", requireAuth, (req, res) => {
  const {userId} = getAuth(req);

  return res.status(200).json({
    success: true,
    message: "Authentication successful,",
    user: {
      clerkUserId: userId
    }
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
      ...catalogue
    });
  } catch (error) {
    const status = error.providerHttpStatus === 403
      ? 403
      : error.providerHttpStatus === 429
        ? 429
        : 502;

    return res.status(status).json({
      success: false,
      code: error.providerResponse?.code || "MASHUP_CATALOGUE_ERROR",
      message:
        error.providerResponse?.message ||
        "Unable to load MashUp packages right now."
    });
  }
});

// CHECK AUTHENTICATION ENDS

// USER PROFILE ROUTE
app.use("/api/profile", profileRouter);
// SELLER PROFILE ROUTE
app.use("/api/seller", sellerProfileRouter);
app.use("/api/seller/logo", sellerLogoRouter)
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
        }
      );

      console.log(
        `✅ Paystack verified on attempt ${attempt}`
      );

      return verification;

    } catch (err) {

      console.log(
        `⚠️ Paystack verify attempt ${attempt}/${retries} failed`
      );

      if (attempt === retries) {
        throw err;
      }

      await new Promise(resolve =>
        setTimeout(resolve, 2000)
      );
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
    const selectedPackage = await
      findSwiftDataPackage (
  network,
  size,
  pkg
);

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
const swiftRes = await axios.post(
  `${swiftBase}/orders`,
  orderData,
  {
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    timeout: 20000,
  }
);

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
    providerOrder.reference ||
    providerOrder.clientReference ||
    null,
  providerStatus:
    providerOrder.status ||
    providerOrder.orderStatus ||
    "processing",
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
  const { network, recipient, package: pkg, size, paymentReference,
    
   } = req.body;
  const result = await handleSwiftDataBuyDataRequest({ network, recipient, pkg, size, paymentReference });

  console.log("🔥 handleSwiftDataBuyDataRequest result:", result);

  return res.status(result.status).json(result.body);
});



// GET route
app.get("/api/buy-data", async (req, res) => {
  const { network, recipient, package: pkg, size, paymentReference } = req.query;
  const result = await handleSwiftDataBuyDataRequest({ network, recipient, pkg, size, paymentReference });
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
    }
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
      identifiers.some(
        (id) => typeof id !== "string" || !id.trim()
      )
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
    const uniqueIdentifiers = [
      ...new Set(identifiers.map((id) => id.trim())),
    ];

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
      error.response?.data || error.message
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
      error.response?.data || error.message
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
  const {
    network,
    recipient,
    package: pkg,
    size,
    paymentReference,
  } = req.body;

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
      }
    );

    console.log(
      "DataMart purchase result:",
      result.status,
      result.body?.message
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
message: "DataMart order reference is required."
});
}

try {
// Fetch the latest status directly from DataMart.
const result = await getDataMartOrderStatus(reference);

if (result?.status !== "success" || !result?.data) {
  return res.status(502).json({
    success: false,
    provider: "datamart",
    message: "DataMart returned an invalid status response."
  });
}

const providerOrder = result.data;

// DataMart returns orderStatus inside result.data.
const rawStatus = String(
  providerOrder.orderStatus || ""
).trim().toLowerCase();

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
  "in progress": "processing"
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
      providerStatus: rawStatus || null
    }
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
    updatedAt: providerOrder.updatedAt || null
  }
});

} catch (error) {
console.error("DataMart status route failed:", {
reference,
httpStatus: error.providerHttpStatus,
providerResponse: error.providerResponse,
message: error.message
});

return res.status(502).json({
  success: false,
  provider: "datamart",
  message: "Unable to retrieve the latest DataMart order status."
});

}
});










/* =========================================
   ECODATA MOBILE CHECKOUT
   Separate from the existing website flow
========================================= */

app.post("/api/mobile/checkout/confirm", async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please sign in to continue.",
      });
    }

    const reference = String(req.body?.reference || "").trim();

    if (!/^ECM[A-F0-9]{20}$/.test(reference)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment reference.",
      });
    }

    const checkouts = await sql`
      SELECT reference, clerk_id, lines, amount, status
      FROM checkouts
      WHERE reference = ${reference}
        AND clerk_id = ${userId}
      LIMIT 1
    `;

    if (!checkouts.length) {
      return res.status(404).json({
        success: false,
        message: "Checkout not found.",
      });
    }

    const checkout = checkouts[0];

    if (checkout.status === "fulfilled") {
      return res.json({
        success: true,
        status: "fulfilled",
        message: "Your order has already been processed.",
      });
    }

    if (checkout.status !== "pending") {
      return res.status(409).json({
        success: false,
        status: checkout.status,
        message: "This checkout is already being processed or needs review.",
      });
    }

    const verification = await verifyPaystack(reference);
    const transaction = verification?.data?.data;

    if (
      verification?.data?.status !== true ||
      transaction?.status !== "success" ||
      transaction?.reference !== reference ||
      transaction?.currency !== "GHS" ||
      Math.round(Number(transaction?.amount)) !==
        Math.round(Number(checkout.amount) * 100)
    ) {
      return res.status(402).json({
        success: false,
        status: "pending",
        message: "Payment has not been confirmed. Please try again shortly.",
      });
    }

    /*
      Do not call the vendor directly here yet.

      The next step must atomically claim this checkout in Neon,
      create orders using the actual orders table columns, and call
      the correct existing vendor handler with a duplicate-purchase
      safeguard.
    */

    const result = await fulfillMobileCheckout(
      reference,
      userId,
      Math.round(Number(transaction.amount)),
    );

    return res.status(result.status === "not_found" ? 404 : 200).json({
      success: result.status === "fulfilled",
      status: result.status,
      reference,
      message: result.message,
    });
  } catch (error) {
    console.error(
      "Mobile checkout confirmation failed:",
      error.response?.data || error.message,
    );

    return res.status(500).json({
      success: false,
      message: "Unable to confirm payment right now.",
    });
  }
});

async function fulfillMobileCheckout(reference, userId, paidAmountPesewas) {
  // Atomically claim this checkout. Only one request can claim it.
  const claimed = await sql`
    UPDATE checkouts
    SET status = 'processing', updated_at = NOW()
    WHERE reference = ${reference}
      AND clerk_id = ${userId}
      AND status = 'pending'
      AND ROUND(amount * 100) = ${paidAmountPesewas}
    RETURNING reference, clerk_id, lines, amount
  `;

  if (!claimed.length) {
    const existing = await sql`
      SELECT status
      FROM checkouts
      WHERE reference = ${reference}
        AND clerk_id = ${userId}
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

    // Current mobile rule: DataMart/Normal orders are paid one at a time.
    if (
      lines.length > 1 &&
      lines.some((line) => String(line.package).toLowerCase() === "normal")
    ) {
      throw new Error("Normal delivery orders must be processed individually.");
    }

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];

      // Save the intended order before calling the vendor.
      // The unique (checkout_ref, line_no) constraint prevents duplicate rows.
      await sql`
        INSERT INTO orders (
          id,
          clerk_id,
          checkout_ref,
          line_no,
          package,
          vendor,
          network,
          size,
          price,
          phone,
          status,
          created_at
        )
        VALUES (
          ${crypto.randomUUID()},
          ${userId},
          ${reference},
          ${index},
          ${String(line.package)},
          ${
            String(line.package).toLowerCase() === "normal"
              ? "datamart"
              : "swiftdata"
          },
          ${String(line.network)},
          ${String(line.size)},
          ${Number(line.price)},
          ${String(line.phone)},
          'processing',
          NOW()
        )
        ON CONFLICT (checkout_ref, line_no) DO NOTHING
      `;
    }

    /*
      IMPORTANT:
      Vendor handlers can make real purchases. Before enabling this section,
      connect it to the exact handler signatures and ensure retries cannot
      resubmit an order when the provider response is uncertain.

      Never retry a provider purchase merely because the app timed out.
    */

    return {
      status: "review",
      message:
        "Payment received. Order fulfillment needs provider confirmation.",
    };
  } catch (error) {
    console.error("Mobile fulfillment error:", error);

    await sql`
      UPDATE checkouts
      SET status = 'review', updated_at = NOW()
      WHERE reference = ${reference}
        AND clerk_id = ${userId}
        AND status = 'processing'
    `;

    return {
      status: "review",
      message: "Payment received. The order needs a manual review.",
    };
  }
}

// Use the existing backend/db.js import.
// If server.js already imports sql from this file,
// DO NOT add a duplicate import.

const MOBILE_PAYSTACK_FEE_RATE = 0.0195;

function mobileCheckoutPrice(basePrice) {
  return Number(
    (Number(basePrice) * (1 + MOBILE_PAYSTACK_FEE_RATE)).toFixed(2),
  );
}











app.post("/api/mobile/checkout", async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please sign in to continue.",
      });
    }

    const { callbackUrl, lines } = req.body ?? {};

    // Validate the batch sent by cartContext.tsx.
    if (
      !Array.isArray(lines) ||
      lines.length === 0 ||
      lines.some(
        (line) =>
          !line ||
          typeof line.network !== "string" ||
          typeof line.package !== "string" ||
          typeof line.size !== "string" ||
          typeof line.phone !== "string" ||
          !line.network.trim() ||
          !line.package.trim() ||
          !line.size.trim() ||
          !line.phone.trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid bundle details.",
      });
    }

    // Normal/DataMart orders must use separate checkouts.
    if (
      lines.length > 1 &&
      lines.some(
        (line) => line.package.trim().toLowerCase() === "normal"
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Normal bundle orders must be checked out separately.",
      });
    }

    // Validate the callback URL against the app's known deep link.
  const allowedCallbackUrls = new Set([
  "ecodatamobile://paystack",
]);

if (
  typeof callbackUrl !== "string" ||
  !allowedCallbackUrls.has(callbackUrl)
) {
  return res.status(400).json({
    success: false,
    message: "Invalid payment callback URL.",
  });
}

    // Calculate all prices on the server.
    const pricedLines = lines.map((line) => {
      const packageName = line.package.trim();
      const network = line.network.trim();
      const size = line.size.trim();
      const phone = line.phone.trim();

      const basePrice = Number(
        getMobileSellingPrice(network, size, packageName)
      );

      if (!Number.isFinite(basePrice) || basePrice <= 0) {
        throw new Error(
          `Invalid selling price for ${network} ${size}GB.`
        );
      }

      return {
        package: packageName,
        network,
        size,
        phone,
        price: basePrice,
      };
    });

    // Apply the checkout fee once to the combined base amount.
    const baseTotal = pricedLines.reduce(
      (sum, line) => sum + line.price,
      0
    );

    const total = mobileCheckoutPrice(baseTotal);

    if (!Number.isFinite(total) || total <= 0) {
      return res.status(400).json({
        success: false,
        message: "Unable to calculate the checkout amount.",
      });
    }

    // Find the signed-in user's email.
    const users = await sql`
      SELECT email
      FROM public.users
      WHERE clerk_id = ${userId}
      LIMIT 1
    `;

    const email = String(users[0]?.email || "").trim();

    if (!email) {
      return res.status(409).json({
        success: false,
        message:
          "Your account email is unavailable. Please update your account.",
      });
    }

    // Check every recipient for an active order.
    for (const line of pricedLines) {
      const activeOrders = await sql`
        SELECT id
        FROM orders
        WHERE phone = ${line.phone}
          AND status IN ('processing', 'pending', 'unknown')
          AND created_at > NOW() - INTERVAL '30 minutes'
        LIMIT 1
      `;

      if (activeOrders.length) {
        return res.status(409).json({
          success: false,
          message:
            `The number ${line.phone} already has an active order.`,
        });
      }
    }

    const reference =
      "ECM" +
      crypto.randomUUID()
        .replace(/-/g, "")
        .slice(0, 20)
        .toUpperCase();

    // Create the checkout record before initializing payment.
    // If Paystack initialization fails, the record is marked failed.
    await sql`
      INSERT INTO checkouts (
        reference,
        clerk_id,
        lines,
        amount,
        status,
        refund_due,
        created_at,
        updated_at
      )
      VALUES (
        ${reference},
        ${userId},
        ${JSON.stringify(pricedLines)}::jsonb,
        ${total},
        'pending',
        0,
        NOW(),
        NOW()
      )
    `;

    try {
      const paymentResponse = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email,
          amount: Math.round(total * 100),
          currency: "GHS",
          reference,
          callback_url: callbackUrl,
          metadata: {
            source: "ecodata_mobile",
            clerk_user_id: userId,
            checkout_reference: reference,
            line_count: pricedLines.length,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      if (
        paymentResponse.data?.status !== true ||
        !paymentResponse.data?.data?.authorization_url
      ) {
        throw new Error("Paystack did not return an authorization URL.");
      }

      return res.json({
        success: true,
        reference,
        amount: total,
        authorizationUrl:
          paymentResponse.data.data.authorization_url,
      });
    } catch (paymentError) {
      await sql`
        UPDATE checkouts
        SET status = 'failed', updated_at = NOW()
        WHERE reference = ${reference}
          AND status = 'pending'
      `;

      throw paymentError;
    }
  } catch (error) {
    console.error("[EcoData mobile checkout] Error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message:
        "Unable to start checkout. Please try again.",
    });
  }
});

















// Frontend fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// ENDS//
