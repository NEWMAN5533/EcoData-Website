import express from 'express';
import axios from 'axios';

const getVoucherRouter = express.Router();

getVoucherRouter.get("/", async (req, res) => {
  try{
    const response = await axios.get(`${process.env.SWIFT_BASE_URL}/vouchers`,
      {
        headers: {
          "x-api":
          process.env.SWIFT_API_KEY
        }
      }
    );
    res.status(200).json(response.data);
  } catch(error) {
    console.error("Voucher fetch error:",
    error.response?.data || error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch vouchers"
    });
  }
});

export default getVoucherRouter;