import express from "express";
import { getAuth } from "@clerk/express";

import sql from "../backend/db.js";
import { requireAuth, requiredAdmin } from "../middleware/clerkAuth.js";

const sellerSettingsRouter = express.Router();

//====================================
// GET API SELLER SETTING
//====================================

sellerSettingsRouter.get("/", requiredAdmin, async(req, res) => {
  try{

    const { userId } = getAuth(req);

    if(!userId){
      return res.status(401).json({
        success: false,
        message: "Please sign in to continue."
      });
    }

    // Confirm this account has a seller profile
    const sellers = sql`
    SELECT clerk_user_id
    FROM ecodata_sellers
    WHERE clerk_user_id = ${ userId }
    LIMIT 1
    `;

    if(!sellers.length){
      return res.status(404).json({
        success: false,
        code: "SELLER_PROFILE_NOT_FOUND",
        message: "Seller profile not found"
      });
    }

    // Create a default preference if this is the first visit
    const rows = await sql `
    INSERT INTO ecodata_seller_settings
    (clerk_user_id)
    VALUES (${userId})
    ON CONFLICT (clerk_user_id) DO NOT NOTHING
    RETURNING *
    `;

    const settings = rows.length
    ? rows[0]
    : (await sql `
      SELECT *
      FROM ecodata_seller_settings
      WHERE clerk_user_id = ${ userId }
      LIMIT 1
      `)[0];

    return res(200).json({
      success: true,
      settings: {
        notifySales: settings.notify_sales,
        notifyWithdrawals: settings.notify_withdrawals,
        notifyProducts: settings.notify_products,
        storeVisibility: settings.store_visibility,
        storeCurrency: settings.store_currency
      }
    });
  } catch(error){
    console.error("Get seller setting error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load your settings."
    });
  }
});



//====================================
// PUT API SELLER SETTING
//====================================

sellerSettingsRouter.put("/", requireAuth, async(req, res) => {
  try{
    const { userId } = getAuth(req);

    if(!userId){
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
      storeCurrency,
    } = req.body;

    if(
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

    const sellers = await sql `
    SELECT clerk_user_id
    FROM ecodata_sellers
    WHERE clerk_user_id = ${ userId }
    LIMIT 1
    `;

    if(!sellers.length){
      return res.status(404).json({
        success: false,
        code: "SELLER_PROFILE_NOT_FOUND",
        message: "Seller profile not found."
      });
    }


    const rows = await sql `
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
    notify_sales = EXCLUDE.notify_sales,
    notify_withdrawals = EXCLUDE.notify_withdrawals,
    notify_products = EXCLUDE.notify_products,
    store_visibility = EXCLUDE.store_visibility,
    store_currency = EXCLUDE.store_currency,
    updated_at = NOW()
    RETURNING *
    `;

   const settings = rows[0];
   return res.status(200).json({
    success: true,
    message: "Settings saved successfully.",
    settings: {
      notifySales: settings.notify_sales,
      notifyWithdrawals: settings.notify_withdrawals,
      notifyProducts: settings.notify_products,
      storeVisibility: settings.store_visibility,
      storeCurrency: settings.store-currency
    }
   });

  } catch(error){
    console.error("Save seller settings error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to save your settings."
    });
  }
});

export default sellerSettingsRouter;