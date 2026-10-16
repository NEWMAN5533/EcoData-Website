// ECODATA USER PROFILE ROUTES
// CLERK AUTHENTICATION + NEON postgreSQL

import express from "express";
import { getAuth } from "@clerk/express";

import sql from "../backend/db.js";
import { requireAuth } from "../middleware/clerkAuth.js";

const profileRouter = express.Router();


profileRouter.post("/", requireAuth, async (req, res) => {
  try{
    const { userId } = getAuth(req);

    if(!userId){
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    const firstName = String(req.body.firstName || "").trim();

    const lastName = String(req.body.lastName || "").trim();

    const email = String(req.body.email || "").trim();

    if(!firstName || !lastName || !email){
      return res.status(400).json({
        success: false,
        message: "First name, last name and email are required."
      });
    }

    if(firstName.length > 100 ||
      lastName.length > 100 ||
      email.length > 255
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more field exceed the allowed length."
      });
    }

    // We never accept clerk_user_id, role, balance, or active
    // from the req body. The authentication clerk session
    //determines the account being modified

    const result = await sql `
    INSERT INTO ecodata_users(
    clerk_user_id,
    first_name,
    last_name,
    email
    )
    VALUES(
    ${userId},
    ${firstName},
    ${lastName},
    ${email}
    )
    ON CONFLICT (clerk_user_id)
    DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    updated_at = NOW()
    RETURNING
    id,
    clerk_user_id,
    first_name,
    last_name,
    email,
    role,
    balance,
    active,
    created_at,
    updated_at
    `;

    return res.status(200).json({
      success: true,
      message: "EcoData profile saved successfully.",
      user: result[0]
    });

  } catch(err){
    console.error("Profile save error: ", err);

    return res.status(500).json({
      success: false,
      message: "Unable to save your profile."
    });
  }
});

profileRouter.get("/", requireAuth, async(req, res) =>{
  try{
    const { userId } = getAuth(req);

    const result = await sql`
    SELECT
    id,
    clerk_user_id,
    first_name,
    last_name,
    email,
    role,
    balance,
    active,
    created_at,
    updated_at
    FROM ecodata_users
    WHERE clerk_user_id = ${userId}
    LIMIT 1
    `;

    if(result.length === 0) {
      return res.status(404).json({
        success:false,
        message: "User profile not found."
      });
    }

    return res.status(200).json({
      success: true,
      user: result[0]
    });

  } catch(err) {
    console.error("Profile retrieval error:", err);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your profile."
    });
  }
});

export default profileRouter;