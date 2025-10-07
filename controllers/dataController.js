import axios from "axios";

export const buyDataBundle = async (req, res) => {
  try {
    const { network, recipient, size, paymentReference } = req.body;

    // ✅ 1. Validate required fields
    if (!network || !recipient || !size || !paymentReference) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // ✅ 2. Verify Paystack Payment
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
        message: "Payment not verified",
      });
    }

    console.log("✅ Payment verified for:", recipient);

    // ✅ 3. Build SwiftData Payload
    const orderData = {
      type: "single",
      volume: parseInt(size),
      phone: recipient,
      offerSlug: `${network}_data_bundle`, // matches SwiftData docs
      webhookUrl: "https://swiftdata-link.com/api/webhooks/orders",
    };

    // ✅ 4. Send Request to SwiftData API
    const swiftRes = await axios.post(
      `${process.env.SWIFT_BASE_URL}/v1/order/${network}`,
      orderData,
      {
        headers: {
          "x-api-key": process.env.SWIFT_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📦 SwiftData Response:", swiftRes.data);

    // ✅ 5. Handle SwiftData Response
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
    console.error("⚠ SwiftData Error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to process data order",
      error: error.response?.data || error.message,
});
}
};