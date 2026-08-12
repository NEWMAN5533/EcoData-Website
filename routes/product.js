import express from "express";
import upload from "../middleware/upload.js";
import { 
  createProduct,
  getCreatorProducts
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


export default createProductRouter;
