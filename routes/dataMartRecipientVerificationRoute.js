import express from "express";
import sql from "../backend/db.js";
import { getActiveVendor } from "../services/vendorManager.js";
import { verifyDataMartRecipient } from "../services/dataMartService.js";

const dataMartRecipientVerificationRoute = express.Router();

dataMartRecipientVerificationRoute.post("/", async (req, res) => {
  try {
    const { network, recipient, size } = req.body;

    if (!network || !recipient || size == null) {
      return res.status(400).json({
        success: false,
        canProceed: false,
        message: "Network, recipient number, and bundle size are required.",
      });
    }

    const normalizedNetwork = String(network)
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, "");

    const phone = String(recipient).trim();
    const capacity = Number(size);

    if (!Number.isFinite(capacity) || capacity <= 0) {
      return res.status(400).json({
        success: false,
        canProceed: false,
        message: "Invalid bundle size.",
      });
    }

    const activeVendor = await getActiveVendor();

    // SwiftData has no verification endpoint configured here.
    // Preserve its existing purchase flow.
    if (activeVendor === "swiftdata") {
      return res.json({
        success: true,
        canProceed: true,
        verificationRequired: false,
        provider: "swiftdata",
        message: "Continue with the existing purchase flow.",
      });
    }

    // DataMart's supplied verification documentation covers MTN only.
    const isMtn = ["MTN", "YELLO"].includes(normalizedNetwork);

    if (!isMtn) {
      return res.status(422).json({
        success: false,
        canProceed: false,
        verificationRequired: true,
        code: "NETWORK_VERIFICATION_UNAVAILABLE",
        message:
          "DataMart recipient verification is currently documented for MTN only. Payment has not been approved to proceed for this network.",
      });
    }

    // Reuse a recent verification result for this recipient.
    const cachedRows = await sql`
      SELECT servable, recommendation, provider_response
      FROM datamart_recipient_verifications
      WHERE phone_number = ${phone}
        AND network = 'MTN'
        AND expires_at > NOW()
      ORDER BY checked_at DESC
      LIMIT 1
    `;

    let result;

    if (cachedRows.length > 0) {
      const cached = cachedRows[0];

      result = {
        servable: cached.servable,
        recommendation: cached.recommendation,
        message: cached.provider_response?.data?.message,
        cached: true,
      };
    } else {
      result = await verifyDataMartRecipient(phone);

      await sql`
        INSERT INTO datamart_recipient_verifications (
          phone_number,
          network,
          servable,
          recommendation,
          provider_response,
          checked_at,
          expires_at
        )
        VALUES (
          ${phone},
          'MTN',
          ${result.servable},
          ${result.recommendation ?? null},
          ${JSON.stringify(result)}::jsonb,
          NOW(),
          NOW() + INTERVAL '60 seconds'
        )
      `;
    }

    if (result.servable === true) {
      return res.json({
        success: true,
        canProceed: true,
        verificationRequired: true,
        provider: "datamart",
        verification: result,
        message: result.message || "Recipient verified. You may continue to payment.",
      });
    }

    // DataMart recommends a 1GB activation bundle for new/frozen lines.
    if (
      result.recommendation === "activate_first" &&
      capacity === 1
    ) {
      return res.json({
        success: true,
        canProceed: true,
        verificationRequired: true,
        provider: "datamart",
        verification: result,
        message:
          "This is a new or frozen MTN number. The 1GB activation bundle may be purchased first; allow up to 72 hours for activation.",
      });
    }

    return res.status(422).json({
      success: false,
      canProceed: false,
      verificationRequired: true,
      code: "RECIPIENT_ACTIVATION_REQUIRED",
      verification: result,
      message:
        result.message ||
        "This MTN number needs activation. Select a 1GB activation bundle first.",
    });
  } catch (error) {
    const status = error.providerHttpStatus;

    console.error("Recipient pre-verification failed:", {
      message: error.providerMessage || error.message,
      providerCode: error.providerCode || null,
      status: status || null,
    });

    if (status === 429) {
      return res.status(429).json({
        success: false,
        canProceed: false,
        code: "RATE_LIMIT_EXCEEDED",
        message:
          "Too many verification requests. Please wait before trying again.",
      });
    }

    if (status === 503) {
      return res.status(503).json({
        success: false,
        canProceed: false,
        code: "VERIFY_UNAVAILABLE",
        message:
          "Recipient verification is temporarily unavailable. Please try again shortly.",
      });
    }

    return res.status(500).json({
      success: false,
      canProceed: false,
      message: "We could not verify this recipient. Please try again.",
    });
  }
});

export default dataMartRecipientVerificationRoute;