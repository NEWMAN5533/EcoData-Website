import express from "express";

import { requiredAdmin } from "../middleware/clerkAuth.js";

import {
  getVendorSettings,
  setActiveVendor,
} from "../services/vendorManager.js";

const vendorManagementRoute = express.Router();

// Protect EVERY vendor management endpoint.
// Only administrators verified against Neon can continue.
vendorManagementRoute.use(requiredAdmin);

// GET /api/admin/vendor/settings
// Retrieve the active bundle vendor.
vendorManagementRoute.get("/settings", async (req, res) => {
  try {
    const settings = await getVendorSettings();

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error(
      "Read vendor settings failed:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load vendor settings.",
    });
  }
});

// PUT /api/admin/vendor/settings
// Change the active bundle vendor.
vendorManagementRoute.put("/settings", async (req, res) => {
  try {
    const { activeVendor } = req.body;

    if (!activeVendor) {
      return res.status(400).json({
        success: false,
        message: "activeVendor is required.",
      });
    }

    const settings = await setActiveVendor(activeVendor);

    console.log("Bundle vendor setting updated:", {
      adminId: req.admin.id,
      clerkUserId: req.admin.clerkUserId,
      activeVendor: settings.activeVendor,
      updatedAt: settings.updatedAt,
    });

    return res.status(200).json({
      success: true,
      message: `Active vendor set to ${settings.activeVendor}.`,
      settings,
    });
  } catch (error) {
    console.error(
      "Update vendor settings failed:",
      error.message
    );

    const isInvalidVendor =
      error.message.startsWith("Invalid vendor");

    return res.status(isInvalidVendor ? 400 : 500).json({
      success: false,
      message: isInvalidVendor
        ? error.message
        : "Unable to update vendor settings.",
    });
  }
});

export default vendorManagementRoute;