import express from "express";
import { getAuth } from "@clerk/express";

import sql from "../backend/db.js";
import { requireAuth } from "../middleware/clerkAuth.js";

const sellerSettingsRouter = express.Router();

// GET /api/seller-settings
sellerSettingsRouter.get("/", requireAuth, async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please sign in to continue."
      });
    }

    // Confirm this account has a seller profile.
    const sellers = await sql`
      SELECT clerk_user_id
      FROM ecodata_sellers
      WHERE clerk_user_id = ${userId}
      LIMIT 1
    `;

    if (!sellers.length) {
      return res.status(404).json({
        success: false,
        code: "SELLER_PROFILE_NOT_FOUND",
        message: "Seller profile not found."
      });
    }

    // Create default preferences if this is the first visit.
    const rows = await sql`
      INSERT INTO ecodata_seller_settings (clerk_user_id)
      VALUES (${userId})
      ON CONFLICT (clerk_user_id) DO NOTHING
      RETURNING *
    `;

    const settings = rows.length
      ? rows[0]
      : (await sql`
          SELECT *
          FROM ecodata_seller_settings
          WHERE clerk_user_id = ${userId}
          LIMIT 1
        `)[0];

    return res.json({
      success: true,
      settings: {
        notifySales: settings.notify_sales,
        notifyWithdrawals: settings.notify_withdrawals,
        notifyProducts: settings.notify_products,
        storeVisibility: settings.store_visibility,
        storeCurrency: settings.store_currency
      }
    });
  } catch (error) {
    console.error("Get seller settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your settings."
    });
  }
});

// PUT /api/seller-settings
sellerSettingsRouter.put("/", requireAuth, async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please sign in to continue."
      });
    }

    const {
      notifySales,
      notifyWithdrawals,
      notifyProducts,
      storeVisibility,
      storeCurrency
    } = req.body;

    if (
      typeof notifySales !== "boolean" ||
      typeof notifyWithdrawals !== "boolean" ||
      typeof notifyProducts !== "boolean" ||
      !["public", "private"].includes(storeVisibility) ||
      storeCurrency !== "GHS"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid settings provided."
      });
    }

    const sellers = await sql`
      SELECT clerk_user_id
      FROM ecodata_sellers
      WHERE clerk_user_id = ${userId}
      LIMIT 1
    `;

    if (!sellers.length) {
      return res.status(404).json({
        success: false,
        code: "SELLER_PROFILE_NOT_FOUND",
        message: "Seller profile not found."
      });
    }

    const rows = await sql`
      INSERT INTO ecodata_seller_settings (
        clerk_user_id,
        notify_sales,
        notify_withdrawals,
        notify_products,
        store_visibility,
        store_currency
      )
      VALUES (
        ${userId},
        ${notifySales},
        ${notifyWithdrawals},
        ${notifyProducts},
        ${storeVisibility},
        ${storeCurrency}
      )
      ON CONFLICT (clerk_user_id)
      DO UPDATE SET
        notify_sales = EXCLUDED.notify_sales,
        notify_withdrawals = EXCLUDED.notify_withdrawals,
        notify_products = EXCLUDED.notify_products,
        store_visibility = EXCLUDED.store_visibility,
        store_currency = EXCLUDED.store_currency,
        updated_at = NOW()
      RETURNING *
    `;

    const settings = rows[0];

    return res.json({
      success: true,
      message: "Settings saved successfully.",
      settings: {
        notifySales: settings.notify_sales,
        notifyWithdrawals: settings.notify_withdrawals,
        notifyProducts: settings.notify_products,
        storeVisibility: settings.store_visibility,
        storeCurrency: settings.store_currency
      }
    });
  } catch (error) {
    console.error("Save seller settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save your settings."
    });
  }
});







/* =========================================
   UPDATE BASIC SELLER ACCOUNT INFORMATION
   PUT /api/seller-settings/account
========================================= */

sellerSettingsRouter.put("/account", requireAuth, async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please sign in to continue."
      });
    }

    const { displayName, phone } = req.body;

    // Validate display name.
    if (
      typeof displayName !== "string" ||
      displayName.trim().length < 2 ||
      displayName.trim().length > 80
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a display name between 2 and 80 characters."
      });
    }

    // Validate phone number.
    if (
      typeof phone !== "string" ||
      phone.trim().length > 25
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid phone number."
      });
    }

    const nameParts = displayName.trim().split(/\s+/);
    const firstName = nameParts.shift();
    const lastName = nameParts.join(" ");

    // Verify the seller profile belongs to this Clerk user.
    const sellers = await sql`
      SELECT clerk_user_id
      FROM ecodata_sellers
      WHERE clerk_user_id = ${userId}
      LIMIT 1
    `;

    if (!sellers.length) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found."
      });
    }

    // Confirm that the associated account exists.
    const users = await sql`
      SELECT clerk_user_id
      FROM ecodata_users
      WHERE clerk_user_id = ${userId}
      LIMIT 1
    `;

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "Account profile not found."
      });
    }

    // Update the account name.
    await sql`
      UPDATE ecodata_users
      SET
        first_name = ${firstName},
        last_name = ${lastName}
      WHERE clerk_user_id = ${userId}
    `;

    // Update the seller's contact number.
    await sql`
      UPDATE ecodata_sellers
      SET phone_number = ${phone.trim()}
      WHERE clerk_user_id = ${userId}
    `;

    return res.json({
      success: true,
      message: "Account information updated successfully.",
      account: {
        displayName: displayName.trim(),
        phone: phone.trim()
      }
    });
  } catch (error) {
    console.error("Update seller account error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update your account information."
    });
  }
});





export default sellerSettingsRouter;