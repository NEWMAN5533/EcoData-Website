import express from 'express';
import axios from 'axios';

const postVoucherRouter = express.Router();

postVoucherRouter.post("/", async (req, res) =>{
  try{
    const {
      voucherSlug,
      quantity,
      phone,
      email,
      sendViaWhatsApp,
      paymentReference
    } = req.body;


    //================
    // VALIDATION
    //================
    if(
      !voucherSlug ||
      !quantity ||
      !phone ||
      !email
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing require field."
      });
    }

    //======================
    // SUBMIT VOUCHER ORDER
    //======================
    const swiftResponse = await axios.post(
      `${process.env.SWIFT_BASE_URL}/api/order-voucher`,
      {
        voucherSlug,
        quantity,
        phone,
        email,
        sendViaWhatsApp,
        webhookUrl: `${process.env.SWIFT_BASE_URL}/api/webhooks/vouchers`
      },
      {
        headers: {
          "x-api-key": process.env.SWIFT_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    return res.status(200).json(swiftResponse.data);

  } catch(error) {
    console.error("=========VOUCHER ORDER ERROR============");
    console.error(error.response?.data || error.message || "Voucher purchase failed.");
    console.error("==========");

    return res.status(500 || error.response?.status ).json({
      success: false,
      message: error.response?.data?.message || error.message ||
      "Voucher purchase failed."
    });
  }
});

export default postVoucherRouter;