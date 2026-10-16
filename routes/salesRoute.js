import express from "express";

import {
  getCreatorSales
} from "../../controllers/creator/salesController.js";

const router =
  express.Router();

router.get(
  "/",
  getCreatorSales
);

export default router;