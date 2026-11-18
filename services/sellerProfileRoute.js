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
        s.store_name,
        s.seller_types,
        s.status,
        s.seller_verified,
        s.can_publish,
        s.can_withdraw,
        s.phone_number,
        s.country,
        s.region,
        s.city,
        s.area,
        s.whatsapp_number,
        s.whatsapp_enabled,
        s.about,
        s.store_logo_url,
        s.facebook_url,
        s.instagram_url,
        s.youtube_url,
        s.website_url,
        u.first_name,
        u.last_name,
        u.email
      FROM ecodata_sellers s
      LEFT JOIN ecodata_users u
        ON u.clerk_user_id = s.clerk_user_id
      WHERE s.clerk_user_id = ${userId}
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

      const fullName = [
        seller.first_name,
        seller.last_name
      ].filter(Boolean).join(" ");

      const location = [
        seller.area,
        seller.city,
        seller.region,
        seller.country
      ].filter(Boolean).join(", ");

      return res.status(200).json({
        success: true,
        seller: {
          storeName: seller.store_name,
          store_name: seller.store_name,

          sellerTypes: seller.seller_types,
          status: seller.status,
          sellerVerified: seller.seller_verified,
          canPublish: seller.can_publish,
          canWithdraw: seller.can_withdraw,

          firstName: seller.first_name,
          lastName: seller.last_name,
          fullName,

          email: seller.email,

        about: seller.about || "",
        storeLogoUrl: seller.store_logo_url || "",
        facebook: seller.facebook_url || "",
        instagram: seller.instagram_url || "",
        youtube: seller.youtube_url || "",
        website: seller.website_url || "",

          phoneNumber: seller.phone_number,

          country: seller.country,
          region: seller.region,
          city: seller.city,
          area: seller.area,
          location,

          whatsappNumber: seller.whatsapp_number,
          whatsappEnabled: seller.whatsapp_enabled
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




/* ======================================
   UPDATE SELLER PROFILE
   PUT /api/seller/profile
====================================== */

sellerProfileRouter.put("/profile", requireAuth, async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    const {
      storeName,
      about,
      facebook,
      instagram,
      youtube,
      website
    } = req.body;

    // Validate store name
    if (
      typeof storeName !== "string" ||
      !storeName.trim() ||
      storeName.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Store name is required and must be at most 100 characters."
      });
    }

    // Validate About field
    if (
      about !== undefined &&
      (typeof about !== "string" || about.length > 1000)
    ) {
      return res.status(400).json({
        success: false,
        message: "About must be text with a maximum of 1000 characters."
      });
    }

    // Validate optional URLs
    function validateOptionalUrl(value, fieldName) {
      if (value === undefined || value === null || value === "") {
        return null;
      }

      if (typeof value !== "string" || value.length > 2048) {
        throw new Error(`${fieldName} is invalid.`);
      }

      let parsed;

      try {
        parsed = new URL(value);
      } catch {
        throw new Error(`${fieldName} must be a valid URL.`);
      }

      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error(`${fieldName} must use HTTP or HTTPS.`);
      }

      return parsed.href;
    }

    let facebookUrl;
    let instagramUrl;
    let youtubeUrl;
    let websiteUrl;

    try {
      facebookUrl = validateOptionalUrl(facebook, "Facebook link");
      instagramUrl = validateOptionalUrl(instagram, "Instagram link");
      youtubeUrl = validateOptionalUrl(youtube, "YouTube link");
      websiteUrl = validateOptionalUrl(website, "Website link");
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    const rows = await sql`
      UPDATE ecodata_sellers
      SET
        store_name = ${storeName.trim()},
        about = ${typeof about === "string" ? about.trim() : ""},
        facebook_url = ${facebookUrl},
        instagram_url = ${instagramUrl},
        youtube_url = ${youtubeUrl},
        website_url = ${websiteUrl},
        updated_at = NOW()
      WHERE clerk_user_id = ${userId}
      RETURNING
        store_name,
        about,
        facebook_url,
        instagram_url,
        youtube_url,
        website_url
    `;

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found."
      });
    }

    const seller = rows[0];

    return res.status(200).json({
      success: true,
      message: "Seller profile updated successfully.",
      seller: {
        storeName: seller.store_name,
        about: seller.about,
        facebook: seller.facebook_url,
        instagram: seller.instagram_url,
        youtube: seller.youtube_url,
        website: seller.website_url
      }
    });

  } catch (error) {
    console.error("Update seller profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update seller profile."
    });
  }
});




export default sellerProfileRouter;