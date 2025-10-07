import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { error } from "console";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({origin: "*"}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend"))); // serve frontend

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// ✅ BUY DATA API
app.post("/api/buy-data", async (req, res) => {
  try {
    const { network, recipient, package: packageName, size, paymentReference } = req.body;

    if (!recipient || !network || !packageName || !size) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    try {
      console.log("Bundle Purchase Received:", req.body);

      res.json({
        success: true,
        message: "✅ Bundle order placed successfully!",
        order: {
          id: Date.now(),
          network,
          recipient,
          package: packageName,
          size,
          paymentReference,
          status: "processing",
        }
      }
      );
    } catch(err){
      console.error("❌ Error processing order:", err);
      return res.status(500).json({ 
        success: false,
        error: "Error processing order",
        message: err.message
      });
    }

    // Verify Paystack payment
    const verify = await axios.get(
      `https://api.paystack.co/transaction/verify/${paymentReference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    if (verify.data.status !== true || verify.data.data.status !== "success") {
      return res.status(400).json({ success: false, message: "Payment not verified" });
    }

    // Send to SwiftData
    const swiftResponse = await axios.post(
      `${process.env.SWIFT_BASE_URL}/order/${network}`,
      {
        type: "single",
        volume: parseInt(size),
        phone: recipient,
        offerSlug: `${network}_data_bundle`,
        webhookUrl: "https://swiftdata-link.com/api/webhooks/orders",
      },
      {
        headers: {
          "x-api-key": process.env.SWIFT_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    return res.json({ success: true, swift: swiftResponse.data });
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: "Failed to process data bundle",
      details: error.response?.data || error.message,
    });
  }
});

// ✅ Serve index.html for all unknown routes (important for frontend)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});
