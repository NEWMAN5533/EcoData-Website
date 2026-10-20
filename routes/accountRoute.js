// ==========================================
// ECODATASTORE ACCOUNT API
// CLERK + NEON POSTGRESQL
// ==========================================

import express from "express";
import { getAuth } from "@clerk/express";

import sql from "../backend/db.js";
import { requireAuth } from "../middleware/clerkAuth.js";

const accountRouter = express.Router();


// ==========================================
// GET AUTHENTICATED ACCOUNT
// GET /api/account/me
// ==========================================

accountRouter.get(
  "/me",
  requireAuth,
  async (req, res) => {

    try {

      // --------------------------------------
      // VERIFY CLERK USER
      // --------------------------------------

      const { userId } = getAuth(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Please sign in to continue."
        });
      }


      // --------------------------------------
      // GET USER PROFILE
      // --------------------------------------

      const users = await sql`
        SELECT
          id,
          clerk_user_id,
          first_name,
          last_name,
          email,
          role,
          active
        FROM ecodata_users
        WHERE clerk_user_id = ${userId}
        LIMIT 1
      `;


      // --------------------------------------
      // PROFILE NOT FOUND
      // --------------------------------------

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          code: "PROFILE_NOT_FOUND",
          message: "Your account profile could not be found."
        });
      }

      const user = users[0];


      // --------------------------------------
      // CHECK ACCOUNT STATUS
      // --------------------------------------

      if (!user.active) {
        return res.status(403).json({
          success: false,
          code: "ACCOUNT_INACTIVE",
          message: "Your account is currently inactive."
        });
      }


      // --------------------------------------
      // CHECK SELLER PROFILE
      // --------------------------------------

      const sellers = await sql`
        SELECT
          clerk_user_id,
          store_name,
          status,
          seller_verified,
          can_publish,
          can_withdraw
        FROM ecodata_sellers
        WHERE clerk_user_id = ${userId}
        LIMIT 1
      `;


      const seller =
        sellers.length > 0
          ? sellers[0]
          : null;



          // --------------------------------------
      // CLASSIFY ACCOUNT TYPE
      // --------------------------------------

      let accountType = null;

      // Admin role comes from the database, never from the client.
      if (user.role === "admin") {
        accountType = "admin";
      }

      // A seller profile may exist while the user's base role
      // remains "user". Seller status is managed separately.
      else if (
        seller &&
        ["user", "seller"].includes(user.role)
      ) {
        accountType = "seller";
      }

      // A regular user without a seller profile.
      else if (
        user.role === "user" &&
        !seller
      ) {
        accountType = "user";
      }

      // Reject inconsistent profiles.
      if (!accountType) {
        return res.status(403).json({
          success: false,
          code: "ACCOUNT_PROFILE_MISMATCH",
          message:
            "Your account profile needs attention. Please contact support."
        });
      }

      // --------------------------------------
      // RETURN ACCOUNT
      // --------------------------------------

      return res.status(200).json({
        success: true,
        accountType,

        account: {
          userId: user.clerk_user_id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role
        },

        seller: seller
          ? {
              storeName: seller.store_name,
              status: seller.status,
              verified: seller.seller_verified,
              canPublish: seller.can_publish,
              canWithdrawal: seller.can_withdraw
            }
          : null
      });
      

    } catch (error) {

      console.error(
        "Account lookup error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to retrieve your account."
      });

    }

  }
);

export default accountRouter;