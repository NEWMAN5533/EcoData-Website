import express from "express";
import cors from "cors";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

// Fix __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 👉 Serve frontend
app.use(express.static(path.join(__dirname, "frontend")));

// ✅ API Route
app.post("/api/buy-data", async (req, res) => {
  try {
    const { network, recipient, package: packageName, size, paymentReference } = req.body;

    // Input validation
    if (!recipient || !network || !packageName || !size) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    if (typeof size !== "number" || isNaN(size)) {
      return res.status(400).json({ success: false, error: "Size must be a number" });
    }

    // ✅ Call Swift API (correct base URL + headers)
    const swiftResponse = await axios.post(
      `https://swiftdata-link.com/api/purchase/${network}`,
      {
        recipient,
        package: packageName,
        size
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.SWIFT_API_KEY}`, // ✅ Add your key here
          "Content-Type": "application/json"
        }
      }
    );

    return res.json(swiftResponse.data);
  } catch (err) {
    console.error("❌ Swift API Error:", err.response?.data || err.message);
    res.status(500).json({
      success: false,
      error: "Failed to process data bundle",
      details: err.response?.data || err.message
    });
  }
});

// ✅ Start server
app.listen(5000, () => {
  console.log("✅ Server running at http://127.0.0.1:5000");
});
