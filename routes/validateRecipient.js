import express from "express";

const validateRecipientRoute = express.Router();

validateRecipientRoute.post("/", async (req, res) => {
  console.log("Received body:", req.body);

  try {
    const { phone, phones, offerSlug, offerId, network } = req.body;

    // Accept either the existing frontend's "phone"
    // or the v2 API's "phones" array.
    const recipients = Array.isArray(phones) ? phones : phone ? [phone] : [];

    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one phone number is required.",
      });
    }

    if (recipients.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "A maximum of 2000 phone numbers can be checked.",
      });
    }

    if (!offerSlug && !offerId) {
      return res.status(400).json({
        success: false,
        message: "A valid SwiftData offerSlug or offerId is required.",
      });
    }

    const apiKey = process.env.SWIFT_API_KEY;

    if (!apiKey) {
      console.error("SWIFT_API_KEY is not configured.");

      return res.status(500).json({
        success: false,
        message: "Recipient verification is not configured.",
      });
    }

    const payload = {
      phones: recipients,
      ...(offerSlug ? { offerSlug } : {}),
      ...(offerId ? { offerId } : {}),
      ...(network ? { network } : {}),
    };

    console.log("Sending v2 beneficiary check:", payload);

    const response = await fetch(
      "https://api.swiftdata-link.com/v2/beneficiary-check",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000),
      },
    );

    const data = await response.json();

    console.log("SwiftData v2 beneficiary response:", data);

    // Preserve the provider's response so the frontend
    // can read its existing verification result.
    return res.status(response.status).json(data);
  } catch (error) {
    console.error("SwiftData recipient verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to validate recipient.",
    });
  }
});

export default validateRecipientRoute;
