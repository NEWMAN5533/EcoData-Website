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
app.use(express.static(path.join(__dirname, "frontend")));

// ✅ POST route to handle data bundle purchase
app.post("/api/buy-data", async (req, res) => {
  const { network, recipient, package: pkg, size, paymentReference } = req.body;

  console.log("📦 Bundle Purchase Received:", req.body);

  // ⿡ Validate input
  if (!network || !recipient || !pkg || !paymentReference) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  try {
    // ⿢ Verify Paystack Payment
    const verify = await axios.get(
      `https://api.paystack.co/transaction/verify/${paymentReference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (!verify.data.status || verify.data.data.status !== "success") {
      return res.status(400).json({
        success: false,
        message: "Payment not verified by Paystack",
      });
    }

    console.log("✅ Paystack verified:", verify.data.data.reference);

    // ⿣ Create SwiftData order payload
    const orderData = {
      type: "single",
      volume: parseInt(size),
      phone: recipient,
      offerSlug: pkg, // ✅ this is your offerSlug (from frontend)
      webhookUrl: "https://swiftdata-link.com/api/webhooks/orders",
    };

    // ⿤ Send order to SwiftData
    const swiftUrl = `${process.env.SWIFT_BASE_URL}/order/${network}`;
    console.log("📡 Sending to SwiftData:", swiftUrl);

    const swiftRes = await axios.post(swiftUrl, orderData, {
      headers: {
        "x-api-key": process.env.SWIFT_API_KEY,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ SwiftData Response:", swiftRes.data);

    // ⿥ Return success response
    if (swiftRes.data.success) {
      return res.json({
        success: true,
        message: "✅ Bundle order placed successfully!",
        order: swiftRes.data,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "SwiftData request failed",
        details: swiftRes.data,
      });
    }
  } catch (error) {
    // ⿦ Catch and handle errors safely
    console.error("⚠ SwiftData Error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to process data order",
      error: error.response?.data || error.message,
    });
  }
});

// ✅ Serve frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);
