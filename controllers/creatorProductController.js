
import cloudinary from "../config/cloudinary.js";
import {
  uploadToCloudinary
} from "../services/cloudinaryUpload.js";

import sql from "../backend/db.js";
import { getAuth } from "@clerk/express";
import crypto from "node:crypto";


export async function createProduct(req, res) {
  let coverUpload = null;
  let fileUpload = null;

  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    const {
      title,
      description,
      categoryId,
      price,
      youtubeUrl,
      affiliateUrl
    } = req.body;

    const type = req.body.productType;

    // ======================
    // BASIC VALIDATION
    // ======================
    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product title is required."
      });
    }

    if (!description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product description is required."
      });
    }

    const parsedCategoryId = Number(categoryId);

if (
  categoryId == null ||
  String(categoryId).trim() === "" ||
  !Number.isInteger(parsedCategoryId) ||
  parsedCategoryId <= 0
) {
  return res.status(400).json({
    success: false,
    message: "A valid product category is required."
  });
}

const categories = await sql`
  SELECT id
  FROM ecodata_categories
  WHERE id = ${parsedCategoryId}
    AND is_active = TRUE
  LIMIT 1
`;

if (categories.length === 0) {
  return res.status(400).json({
    success: false,
    message: "This product category does not exist or is inactive."
  });
}

const validCategoryId = categories[0].id;

    const validTypes = [
      "ebook",
      "notes",
      "video",
      "template",
      "zip",
      "affiliate"
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product type."
      });
    }

    const productPrice = Number(price);

    if (!Number.isFinite(productPrice) || productPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product price."
      });
    }

      // Sellers may submit products while awaiting store approval.
    // publishing remains controlled by admin approval workflow

    const sellers = await sql`
      SELECT id, status, can_publish
      FROM ecodata_sellers
      WHERE clerk_user_id = ${userId}
      LIMIT 1
    `;

    if (sellers.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Your seller profile was not found."
      });
    }

    const seller = sellers[0];

    if(seller.status === "suspended"){
      return res.status(403).json({
        success: false,
        message: "Your seller account is suspended. You cannot submit product."
      });
    }

    // ======================
    // TYPE-SPECIFIC VALIDATION
    // ======================
    const cover = req.files?.cover?.[0];
    const file = req.files?.file?.[0];

    if(!cover){
      return res.status(400).json({
        success: false,
        message: "A product cover image is required."
      });

    }

    if (
      ["ebook", "notes", "template", "zip"].includes(type) &&
      !file
    ) {
      return res.status(400).json({
        success: false,
        message: "Product file is required."
      });
    }

    if (type === "video" && !youtubeUrl?.trim()) {
      return res.status(400).json({
        success: false,
        message: "YouTube video link is required."
      });
    }

    if (type === "affiliate" && !affiliateUrl?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Affiliate URL is required."
      });
    }

    // ======================
    // CLOUDINARY COVER UPLOAD
    // ======================
    if (cover) {
      coverUpload = await uploadToCloudinary(cover.buffer, {
        resource_type: "image",
        folder: "ecodata/products/covers"
      });
    }

    const coverPublicId = coverUpload.public_id;

    // ======================
    // CLOUDINARY FILE UPLOAD
    // ======================
    if (
      file &&
      ["ebook", "notes", "template", "zip"].includes(type)
    ) {
      fileUpload = await uploadToCloudinary(file.buffer, {
        resource_type: "raw",
        folder: `ecodata/products/${type}`
      });
    }

    // ======================
    // GENERATE UNIQUE SLUG
    // ======================
    const baseSlug = title
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 150) || "product";

    const slug = `${baseSlug}-${crypto.randomUUID()}`;

    // ======================
    // SAVE PRODUCT TO NEON
    // ======================
    const products = await sql`
      INSERT INTO ecodata_products (
    seller_id,
    category_id,
    name,
    slug,
    description,
    product_type,
    product_subtype,
    price,
    status,
    image_url,
    cover_public_id,
    file_public_id,
    file_url,
    file_resource_type,
    youtube_url,
    affiliate_url,
    updated_at
  )
  VALUES (
    ${seller.id},
    ${validCategoryId},
    ${title.trim()},
    ${slug},
    ${description.trim()},
    ${"digital"},
    ${type},
    ${productPrice},
    'pending',
    ${coverUpload?.secure_url || null},
    ${coverUpload?.public_id || null},
    ${fileUpload?.public_id || null},
    ${fileUpload?.secure_url || null},
    ${fileUpload ? "raw" : null},
    ${type === "video" ? youtubeUrl.trim() : null},
    ${type === "affiliate" ? affiliateUrl.trim() : null},
    NOW()
  )
  RETURNING id, seller_id, name, slug, status, created_at
`;

    const product = products[0];

    console.log("Product created in Neon:", {
      productId: String(product.id),
      sellerId: String(product.seller_id)
    });

    return res.status(201).json({
      success: true,
      message: "Product submitted for approval.",
      productId: String(product.id),
      product
    });

  } catch (error) {
    console.error("Create product error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create product."
    });
  }
}




