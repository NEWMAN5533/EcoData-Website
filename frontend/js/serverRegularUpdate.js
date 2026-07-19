
// OLD SERVER 2/12/2025//
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

// Helper: common logic for buy-data (POST or GET)
async function handleBuyDataRequest({network, recipient, pkg, size, paymentReference }) {
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

// Frontend fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// ENDS//


// dataMart server










  document.addEventListener("DOMContentLoaded", () => {

 
  let promoWasInactive = true;

  function isPromoTime() {
    const day = new Date().getDay();
    return (day === 4 || day === 5);
  }

  function getPromoEndTime() {
    const now = new Date();
    const day = now.getDay();
    let end = new Date(now);

    if(day === 4 ) {
      end.setDate(now.getDate() + 1);
      end.setHours(23, 59, 59, 999);

    } else if (day === 5) {
      end.setHours(23, 59, 59, 999);
    } else {
      return null;
    }
    return end.getTime();
  }


    // function  even-if(isPromoTime {untargetExpressDiv.style.display = "flex"} if(mode changed to express))
   function handleDeliveryOverride(promoActiveDiv, promoEndedDiv, untargetExpressDiv) {
    if( selectedPackageName === "express") {
      promoActiveDiv.classList.add("hidden");
      promoEndedDiv.style.display = "none";
      untargetExpressDiv.style.display = "flex";
      return true; // tell system to stop further logic
    }
    return false;
   }


  function updateTimer() {
    const bar = document.getElementById("promoBar");
    const badge = document.getElementById("liveBadge");
    const timerEl = document.getElementById("timer");
    const labelEl = document.getElementById("label");

    const promoActiveDiv = document.getElementById("promoActive");
    const promoEndedDiv = document.getElementById("topOpt");
    const untargetExpressDiv = document.getElementById("bottomOpt");
   
   
  

    if(!isPromoTime()) {
      bar.classList.remove("show");
      promoActiveDiv.classList.add("hidden");
      promoEndedDiv.style.display = "flex";
      untargetExpressDiv.style.display = "flex";

      if(handleDeliveryOverride(promoActiveDiv, promoEndedDiv)) {
      return; // Stop everything else
    }

      promoWasInactive = true;
      return;
    }

    // First time appearing anytime
    if(promoWasInactive) {
      setTimeout(() => bar.classList.add("show"), 200 );
      badge.classList.add("show");
      promoWasInactive = false;
    }

    const endTime = getPromoEndTime();
    const now = new Date().getTime();
    const remaining = endTime - now;

    if(remaining <= 0) {
      timerEl.innerHTML = "00:00:00";
      labelEl.innerHTML = "Promo ended. Check back next week";

      promoActiveDiv.classList.add("hidden");
      promoEndedDiv.style.display = "flex";
      untargetExpressDiv.style.display = "flex";
      return;
    } else{
      promoActiveDiv.classList.remove("hidden");
      promoEndedDiv.style.display = "none";
      untargetExpressDiv.style.display = "none";
    }

    let hours = Math.floor(remaining / (1000 * 60 * 60));
    let minutes = Math.floor((remaining %  (1000 * 60 * 60 )) / (1000 * 60));
    let seconds = Math.floor((remaining % (1000 * 60 )) / 1000);

    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    timerEl.innerHTML = `${hours}:${minutes}:${seconds}`;
    labelEl.innerHTML = "Promo Ends In";

    if(remaining < 6 * 60 * 60 * 1000) {
      timerEl.classList.add("warning");
    } else {
      timerEl.classList.remove("warning");
    }
  }

  setInterval(updateTimer, 1000);
  updateTimer();

   });
