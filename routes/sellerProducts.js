import express from "express";
import { getAuth } from "@clerk/express";

import sql from "../backend/db.js";
import { requireAuth } from "../middleware/clerkAuth.js";

import upload from "../middleware/upload.js";
import { uploadToCloudinary } from "../services/cloudinaryUpload.js";

const sellerProductsRouter = express.Router();

// ==========================================
// LOAD THE AUTHENTICATED SELLER
// ==========================================

async function loadSeller(req, res, next) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please sign in to continue."
      });
    }

    const sellers = await sql`
      SELECT
        id,
        clerk_user_id,
        store_name,
        status,
        can_publish
      FROM ecodata_sellers
      WHERE clerk_user_id = ${userId}
      LIMIT 1
    `;

    if (!sellers.length) {
      return res.status(403).json({
        success: false,
        message: "No seller profile was found for this account."
      });
    }

    req.seller = sellers[0];

    next();
  } catch (error) {
    console.error("Load seller error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify your seller account."
    });
  }
}

// ==========================================
// CHECK PRODUCT PUBLISHING PERMISSION
// ==========================================

function requirePublishPermission(req, res, next) {
  // Block sellers who are not approved.
  if (req.seller.status !== "approved") {
    return res.status(403).json({
      success: false,
      code: "SELLER_NOT_APPROVED",
      message: "Your seller account must be approved before you can publish products."
    });
  }

  // Block sellers without publishing permission.
  if (req.seller.can_publish !== true) {
    return res.status(403).json({
      success: false,
      code: "PUBLISH_PERMISSION_REQUIRED",
      message: "Your account has not been granted permission to publish products."
    });
  }

  next();
}

// ==========================================
// FORMAT PRODUCTS FOR THE EXISTING FRONTEND
// ==========================================

function formatProduct(product) {
  return {
    id: String(product.id),
    productId: String(product.id),

    title: product.name,
    name: product.name,

    description: product.description || "",

    type: product.product_type,
    productType: product.product_type,
    product_type: product.product_type,

    subtype: product.product_subtype || "",
    productSubtype: product.product_subtype || "",
    product_subtype: product.product_subtype || "",

    youtubeUrl: product.youtube_url || "",
    affiliateUrl: product.affiliate_url || "",

    price: Number(product.price),
    compareAtPrice:
      product.compare_at_price == null
        ? null
        : Number(product.compare_at_price),

    stockQuantity: product.stock_quantity,

    categoryId:
      product.category_id == null
        ? null
        : String(product.category_id),

    category: product.category_name || "",

    coverUrl: product.image_url || "",
    imageUrl: product.image_url || "",

    status: product.status,

    // Real sales data will be connected to order records later.
    sales: 0,

    createdAt: product.created_at,
    updatedAt: product.updated_at
  };
}

// ==========================================
// GET THE AUTHENTICATED SELLER'S PRODUCTS
// GET /api/seller/products
// ==========================================

sellerProductsRouter.get(
  "/",
  requireAuth,
  loadSeller,
  async (req, res) => {
    try {
      const products = await sql`
        SELECT
          p.id,
          p.seller_id,
          p.category_id,
          p.name,
          p.slug,
          p.description,
          p.product_type,
          p.product_subtype,
          p.youtube_url,
          p.affiliate_url,
          p.price,
          p.compare_at_price,
          p.stock_quantity,
          p.status,
          p.featured,
          p.image_url,
          p.created_at,
          p.updated_at,
          c.name AS category_name
        FROM ecodata_products AS p
        LEFT JOIN ecodata_categories AS c
          ON c.id = p.category_id
        WHERE p.seller_id = ${req.seller.id}
        ORDER BY p.created_at DESC
      `;

      return res.json({
        success: true,
        products: products.map(formatProduct)
      });
    } catch (error) {
      console.error("Get seller products error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load your products."
      });
    }
  }
);

// ==========================================
// CREATE A PRODUCT
// POST /api/seller/products
// ==========================================

