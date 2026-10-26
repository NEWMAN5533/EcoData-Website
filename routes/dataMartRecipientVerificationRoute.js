import express from "express";
import axios from "axios";
import { getActiveVendor } from "../services/vendorManager.js";

const dataMartRecipientVerificationRoute = express.Router();

const DATAMART_API_URL =
  "https://api.datamartgh.shop/api/developer";

const datamart = axios.create({
  baseURL: DATAMART_API_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

function normalizeGhanaPhoneNumber(value) {
  let phone = String(value || "").trim();

  if (phone.startsWith("+233")) {
    phone = "0" + phone.slice(4);
  } else if (phone.startsWith("233")) {
    phone = "0" + phone.slice(3);
  }

  return /^0\d{9}$/.test(phone) ? phone : null;
}

dataMartRecipientVerificationRoute.post("/", async (req, res) => {
  try {
    const { network, recipient, size } = req.body ?? {};

    // 1. Validate the request.
    if (!network || !recipient || size == null) {
      return res.status(400).json({
        success: false,
        canProceed: false,
        message:
          "Network, recipient number, and bundle size are required.",
      });
    }

    const normalizedNetwork = String(network)
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, "");

    const phone = normalizeGhanaPhoneNumber(recipient);
    const capacity = Number(size);

    if (!phone) {
      return res.status(400).json({
        success: false,
        canProceed: false,
        code: "INVALID_RECIPIENT",
        message: "Enter a valid Ghanaian phone number.",
      });
    }

    if (!Number.isFinite(capacity) || capacity <= 0) {
      return res.status(400).json({
        success: false,
        canProceed: false,
        message: "Invalid bundle size.",
      });
    }

    // 2. Preserve the existing SwiftData purchase flow.
    const activeVendor = String(await getActiveVendor())
      .trim()
      .toLowerCase();

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
        message:
          "The active data provider is unavailable. Please try again.",
      });
    }

    // 3. DataMart's documented verification is for MTN only.
    if (!["MTN", "YELLO"].includes(normalizedNetwork)) {
      return res.status(422).json({
        success: false,
        canProceed: false,
        verificationRequired: true,
        code: "NETWORK_VERIFICATION_UNAVAILABLE",
        message:
          "Recipient verification through DataMart is currently available for MTN only.",
      });
    }

    // 4. Call DataMart directly. No database cache.
    const apiKey = process.env.DATAMART_API_KEY;

    if (!apiKey) {
      console.error("DATAMART_API_KEY is not configured.");

      return res.status(500).json({
        success: false,
        canProceed: false,
        code: "VERIFICATION_CONFIG_ERROR",
        message:
          "Recipient verification is temporarily unavailable.",
      });
    }

    const response = await datamart.post(
      "/verify-number",
      {
        phoneNumber: phone,
      },
      {
        headers: {
          "X-API-Key": apiKey,
          "X-API-Secret": process.env.DATAMART_API_SECRET,
        },
      }
    );

    const result = response.data?.data;

    if (
      response.data?.status !== "success" ||
      !result ||
      typeof result.servable !== "boolean"
    ) {
    

      console.error("Recipient verification failed:", {
  message: error.message,
  providerStatus: providerStatus ?? null,
  providerCode: providerCode ?? null,
  providerMessage: providerBody?.message ?? null,
});

      return res.status(502).json({
        success: false,
        canProceed: false,
        code: "INVALID_VERIFICATION_RESPONSE",
        message:
          "We could not confirm this recipient's eligibility. Please try again.",
      });
    }

    // 5. Active line: any supported bundle size may proceed.
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

    // 6. New/frozen line: only the 1GB activation bundle may proceed.
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
            "Select the 1GB activation bundle and allow up to 72 hours for activation.",
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

    // 7. Do not approve an unknown recommendation.
    return res.status(422).json({
      success: false,
      canProceed: false,
      verificationRequired: true,
      code: "RECIPIENT_NOT_VERIFIED",
      verification: result,
      message:
        result.message ||
        "This recipient could not be approved for the selected bundle.",
    });
  } catch (error) {
    const providerStatus = error.response?.status;
    const providerBody = error.response?.data;
    const providerCode = providerBody?.code;

    console.error("Recipient verification failed:", {
      message: error.message,
      providerStatus: providerStatus ?? null,
      providerCode: providerCode ?? null,
    });

    if (
      providerStatus === 429 ||
      providerCode === "RATE_LIMIT_EXCEEDED"
    ) {
      return res.status(429).json({
        success: false,
        canProceed: false,
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: providerBody?.retryAfter,
        message:
          "Too many verification requests. Please wait before trying again.",
      });
    }

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

    return res.status(502).json({
      success: false,
      canProceed: false,
      code: "VERIFICATION_FAILED",
      message:
        "We could not verify this recipient. Please try again.",
    });
  }
});

export default dataMartRecipientVerificationRoute;