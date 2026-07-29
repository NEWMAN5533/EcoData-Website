import express from "express";
import axios from "axios";
import { admin } from "../firebaseAdmin";

const exclusiveAgentRoute = express.Router();

exclusiveAgentRoute.post("/verify-payment", async (req, res) => {

  try{

  const { reference, uid } = req.body;

  if( !reference || !uid ) {
    res.status(400).json({
      message: "User uid not valid"});
  }

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = response.data?.data;

    const AGENT_PRICE = 50;
    const expectedAmount = AGENT_PRICE * 100;


    // VALIDATION
    if (data.status !== "success") {
      return res.status(400).json({ error: "Payment not successful" });
    };

    if(data.amount !== expectedAmount) {
      return res.status(400).json({
        error: "Incorrect amount"});
    }

    if(data.currency !== "GHS"){
      return res.status(400).json({
        error: "Invalid currency"});
    }

    if(data.metadata.uid !== uid) {
      return res.status(400).json({ error: "Uid mismatch"});
    }

    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if(!userDoc.exists){
      return res.status(404).json({ error: "User not found"});
    }

    if(userDoc.data().paymentStatus === "verified"){
      return res.status(400).json({ error: "Already verified"});
    }

    await userRef.update({
      isAgent: true,
      paymentStatus: "verified",
      agentApproved: true,
      amount: AGENT_PRICE,
      paidAt: admin.firestore.FieldValue.serverTimesStamp(),
      paymentReference: reference,
    });

    res.json({
      success: true,
      message: "Agent upgraded successfully"
    })

   

    } catch(error){
      console.log("Failed to upgrade Agent", error.reference?.data ||error);
      res.status(500).json({ error: "Server error "});
    }

});

export default exclusiveAgentRoute;