sellerProductsRouter.post(
  "/",
  requireAuth,
  loadSeller,
  requirePublishPermission,
   upload.fields([
    { name: "cover", maxCount: 1},
    { name: "file", maxCount: 1}
  ]),
  async (req, res) => {
    try {

      const coverFile = req.files?.cover?.[0] || null;
      const productFile = req.files?.file?.[0] || null;

      const {
        title,
        name,
        description,
        productType,
        type,
        price,
        compareAtPrice,
        stockQuantity,
        categoryId,
        imageUrl,
        coverUrl,
        youtubeUrl,
        affiliateUrl
      } = req.body || {};

      const productName = String(name ?? title ?? "").trim();
      const productDescription =
        String(description ?? "").trim();

      const rawType = String(
        productType ?? type ?? ""
      ).trim().toLowerCase();

      const parsedPrice = Number(price);

      if (!productName || productName.length > 200) {
        return res.status(400).json({
          success: false,
          message: "Enter a product name of 1–200 characters."
        });
      }

    

      const productTypeMap = {
  physical: { type: "physical", subtype: "physical" },
  digital: { type: "digital", subtype: "digital" },
  ebook: { type: "digital", subtype: "ebook" },
  notes: { type: "digital", subtype: "notes" },
  video: { type: "digital", subtype: "video" },
  templates: { type: "digital", subtype: "templates" },
  template: { type: "digital", subtype: "templates" },
  zip: { type: "digital", subtype: "zip" },
  affiliate: { type: "digital", subtype: "affiliate" },
  service: { type: "physical", subtype: "service" }
};

const mappedProductType = productTypeMap[rawType];

if (!mappedProductType) {
  return res.status(400).json({
    success: false,
    message: "Choose a valid product type."
  });
}

const databaseProductType = mappedProductType.type;
const productSubtype = mappedProductType.subtype;



      if (
        price === undefined ||
        price === null ||
        String(price).trim() === "" ||
        !Number.isFinite(parsedPrice) ||
        parsedPrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid non-negative product price."
        });
      }

      let parsedCompareAtPrice = null;

      if (
        compareAtPrice !== undefined &&
        compareAtPrice !== null &&
        String(compareAtPrice).trim() !== ""
      ) {
        parsedCompareAtPrice = Number(compareAtPrice);

        if (
          !Number.isFinite(parsedCompareAtPrice) ||
          parsedCompareAtPrice < parsedPrice
        ) {
          return res.status(400).json({
            success: false,
            message: "The compare-at price must be at least the product price."
          });
        }
      }

      let parsedStock = null;

      if (
        stockQuantity !== undefined &&
        stockQuantity !== null &&
        String(stockQuantity).trim() !== ""
      ) {
        parsedStock = Number(stockQuantity);

        if (
          !Number.isInteger(parsedStock) ||
          parsedStock < 0
        ) {
          return res.status(400).json({
            success: false,
            message: "Stock quantity must be a non-negative whole number."
          });
        }
      }

      if (mappedProductType.subtype === "physical" && parsedStock === null) {
        return res.status(400).json({
          success: false,
          message: "Enter the stock quantity for a physical product."
        });
      }

      const rawCategoryId =
        categoryId == null ? "" : String(categoryId).trim();

      let parsedCategoryId = null;

      if (rawCategoryId) {
        if (!/^\d+$/.test(rawCategoryId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid product category."
          });
        }

        parsedCategoryId = rawCategoryId;

        const categories = await sql`
          SELECT id
          FROM ecodata_categories
          WHERE id = ${parsedCategoryId}
            AND is_active = TRUE
          LIMIT 1
        `;

        if (!categories.length) {
          return res.status(400).json({
            success: false,
            message: "The selected category is unavailable."
          });
        }
      }

    // 1. Get the existing image URL
const productImage = String(
  imageUrl ?? coverUrl ?? ""
).trim();

// 2. Validate the existing image URL
if (productImage) {
  try {
    const parsedUrl = new URL(productImage);

    if (parsedUrl.protocol !== "https:") {
      throw new Error("HTTPS required");
    }
  } catch {
    return res.status(400).json({
      success: false,
      message: "The product image must be a valid HTTPS URL."
    });
  }
}

// 3. Upload the new cover image HERE
let uploadedCoverUrl = productImage || "";

if (coverFile) {
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(coverFile.mimetype)) {
    return res.status(400).json({
      success: false,
      message: "The cover must be an image file."
    });
  }

  const coverUpload = await uploadToCloudinary(
    coverFile.buffer,
    {
      folder: "ecodata/products/covers",
      resource_type: "image"
    }
  );

  uploadedCoverUrl = coverUpload.secure_url;
}


if (!uploadedCoverUrl) {
  return res.status(400).json({
    success: false,
    message: "Please provide a product cover image."
  });
}

// 4. Continue with your existing slug generation and SQL INSERT



