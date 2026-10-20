// ==========================================
// ECODATA SELLER PROFILE API
// CLERK AUTHENTICATION + NEON POSTGRESQL
// ==========================================

import express from "express";
import { getAuth } from "@clerk/express";

import sql from "../backend/db.js";
import { requireAuth } from "../middleware/clerkAuth.js";

const sellerProfileRouter = express.Router();


// ==========================================
// CREATE SELLER PROFILE
// POST /api/seller-profile
// ==========================================

sellerProfileRouter.post(
  "/",
  requireAuth,
  async (req, res) => {
    try {
      // --------------------------------------
      // VERIFY CLERK SESSION
      // --------------------------------------

      const { userId } = getAuth(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Please sign in to continue."
        });
      }


      // --------------------------------------
      // GET SELLER INFORMATION
      // --------------------------------------

      const {
        firstName,
        lastName,
        email,
        storeName,
        sellerTypes,
        phoneNumber,
        country,
        region,
        city,
        area,
        whatsappNumber,
        whatsappEnabled,
        sellerTermsAccepted,
        privacyPolicyAccepted
      } = req.body;


      // --------------------------------------
      // VALIDATE REQUIRED FIELDS
      // --------------------------------------

      if (
        typeof firstName !== "string" ||
        typeof lastName !== "string" ||
        typeof email !== "string" ||
        typeof storeName !== "string" ||
        typeof phoneNumber !== "string" ||
        typeof country !== "string" ||
        typeof region !== "string" ||
        typeof city !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "Some required seller information is missing."
        });
      }


      const cleanFirstName = firstName.trim();
      const cleanLastName = lastName.trim();
      const cleanEmail = email.trim().toLowerCase();
      const cleanStoreName = storeName.trim();
      const cleanPhone = phoneNumber.trim();
      const cleanCountry = country.trim();
      const cleanRegion = region.trim();
      const cleanCity = city.trim();
      const cleanArea =
        typeof area === "string" && area.trim()
          ? area.trim()
          : null;


      if (
        !cleanFirstName ||
        !cleanLastName ||
        !cleanStoreName ||
        !cleanPhone ||
        !cleanCountry ||
        !cleanRegion ||
        !cleanCity
      ) {
        return res.status(400).json({
          success: false,
          message: "Please complete all required fields."
        });
      }


      if (
        cleanFirstName.length > 100 ||
        cleanLastName.length > 100 ||
        cleanStoreName.length > 150 ||
        cleanEmail.length > 255 ||
        cleanPhone.length > 20 ||
        cleanCountry.length > 100 ||
        cleanRegion.length > 100 ||
        cleanCity.length > 100 ||
        (cleanArea && cleanArea.length > 100)
      ) {
        return res.status(400).json({
          success: false,
          message: "One or more fields exceed the allowed length."
        });
      }


      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address."
        });
      }


      // --------------------------------------
      // VALIDATE SELLER TYPES
      // --------------------------------------

      const allowedTypes = [
        "digital",
        "physical",
        "service"
      ];

      if (
        !Array.isArray(sellerTypes) ||
        sellerTypes.length === 0 ||
        !sellerTypes.every(
          type => allowedTypes.includes(type)
        ) ||
        new Set(sellerTypes).size !== sellerTypes.length
      ) {
        return res.status(400).json({
          success: false,
          message: "Select at least one valid seller type."
        });
      }


      // --------------------------------------
      // VALIDATE AGREEMENTS
      // --------------------------------------

      if (
        sellerTermsAccepted !== true ||
        privacyPolicyAccepted !== true
      ) {
        return res.status(400).json({
          success: false,
          message: "You must accept the Seller Terms and Privacy Policy."
        });
      }


      // --------------------------------------
      // VALIDATE WHATSAPP
      // --------------------------------------

      const needsWhatsapp =
        sellerTypes.includes("physical") ||
        sellerTypes.includes("service");

      const useWhatsapp =
        needsWhatsapp &&
        whatsappEnabled === true;

      let cleanWhatsapp = null;

      if (useWhatsapp) {
        if (
          typeof whatsappNumber !== "string" ||
          !/^\+?233\d{9}$/.test(
            whatsappNumber.trim().replace(/\s+/g, "")
          )
        ) {
          return res.status(400).json({
            success: false,
            message: "Provide a valid Ghana WhatsApp number."
          });
        }

        cleanWhatsapp = whatsappNumber
          .trim()
          .replace(/\s+/g, "")
          .replace(/^\+/, "");
      }



      // ==========================================
 // GET SELLER PROFILE
 // GET /api/seller-profile
 // ==========================================

