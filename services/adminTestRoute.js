
import { getAuth } from "@clerk/express";
import { requiredAdmin } from "../middleware/clerkAuth.js";
import express from "express";

// define route
const adminTestRouter = express.Router();

// GET/api/admin/test
adminTestRouter.get("/test", requiredAdmin, (req, res) => {
  const { userId } = getAuth(req);

  return res.status(200).json({
    success: true,
    message: "Admin authentication successful.",
    admin: {
      clerkUserId: userId,
      adminDatabaseId: req.admin.id
    }
  });
});

export default adminTestRouter;