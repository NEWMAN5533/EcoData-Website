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
import productRouter from "./routes/product.js";
import subscriptionRouter from "./routes/subscriptionRouter.js";
import adminRoute from "./routes/adminOrderUpdate.js";
import syncOrderRoute from "./routes/syncOrderStatus.js";
import validateRecipientRoute from "./routes/validateRecipient.js";
import restrictionsRoute from "./routes/restrictions.js";
import exclusiveAgentRoute from "./routes/exclusivePage.js";
import afaRegisterRouter from "./routes/afaRegisterRoute.js";
import getVoucherRouter from "./routes/getVouchersRoute.js";
import postVoucherRouter from "./routes/postVoucherRouter.js";




// Firebase Admin
import { admin, db } from "./firebaseAdmin.js";
import { startOrderSyncJob } from "./cron/syncOrders.js";


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
app.use("/api/create-store", storeRouter);
app.use("/api/upload-product", productRouter);
app.use("/api/initiate-subscription", subscriptionRouter);
app.use("/api/admin", adminRoute);
app.use("/api/admin", syncOrderRoute);
app.use("/api/verify-payment", exclusiveAgentRoute);
app.use("/api/afa-register", afaRegisterRouter);
app.use("/api/vouchers", getVoucherRouter);
app.use("/api/order-voucher", postVoucherRouter);





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

// Helper: common logic for buy-data (POST or GET)
// ================================
// HANDLE BUY DATA REQUEST (FIXED)
// ================================
// Helper: common logic for buy-data (POST or GET)
export async function handleBuyDataRequest({network, recipient, pkg, size, paymentReference }) {
  if (!network || !recipient || !pkg || !paymentReference) {
    return { ok: false, status: 400, body: { success: false, message: "Missing required fields" } };
  }

  // 🚨 1. STOP DUPLICATE REQUESTS HERE
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
    
    if(verification.data.data.status !== "success"){
      return {
        ok: false,
        status: 400,
        body: {
          success: false,
          message: "Payment verification failed",
        },
      };
    }

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

    console.error("🔥 handleBuyDataRequest error:", errData);

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
  const { network, recipient, package: pkg, size, paymentReference } = req.body;
  const result = await handleBuyDataRequest({ network, recipient, pkg, size, paymentReference });

  console.log("🔥 handleBuyDataRequest result:", result);

  return res.status(result.status).json(result.body);
});



// GET route
app.get("/api/buy-data", async (req, res) => {
  const { network, recipient, package: pkg, size, paymentReference } = req.query;
  const result = await handleBuyDataRequest({ network, recipient, pkg, size, paymentReference });
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