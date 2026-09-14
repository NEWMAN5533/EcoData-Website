import express from "express";
import axios from "axios";

const afaRegisterRouter = (verifyPaystack) => {

  const router = express.Router();

  router.post("/register", async (req, res) => {

    console.log("========== AFA REGISTRATION REQUEST ==========");

    try {

      const {
        name,
        phoneNumber,
        idNumber,
        occupation,
        location,
        region,
        dateOfBirth,
        paymentReference
      } = req.body;


      // =========================
      // VALIDATION
      // =========================

      if (
        !name ||
        !phoneNumber ||
        !idNumber ||
        !occupation ||
        !location ||
        !region ||
        !dateOfBirth ||
        !paymentReference
      ) {
        return res.status(400).json({
          success: false,
          message:
            "All AFA registration fields and payment reference are required"
        });
      }


      // =========================
      // VERIFY PAYSTACK
      // =========================

      console.log(
        "Verifying AFA payment:",
        paymentReference
      );

      const verification =
        await verifyPaystack(paymentReference);

      const payment =
        verification.data?.data;


      if (
        !verification.data?.status ||
        payment?.status !== "success"
      ) {

        return res.status(400).json({
          success: false,
          message: "Payment verification failed."
        });

      }


      // =========================
      // VERIFY AMOUNT
      // =========================

      const ECODATA_AFA_PRICE = 20;

      const paidAmount =
        Number(payment.amount || 0);

      const expectedAmount =
        ECODATA_AFA_PRICE * 100;


      if (paidAmount !== expectedAmount) {

        console.log(
          "Invalid AFA payment amount:",
          paidAmount
        );

        return res.status(400).json({
          success: false,
          message: "Invalid AFA payment amount."
        });

      }


      // =========================
      // CLEAN DATA
      // =========================

      const registrationData = {

        name: String(name).trim(),

        phoneNumber:
          String(phoneNumber).trim(),

        idNumber:
          String(idNumber).trim(),

        occupation:
          String(occupation).trim(),

        location:
          String(location).trim(),

        region:
          String(region).trim(),

        dateOfBirth:
          String(dateOfBirth).trim(),

        webhookUrl:
          "https://swiftdata-link.com/api/webhooks/afa"
      };


      // =========================
      // SWIFT BASE
      // =========================

      const base = (
        process.env.SWIFT_BASE_URL ||
        "https://swiftdata-link.com/api/v1"
      ).replace(/\/$/, "");


      // =========================
      // SWIFT AFA ENDPOINT
      // =========================

      const swiftUrl =
        `${base}/afa/register`;


      console.log(
        "Sending AFA registration to:",
        swiftUrl
      );


      // =========================
      // SEND TO SWIFT
      // =========================

      const response = await axios.post(
        swiftUrl,
        registrationData,
        {
          headers: {
            "x-api-key":
              process.env.SWIFT_API_KEY,

            "Content-Type":
              "application/json"
          },

          timeout: 15000
        }
      );


      console.log(
        "Swift AFA response:",
        response.data
      );


      // =========================
      // SUCCESS
      // =========================

      if (response.data?.success) {

        const registration = {

          ...response.data.registration,

          ecoDataPrice:
            ECODATA_AFA_PRICE,

          paymentReference:
            payment.reference ||
            paymentReference
        };


        return res.json({

          success: true,

          registration,

          authMethod:
            response.data.authMethod ||
            "api-key"
        });

      }


      // =========================
      // SWIFT FAILURE
      // =========================

      return res.status(400).json({

        success: false,

        message:
          response.data?.message ||
          "AFA registration failed",

        details:
          response.data
      });


    } catch (error) {

      console.error(
        "======== AFA REGISTRATION ERROR =========="
      );

      console.error(
        error.response?.data ||
        error.message
      );


      if (error.response) {

        return res.status(
          error.response.status || 500
        ).json({

          success: false,

          message:
            error.response.data?.message ||
            "AFA registration request failed",

          details:
            error.response.data || null
        });

      }


      return res.status(500).json({

        success: false,

        message:
          "Unable to complete AFA registration",

        error:
          error.message
      });

    }

  });

  return router;
};

export default afaRegisterRouter;