//==============================
 // GET CREATOR PRODUCTS
 //==============================
export async function getCreatorProducts(req, res) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    // Find the seller associated with the authenticated Clerk user.
    const sellers = await sql`
      SELECT id
      FROM ecodata_sellers
      WHERE clerk_user_id = ${userId}
      LIMIT 1
    `;

    if (sellers.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Seller profile not found."
      });
    }

    const sellerId = sellers[0].id;

    console.log("Loading products for seller:", sellerId);

    // Return only products owned by this seller.
    const products = await sql`
      SELECT
        p.id,
        p.seller_id,
        p.category_id,
        c.name AS category_name,
        p.name,
        p.slug,
        p.description,
        p.product_type,
        p.product_subtype,
        p.price,
        p.compare_at_price,
        p.stock_quantity,
        p.status,
        p.featured,
        p.image_url,
        p.youtube_url,
        p.affiliate_url,
        p.created_at,
        p.updated_at
      FROM ecodata_products p
      LEFT JOIN ecodata_categories c
        ON c.id = p.category_id
      WHERE p.seller_id = ${sellerId}
      ORDER BY p.created_at DESC
    `;

    return res.status(200).json({
      success: true,
      count: products.length,
      products
    });

  } catch (error) {
    console.error("Get creator products error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load creator products."
    });
  }
}

//====================================
 // UPDATE CREATOR PRODUCT — NEON
 //====================================
