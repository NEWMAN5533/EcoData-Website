import express from "express";

import {
  createProduct,
  getCreatorProducts,
  updateCreatorProduct,
  deleteCreatorProduct
} from "../../controllers/creator/productController.js";

const router =
  express.Router();

router.post(
  "/",
  createProduct
);

router.get(
  "/",
  getCreatorProducts
);

router.put(
  "/:productId",
  updateCreatorProduct
);

router.delete(
  "/:productId",
  deleteCreatorProduct
);

export default router;