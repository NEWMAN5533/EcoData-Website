import express from "express";
import axios from "axios";

const afaStatusRouter = express.Router();

afaStatusRouter.get("/:identifier", async (req, res) => {

  console.log("========== AFA STATUS CHECK ==========");

  try {

    const identifier =
      String(req.params.identifier || "").trim();

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Missing AFA registration identifier"
      });
    }


    // =========================
    // SWIFT BASE URL
    // =========================

    const base = (
      process.env.SWIFT_BASE_URL ||
      "https://swiftdata-link.com/api/v1"
    ).replace(/\/$/, "");


    // =========================
    // SWIFT STATUS ENDPOINT
    // =========================

    const swiftUrl =
      `${base}/afa/status/${encodeURIComponent(identifier)}`;


    console.log(
      "Checking AFA status:",
      swiftUrl
    );


    // =========================
    // REQUEST SWIFT
    // =========================

    const response = await axios.get(
      swiftUrl,
      {
        headers: {
          "x-api-key":
            process.env.SWIFT_API_KEY,

          "Content-Type":
            "application/json"
        },

        timeout: 10000
      }
    );


    console.log(
      "Swift AFA status response:",
      response.data
    );


    // =========================
    // SUCCESS
    // =========================

    if (response.data?.success) {

      return res.json({

        success: true,

        registration:
          response.data.registration,

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
        "Unable to fetch AFA registration status",

      details:
        response.data

    });


  } catch (error) {

    console.error(
      "======== AFA STATUS ERROR =========="
    );

    console.error(
      "Swift error:",
      error.response?.data ||
      error.message
    );


    // =========================
    // SWIFT API ERROR
    // =========================

    if (error.response) {

      return res.status(
        error.response.status || 500
      ).json({

        success: false,

        message:
          error.response.data?.message ||
          "AFA status request failed",

        details:
          error.response.data ||
          null

      });

    }


    // =========================
    // NETWORK ERROR
    // =========================

    return res.status(500).json({

      success: false,

      message:
        "Unable to connect to AFA status service",

      error:
        error.message

    });

  }

});

export default afaStatusRouter;