export async function updateCreatorProduct(req, res) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    const productId = String(req.params.productId || "").trim();

    if (!/^\d+$/.test(productId) || Number(productId) <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid product ID is required."
      });
    }

    // Find the authenticated seller.
    const sellers = await sql`
      SELECT id, status
      FROM ecodata_sellers
      WHERE clerk_user_id = ${userId}
      LIMIT 1
    `;

    if (sellers.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Seller profile not found."
      });
    }

    const seller = sellers[0];

    if (seller.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Your seller account is suspended."
      });
    }

    // Confirm ownership before updating.
    const existing = await sql`
      SELECT id, product_type, product_subtype
      FROM ecodata_products
      WHERE id = ${productId}
        AND seller_id = ${seller.id}
      LIMIT 1
    `;

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found for this seller."
      });
    }

    const currentProduct = existing[0];

    const {
      title,
      description,
      categoryId,
      category,
      price,
      type,
      productType,
      youtubeUrl,
      affiliateUrl
    } = req.body;

    const updates = {};

    // Product title -> database name.
    if (title !== undefined) {
      if (!String(title).trim()) {
        return res.status(400).json({
          success: false,
          message: "Product title cannot be empty."
        });
      }

      updates.name = String(title).trim();
    }

    if (description !== undefined) {
      if (!String(description).trim()) {
        return res.status(400).json({
          success: false,
          message: "Product description cannot be empty."
        });
      }

      updates.description = String(description).trim();
    }

    if (price !== undefined) {
      const productPrice = Number(price);

      if (!Number.isFinite(productPrice) || productPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid product price."
        });
      }

      updates.price = productPrice;
    }

    // Accept either categoryId or a category slug/name.
    if (categoryId !== undefined) {
      const parsedCategoryId = Number(categoryId);

      if (
        !Number.isInteger(parsedCategoryId) ||
        parsedCategoryId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "A valid category is required."
        });
      }

      const categories = await sql`
        SELECT id
        FROM ecodata_categories
        WHERE id = ${parsedCategoryId}
          AND is_active = TRUE
        LIMIT 1
      `;

      if (categories.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Category not found or inactive."
        });
      }

      updates.category_id = categories[0].id;
    } else if (category !== undefined) {
      const categoryValue = String(category).trim();

      if (!categoryValue) {
        return res.status(400).json({
          success: false,
          message: "A valid category is required."
        });
      }

      const categories = await sql`
        SELECT id
        FROM ecodata_categories
        WHERE is_active = TRUE
          AND (slug = ${categoryValue} OR name = ${categoryValue})
        LIMIT 1
      `;

      if (categories.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Category not found or inactive."
        });
      }

      updates.category_id = categories[0].id;
    }

    // Product subtype, e.g. notes, ebook, video.
    const requestedType = productType ?? type;

    if (requestedType !== undefined) {
      const validTypes = [
        "ebook",
        "notes",
        "video",
        "template",
        "zip",
        "affiliate"
      ];

      if (!validTypes.includes(requestedType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product type."
        });
      }

      updates.product_type =
        requestedType === "affiliate" ? "digital" : "digital";

      updates.product_subtype = requestedType;
    }

    if (youtubeUrl !== undefined) {
      const url = String(youtubeUrl).trim();

      if (url && currentProduct.product_subtype !== "video"
          && requestedType !== "video") {
        return res.status(400).json({
          success: false,
          message: "YouTube URL is only valid for video products."
        });
      }

      updates.youtube_url = url || null;
    }

    if (affiliateUrl !== undefined) {
      const url = String(affiliateUrl).trim();

      if (url && currentProduct.product_subtype !== "affiliate"
          && requestedType !== "affiliate") {
        return res.status(400).json({
          success: false,
          message: "Affiliate URL is only valid for affiliate products."
        });
      }

      updates.affiliate_url = url || null;
    }

    const fields = Object.keys(updates);

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid product changes were provided."
      });
    }

    // Update only explicitly supplied fields.
    const updated = await sql`
      UPDATE ecodata_products
      SET
        name = COALESCE(${updates.name ?? null}, name),
        description = CASE
          WHEN ${Object.hasOwn(updates, "description")}
          THEN ${updates.description ?? null}
          ELSE description
        END,
        price = COALESCE(${updates.price ?? null}, price),
        category_id = COALESCE(${updates.category_id ?? null}, category_id),
        product_type = COALESCE(${updates.product_type ?? null}, product_type),
        product_subtype = COALESCE(${updates.product_subtype ?? null}, product_subtype),
        youtube_url = CASE
          WHEN ${Object.hasOwn(updates, "youtube_url")}
          THEN ${updates.youtube_url ?? null}
          ELSE youtube_url
        END,
        affiliate_url = CASE
          WHEN ${Object.hasOwn(updates, "affiliate_url")}
          THEN ${updates.affiliate_url ?? null}
          ELSE affiliate_url
        END,
        updated_at = NOW()
      WHERE id = ${productId}
        AND seller_id = ${seller.id}
      RETURNING id, name, price, product_type, product_subtype,
                category_id, status, updated_at
    `;

    if (updated.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found or no longer belongs to this seller."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product: updated[0]
    });

  } catch (error) {
    console.error("Update creator product error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update product."
    });
  }
}

//====================================
 // DELETE CREATOR PRODUCT — NEON + CLERK
 //====================================
