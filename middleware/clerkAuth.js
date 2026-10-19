import { clerkMiddleware, getAuth } from "@clerk/express";
import sql from "../backend/db.js";

/***
 * /Initialize clerk authentication
 * apply clerk middleware globally in server.js
 * 
 * 
 */

export const initializeClerk = clerkMiddleware();

/**
 * require an authenticated user
 * 
 */

export function requireAuth(req, res, next){
  const auth = getAuth(req);

  if(!auth?.userId){
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }
  next();
}

/***
 * Required an authenticated administrator,manually authenticated admin
 * Admin access is verified against Neon on the server
 * 
 */

export async function requiredAdmin( req, res, next ){
  try{
    const { userId } = getAuth(req);

    if(!userId){
      return res.status(401).json({
        success: false,
        code: "AUTHENTICATION__REQUIRED",
        message: "Please sign in to continue."
      });
    }

    // SYNC ADMINS
    const admins = await sql `
    SELECT id
    FROM ecodata_admins
    WHERE clerk_user_id = ${ userId }
    AND active = TRUE
    LIMIT 1
    `;

    if(admins.length === 0){
      return res.status(403).json({
        success: false,
        code: "ADMIN_ACCESS_DENIED",
        message: "You are not authorized to access the admin area."
      });
    }

    req.admin = {
      id: admins[0].id,
      clerkUserId: userId
    };

    return next();

  } catch(error){
    console.error("Admin authorization error:", error);

    return res.status(500).json({
      success: false,
      code: "ADMIN_AUTHORIZATION_ERROR",
      message: "Unable to verified administrator access."
    });
  }
}