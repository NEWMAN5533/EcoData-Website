import { Router } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { requireAuth } from "../middleware/clerkAuth.js";
import sql from "../backend/db.js";

const mobileRouter = Router();

async function getClerkUser(userId) {
  const client =
    typeof clerkClient === "function" ? await clerkClient() : clerkClient;

  return client.users.getUser(userId);
}

// GET /api/me — retrieve the signed-in user's EcoData profile
mobileRouter.get("/", requireAuth, async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
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
      WHERE clerk_user_id = ${userId}
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

// POST /api/me — create or update the profile after registration
mobileRouter.post("/", requireAuth, async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const fullName =
      typeof req.body?.fullName === "string" ? req.body.fullName.trim() : "";

    const phone =
      typeof req.body?.phone === "string" ? req.body.phone.trim() : "";

    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: "Full name is required.",
      });
    }

    const nameParts = fullName.split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ");

    if (!lastName) {
      return res.status(400).json({
        success: false,
        message: "Enter your first and last name.",
      });
    }

    if (!/^0\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit phone number.",
      });
    }

    // Retrieve the authenticated user's details directly from Clerk.
    const clerkUser = await getClerkUser(userId);

    const emailAddress =
      clerkUser.emailAddresses?.find(
        (address) => address.id === clerkUser.primaryEmailAddressId,
      ) || clerkUser.emailAddresses?.[0];

    const email = emailAddress?.emailAddress?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "No email address is available for this account.",
      });
    }

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
        ${userId},
        ${firstName},
        ${lastName},
        ${fullName},
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