export async function deleteCreatorProduct(req, res) {
  try {
    // 1. Authenticate seller through Clerk
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    // 2. Validate product ID
    const productId = String(req.params.productId || "").trim();

    if (!/^\d+$/.test(productId) || Number(productId) <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid product ID is required."
      });
    }

    // 3. Find seller using their Clerk ID
    const sellers = await sql`
      SELECT id, status
      FROM ecodata_sellers
      WHERE clerk_user_id = ${userId}
      LIMIT 1
    `;

    if (sellers.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Seller profile not found."
      });
    }

    const seller = sellers[0];

    if (seller.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Your seller account is suspended."
      });
    }

    // 4. Verify ownership and retrieve Cloudinary IDs
    const products = await sql`
      SELECT
        p.id,
        p.seller_id,
        p.image_url,
        p.cover_public_id,
        p.file_public_id,
        p.file_resource_type
      FROM ecodata_products p
      WHERE p.id = ${productId}
        AND p.seller_id = ${seller.id}
      LIMIT 1
    `;

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found for this seller."
      });
    }

    const product = products[0];

    // 5. Prevent deletion if order records exist
    const orderItems = await sql`
      SELECT id
      FROM ecodata_order_items
      WHERE product_id = ${productId}
      LIMIT 1
    `;

    if (orderItems.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This product cannot be deleted because it has purchase records."
      });
    }

    // 6. Prevent deletion if sales records exist
    const sales = await sql`
      SELECT id
      FROM ecodata_sales
      WHERE product_id = ${productId}
      LIMIT 1
    `;

    if (sales.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This product cannot be deleted because it has sales records."
      });
    }

    // 7. Delete the product from Neon.
    // Foreign keys also protect against deletion if order/sales
    // records are inserted between our checks and this query.
    const deleted = await sql`
      DELETE FROM ecodata_products
      WHERE id = ${productId}
        AND seller_id = ${seller.id}
      RETURNING id
    `;

    if (deleted.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found or no longer belongs to this seller."
      });
    }

    // 8. Clean up Cloudinary assets after database deletion
    const cloudinaryTasks = [];

    // Delete cover only when its dedicated public ID exists
    if (product.cover_public_id) {
      cloudinaryTasks.push(
        cloudinary.uploader.destroy(
          product.cover_public_id,
          { resource_type: "image" }
        )
      );
    } else if (product.image_url) {
      console.warn(
        "Cover public ID missing; skipping cover cleanup:",
        product.id
      );
    }

    // Delete the digital file, if one exists
    if (product.file_public_id) {
      cloudinaryTasks.push(
        cloudinary.uploader.destroy(
          product.file_public_id,
          {
            resource_type: product.file_resource_type || "raw"
          }
        )
      );
    }

    const cleanupResults = await Promise.allSettled(cloudinaryTasks);

    cleanupResults.forEach((result) => {
      if (result.status === "rejected") {
        console.error(
          "Cloudinary cleanup failed:",
          result.reason
        );
      }
    });

    console.log("Product deleted successfully:", productId);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
      productId
    });

  } catch (error) {
    // Handle a concurrent purchase or another foreign-key restriction
    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message:
          "This product is linked to other records and cannot be deleted."
      });
    }

    console.error("Delete creator product error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete product."
    });
  }
}





import { getAuth } from "@clerk/express";
import sql from "../backend/db.js";

