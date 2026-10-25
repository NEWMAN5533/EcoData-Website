import { clerkMiddleware, getAuth, clerkClient } from "@clerk/express";
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

export async function requiredAdmin(req, res, next) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        code: "AUTHENTICATION_REQUIRED",
        message: "Please sign in to continue."
      });
    }

    // Find an active administrator by the authenticated Clerk user ID.
    const admins = await sql`
      SELECT id, email
      FROM ecodata_admins
      WHERE clerk_user_id = ${userId}
        AND active = TRUE
      LIMIT 1
    `;

    if (admins.length === 0) {
      return res.status(403).json({
        success: false,
        code: "ADMIN_ACCESS_DENIED",
        message: "You are not authorized to access the admin area."
      });
    }

    // Get the user's email from the authenticated Clerk account.
    const client =
      typeof clerkClient === "function"
        ? await clerkClient()
        : clerkClient;

    const clerkUser = await client.users.getUser(userId);

    const verifiedEmails = clerkUser.emailAddresses
      .filter(
        address => address.verification?.status === "verified"
      )
      .map(address => address.emailAddress.toLowerCase());

    const adminEmail = String(admins[0].email || "")
      .trim()
      .toLowerCase();

    if (!adminEmail || !verifiedEmails.includes(adminEmail)) {
      return res.status(403).json({
        success: false,
        code: "ADMIN_EMAIL_MISMATCH",
        message: "Your verified email does not match the administrator record."
      });
    }

    req.admin = {
      id: admins[0].id,
      clerkUserId: userId,
      email: adminEmail
    };

    return next();
  } catch (error) {
    console.error("Admin authorization error:", error);

    return res.status(500).json({
      success: false,
      code: "ADMIN_AUTHORIZATION_ERROR",
      message: "Unable to verify administrator access."
    });
  }
}
