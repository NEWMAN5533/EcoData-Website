import express from 'express';
import axios from 'axios';

const postVoucherRouter = express.Router();



//========================
// VERIFY PAYMENT 
//========================
async function verifyPayment(reference){
  const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    }
  );
  return response.data.data;
}


//=====================
// ORDER VOUCHER ROUTE
//=====================
postVoucherRouter.post("/purchase", async (req, res) =>{
  try{
    const {
      voucherSlug,
      quantity,
      phone,
      email,
      sendViaWhatsApp,
      paymentReference
    } = req.body;

    //==================
    // VERIFY PAYMENT
    //==================
    const payment = await
    verifyPayment(paymentReference);

  
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
      `${process.env.SWIFT_BASE_URL}/vouchers/purchase`,
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