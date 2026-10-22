import express from "express";
import multer from "multer";
import { getAuth } from "@clerk/express";

import { sql } from "../backend/db.js";
import { uploadToCloudinary } from "../services/cloudinaryUpload.js";

const sellerLogoRouter = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB MAXIMUM
  },
  fileFilter: (req, file, callback) =>{
   const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
   ];

   if(!allowedTypes.includes(file.mimetype)){
    return callback(
      new Error("Only JPG, PNG, and WebP images are allowed.")
    );
   }

   callback(null, true);
  }
});

sellerLogoRouter.post(
  "/",
  async (req, res, next) => {
    const { userId } = getAuth(req);

    if(!userId){
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    next();
  },
  (req, res, next) => {
    upload.single("logo")(req, res, (error) => {
      if(error){
        return res.status(400).json({
          success: false,
          message: error.code === "LIMIT_FILE_SIZE"
          ? "Logo must not exceed 5 MB."
          : error.message || "Invalid logo upload."
        });
      }

      next();
    });
  },
  async (req, res) => {
    try{
      const { userId } = getAuth(req);

      if(!userId){
        return res.status(401).json({
          success: false,
          message: "Authentication required."
        });
      }

      if(!req.file){
        return res.status(400).json({
          success: false,
          message: "Please select a logo image."
        });
      }

      // Upload using existing Cloudinary helper
      const uploaded = await uploadToCloudinary(
        req.file.buffer,
        {
          resource_type: "image",
          folder: "ecodata/seller-logo",
          public_id: `seller_${userId.replace(/[^a-zA-Z0-9_-]/g, "_")}`
        }
      );
      if(!uploaded?.secure__url){
        throw new Error("Cloudinary did not return a secure image URL.");
      }
      // SAVE URL to auth seller
      const rows = await sql `
      UPDATE ecodata_sellers
      SET
      store_logo_url = ${uploaded.secure__url},
      updated_at = NOW()
      WHERE clerk_user_id = ${userId}
      RETURNING store_logo_url
      `;

      if(rows.length === 0 ){
        return res.status(404).json({
          success: false,
          message: "Seller profile not found."
        });
      }
      return res.status(200).json({
        success: true,
        message: "Seller logo uploaded successfully.",
        logoUrl: rows[0].store_logo_url
      });
    } catch(error){
      console.error("Seller logo uploaded error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to upload seller logo."
      });
    }
  }
);

export default sellerLogoRouter;