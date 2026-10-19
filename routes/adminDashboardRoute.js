import express from "express";
import { requiredAdmin } from "../middleware/clerkAuth.js";

const adminAccessDashboardRouter = express.Router();

// GET/api/adminDashboard
adminAccessDashboardRouter.get("/dashboard", requiredAdmin, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Admin dashboard access verified.",
    admin: {
      id: req.admin.id,
      clerkUserId: req.admin.clerkUserId
    },
    dashboard:  {
      title: "EcoData Store Administration",
      section: [
        "Overview",
        "Orders",
        "Users",
        "Sellers",
        "Products",
        "Settings"
      ]
    }
  });
});

export default adminAccessDashboardRouter;