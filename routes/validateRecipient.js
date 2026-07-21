import express from 'express';
import axios from 'axios';


const validateRecipientRoute = express.Router();

validateRecipientRoute.post("/", async (req, res) => {
    console.log("Received body:", req.body);

  try {

    const { phone, offerSlug } = req.body;

    if (!phone || !offerSlug) {
      return res.status(400).json({
        success: false,
        message: "Phone number and offerSlug are required."
      });
    }
   console.log("Sending to validation to swift:", {
    phone,
    offerSlug
   }
   );

    const response = await fetch("https://swiftdata-link.com/api/v1/orders/validate-recipient",
      {
        method: 'POST',
        headers: {
          "content-Type": "application/json",
          "x-api-key": process.env.SWIFT_API_KEY
        },
        body: JSON.stringify({
          phone,
          network: "MTN",
          offerSlug,
          skipCache: true
        })
      }
    );

    const data = await response.json();
    console.log("Swift validation response", data);

    res.json(data);
  } catch (error) {
    console.error("Recipient validation error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to validate recipient."
    });
  }
});

export default validateRecipientRoute;