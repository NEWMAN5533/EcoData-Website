import express from "express";
import { getActiveVendor } from "../services/vendorManager.js";

const vendorStatusRouter = express.Router();

vendorStatusRouter.get("/", async (req, res) => {
  try {
    const activeVendor = String(
      await getActiveVendor()
    ).trim().toLowerCase();

    return res.json({
      success: true,
      activeVendor
    });
  } catch (error) {
    console.error("Vendor status lookup failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify the active vendor."
    });
  }
});

export default vendorStatusRouter;