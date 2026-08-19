import express from "express";
import upload from "../middleware/upload.js";
import { 
  createProduct,
  getCreatorProducts,
  getCreatorSales,
  getCreatorWithdrawals,
  getCreatorDashboard,
  updateCreatorProduct,
  deleteCreatorProduct
} from "../controllers/creatorProductController.js";

const createProductRouter = express.Router();

createProductRouter.post("/", upload.fields([
  {name: "cover", maxCount: 1},
  {name: "file", maxCount: 1}
]),
createProduct
);

//===================
// GET CREATOR PRODUCTS
//======================
createProductRouter.get("/",getCreatorProducts);


createProductRouter.get("/dashboard",getCreatorDashboard);


createProductRouter.get("/sales",getCreatorSales);


createProductRouter.get("/withdrawals",getCreatorWithdrawals);


creatorProductRouter.put("/:productId", updateCreatorProduct);

creatorProductRouter.delete("/:productId", deleteCreatorProduct);


export default createProductRouter;