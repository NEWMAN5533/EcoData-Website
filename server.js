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
import exclusiveAgentRoute from "./routes/exclusivePage.js";
import afaRegisterRouter from "./routes/afaRegisterRoute.js";
import afaStatusRouter from "./routes/afaStatusRouter.js";
import getVoucherRouter from "./routes/getVouchersRoute.js";
import postVoucherRouter from "./routes/postVoucherRouter.js";
import failedOrderCheckRouter from "./routes/failedOrderCheckRouter.js";





/* =========================================
   VENDOR MANAGEMENT
========================================= */
import vendorManagementRouter from "./routes/vendorManagementRoute.js";
import { getActiveVendor } from "./services/vendorManager.js";
import { handleDataMartBuyDataRequest } from "./services/dataMartBundler.js";

/* =========================================
   DATAMART SERVICE
========================================= */


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



app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "frontend")));

// ROUTES
app.use("/api/validate-recipient", validateRecipientRoute);
app.use("/api/restrictions", restrictionsRoute);
app.use("/api/paystack/webhook", paystackWebhookRouter);


app.use("/api/admin", adminRoute);
app.use("/api/admin", syncOrderRoute);
app.use("/api/verify-payment", exclusiveAgentRoute);
app.use("/api/afa", afaRegisterRouter(verifyPaystack));
app.use("/api/afa/status", afaStatusRouter);
app.use("/api/live-order-status", failedOrderCheckRouter);
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



const activeVendor = await getActiveVendor();

let result;

if (activeVendor === "datamart") {
  result = await handleDataMartBuyDataRequest(
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
} else if (activeVendor === "swiftdata") {
  result = await handleSwiftDataBuyDataRequest({
    network,
    recipient,
    pkg,
    size,
    paymentReference,
  });
} else {
  result = {
    ok: false,
    status: 500,
    body: {
      success: false,
      message: "The configured bundle vendor is unsupported.",
    },
  };
}





// Helper: common logic for buy-data (POST or GET)
// ================================
// HANDLE BUY DATA REQUEST (FIXED)
// ================================
// Helper: common logic for buy-data (POST or GET)
export async function handleSwiftDataBuyDataRequest({
  network, 
  recipient, 
  pkg, 
  size, 
  paymentReference }) {

  if (
    !network || 
    !recipient || 
    !pkg || 
    !paymentReference ||
    size === undefined
    ) 
    {
    return { 
      ok: false, 
      status: 400, 
      body: { 
        success: false, 
        message: "Missing required fields" } 
      };
  }

 


  // 2. STOP DUPLICATE REQUESTS HERE
  if (processedOrders.has(paymentReference)) {
    return {
      ok: true,
      status: 200,
      body: {
        success: true,
        message: "Order already processed (duplicate prevented)",
        order: processedOrders.get(paymentReference).response
      }
    };
  }

  

  // 2. Verify Paystack payment
  try {

    const verification = await verifyPaystack(paymentReference);
    
    const transaction = 
    verification?.data?.data;

    if(transaction?.status !== "success"){
      return {
        ok: false,
        status: 400,
        body: {
          success: false,
          message: "Payment verification failed",
        },
      };
    }

    if(transaction.reference !== paymentReference){
      return {
        ok: false,
        status: 400,
        body: {
          success: false,
          message: "Payment reference mismatch"
        }
      };
    }


// Paystack returns the transaction amount in pesewas
const actualAmountPesewas = Number(transaction.amount);

if (
  !Number.isFinite(actualAmountPesewas) ||
  actualAmountPesewas <= 0
) {
  return {
    ok: false,
    status: 400,
    body: {
      success: false,
      message: "Invalid payment amount."
    }
  };
}


// Convert pesewas to Ghana cedis
const actualAmountGHS = actualAmountPesewas / 100;

// Verify against promo, agent and normal user prices
const priceCheck = verifySellingPrice(network, size, actualAmountGHS);

if (!priceCheck.valid) {
  return {
    ok: false,
    status: 400,
    body: {
      success: false,
      message: priceCheck.message
    }
  };
}

console.log("Approved price verified:", {
  paymentReference,
  priceType: priceCheck.priceType,
  expectedPrice: priceCheck.expectedPrice,
  actualAmountGHS
});


    console.log("Payment verified successfully for reference:", paymentReference);


  
    // 3. Build SwiftData order payload
    const orderData = {
      type: "single",
      volume: parseInt(size, 10),
      phone: recipient,
      offerSlug: pkg,
      webhookUrl:
        process.env.SWIFT_WEBHOOK_URL || "https://swiftdata-link.com/api/webhooks/orders",
    };

    console.log("Full SwiftData order payload:", orderData);

    // 4. Post to SwiftData
    const swiftBase = (process.env.SWIFT_BASE_URL || "https://swiftdata-link.com").replace(/\/$/, "");

    console.log(" Sending to swiftData:", {
      network,
      recipient,
      pkg,
      size,
      paymentReference
    });

    const swiftUrl = `${swiftBase}/order/${network}`;

    console.log("SwiftData URL:", swiftUrl);

    const swiftRes = await axios.post(swiftUrl, orderData, {
      headers: {
        "x-api-key": process.env.SWIFT_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });


    processedOrders.set(paymentReference, {
      status: "processing",
      response: {
        reference:
          swiftRes.data?.reference || null,

        orderId:
          swiftRes.data?.orderId || null,
      },
    });

    console.log("🔥 swiftData response:", swiftRes.data);

    if (swiftRes.data?.success) {
      return {
        ok: true,
        status: 200,
        body: {
          success: true,
          message: "Bundle order placed",
          order: swiftRes.data,
        },
      };
    } else {
      return {
        ok: false,
        status: 400,
        body: {
          success: false,
          message: "SwiftData request failed",
          details: swiftRes.data,
        },
      };
    }
  } catch (err) {
    const errData = {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message
    };

    console.error("🔥 handleSwiftDataBuyDataRequest error:", errData);

    // Save failure so duplicate network retry does not call Swift again
    processedOrders.set(paymentReference, {
      status: "failed",
      response: errData,
    });

    return {
      ok: false,
      status: 500,
      body: {
        success: false,
        message: "Failed to process data order",
        error: errData,
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

// Status route
app.get("/api/v1/order/status/:orderIdOrRef", async (req, res) => {
  const { orderIdOrRef } = req.params;

  if (!orderIdOrRef) {
    return res.status(400).json({ success: false, message: "Missing order ID or reference" });
  }

  try {
    const base = (process.env.SWIFT_BASE_URL || "https://swiftdata-link.com").replace(/\/$/, "");
    const swiftUrl = `${base}/order/status/${encodeURIComponent(orderIdOrRef)}`;

    const response = await axios.get(swiftUrl, {
      headers: {
        "x-api-key": process.env.SWIFT_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    if (response.data?.success) {
      return res.json({ success: true, order: response.data.order });
    } else {
      return res.status(400).json({
        success: false,
        message: response.data?.message || "Failed to fetch order status",
        details: response.data,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching order status",
      error: error.response?.data || error.message,
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