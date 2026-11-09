import express from "express";

const validateRecipientRoute = express.Router();

validateRecipientRoute.post("/", async (req, res) => {
  console.log("Received body:", req.body);

  try {
    const { phone, phones, offerSlug, offerId, network } = req.body;

    // Accept either "phone" or "phones".
    const recipients = Array.isArray(phones)
      ? phones
      : phone
        ? [phone]
        : [];

    if (
      recipients.length === 0 ||
      recipients.some(
        (item) => typeof item !== "string" || !item.trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        eligible: false,
        message: "Valid recipient phone number(s) are required.",
      });
    }

    if (recipients.length > 2000) {
      return res.status(400).json({
        success: false,
        eligible: false,
        message: "A maximum of 2000 phone numbers can be checked.",
      });
    }

    if (!offerSlug && !offerId) {
      return res.status(400).json({
        success: false,
        eligible: false,
        message: "A valid SwiftData offerSlug or offerId is required.",
      });
    }

    const apiKey = process.env.SWIFT_API_KEY;

    if (!apiKey) {
      console.error("SWIFT_API_KEY is not configured.");

      return res.status(500).json({
        success: false,
        eligible: false,
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
      }
    );

    const responseText = await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error(
        "SwiftData returned a non-JSON response:",
        response.status,
        responseText.slice(0, 500)
      );

      return res.status(502).json({
        success: false,
        eligible: false,
        message: "Invalid response from recipient verification service.",
      });
    }

    console.log(
      "SwiftData v2 beneficiary response:",
      JSON.stringify(data, null, 2)
    );

    if (!response.ok || data?.success !== true) {
      return res.status(response.status >= 400 ? response.status : 502).json({
        success: false,
        eligible: false,
        message:
          data?.error?.message ||
          data?.message ||
          "SwiftData recipient verification failed.",
        error: data?.error,
      });
    }

    // Extract the first recipient result.
    const results = data?.data?.results;
    const recipientResult = Array.isArray(results)
      ? results[0]
      : null;

    // Only approve if the provider explicitly confirms eligibility.
    const eligible = recipientResult?.eligible === true;

    return res.status(200).json({
      success: true,
      eligible,
      message:
        recipientResult?.message ||
        (eligible
          ? "Recipient is eligible."
          : "Recipient is not confirmed eligible."),
      result: recipientResult,
      data: data.data,
    });
  } catch (error) {
    console.error("SwiftData recipient verification error:", error);

    return res.status(502).json({
      success: false,
      eligible: false,
      message:
        error.name === "TimeoutError" || error.name === "AbortError"
          ? "Recipient verification timed out. Please try again."
          : "Unable to verify recipient right now. Please try again.",
    });
  }
});

export default validateRecipientRoute;