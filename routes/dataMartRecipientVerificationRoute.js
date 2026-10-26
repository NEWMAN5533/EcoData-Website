import express from "express";
import { getActiveVendor } from "../services/vendorManager.js";
import { verifyDataMartRecipient } from "../services/dataMartService.js";

const dataMartRecipientVerificationRoute = express.Router();

dataMartRecipientVerificationRoute.post("/", async (req, res) => {
  try {
    const { network, recipient, size } = req.body ?? {};

    // 1. Validate required fields.
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

    // 2. Check which vendor is active.
    const activeVendor = String(await getActiveVendor())
      .trim()
      .toLowerCase();

    // Preserve the existing SwiftData purchase flow.
    if (activeVendor === "swiftdata") {
      return res.json({
        success: true,
        canProceed: true,
        verificationRequired: false,
        provider: "swiftdata",
        message: "Continue with the existing purchase flow.",
      });
    }

    if (activeVendor !== "datamart") {
      return res.status(503).json({
        success: false,
        canProceed: false,
        code: "VENDOR_UNAVAILABLE",
        message: "The active data provider is unavailable. Please try again.",
      });
    }

    // 3. DataMart's documented verification supports MTN only.
    if (!["MTN", "YELLO"].includes(normalizedNetwork)) {
      return res.status(422).json({
        success: false,
        canProceed: false,
        verificationRequired: true,
        code: "NETWORK_VERIFICATION_UNAVAILABLE",
        message:
          "Recipient verification is currently available for MTN only. Payment cannot proceed through this verification flow for the selected network.",
      });
    }

    // 4. Call DataMart directly. No database cache is needed.
    const result = await verifyDataMartRecipient(phone);

    // 5. The number can receive any bundle size.
    if (
      result.servable === true &&
      result.recommendation === "sell_any"
    ) {
      return res.json({
        success: true,
        canProceed: true,
        verificationRequired: true,
        provider: "datamart",
        verification: result,
        message:
          result.message ||
          "Recipient verified. You may continue to payment.",
      });
    }

    // 6. New/frozen number: allow only the 1GB activation bundle.
    if (
      result.servable === false &&
      result.recommendation === "activate_first"
    ) {
      if (capacity === 1) {
        return res.json({
          success: true,
          canProceed: true,
          verificationRequired: true,
          activationRequired: true,
          provider: "datamart",
          verification: result,
          message:
            result.message ||
            "This number needs activation. Purchase 1GB first and allow up to 72 hours for activation.",
        });
      }

      return res.status(422).json({
        success: false,
        canProceed: false,
        verificationRequired: true,
        activationRequired: true,
        code: "RECIPIENT_ACTIVATION_REQUIRED",
        verification: result,
        message:
          result.message ||
          "This number needs activation. Select a 1GB activation bundle first.",
      });
    }

    // 7. Unexpected or unsupported verification response.
    return res.status(422).json({
      success: false,
      canProceed: false,
      verificationRequired: true,
      code: "RECIPIENT_NOT_VERIFIED",
      verification: result,
      message:
        result.message ||
        "We could not confirm that this number can receive data. Please check the number or try again later.",
    });
  } catch (error) {
    const providerStatus = error.providerHttpStatus;
    const providerCode =
      error.providerResponse?.code ||
      error.providerCode ||
      error.code;

    console.error("Recipient verification failed:", {
      message: error.message,
      providerStatus: providerStatus ?? null,
      providerCode: providerCode ?? null,
      providerResponse: error.providerResponse ?? null,
    });

    // DataMart rate limit: maximum two real checks per minute per API key.
    if (
      providerStatus === 429 ||
      providerCode === "RATE_LIMIT_EXCEEDED"
    ) {
      return res.status(429).json({
        success: false,
        canProceed: false,
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: error.providerResponse?.retryAfter,
        message:
          "Too many verification requests. Please wait before trying again.",
      });
    }

    // DataMart verification temporarily unavailable.
    if (
      providerStatus === 503 ||
      providerCode === "VERIFY_UNAVAILABLE"
    ) {
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
      code: "VERIFICATION_FAILED",
      message: "We could not verify this recipient. Please try again.",
    });
  }
});

export default dataMartRecipientVerificationRoute;