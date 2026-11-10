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
import swiftDataOrderStatusPolling from "./routes/swiftDataOrderStatusPolling.js";



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



// Frontend fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// ENDS//
