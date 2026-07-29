import express from 'express';
import axios from 'axios';

const afaRegisterRouter = express.Router();

afaRegisterRouter.post("/afa-register", async (req, res) => {

const {
  phone,
  fullName,
  paymentReference,
} = req.body;

const result = await handleAFARequest({
  phone: phone,
  fullName: fullname,
  paymentReference: paymentReference
});

res.status(result.status).json(result.body);

async function handleAFARequest({phone, fullName, paymentReference}) {
  // Validate 
  if(!phone || !fullName || !paymentReference){
    return {
      ok: false,
      status: 400,
      body: {
        success: false,
        message: "Missing require field"
      }
    }
  }

  // Duplicate protection
  if(processedOrders.has(paymentReference)){
    return {
      ok: true,
      status: 200,
      body: {
        success: true,
        message: "Afa Already registered",
        ...processedOrders.get(paymentReference).response,
      },
    };
  }


}



  try {
    // ====================
    // VERIFY PAYMENT
    // ====================
    const verification = await axios.get(
      `https://api.paystack.co/transaction/verify/${paymentReference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (!verification.data.status) {
      throw new Error("Payment verification failed");
    }

    const paidAmount = verification.data.data.amount / 100;

    if (paidAmount !== 20) {
      throw new Error("Invalid payment amount");
    }

    // ====================
    // 🚫 REMOVE SWIFT CALL
    // ====================

    // ====================
    // SAVE AFA REQUEST (YOU CONTROL THIS)
    // ====================
    const responseData = {
      registrationId: "AFA-" + Date.now(),
      name: fullName,
      phoneNumber: phone,
      registrationPrice: paidAmount,
      status: "pending", // 🔥 always pending (admin approval)
      submittedAt: new Date().toISOString(),
    };

    // Store in memory (you can later move to DB)
    processedOrders.set(paymentReference, {
      status: "success",
      response: responseData,
    });

    return {
      ok: true,
      status: 200,
      body: {
        success: true,
        message: "Registration submitted successfully",
        ...responseData,
      },
    };
  } catch (err) {
    const errData = err.response?.data || err.message;

    processedOrders.set(paymentReference, {
      status: "failed",
      response: { error: errData },
    });

    return {
      ok: false,
      status: 500,
      body: {
        success: false,
        message: "AFA submission failed",
        error: errData,
      },
    }
  }
} 
)

export default afaRegisterRouter;
