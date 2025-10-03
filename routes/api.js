// routes/api.js
import express from "express";
import { buyDataBundle } from "../controllers/dataController.js";

const router = express.Router();

// POST /api/buy-data
router.post("/buy-data", buyDataBundle);

export default router;

