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

// 🚨 Prevent duplicate orders (Memory Cache)
const processedOrders = new Map();

/*
  Structure:
  processedOrders.set(paymentReference, {
      status: "success" | "failed",
      response: {...}   // SwiftData response
  });
*/

async function fetchAvailableOffers() {
  try {
    const base = (process.env.SWIFT_BASE_URL || "https://swiftdata-link.com").replace(/\/$/, "");
    const res = await axios.get(`${base}/api/v1/offers`, {
      headers: { "x-api-key": process.env.SWIFT_API_KEY },
      timeout: 10000,
    });
    if (res.data?.success && Array.isArray(res.data.offers)) return res.data.offers;
    return [];
  } catch (e) {
    console.warn("Could not fetch offers from SwiftData:", e.message || e);
    return [];
  }
}

// Helper: common logic for buy-data (POST or GET)
async function handleBuyDataRequest({ network, recipient, pkg, size, paymentReference }) {
  if (!recipient || !pkg || !paymentReference) {
    return { ok: false, status: 400, body: { success: false, message: "Missing required fields" } };
  }

  // 0) Normalize size to int
  const volume = parseInt(size, 10) || 0;

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

  // Optional: verify offerSlug exists & volume supported (pre-check)
  const offers = await fetchAvailableOffers();
  if (offers.length) {
    const found = offers.find(o => (o.offerSlug || "").toLowerCase() === (pkg || "").toLowerCase());
    if (!found) {
      return {
        ok: false,
        status: 400,
        body: { success: false, message: `Offer "${pkg}" not found in SwiftData offers` }
      };
    }
    // if volumes provided in offer, ensure requested volume is allowed
    if (Array.isArray(found.volumes) && found.volumes.length && !found.volumes.includes(volume)) {
      return {
        ok: false,
        status: 400,
        body: { success: false, message: `Volume ${volume} not available for offer "${pkg}"` }
      };
    }
  }
  // 2. Verify Paystack payment
  try {
    const verify = await axios.get(
      `https://api.paystack.co/transaction/verify/${paymentReference}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
        timeout: 10000,
      }
    );

    if (!verify.data?.data || verify.data.data.status !== "success") {
      return {
        ok: false,
        status: 400,
        body: { success: false, message: "Payment not verified by Paystack" }
      };
    }

    // 3. Build SwiftData order payload using API v1 (offerSlug-based)
    const orderData = {
      type: "single",
      volume: volume,
      phone: recipient,
      offerSlug: pkg,
      // webhookUrl optional - include only if configured
      ...(process.env.SWIFT_WEBHOOK_URL ? { webhookUrl: process.env.SWIFT_WEBHOOK_URL } : {})
    };

    // 4. Post to SwiftData (v1 endpoint)
    const swiftBase = (process.env.SWIFT_BASE_URL || "https://swiftdata-link.com").replace(/\/$/, "");
    const swiftUrl = `${swiftBase}/api/v1/order`;

    const swiftRes = await axios.post(swiftUrl, orderData, {
      headers: {
        "x-api-key": process.env.SWIFT_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });

    // ❇ SAVE RESULT TO PREVENT DUPLICATES
    processedOrders.set(paymentReference, {
      status: swiftRes.data?.success ? "success" : "failed",
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
    const errData = err.response?.data || err.message || String(err);
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
    const swiftUrl = `${base}/api/v1/order/status/${encodeURIComponent(orderIdOrRef)}`;

    const response = await axios.get(swiftUrl, {
      headers: {
        "x-api-key": process.env.SWIFT_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    // Swift v1 returns { success: true, order: { ... } }
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
    console.error("⚠ SwiftData Status Error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching order status",
      error: error.response?.data || error.message,
    });
  }
});

// optional: lightweight route to proxy offers (useful for building frontend UI)
app.get("/api/v1/offers", async (req, res) => {
  try {
    const base = (process.env.SWIFT_BASE_URL || "https://swiftdata-link.com").replace(/\/$/, "");
    const swiftUrl = `${base}/api/v1/offers`;
    const response = await axios.get(swiftUrl, {
      headers: { "x-api-key": process.env.SWIFT_API_KEY },
      timeout: 10000,
    });
    return res.json(response.data);
  } catch (err) {
    console.error("Error fetching offers:", err.message || err);
    return res.status(500).json({ success: false, message: "Failed to fetch offers" });
  }
});

// Frontend fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));