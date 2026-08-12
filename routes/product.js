import express from "express";
import upload from "../middleware/upload.js";
import { 
  createProduct
} from "../controllers/creatorProductController.js";

const createProductRouter = express.Router();

createProductRouter.post("/", upload.fields([
  {name: "cover", maxCount: 1},
  {name: "file", maxCount: 1}
]),
createProduct
);
export default createProductRouter;
