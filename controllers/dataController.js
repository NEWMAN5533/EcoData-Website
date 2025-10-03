import axios from "axios";

/**
 * ✅ Buy data bundle (Paystack + Swift with full error logging)
 */
export const buyDataBundle = async (req, res) => {
  try {
    const { network, recipient, packageName, size, paymentReference } = req.body;
    const PAYSTACK_KEY = req.app.locals.paystackKey;

    console.log("📩 Incoming request:", { network, recipient, packageName, size, paymentReference });

    // 🔹 Step 1: Verify Paystack payment
    console.log("⏳ Verifying payment with Paystack...");
    let verify;
    try {
      verify = await axios.get(
        `https://api.paystack.co/transaction/verify/${paymentReference}`,
        { headers: { Authorization: `Bearer ${PAYSTACK_KEY}` } }
      );
      console.log(`✅ Paystack Response [${verify.status}]:`, verify.data);
    } catch (err) {
      console.error("❌ Paystack Error:", err.response?.data || err.message);
      return res.status(500).json({
        success: false,
        message: "Failed to verify payment with Paystack",
        details: err.response?.data || err.message,
      });
    }

    if (verify.data.status !== true || verify.data.data.status !== "success") {
      console.warn("⚠️ Payment not successful:", verify.data);
      return res.status(400).json({ success: false, message: "Payment not verified" });
    }

    // 🔹 Step 2: Call Swift API
    console.log("⏳ Calling Swift API...");
    try {
      const swiftResponse = await axios.post(
        `https://swiftdata-link.com/api/purchase/${network}`, // ✅ correct endpoint
        {
          recipient,             // 📲 phone number
          package: packageName,  // 🎁 EXACT name (case-sensitive)
          size                   // 🔢 GB number
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.SWIFT_API_KEY}`,
            "Content-Type": "application/json"
          },
        }
      );

      console.log(`✅ Swift Response [${swiftResponse.status}]:`, swiftResponse.data);
      res.json({ success: true, data: swiftResponse.data });
    } catch (err) {
      console.error("❌ Swift API Error:");
      console.error("👉 Status:", err.response?.status || "NO STATUS");
      console.error("👉 Headers:", err.response?.headers || {});
      console.error("👉 Data:", err.response?.data || {});
      console.error("👉 Message:", err.message);

      res.status(err.response?.status || 500).json({
        success: false,
        message: "Failed to process request with Swift",
        details: err.response?.data || err.message,
      });
    }
  } catch (error) {
    console.error("❌ Unexpected Error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
