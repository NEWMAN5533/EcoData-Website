import express from 'express';
import axios from 'axios';

const restrictionsRoute = express.Router();

restrictionsRoute.get("/", async (req, res) => {
  try {
    const response = await axios.get(

      "https://swiftdata-link.com/api/v1/restrictions",
      {
        headers: {
          "x-api-key": process.env.SWIFT_API_KEY

        }
      }
    );

    res.json(response.data);

  } catch(error) {
    console.log("Restrictions error:", error.response?.data || error.message
    );

    res.status(500).json({
      success: false,
      message: "Unable to fetch restrictions"
    });
  }
});
export default restrictionsRoute;