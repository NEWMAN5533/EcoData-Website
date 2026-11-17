import { Router } from "express";
import { requireAuth } from "../middleware/clerkAuth.js";
import { sql } from "../backend/db.js";

const mobileRouter = Router();

// GET /api/me — retrieve the signed-in user's EcoData profile
mobileRouter.get("/", requireAuth, async (req, res) => {
  try {
    const clerkUserId =
      req.auth?.userId ||
      req.auth?.user?.id ||
      req.auth?.claims?.sub;

    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const rows = await sql`
      SELECT
        id,
        clerk_user_id,
        first_name,
        last_name,
        email,
        phone,
        full_name,
        loyalty_points,
        balance,
        role,
        active,
        created_at,
        updated_at
      FROM public.ecodata_users
      WHERE clerk_user_id = ${clerkUserId}
      LIMIT 1
    `;

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Profile not found. Please complete registration.",
      });
    }

    return res.json({
      success: true,
      user: rows[0],
    });
  } catch (error) {
    console.error("GET /api/me error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your profile.",
    });
  }
});

// POST /api/me — create the profile after Clerk registration
mobileRouter.post("/", requireAuth, async (req, res) => {
  try {
    const clerkUserId =
      req.auth?.userId ||
      req.auth?.user?.id ||
      req.auth?.claims?.sub;

    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const { fullName, phone } = req.body ?? {};

    if (typeof fullName !== "string" || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Full name is required.",
      });
    }

    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ");

    if (!lastName) {
      return res.status(400).json({
        success: false,
        message: "Enter your first and last name.",
      });
    }

    if (typeof phone !== "string" || !/^0\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit phone number.",
      });
    }

    // Obtain the email from Clerk, not from untrusted client input.
    const clerkUser = await req.auth.getUser?.();

    if (!clerkUser?.emailAddresses?.length) {
      return res.status(400).json({
        success: false,
        message: "No email address is available for this account.",
      });
    }

    const email =
      clerkUser.primaryEmailAddress?.emailAddress ||
      clerkUser.emailAddresses[0].emailAddress;

    const rows = await sql`
      INSERT INTO public.ecodata_users (
        clerk_user_id,
        first_name,
        last_name,
        full_name,
        email,
        phone
      )
      VALUES (
        ${clerkUserId},
        ${firstName},
        ${lastName},
        ${fullName.trim()},
        ${email},
        ${phone}
      )
      ON CONFLICT (clerk_user_id)
      DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        updated_at = NOW()
      RETURNING
        id,
        clerk_user_id,
        first_name,
        last_name,
        email,
        full_name,
        phone,
        loyalty_points,
        balance,
        role,
        active,
        created_at,
        updated_at
    `;

    return res.status(200).json({
      success: true,
      user: rows[0],
    });
  } catch (error) {
    console.error("POST /api/me error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create your profile.",
    });
  }
});

export default mobileRouter;