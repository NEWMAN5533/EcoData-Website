import express from "express";
import { timingSafeEqual } from "node:crypto";
import { setActiveVendor } from "../services/vendorManager.js";

const vendorSettingsRouter = express.Router();

function verifySuperAdminKey(req, res, next) {
  const expectedKey = process.env.ECODATA_SUPER_ADMIN_KEY;
  const suppliedKey = req.get("x-ecodata-super-admin-key");

  if (!expectedKey) {
    return res.status(500).json({
      success: false,
      message: "Super-admin key is not configured."
    });
  }

  if (!suppliedKey) {
    return res.status(401).json({
      success: false,
      message: "Super-admin authorization is required."
    });
  }

  const expected = Buffer.from(expectedKey, "utf8");
  const supplied = Buffer.from(suppliedKey, "utf8");

  if (
    expected.length !== supplied.length ||
    !timingSafeEqual(expected, supplied)
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid super-admin key."
    });
  }

  next();
}

// Only authorized requests can change the active vendor.
vendorSettingsRouter.post("/", verifySuperAdminKey, async (req, res) => {
  try {
    const vendor = String(req.body?.vendor || "")
      .trim()
      .toLowerCase();

    if (!["swiftdata", "datamart"].includes(vendor)) {
      return res.status(400).json({
        success: false,
        message: "Choose swiftdata or datamart."
      });
    }

    const settings = await setActiveVendor(vendor);

    return res.json({
      success: true,
      activeVendor: settings.activeVendor,
      updatedAt: settings.updatedAt,
      message: `Active vendor changed to ${settings.activeVendor}.`
    });
  } catch (error) {
    console.error("Vendor update failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update the active vendor."
    });
  }
});

export default vendorSettingsRouter;