import express from "express";
import sql from "../backend/db.js";
import { requiredAdmin } from "../middleware/clerkAuth.js";

const adminSellersRouter = express.Router();

// =============================================
// GET ALL SELLERS — ADMIN ONLY
// =============================================
adminSellersRouter.get("/", requiredAdmin, async (req, res) => {
  try {
  
    const sellers = await sql`
  SELECT
    s.id,
    s.clerk_user_id,
    s.store_name,
    s.phone_number,
    s.whatsapp_number,
    s.seller_types,
    s.country,
    s.region,
    s.city,
    s.area,
    s.status,
    s.seller_verified,
    s.can_publish,
    s.can_withdraw,
    s.created_at,
    s.updated_at,
    u.first_name,
    u.last_name,
    u.email,
    COALESCE(p.product_count, 0)::int AS products
  FROM ecodata_sellers AS s
  LEFT JOIN ecodata_users AS u
    ON u.clerk_user_id = s.clerk_user_id
  LEFT JOIN (
    SELECT
      seller_id,
      COUNT(*) AS product_count
    FROM ecodata_products
    GROUP BY seller_id
  ) AS p
    ON p.seller_id = s.id
  ORDER BY s.created_at DESC
`;
    const formattedSellers = sellers.map((seller) => (
      {
   
        id: String(seller.id),
      clerkUserId: seller.clerk_user_id,
      name: seller.store_name || "Unnamed Store",

        // Add this line:
        products: Number(seller.products ?? 0),


      owner: [seller.first_name, seller.last_name]
        .filter(Boolean)
        .join(" ") || "Not provided",
      email: seller.email || "",
      phone: seller.phone_number || "",
      whatsapp: seller.whatsapp_number || "",
      sellerTypes: seller.seller_types || [],
      country: seller.country || "",
      region: seller.region || "",
      city: seller.city || "",
      area: seller.area || "",
      status: seller.status || "pending",
      sellerVerified: seller.seller_verified === true,
      canPublish: seller.can_publish === true,
      canWithdraw: seller.can_withdraw === true,
      joined: seller.created_at,
      updatedAt: seller.updated_at
    
    }));

    return res.status(200).json({
      success: true,
      count: formattedSellers.length,
      sellers: formattedSellers
    });
  } catch (error) {
    console.error("Admin sellers fetch error:", error);

    return res.status(500).json({
      success: false,
      code: "SELLERS_FETCH_FAILED",
      message: "Unable to load seller records."
    });
  }
});

export default adminSellersRouter;