// Validate YouTube and affiliate URLs.
function validateOptionalUrl(value, allowedHosts) {
  const url = String(value ?? "").trim();

  if (!url) return null;

  try {
    const parsed = new URL(url);

    if (
      parsed.protocol !== "https:" ||
      !allowedHosts.some(
        host =>
          parsed.hostname === host ||
          parsed.hostname.endsWith(`.${host}`)
      )
    ) {
      return false;
    }

    return parsed.href;
  } catch {
    return false;
  }
}

const parsedYoutubeUrl = validateOptionalUrl(
  youtubeUrl,
  ["youtube.com", "youtu.be"]
);


const parsedAffiliateUrl = validateOptionalUrl(
  affiliateUrl,
  ["amazon.com"]
);


if (parsedYoutubeUrl === false) {
  return res.status(400).json({
    success: false,
    message: "Enter a valid HTTPS YouTube URL."
  });
}



if (parsedAffiliateUrl === false) {
  return res.status(400).json({
    success: false,
    message: "Enter a valid HTTPS Amazon affiliate URL."
  });
}


if(productSubtype === "video" && ! parsedYoutubeUrl){
  return res.status(400).json({
    message: "An YouTube URL is required for video products."
  });
}


if(productSubtype === "affiliate" && !parsedAffiliateUrl){
  return res.status(400).json({
    message: "An affiliate URL is required for affiliate products."
  });
}


const fileRequiredTypes = [
  "ebook",
  "notes",
  "templates",
  "zip"
];

if (fileRequiredTypes.includes(productSubtype) && !productFile) {
  return res.status(400).json({
    success: false,
    message: "Please select the digital product file to upload."
  });
}

if (productFile && !fileRequiredTypes.includes(productSubtype)) {
  return res.status(400).json({
    success: false,
    message: "File uploads are only supported for ebooks, notes, templates, and ZIP products."
  });
}



let uploadedProductFile = null;

if (productFile) {
  const allowedFileTypes = {
    ebook: ["application/pdf"],
    notes: ["application/pdf"],
    templates: [
      "application/pdf",
      "application/zip",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ],
    zip: [
      "application/zip",
      "application/x-zip-compressed"
    ]
  };

  const allowedMimeTypes = allowedFileTypes[productSubtype] || [];

  if (!allowedMimeTypes.includes(productFile.mimetype)) {
    return res.status(400).json({
      success: false,
      message: "This file format is not supported for the selected product type."
    });
  }

  const fileUpload = await uploadToCloudinary(
    productFile.buffer,
    {
      folder: "ecodata/products/files",
      resource_type: "raw",
      type: "authenticated"
    }
  );

  uploadedProductFile = {
    publicId: fileUpload.public_id,
    resourceType: fileUpload.resource_type
  };
}


      // Add a suffix so products with similar names
      // do not conflict on the unique slug constraint.
      const baseSlug =
        productName
          .toLowerCase()
          .normalize("NFKD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 180) || "product";

      const slug =
        `${baseSlug}-${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;

      const inserted = await sql`
        INSERT INTO ecodata_products (
          seller_id,
          category_id,
          name,
          slug,
          description,
          product_type,
          product_subtype,
          youtube_url,
          affiliate_url,
          price,
          compare_at_price,
          stock_quantity,
          status,
          image_url,
          file_public_id,
          file_resource_type
        )
    VALUES (
        ${req.seller.id},
        ${parsedCategoryId},
        ${productName},
        ${slug},
        ${productDescription || null},
        ${databaseProductType},
        ${productSubtype},
        ${parsedYoutubeUrl},
        ${parsedAffiliateUrl},
        ${parsedPrice},
        ${parsedCompareAtPrice},
        ${parsedStock},
        'pending',
        ${uploadedCoverUrl || null},
        ${uploadedProductFile?.publicId || null},
        ${uploadedProductFile?.resourceType || null}
      )
        RETURNING
          id,
          seller_id,
          category_id,
          name,
          slug,
          description,
          product_type,
          product_subtype,
          youtube_url,
          affiliate_url,
          price,
          compare_at_price,
          stock_quantity,
          status,
          featured,
          image_url,
          file_public_id,
          file_resource_type,
          created_at,
          updated_at
      `;

      return res.status(201).json({
        success: true,
        message: "Product submitted successfully for review.",
        product: formatProduct(inserted[0])
      });
    } catch (error) {
      console.error("Create seller product error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to create your product."
      });
    }
  }
);

export default sellerProductsRouter;