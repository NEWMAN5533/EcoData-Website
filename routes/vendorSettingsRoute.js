import express from "express";
import { getAuth, clerkClient } from "@clerk/express";

import {
  getVendorSettings,
  setActiveVendor
} from "../services/vendorManager.js";

const vendorSettingsRouter = express.Router();

const ALLOWED_VENDORS = ["swiftdata", "datamart"];

// Authorize if EITHER:
// 1. The Clerk user has a verified email in VENDOR_ADMIN_EMAILS, OR
// 2. The user has an active record in ecodata_admins.
async function verifyVendorAdmin(req, res, next) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please sign in to continue."
      });
    }

    // First: check the approved, verified email.
    const configuredEmails = process.env.VENDOR_ADMIN_EMAILS || "";

    const allowedEmails = configuredEmails
      .split(",")
      .map(email => email.trim().toLowerCase())
      .filter(Boolean);

    if (allowedEmails.length > 0) {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);

      const hasApprovedVerifiedEmail = user.emailAddresses.some(
        address =>
          address.verification?.status === "verified" &&
          allowedEmails.includes(
            address.emailAddress.toLowerCase()
          )
      );

      if (hasApprovedVerifiedEmail) {
        req.vendorAdmin = {
          clerkUserId: userId,
          authorizationMethod: "verified_email"
        };

        return next();
      }
    }

    // Second: check the existing active Neon administrator record.
    const { default: sql } = await import("../backend/db.js");

    const admins = await sql`
      SELECT id
      FROM ecodata_admins
      WHERE clerk_user_id = ${userId}
        AND active = TRUE
      LIMIT 1
    `;

    if (admins.length > 0) {
      req.vendorAdmin = {
        id: admins[0].id,
        clerkUserId: userId,
        authorizationMethod: "neon_admin"
      };

      return next();
    }

    return res.status(403).json({
      success: false,
      message: "You are not authorized to manage vendors."
    });
  } catch (error) {
    console.error("Vendor authorization failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify vendor administrator access."
    });
  }
}

// Get the current vendor.
vendorSettingsRouter.get(
  "/settings",
  verifyVendorAdmin,
  async (req, res) => {
    try {
      const settings = await getVendorSettings();

      return res.json({
        success: true,
        settings
      });
    } catch (error) {
      console.error("Loading vendor settings failed:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load vendor settings."
      });
    }
  }
);

// Update the active vendor.
vendorSettingsRouter.put(
  "/settings",
  verifyVendorAdmin,
  async (req, res) => {
    try {
      const vendor = String(
        req.body?.activeVendor || req.body?.vendor || ""
      ).trim().toLowerCase();

      if (!ALLOWED_VENDORS.includes(vendor)) {
        return res.status(400).json({
          success: false,
          message: "Choose swiftdata or datamart."
        });
      }

      const settings = await setActiveVendor(vendor);

      return res.json({
        success: true,
        settings,
        message: `Active vendor changed to ${settings.activeVendor}.`
      });
    } catch (error) {
      console.error("Vendor update failed:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to update the active vendor."
      });
    }
  }
);

export default vendorSettingsRouter;