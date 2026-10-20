import express from "express";
import { getAuth } from "@clerk/express";

import sql from "../../backend/db.js";
import { requireAuth } from "../../middleware/clerkAuth.js";

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
  if (!req.seller.can_publish) {
    return res.status(403).json({
      success: false,
      message: "Your account is not currently allowed to publish products."
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

router.get(
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

router.post(
  "/",
  requireAuth,
  loadSeller,
  requirePublishPermission,
  async (req, res) => {
    try {
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
        coverUrl
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

      if (!["physical", "digital"].includes(rawType)) {
        return res.status(400).json({
          success: false,
          message: "Product type must be physical or digital."
        });
      }

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

      if (rawType === "physical" && parsedStock === null) {
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

      const productImage = String(
        imageUrl ?? coverUrl ?? ""
      ).trim();

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
          price,
          compare_at_price,
          stock_quantity,
          status,
          image_url
        )
        VALUES (
          ${req.seller.id},
          ${parsedCategoryId},
          ${productName},
          ${slug},
          ${productDescription || null},
          ${rawType},
          ${parsedPrice},
          ${parsedCompareAtPrice},
          ${parsedStock},
          'pending',
          ${productImage || null}
        )
        RETURNING
          id,
          seller_id,
          category_id,
          name,
          slug,
          description,
          product_type,
          price,
          compare_at_price,
          stock_quantity,
          status,
          featured,
          image_url,
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
