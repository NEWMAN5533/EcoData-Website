import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import storesRoutes from "./routes/storesRoute.js";
import paystackWebhookRouter from "./routes/paystackWebhookRouter.js";
import productRouter from "./routes/product.js";
import subscriptionRouter from "./routes/subscriptionRouter.js";


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();


app.use(cors());



// Capture raw body for Paystack signature verification
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "frontend")));



// ROUTERS USED
app.use("/paystack/webhook", paystackWebhookRouter);
app.use("/api", storesRoutes);
app.use("/api", productRouter);
app.use("/api", subscriptionRouter);



// Initialize Firebase Admin
import admin from "firebase-admin";

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FB_PROJECT_ID,
    clientEmail: process.env.FB_CLIENT_EMAIL,
    privateKey: process.env.FB_PRIVATE_KEY.replace(/\\n/g,'\n'),
  }),
});

const db = admin.firestore();



// 🚨 Prevent duplicate orders (Memory Cache)
const processedOrders = new Map();

/*
  Structure:
  processedOrders.set(paymentReference, {
      status: "success" | "failed",
      response: {...}   // SwiftData response
  });
*/

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
   

    // 3. Build SwiftData order payload
    const orderData = {
      type: "single",
      volume: parseInt(size, 10),
      phone: recipient,
      offerSlug: pkg,
      webhookUrl:
        process.env.SWIFT_WEBHOOK_URL || "https://swiftdata-link.com/api/webhooks/orders",
    };

    // 4. Post to SwiftData
    const swiftBase = (process.env.SWIFT_BASE_URL || "https://swiftdata-link.com").replace(/\/$/, "");
    const swiftUrl = `${swiftBase}/order/${network}`;

    const swiftRes = await axios.post(swiftUrl, orderData, {
      headers: {
        "x-api-key": process.env.SWIFT_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });

    // ❇ SAVE RESULT TO PREVENT DUPLICATES
    processedOrders.set(paymentReference, {
      status: "success",
      response: swiftRes.data,
    });

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
    const errData = err.response?.data || err.message || err;
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


// ====================================
// PRODUCTION STORE SERVER VERIFICATION
// ====================================


// ======================================
// PRODUCTION STORE SERVER VERIFICATIOIN ENDS
// =======================================


// =====================
// AGENT ROUTE VERIFICATION
// ====================
app.post("/verify-payment", async (req, res) => {
  try {
    const { reference, uid } = req.body;

    if (!reference || !uid) {
      return res.status(400).json({ error: "Missing reference or uid" });
    }

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = response.data.data;

    const AGENT_PRICE = 100;
    const expectedAmount = AGENT_PRICE * 100;

    if (data.status !== "success") {
      return res.status(400).json({ error: "Payment not successful" });
    }

    if (data.amount !== expectedAmount) {
      return res.status(400).json({ error: "Incorrect amount" });
    }

    if (data.currency !== "GHS") {
      return res.status(400).json({ error: "Invalid currency" });
    }

    if (data.metadata.uid !== uid) {
      return res.status(400).json({ error: "UID mismatch" });
    }

    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    if (userDoc.data().paymentStatus === "verified") {
      return res.status(400).json({ error: "Already verified" });
    }

    await userRef.update({
      isAgent: true,
      paymentStatus: "verified",
      agentApproved: true,
      amount: AGENT_PRICE,
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentReference: reference,
    });

    return res.json({ success: true, message: "Agent upgraded successfully" });

  } catch (error) {
    console.error("Verification error:", error.response?.data || error);
    res.status(500).json({ error: "Server error" });
  }
});
// =====================
// AGENT ROUTE VERIFICATION ENDS
// ====================








// ====================
// MTN AFA HANDLER
// ====================
async function handleAFARequest({
  fullName,
  phone,
  paymentReference,
}) {
  // ====================
  // VALIDATION
  // ====================
  if (!fullName || !phone || !paymentReference) {
    return {
      ok: false,
      status: 400,
      body: {
        success: false,
        message: "Missing required fields",
      },
    };
  }

  // ====================
  // DUPLICATION PROTECTION
  // ====================
  if (processedOrders.has(paymentReference)) {
    return {
      ok: true,
      status: 200,
      body: {
        success: true,
        message: "AFA already processed",
        ...processedOrders.get(paymentReference).response,
      },
    };
  }

  try {
    // ====================
    // VERIFY PAYSTACK PAYMENT
    // ====================
    const verification = await axios.get(
  `https://api.paystack.co/transaction/verify/${paymentReference}`,
  {
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
  }
);

    if (!verification.status || verification.data.status !== "success") {
      throw new Error("Payment verification failed");
    }

    // Optional: validate amount
    const paidAmount = verification.data.amount / 100;
    if (paidAmount !== 20) {
      throw new Error("Invalid payment amount");
    }



    // ====================
    // SEND TO SWIFT AFA
    // ====================
    const base = (process.env.SWIFT_BASE_URL || "")
      .replace(/\/$/, "");

    const swiftUrl = `${base}/services/mtn-afa`;

    const swiftRes = await axios.post(
      swiftUrl,
      { phone, fullName },
      {
        headers: {
          "x-api-key": process.env.SWIFT_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    const responseData = {
      registrationId:
        swiftRes.data?.registrationId ||
        "AFA-" + Date.now(),
      name: fullName,
      phoneNumber: phone,
      registrationPrice: paidAmount,
      status: swiftRes.data?.status || "pending",
      submittedAt: new Date().toISOString(),
    };

    // Store processed order
    processedOrders.set(paymentReference, {
      status: "success",
      response: responseData,
    });

    return {
      ok: true,
      status: 200,
      body: {
        success: true,
        message: "AFA registration successful",
        ...responseData,
      },
    };
  } catch (err) {
    const errData = err.response?.data || err.message;

    processedOrders.set(paymentReference, {
      status: "failed",
      response: { error: errData },
    });

    return {
      ok: false,
      status: 500,
      body: {
        success: false,
        message: "AFA registration failed",
        error: errData,
      },
    };
  }
}



// =======================
// MTN AFA ROUTE
// =======================
app.post("/api/afa/register", async (req, res) => {
  const {phone,
      fullName, 
      paymentReference,
    } = req.body;

  const result = await handleAFARequest({
    fullName: fullName,
    phone: phone,
    paymentReference: paymentReference,
  });

  res.status(result.status).json(result.body);
});



// =======================
//  AFA ORDER STATUS
// =======================




// =======================
// MTN AFA HANDLER ENDS
// =======================


// Frontend fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// ENDS//