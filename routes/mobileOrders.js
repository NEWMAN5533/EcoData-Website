import { Router } from "express";
import { getAuth } from "@clerk/express";
import { requireAuth } from "../middleware/clerkAuth.js";
import sql from "../backend/db.js";

const mobileOrdersRouter = Router();

const NETWORKS = {
  mtn: { id: "mtn", name: "MTN" },
  yello: { id: "mtn", name: "MTN" },
  telecel: { id: "telecel", name: "Telecel" },
  airteltigo: { id: "airteltigo", name: "AirtelTigo" },
  at: { id: "airteltigo", name: "AirtelTigo" },
  at_premium: { id: "airteltigo", name: "AirtelTigo" },
};

const TURNAROUND_MIN = {
  normal: 12,
  express: 3,
  verified: 6,
};

function mapOrder(row) {
  const rawStatus = String(row.status || "").trim().toLowerCase();

  let status;

  if (
    ["delivered", "completed", "success", "successful"].includes(rawStatus)
  ) {
    status = "delivered";
  } else if (
    ["failed", "cancelled", "canceled", "rejected", "refunded"].includes(
      rawStatus,
    )
  ) {
    status = "failed";
  } else if (rawStatus === "processing") {
    status = "processing";
  } else {
    // Pending, review and unknown are not confirmed deliveries.
    status = "received";
  }

  const packageValue = String(row.package || "normal").trim().toLowerCase();
  const delivery = Object.hasOwn(TURNAROUND_MIN, packageValue)
    ? packageValue
    : "normal";

  const networkValue = String(row.network || "").trim().toLowerCase();
  const networkInfo = NETWORKS[networkValue] || {
    id: networkValue,
    name: networkValue.toUpperCase(),
  };

  const at = new Date(row.created_at).getTime();
  const doneAt = row.delivered_at
    ? new Date(row.delivered_at).getTime()
    : undefined;

  const elapsedMin = Math.max(0, (Date.now() - at) / 60000);
  const turnaroundMin = TURNAROUND_MIN[delivery];

  // Estimated progress, not provider-confirmed progress.
  const progress =
    status === "delivered"
      ? 1
      : status === "failed"
        ? 0
        : Math.min(0.95, elapsedMin / turnaroundMin);

  const etaMin =
    status === "delivered" || status === "failed"
      ? null
      : Math.max(0, Math.ceil(turnaroundMin - elapsedMin));

  return {
    id: `${row.checkout_ref}-${row.line_no}`,
    network: networkInfo.id,
    networkName: networkInfo.name,
    size: String(row.size),
    price: Number(row.price),
    phone: String(row.phone),
    delivery,
    status,
    progress,
    etaMin,
    at,
    ...(doneAt !== undefined ? { doneAt } : {}),
  };
}

mobileOrdersRouter.get("/", requireAuth, async (req, res) => {
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
        checkout_ref,
        line_no,
        package,
        vendor,
        network,
        size,
        price,
        phone,
        status,
        created_at,
        delivered_at
      FROM orders
      WHERE clerk_user_id = ${userId}
      ORDER BY created_at DESC, line_no ASC
    `;

    return res.json(rows.map(mapOrder));
  } catch (error) {
    console.error("[EcoData][ORDERS][FETCH_ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your orders.",
    });
  }
});

export default mobileOrdersRouter;