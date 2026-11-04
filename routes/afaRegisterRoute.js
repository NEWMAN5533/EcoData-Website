import express from "express";
import axios from "axios";

const afaRegisterRouter = (verifyPaystack) => {
  const router = express.Router();

  // =========================
  // SWIFTDATA V2 CONFIGURATION
  // =========================
  const SWIFT_BASE_URL =
    "https://api.swiftdata-link.com/v2";

  const ECODATA_AFA_PRICE = 20;

  router.post("/register", async (req, res) => {
    console.log("========== AFA REGISTRATION REQUEST ==========");

    try {
      const {
        name,
        phone,
        phoneNumber, // Backward compatibility with the old frontend
        idNumber,
        occupation,
        location,
        region,
        dateOfBirth,
        paymentReference
      } = req.body ?? {};

      // =========================
      // NORMALIZE INPUT
      // =========================
      // The v2 provider field is "phone".
      // Accept "phoneNumber" temporarily from the old frontend.

      const registrationData = {
        name: String(name ?? "").trim(),
        phone: String(phone ?? phoneNumber ?? "").trim(),
        idNumber: String(idNumber ?? "").trim().toUpperCase(),
        location: String(location ?? "").trim(),
        region: String(region ?? "").trim(),
        dateOfBirth: String(dateOfBirth ?? "").trim()
      };

      const cleanOccupation =
        String(occupation ?? "").trim();

      const cleanPaymentReference =
        String(paymentReference ?? "").trim();

      // =========================
      // REQUIRED FIELD VALIDATION
      // =========================

      const missingFields = [];

      for (const field of [
        "name",
        "phone",
        "idNumber",
        "location",
        "region",
        "dateOfBirth"
      ]) {
        if (!registrationData[field]) {
          missingFields.push(field);
        }
      }

      if (!cleanPaymentReference) {
        missingFields.push("paymentReference");
      }

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Please complete all required fields.",
          missingFields
        });
      }

      // =========================
      // GHANA CARD VALIDATION
      // Example: GHA-202501234-5
      // =========================

      if (!/^GHA-\d{9}-\d$/i.test(registrationData.idNumber)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid Ghana Card number. Expected format: GHA-XXXXXXXXX-X."
        });
      }

      // =========================
      // DATE OF BIRTH VALIDATION
      // =========================

      const dob = registrationData.dateOfBirth;
      const dobMatch =
        /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);

      if (!dobMatch) {
        return res.status(400).json({
          success: false,
          message: "Date of birth must use YYYY-MM-DD format."
        });
      }

      const [, year, month, day] = dobMatch;
      const dobDate = new Date(
        `${dob}T00:00:00.000Z`
      );

      if (
        Number(year) < 1900 ||
        dobDate.toISOString().slice(0, 10) !== dob
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid date of birth."
        });
      }

      // =========================
      // VERIFY PAYSTACK PAYMENT
      // =========================

      console.log(
        "Verifying AFA payment:",
        cleanPaymentReference
      );

      const verification =
        await verifyPaystack(cleanPaymentReference);

      const payment =
        verification?.data?.data;

      if (
        !verification?.data?.status ||
        payment?.status !== "success"
      ) {
        return res.status(400).json({
          success: false,
          message: "Payment verification failed."
        });
      }

      // =========================
      // VERIFY PAYMENT AMOUNT
      // Paystack amount is in pesewas.
      // EcoData registration price: GH₵20.
      // =========================

      const paidAmount = Number(payment.amount);
      const expectedAmount =
        ECODATA_AFA_PRICE * 100;

      if (
        !Number.isSafeInteger(paidAmount) ||
        paidAmount !== expectedAmount
      ) {
        console.error(
          "Invalid AFA payment amount:",
          paidAmount
        );

        return res.status(400).json({
          success: false,
          message: "Invalid AFA payment amount."
        });
      }

      // =========================
      // CHECK API KEY
      // =========================

      const apiKey = process.env.SWIFT_API_KEY;

      if (!apiKey) {
        console.error("SwiftData API key is not configured.");

        return res.status(500).json({
          success: false,
          message:
            "AFA registration service is temporarily unavailable."
        });
      }

      // =========================
      // SWIFTDATA V2 REQUEST
      // Do not send a price or phoneNumber.
      // Occupation is optional.
      // =========================

      const payload = {
        name: registrationData.name,
        phone: registrationData.phone,
        idNumber: registrationData.idNumber,
        location: registrationData.location,
        region: registrationData.region,
        dateOfBirth: registrationData.dateOfBirth
      };

      if (cleanOccupation) {
        payload.occupation = cleanOccupation;
      }

      const swiftUrl = `${SWIFT_BASE_URL}/afa`;

      console.log(
        "Submitting AFA registration to SwiftData v2."
      );

      const response = await axios.post(
        swiftUrl,
        payload,
        {
          headers: {
            "x-api-key": apiKey,
            "Content-Type": "application/json"
          },
          timeout: 20000
        }
      );

      console.log(
        "SwiftData AFA HTTP status:",
        response.status
      );

      // =========================
      // PARSE V2 RESPONSE
      // Expected envelope:
      // { success: true, data: { publicId, ... } }
      // =========================

      const body = response.data;
      const data = body?.data;

      if (
        response.status < 200 ||
        response.status >= 300 ||
        body?.success !== true ||
        !data?.publicId
      ) {
        console.error(
          "Unexpected SwiftData AFA response:",
          {
            httpStatus: response.status,
            success: body?.success,
            hasPublicId: Boolean(data?.publicId)
          }
        );

        return res.status(502).json({
          success: false,
          message:
            "SwiftData did not return a valid registration confirmation."
        });
      }

      // =========================
      // SUCCESS
      // Preserve the existing frontend
      // response shape.
      // =========================

      const registration = {
        ...data,
        ecoDataPrice: ECODATA_AFA_PRICE,
        paymentReference:
          payment.reference || cleanPaymentReference
      };

      console.log(
        "AFA registration submitted:",
        data.publicId
      );

      return res.status(201).json({
        success: true,
        registration,
        authMethod: "api-key"
      });

    } catch (error) {
      console.error(
        "========== AFA REGISTRATION ERROR =========="
      );

      if (error.response) {
        const providerBody = error.response.data;

        const providerError =
          providerBody?.error;

        console.error("SwiftData HTTP status:", error.response.status);
        console.error("SwiftData error code:", providerError?.code);
        console.error("SwiftData error message:",
          providerError?.message ||
          providerBody?.message ||
          "Unknown provider error"
        );

        // Do not expose internal provider details to the browser.
        return res.status(502).json({
          success: false,
          message:
            "AFA registration could not be completed. Please contact support if payment was deducted.",
          providerStatus: error.response.status,
          providerCode: providerError?.code || null
        });
      }

      console.error("Request error:", error.message);

      // A timeout may occur after SwiftData accepted the request.
      // Do not blindly submit another registration.
      if (
        error.code === "ECONNABORTED" ||
        error.code === "ETIMEDOUT"
      ) {
        return res.status(504).json({
          success: false,
          pendingReconciliation: true,
          message:
            "The registration response timed out. Its status must be checked before another submission."
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to complete AFA registration. Please contact support if payment was deducted."
      });
    }
  });

  return router;
};

export default afaRegisterRouter;