// ==========================================
// GET CREATOR DASHBOARD — CLERK + NEON
// ==========================================
export async function getCreatorDashboard(req, res) {
  try {
    // 1. Identify the seller through Clerk
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    // 2. Resolve the authenticated user's seller record
    const sellerRows = await sql`
      SELECT
        id,
        clerk_user_id,
        store_name,
        status,
        seller_verified,
        can_publish,
        can_withdraw
      FROM ecodata_sellers
      WHERE clerk_user_id = ${userId}
      LIMIT 1
    `;

    if (!sellerRows.length) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found."
      });
    }

    const seller = sellerRows[0];
    const sellerId = seller.id;

    // 3. Load products, sales, and withdrawals
    const [productsRows, salesRows, withdrawalRows] =
      await Promise.all([
        sql`
          SELECT *
          FROM ecodata_products
          WHERE seller_id = ${sellerId}
          ORDER BY created_at DESC
        `,

        sql`
          SELECT
            s.id,
            s.order_item_id,
            s.seller_id,
            s.product_id,
            s.quantity,
            s.unit_price,
            s.gross_amount,
            s.sale_status,
            s.sold_at,
            s.created_at,
            s.updated_at,
            oi.order_id,
            oi.product_name,
            o.payment_status,
            o.order_status,
            o.currency,
            o.paid_at
          FROM ecodata_sales s
          LEFT JOIN ecodata_order_items oi
            ON oi.id = s.order_item_id
          LEFT JOIN ecodata_orders o
            ON o.id = oi.order_id
          WHERE s.seller_id = ${sellerId}
          ORDER BY s.created_at DESC
        `,

        sql`
          SELECT
            id,
            seller_id,
            amount,
            currency,
            payout_method,
            status,
            transaction_reference,
            requested_at,
            reviewed_at,
            paid_at,
            created_at,
            updated_at
          FROM ecodata_withdrawals
          WHERE seller_id = ${sellerId}
          ORDER BY requested_at DESC
        `
      ]);

    // 4. Preserve familiar frontend field names
    const products = productsRows.map(product => ({
      ...product,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      views: 0
    }));

    const sales = salesRows.map(sale => ({
      ...sale,
      createdAt: sale.created_at,
      soldAt: sale.sold_at,
      creatorShare: 0
    }));

    const withdrawals = withdrawalRows.map(withdrawal => ({
      ...withdrawal,
      requestedAt: withdrawal.requested_at,
      createdAt: withdrawal.created_at,
      updatedAt: withdrawal.updated_at,
      paid: withdrawal.status === "paid"
    }));

    // 5. Product statistics
    const totalProducts = products.length;

    const publishedProducts = products.filter(
      product =>
        String(product.status || "").toLowerCase() === "published"
    ).length;

    const pendingProducts = products.filter(
      product =>
        String(product.status || "").toLowerCase() === "pending"
    ).length;

    // 6. Count and calculate only eligible sales
    // Confirm these status values match your checkout workflow.
    const eligibleSales = sales.filter(sale => {
      const saleStatus =
        String(sale.sale_status || "").toLowerCase();

      const paymentStatus =
        String(sale.payment_status || "").toLowerCase();

      const orderStatus =
        String(sale.order_status || "").toLowerCase();

      return (
        saleStatus === "completed" &&
        paymentStatus === "paid" &&
        ["completed", "delivered"].includes(orderStatus)
      );
    });

    let totalRevenue = 0;
    let totalEarnings = 0;
    let platformFees = 0;

    const chartMap = new Map();

    for (const sale of eligibleSales) {
      const revenue = Number(sale.gross_amount || 0);

      if (!Number.isFinite(revenue) || revenue <= 0) {
        continue;
      }

      const earnings = revenue * 0.70;
      const fee = revenue * 0.30;

      totalRevenue += revenue;
      totalEarnings += earnings;
      platformFees += fee;

      const timestamp = sale.sold_at || sale.created_at;

      if (!timestamp) continue;

      const dateKey = new Date(timestamp)
        .toISOString()
        .slice(0, 10);

      if (!chartMap.has(dateKey)) {
        chartMap.set(dateKey, {
          date: dateKey,
          sales: 0,
          revenue: 0,
          earnings: 0,
          platformFees: 0
        });
      }

      const day = chartMap.get(dateKey);
      day.sales += 1;
      day.revenue += revenue;
      day.earnings += earnings;
      day.platformFees += fee;
    }

    // Add the calculated share to each sale for the frontend
    for (const sale of sales) {
      const isEligible = eligibleSales.some(
        eligible => eligible.id === sale.id
      );

      const revenue = Number(sale.gross_amount || 0);

      sale.creatorShare = isEligible
        ? Number((revenue * 0.70).toFixed(2))
        : 0;
    }

    // 7. Views are not stored in the current products schema
    const totalViews = 0;
    const conversionRate = 0;

    // 8. Reserve withdrawals that have not reached a final state
    const reservedStatuses = new Set([
      "pending",
      "approved",
      "processing"
    ]);

    const withdrawalAmount = withdrawals
      .filter(withdrawal => withdrawal.status === "paid")
      .reduce((sum, withdrawal) => {
        const amount = Number(withdrawal.amount || 0);
        return sum + (
          Number.isFinite(amount) && amount > 0 ? amount : 0
        );
      }, 0);

    const reservedWithdrawalAmount = withdrawals
      .filter(withdrawal =>
        reservedStatuses.has(
          String(withdrawal.status || "").toLowerCase()
        )
      )
      .reduce((sum, withdrawal) => {
        const amount = Number(withdrawal.amount || 0);
        return sum + (
          Number.isFinite(amount) && amount > 0 ? amount : 0
        );
      }, 0);

    const availableBalance = Math.max(
      0,
      totalEarnings -
        withdrawalAmount -
        reservedWithdrawalAmount
    );

    // 9. Chart data
    const chartData = Array.from(chartMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(day => ({
        date: day.date,
        sales: day.sales,
        revenue: Number(day.revenue.toFixed(2)),
        earnings: Number(day.earnings.toFixed(2)),
        platformFees: Number(day.platformFees.toFixed(2))
      }));

    const money = value => Number(value.toFixed(2));

    // 10. Response — keep existing frontend structure
    return res.status(200).json({
      success: true,

      dashboard: {
        totalProducts,
        publishedProducts,
        pendingProducts,
        totalSales: eligibleSales.length,
        totalRevenue: money(totalRevenue),
        totalEarnings: money(totalEarnings),
        platformFees: money(platformFees),
        availableBalance: money(availableBalance),
        conversionRate,
        views: totalViews,
        withdrawalAmount: money(withdrawalAmount)
      },

      chart: {
        labels: chartData.map(day => day.date),
        sales: chartData.map(day => day.sales),
        revenue: chartData.map(day => day.revenue),
        earnings: chartData.map(day => day.earnings),
        platformFees: chartData.map(day => day.platformFees),
        data: chartData
      },

      products,
      sales,
      withdrawals
    });

  } catch (error) {
    console.error("Get creator dashboard failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard."
    });
  }
}


