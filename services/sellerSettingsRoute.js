import express from "express";
import { getAuth } from "@clerk/express";

import sql, { pool } from "../backend/db.js";
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

// PUT /api/seller-settings/account
sellerSettingsRouter.put("/account", requireAuth, async (req, res) => {
  let client;
  let transactionStarted = false;

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
        message: "Display name must be between 2 and 80 characters."
      });
    }

    // Validate phone number.
    if (
      typeof phone !== "string" ||
      phone.trim().length > 25
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid phone number."
      });
    }

    const cleanName = displayName.trim();
    const cleanPhone = phone.trim();

    const nameParts = cleanName.split(/\s+/);
    const firstName = nameParts.shift();
    const lastName = nameParts.join(" ");

    // Acquire one database connection for the transaction.
    client = await pool.connect();

    await client.query("BEGIN");
    transactionStarted = true;

    // Confirm the authenticated user exists.
    const users = await client.query(
      `SELECT clerk_user_id
       FROM ecodata_users
       WHERE clerk_user_id = $1
       LIMIT 1`,
      [userId]
    );

    if (users.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).json({
        success: false,
        code: "USER_PROFILE_NOT_FOUND",
        message: "Your account profile was not found."
      });
    }

    // Update the user's display name.
    await client.query(
      `UPDATE ecodata_users
       SET first_name = $1,
           last_name = $2
       WHERE clerk_user_id = $3`,
      [firstName, lastName, userId]
    );

    // Check whether this account has a seller profile.
    const sellers = await client.query(
      `SELECT clerk_user_id
       FROM ecodata_sellers
       WHERE clerk_user_id = $1
       LIMIT 1`,
      [userId]
    );

    const isSeller = sellers.rows.length > 0;

    // Save the phone number for seller accounts.
    if (isSeller) {
      await client.query(
        `UPDATE ecodata_sellers
         SET phone_number = $1
         WHERE clerk_user_id = $2`,
        [cleanPhone, userId]
      );
    }

    // Commit both updates together.
    await client.query("COMMIT");
    transactionStarted = false;

    return res.json({
      success: true,
      message: "Account information updated successfully.",
      account: {
        isSeller,
        displayName: cleanName,
        phone: cleanPhone
      }
    });

  } catch (error) {
    // Roll back any incomplete transaction.
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "Account update rollback error:",
          rollbackError
        );
      }
    }

    console.error("Update account information error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update your account information."
    });

  } finally {
    // Always release the database connection.
    if (client) {
      client.release();
    }
  }
});




// GET /api/seller-settings/account
sellerSettingsRouter.get("/account", requireAuth, async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please sign in to continue."
      });
    }

    // Find the user and check whether a seller profile exists.
    const rows = await sql`
      SELECT
        u.first_name,
        u.last_name,
        u.email,
        s.clerk_user_id AS seller_id,
        s.phone_number
      FROM ecodata_users u
      LEFT JOIN ecodata_sellers s
        ON s.clerk_user_id = u.clerk_user_id
      WHERE u.clerk_user_id = ${userId}
      LIMIT 1
    `;

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Account profile not found."
      });
    }

    const user = rows[0];
    const isSeller = Boolean(user.seller_id);

    const savedName = [
      user.first_name,
      user.last_name
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return res.json({
      success: true,
      account: {
        isSeller,
        displayName: savedName || (
          isSeller ? "Creator/seller" : "EcoData/user"
        ),
        username: "",
        email: user.email || "",
        phone: user.phone_number || ""
      }
    });
  } catch (error) {
    console.error("Load account information error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load account information."
    });
  }
});



export default sellerSettingsRouter;