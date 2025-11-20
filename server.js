// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "frontend")));

// Memory cache to prevent duplicate placements for the same paymentReference
const processedOrders = new Map();

// Helper: common logic for buy-data (supports GET query or POST JSON)
async function handleBuyDataRequest({ network, recipient, pkg, size, paymentReference }) {
  if (!network || !recipient || !pkg || !paymentReference) {
    return { ok: false, status: 400, body: { success: false, message: "Missing required fields" } };
  }

  // Prevent duplicate processing for same paymentReference
  if (processedOrders.has(paymentReference)) {
    return {
      ok: true,
      status: 200,
      body: {
        success: true,
        message: "Order already processed (duplicate prevented)",
        order: processedOrders.get(paymentReference).response,
      },
    };
  }

  // Verify Paystack
  try {
    const verify = await axios.get(`https://api.paystack.co/transaction/verify/${paymentReference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      timeout: 10000,
    });

    if (!verify.data?.data || verify.data.data.status !== "success") {
      processedOrders.set(paymentReference, { status: "failed", response: { message: "Paystack not verified" } });
      return { ok: false, status: 400, body: { success: false, message: "Payment not verified by Paystack" } };
    }

    // Build swift payload
    const orderData = {
      type: "single",
      volume: parseInt(size, 10),
      phone: recipient,
      offerSlug: pkg,
      webhookUrl: process.env.SWIFT_WEBHOOK_URL || "https://swiftdata-link.com/api/webhooks/orders",
    };

    const swiftBase = (process.env.SWIFT_BASE_URL || "https://swiftdata-link.com/api/v1").replace(/\/$/, "");
    // Swift expects POST to /order/:network (based on your earlier server)
    const swiftUrl = `${swiftBase}/order/${encodeURIComponent(network)}`;

    const swiftRes = await axios.post(swiftUrl, orderData, {
      headers: {
        "x-api-key": process.env.SWIFT_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });

    // Save result to cache (success or not) to prevent duplicates on network retries
    processedOrders.set(paymentReference, { status: "success", response: swiftRes.data });

    if (swiftRes.data?.success) {
      return { ok: true, status: 200, body: { success: true, message: "Bundle order placed", order: swiftRes.data } };
    } else {
      return { ok: false, status: 400, body: { success: false, message: "SwiftData request failed", details: swiftRes.data } };
    }
  } catch (err) {
    const errData = err.response?.data || err.message || err;
    console.error("handleBuyDataRequest error:", errData);

    // Cache failure so multiple retries don't hit Swift
    processedOrders.set(paymentReference, { status: "failed", response: errData });

    return { ok: false, status: 500, body: { success: false, message: "Failed to process data order", error: errData } };
  }
}

// POST endpoint (preferred)
app.post("/api/buy-data", async (req, res) => {
  const { network, recipient, package: pkg, size, paymentReference } = req.body;
  const result = await handleBuyDataRequest({ network, recipient, pkg, size, paymentReference });
  return res.status(result.status).json(result.body);
});

// GET endpoint (keeps backward compatibility if frontend still sends GET queries)
app.get("/api/buy-data", async (req, res) => {
  const { network, recipient, package: pkg, size, paymentReference } = req.query;
  const result = await handleBuyDataRequest({ network, recipient, pkg, size, paymentReference });
  return res.status(result.status).json(result.body);
});

// Live orders feed proxy: GET /api/orders
// This fetches SwiftData public orders endpoint and returns the JSON to the frontend.
// NOTE: if Swift returns HTML or blocks CORS, this avoids frontend CORS issues.
app.get("/api/orders", async (req, res) => {
  try {
    const swiftBase = (process.env.SWIFT_BASE_URL || "https://swiftdata-link.com/api/v1").replace(/\/$/, "");
    const swiftOrdersUrl = `${swiftBase}/orders`; // your stated endpoint

    const response = await axios.get(swiftOrdersUrl, {
      headers: { "x-api-key": process.env.SWIFT_API_KEY, "Content-Type": "application/json" },
      timeout: 10000,
    });

    return res.json(response.data);
  } catch (err) {
    console.error("Error fetching swift orders:", err.response?.data || err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch live orders", error: err.response?.data || err.message });
  }
});

// Status route — returns SwiftData order status (proxied)
app.get("/api/v1/order/status/:orderIdOrRef", async (req, res) => {
  const { orderIdOrRef } = req.params;
  if (!orderIdOrRef) return res.status(400).json({ success: false, message: "Missing order ID or reference" });

  try {
    const swiftBase = (process.env.SWIFT_BASE_URL || "https://swiftdata-link.com/api/v1").replace(/\/$/, "");
    const swiftUrl = `${swiftBase}/order/status/${encodeURIComponent(orderIdOrRef)}`;

    const response = await axios.get(swiftUrl, {
      headers: { "x-api-key": process.env.SWIFT_API_KEY, "Content-Type": "application/json" },
      timeout: 10000,
    });

    // Return Swift response directly (frontend knows how to interpret it)
    return res.json({ success: true, order: response.data });
  } catch (error) {
    console.error("SwiftData Status Error:", error.response?.data || error.message);
    return res.status(500).json({ success: false, message: "Error fetching order status", error: error.response?.data || error.message });
  }
});

// Frontend fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



























