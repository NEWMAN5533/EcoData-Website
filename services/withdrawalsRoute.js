import express from "express";

import {
  getCreatorWithdrawals
} from "../../controllers/creator/withdrawalController.js";

const router =
  express.Router();

router.get(
  "/",
  getCreatorWithdrawals
);

export default router;