sellerProfileRouter.get(
  "/profile",
  requireAuth,
  async (req, res) => {
    try {
      const { userId } = getAuth(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Please sign in to continue."
        });
      }

      const rows = await sql`
        SELECT
          store_name,
          seller_types,
          status,
          seller_verified,
          can_publish,
          can_withdraw
        FROM ecodata_sellers
        WHERE clerk_user_id = ${userId}
        LIMIT 1
      `;

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          code: "SELLER_PROFILE_NOT_FOUND",
          message: "Please complete your seller registration."
        });
      }

      const seller = rows[0];

      return res.status(200).json({
        success: true,
        seller: {
          storeName: seller.store_name,
          store_name: seller.store_name,
          sellerTypes: seller.seller_types,
          status: seller.status,
          sellerVerified: seller.seller_verified,
          canPublish: seller.can_publish,
          canWithdraw: seller.can_withdraw
        }
      });

    } catch (error) {
      console.error("Get seller profile error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load your seller profile."
      });
    }
  }
);

      // --------------------------------------
      // SAVE USER + SELLER PROFILE ATOMICALLY
      // --------------------------------------

      const userQuery = sql`
        INSERT INTO ecodata_users (
          clerk_user_id,
          first_name,
          last_name,
          email
        )
        VALUES (
          ${userId},
          ${cleanFirstName},
          ${cleanLastName},
          ${cleanEmail}
        )
        ON CONFLICT (clerk_user_id)
        DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          email = EXCLUDED.email,
          updated_at = NOW()
      `;

      const sellerQuery = sql`
        INSERT INTO ecodata_sellers (
          clerk_user_id,
          store_name,
          seller_types,
          phone_number,
          country,
          region,
          city,
          area,
          whatsapp_number,
          whatsapp_enabled,
          status,
          seller_verified,
          can_publish,
          can_withdraw,
          seller_terms_accepted,
          privacy_policy_accepted
        )
        VALUES (
          ${userId},
          ${cleanStoreName},
          ${sellerTypes},
          ${cleanPhone},
          ${cleanCountry},
          ${cleanRegion},
          ${cleanCity},
          ${cleanArea},
          ${cleanWhatsapp},
          ${useWhatsapp},
          'pending',
          FALSE,
          FALSE,
          FALSE,
          TRUE,
          TRUE
        )
        ON CONFLICT (clerk_user_id)
        DO UPDATE SET
          store_name = EXCLUDED.store_name,
          seller_types = EXCLUDED.seller_types,
          phone_number = EXCLUDED.phone_number,
          country = EXCLUDED.country,
          region = EXCLUDED.region,
          city = EXCLUDED.city,
          area = EXCLUDED.area,
          whatsapp_number = EXCLUDED.whatsapp_number,
          whatsapp_enabled = EXCLUDED.whatsapp_enabled,
          seller_terms_accepted = TRUE,
          privacy_policy_accepted = TRUE,
          updated_at = NOW()
      `;

      await sql.transaction([
        userQuery,
        sellerQuery
      ]);



      // --------------------------------------
      // SUCCESS
      // --------------------------------------

      return res.status(201).json({
        success: true,
        message: "Seller profile saved successfully.",
        seller: {
          status: "pending",
          canPublish: false,
          canWithdraw: false
        }
      });

    } catch (error) {
      console.error(
        "Seller profile creation error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to save the seller profile. Please try again."
      });
    }
  }
);


export default sellerProfileRouter;