// ==========================================
// GET CREATOR DASHBOARD — CLERK + NEON
// ==========================================
export async function getCreatorDashboard(req, res) {
  try {
    // 1. Identify the seller through Clerk
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    // 2. Resolve the authenticated user's seller record
    const sellerRows = await sql`
      SELECT
        id,
        clerk_user_id,
        store_name,
        status,
        seller_verified,
        can_publish,
        can_withdraw
      FROM ecodata_sellers
      WHERE clerk_user_id = ${userId}
      LIMIT 1
    `;

    if (!sellerRows.length) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found."
      });
    }

    const seller = sellerRows[0];
    const sellerId = seller.id;

    // 3. Load products, sales, and withdrawals
    const [productsRows, salesRows, withdrawalRows] =
      await Promise.all([
        sql`
          SELECT *
          FROM ecodata_products
          WHERE seller_id = ${sellerId}
          ORDER BY created_at DESC
        `,

        sql`
          SELECT
            s.id,
            s.order_item_id,
            s.seller_id,
            s.product_id,
            s.quantity,
            s.unit_price,
            s.gross_amount,
            s.sale_status,
            s.sold_at,
            s.created_at,
            s.updated_at,
            oi.order_id,
            oi.product_name,
            o.payment_status,
            o.order_status,
            o.currency,
            o.paid_at
          FROM ecodata_sales s
          LEFT JOIN ecodata_order_items oi
            ON oi.id = s.order_item_id
          LEFT JOIN ecodata_orders o
            ON o.id = oi.order_id
          WHERE s.seller_id = ${sellerId}
          ORDER BY s.created_at DESC
        `,

        sql`
          SELECT
            id,
            seller_id,
            amount,
            currency,
            payout_method,
            status,
            transaction_reference,
            requested_at,
            reviewed_at,
            paid_at,
            created_at,
            updated_at
          FROM ecodata_withdrawals
          WHERE seller_id = ${sellerId}
          ORDER BY requested_at DESC
        `
      ]);

    // 4. Preserve familiar frontend field names
    const products = productsRows.map(product => ({
      ...product,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      views: 0
    }));

    const sales = salesRows.map(sale => ({
      ...sale,
      createdAt: sale.created_at,
      soldAt: sale.sold_at,
      creatorShare: 0
    }));

    const withdrawals = withdrawalRows.map(withdrawal => ({
      ...withdrawal,
      requestedAt: withdrawal.requested_at,
      createdAt: withdrawal.created_at,
      updatedAt: withdrawal.updated_at,
      paid: withdrawal.status === "paid"
    }));

    // 5. Product statistics
    const totalProducts = products.length;

    const publishedProducts = products.filter(
      product =>
        String(product.status || "").toLowerCase() === "published"
    ).length;

    const pendingProducts = products.filter(
      product =>
        String(product.status || "").toLowerCase() === "pending"
    ).length;

    // 6. Count and calculate only eligible sales
    // Confirm these status values match your checkout workflow.
    const eligibleSales = sales.filter(sale => {
      const saleStatus =
        String(sale.sale_status || "").toLowerCase();

      const paymentStatus =
        String(sale.payment_status || "").toLowerCase();

      const orderStatus =
        String(sale.order_status || "").toLowerCase();

      return (
        saleStatus === "completed" &&
        paymentStatus === "paid" &&
        ["completed", "delivered"].includes(orderStatus)
      );
    });

    let totalRevenue = 0;
    let totalEarnings = 0;
    let platformFees = 0;

    const chartMap = new Map();

    for (const sale of eligibleSales) {
      const revenue = Number(sale.gross_amount || 0);

      if (!Number.isFinite(revenue) || revenue <= 0) {
        continue;
      }

      const earnings = revenue * 0.70;
      const fee = revenue * 0.30;

      totalRevenue += revenue;
      totalEarnings += earnings;
      platformFees += fee;

      const timestamp = sale.sold_at || sale.created_at;

      if (!timestamp) continue;

      const dateKey = new Date(timestamp)
        .toISOString()
        .slice(0, 10);

      if (!chartMap.has(dateKey)) {
        chartMap.set(dateKey, {
          date: dateKey,
          sales: 0,
          revenue: 0,
          earnings: 0,
          platformFees: 0
        });
      }

      const day = chartMap.get(dateKey);
      day.sales += 1;
      day.revenue += revenue;
      day.earnings += earnings;
      day.platformFees += fee;
    }

    // Add the calculated share to each sale for the frontend
    for (const sale of sales) {
      const isEligible = eligibleSales.some(
        eligible => eligible.id === sale.id
      );

      const revenue = Number(sale.gross_amount || 0);

      sale.creatorShare = isEligible
        ? Number((revenue * 0.70).toFixed(2))
        : 0;
    }

    // 7. Views are not stored in the current products schema
    const totalViews = 0;
    const conversionRate = 0;

    // 8. Reserve withdrawals that have not reached a final state
    const reservedStatuses = new Set([
      "pending",
      "approved",
      "processing"
    ]);

    const withdrawalAmount = withdrawals
      .filter(withdrawal => withdrawal.status === "paid")
      .reduce((sum, withdrawal) => {
        const amount = Number(withdrawal.amount || 0);
        return sum + (
          Number.isFinite(amount) && amount > 0 ? amount : 0
        );
      }, 0);

    const reservedWithdrawalAmount = withdrawals
      .filter(withdrawal =>
        reservedStatuses.has(
          String(withdrawal.status || "").toLowerCase()
        )
      )
      .reduce((sum, withdrawal) => {
        const amount = Number(withdrawal.amount || 0);
        return sum + (
          Number.isFinite(amount) && amount > 0 ? amount : 0
        );
      }, 0);

    const availableBalance = Math.max(
      0,
      totalEarnings -
        withdrawalAmount -
        reservedWithdrawalAmount
    );

    // 9. Chart data
    const chartData = Array.from(chartMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(day => ({
        date: day.date,
        sales: day.sales,
        revenue: Number(day.revenue.toFixed(2)),
        earnings: Number(day.earnings.toFixed(2)),
        platformFees: Number(day.platformFees.toFixed(2))
      }));

    const money = value => Number(value.toFixed(2));

    // 10. Response — keep existing frontend structure
    return res.status(200).json({
      success: true,

      dashboard: {
        totalProducts,
        publishedProducts,
        pendingProducts,
        totalSales: eligibleSales.length,
        totalRevenue: money(totalRevenue),
        totalEarnings: money(totalEarnings),
        platformFees: money(platformFees),
        availableBalance: money(availableBalance),
        conversionRate,
        views: totalViews,
        withdrawalAmount: money(withdrawalAmount)
      },

      chart: {
        labels: chartData.map(day => day.date),
        sales: chartData.map(day => day.sales),
        revenue: chartData.map(day => day.revenue),
        earnings: chartData.map(day => day.earnings),
        platformFees: chartData.map(day => day.platformFees),
        data: chartData
      },

      products,
      sales,
      withdrawals
    });

  } catch (error) {
    console.error("Get creator dashboard failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard."
    });
  }
}



