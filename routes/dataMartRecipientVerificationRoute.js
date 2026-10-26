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

function allowPurchaseWithoutVerification(res, reason) {
  console.warn(
    "DataMart recipient verification unavailable; allowing checkout to continue:",
    reason
  );

  return res.status(200).json({
    success: true,
    canProceed: true,
    verificationRequired: false,
    verificationSkipped: true,
    provider: "datamart",
    code: "VERIFY_UNAVAILABLE",
    message:
      "Recipient verification is temporarily unavailable. You may continue to payment.",
  });
}

dataMartRecipientVerificationRoute.post("/", async (req, res) => {
  try {
    const { network, recipient, size } = req.body ?? {};

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

    // DataMart verification is documented for MTN only.
    // Other networks skip this optional pre-check.
    if (!["MTN", "YELLO"].includes(normalizedNetwork)) {
      return allowPurchaseWithoutVerification(
        res,
        `Verification not supported for network ${normalizedNetwork}`
      );
    }

    const apiKey = process.env.DATAMART_API_KEY;
    const apiSecret = process.env.DATAMART_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error(
        "DataMart verification credentials are not fully configured."
      );

      return allowPurchaseWithoutVerification(
        res,
        "Verification credentials are missing"
      );
    }

    let response;

    try {
      response = await datamart.post(
        "/verify-number",
        {
          phoneNumber: phone,
        },
        {
          headers: {
            "X-API-Key": apiKey,
            "X-API-Secret": apiSecret,
          },
        }
      );
    } catch (error) {
      const providerStatus = error.response?.status;
      const providerBody = error.response?.data;
      const providerCode = providerBody?.code;

      console.error("DataMart recipient verification request failed:", {
        message: error.message,
        providerStatus: providerStatus ?? null,
        providerCode: providerCode ?? null,
      });

      // These failures indicate that the verification service
      // could not reliably give us a result.
      if (
        !error.response ||
        providerStatus >= 500 ||
        providerStatus === 408 ||
        providerStatus === 429 ||
        providerCode === "VERIFY_UNAVAILABLE" ||
        providerCode === "RATE_LIMIT_EXCEEDED"
      ) {
        return allowPurchaseWithoutVerification(
          res,
          providerCode || providerStatus || error.code || error.message
        );
      }

      // Unexpected client/auth/config errors should not be
      // silently treated as a recipient verification result.
      return res.status(502).json({
        success: false,
        canProceed: false,
        code: "VERIFICATION_FAILED",
        message:
          "We could not verify this recipient. Please try again.",
      });
    }

    const result = response.data?.data;

    // A malformed response is a verification outage, not proof
    // that the recipient is invalid.
    if (
      response.data?.status !== "success" ||
      !result ||
      typeof result.servable !== "boolean"
    ) {
      return allowPurchaseWithoutVerification(
        res,
        "DataMart returned an incomplete verification response"
      );
    }

    // Verified, eligible line.
    if (
      result.servable === true &&
      result.recommendation === "sell_any"
    ) {
      return res.json({
        success: true,
        canProceed: true,
        verificationRequired: true,
        verificationSkipped: false,
        provider: "datamart",
        verification: result,
        message:
          result.message ||
          "Recipient verified. You may continue to payment.",
      });
    }

    // Activation-required line: only 1GB can proceed.
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
          verificationSkipped: false,
          provider: "datamart",
          verification: result,
          message:
            result.message ||
            "Select the 1GB activation bundle and allow time for activation.",
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

    // A definite rejection must still block the purchase.
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
    console.error("Recipient verification route error:", {
      message: error.message,
    });

    return allowPurchaseWithoutVerification(
      res,
      "Unexpected error in the verification route"
    );
  }
});

export default dataMartRecipientVerificationRoute;