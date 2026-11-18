import express from "express";
import upload from "../middleware/upload.js";
import { 
  createProduct,
  getCreatorProducts,
  getCreatorSales,
  getCreatorWithdrawals,
  getCreatorDashboard,
  updateCreatorProduct,
  deleteCreatorProduct,
  createCreatorWithdrawal
} from "../controllers/creatorProductController.js";

import { requireAuth } from "../middleware/clerkAuth.js";



const createProductRouter = express.Router();

// AUTHENTICATE VISITORS
createProductRouter.use(requireAuth);

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


createProductRouter.get("/",getCreatorDashboard);


createProductRouter.get("/",getCreatorSales);


createProductRouter.get("/",getCreatorWithdrawals);

createProductRouter.post("/", createCreatorWithdrawal);


createProductRouter.put("/:productId", updateCreatorProduct);

createProductRouter.delete("/:productId", deleteCreatorProduct);


export default createProductRouter;