//=======================
 // GET CREATOR SALES
 // CLERK + NEON
 //=======================
export async function getCreatorSales(req, res) {
  try {
    // 1. Get authenticated Clerk user
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    // 2. Find the seller profile
    const sellerRows = await sql`
      SELECT id
      FROM ecodata_sellers
      WHERE clerk_user_id = ${userId}
      LIMIT 1
    `;

    if (!sellerRows.length) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found."
      });
    }

    const sellerId = sellerRows[0].id;

    // 3. Fetch this seller's sales
    const rows = await sql`
      SELECT
        s.id,
        s.order_item_id,
        s.seller_id,
        s.product_id,
        s.quantity,
        s.unit_price,
        s.gross_amount,
        s.sale_status,
        s.sold_at,
        s.created_at,
        s.updated_at,
        oi.order_id,
        oi.product_name,
        oi.product_type,
        oi.product_subtype,
        o.payment_status,
        o.order_status,
        o.currency,
        o.payment_reference,
        o.paid_at
      FROM ecodata_sales s
      LEFT JOIN ecodata_order_items oi
        ON oi.id = s.order_item_id
      LEFT JOIN ecodata_orders o
        ON o.id = oi.order_id
      WHERE s.seller_id = ${sellerId}
      ORDER BY s.created_at DESC
    `;

    // 4. Preserve frontend-friendly fields
    const sales = rows.map(sale => {
      const grossAmount = Number(sale.gross_amount || 0);

      const saleStatus =
        String(sale.sale_status || "").toLowerCase();

      const paymentStatus =
        String(sale.payment_status || "").toLowerCase();

      const orderStatus =
        String(sale.order_status || "").toLowerCase();

      const eligible =
        saleStatus === "completed" &&
        paymentStatus === "paid" &&
        ["completed", "delivered"].includes(orderStatus);

      return {
        ...sale,
        createdAt: sale.created_at,
        soldAt: sale.sold_at,
        creatorShare:
          eligible && Number.isFinite(grossAmount)
            ? Number((grossAmount * 0.70).toFixed(2))
            : 0
      };
    });

    return res.status(200).json({
      success: true,
      count: sales.length,
      sales
    });

  } catch (error) {
    console.error("Get creator sales error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load creator sales."
    });
  }
}

