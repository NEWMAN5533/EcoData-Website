import express from "express";

import {
  getCreatorDashboard
} from "../../controllers/creator/dashboardController.js";

const router =
  express.Router();

router.get(
  "/",
  getCreatorDashboard
);

export default router;