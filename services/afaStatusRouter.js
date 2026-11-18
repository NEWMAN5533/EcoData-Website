import express from "express";
import axios from "axios";

const afaStatusRouter = express.Router();

const SWIFT_BASE_URL =
  "https://api.swiftdata-link.com/v2";

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

    const apiKey = process.env.SWIFT_API_KEY;

    if (!apiKey) {
      console.error("SwiftData API key is not configured.");

      return res.status(500).json({
        success: false,
        message: "AFA status service is temporarily unavailable."
      });
    }

    // =========================
    // CANONICAL SWIFTDATA V2
    // GET /afa/:identifier
    // Identifier = data.publicId
    // =========================

    const swiftUrl =
      `${SWIFT_BASE_URL}/afa/${encodeURIComponent(identifier)}`;

    console.log("Checking SwiftData AFA status.");

    const response = await axios.get(swiftUrl, {
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json"
      },
      timeout: 15000
    });

    const body = response.data;
    const registration = body?.data;

    console.log("SwiftData AFA status HTTP:", response.status);

    // =========================
    // VALIDATE V2 SUCCESS
    // =========================

    if (
      response.status >= 200 &&
      response.status < 300 &&
      body?.success === true &&
      registration?.publicId
    ) {
      return res.status(200).json({
        success: true,
        registration,
        authMethod: "api-key"
      });
    }

    console.error("Unexpected SwiftData AFA status response.");

    return res.status(502).json({
      success: false,
      message: "SwiftData returned an invalid AFA status response."
    });

  } catch (error) {
    console.error("========== AFA STATUS ERROR ==========");

    if (error.response) {
      const providerBody = error.response.data;
      const providerError = providerBody?.error;

      console.error("SwiftData HTTP status:", error.response.status);
      console.error("SwiftData error code:", providerError?.code);
      console.error(
        "SwiftData error message:",
        providerError?.message ||
          providerBody?.message ||
          "Unknown provider error"
      );

      // Preserve relevant HTTP status semantics.
      const status = [400, 401, 403, 404, 429].includes(
        error.response.status
      )
        ? error.response.status
        : 502;

      return res.status(status).json({
        success: false,
        message:
          status === 404
            ? "AFA registration was not found."
            : status === 401 || status === 403
              ? "AFA status service authorization failed."
              : status === 429
                ? "AFA status service is busy. Please try again shortly."
                : "Unable to fetch AFA registration status.",
        providerCode: providerError?.code || null
      });
    }

    console.error("AFA status connection error:", error.message);

    const timedOut =
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT";

    return res.status(timedOut ? 504 : 502).json({
      success: false,
      message: timedOut
        ? "AFA status check timed out. Please try again."
        : "Unable to connect to AFA status service."
    });
  }
});

export default afaStatusRouter;