//==========================
 // GET CREATOR WITHDRAWALS
 // CLERK + NEON
 //==========================
export async function getCreatorWithdrawals(req, res) {
  try {
    // 1. Authenticate using Clerk
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    // 2. Resolve seller from authenticated Clerk ID
    const sellerRows = await sql`
      SELECT id
      FROM ecodata_sellers
      WHERE clerk_user_id = ${userId}
      LIMIT 1
    `;

    if (!sellerRows.length) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found."
      });
    }

    const sellerId = sellerRows[0].id;

    // 3. Fetch this seller's withdrawal history
    const rows = await sql`
      SELECT
        id,
        seller_id,
        amount,
        currency,
        payout_method,
        status,
        transaction_reference,
        admin_notes,
        requested_at,
        reviewed_at,
        paid_at,
        created_at,
        updated_at
      FROM ecodata_withdrawals
      WHERE seller_id = ${sellerId}
      ORDER BY requested_at DESC
    `;

    // 4. Preserve frontend-friendly field names
    const withdrawals = rows.map(withdrawal => ({
      ...withdrawal,
      requestedAt: withdrawal.requested_at,
      reviewedAt: withdrawal.reviewed_at,
      paidAt: withdrawal.paid_at,
      createdAt: withdrawal.created_at,
      updatedAt: withdrawal.updated_at,
      paid: withdrawal.status === "paid"
    }));

    return res.status(200).json({
      success: true,
      count: withdrawals.length,
      withdrawals
    });

  } catch (error) {
    console.error("Get creator withdrawals error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdrawals."
    });
  }
}
