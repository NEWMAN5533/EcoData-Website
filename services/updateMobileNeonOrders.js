import sql from "../backend/db.js";

// ========================================
// UPDATA DATABASE ORDER (REF)
//=========================================
 async function updateMobileNeonOrder({
  checkoutReference,
  lineNo,
  vendor,
  vendorReference = null,
  status,
}) {
  const allowedStatuses = [
    "processing",
    "pending",
    "unknown",
    "delivered",
    "failed",
    "refunded",
    "review",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Error(`Invalid mobile order status: ${status}`);
  }

  const rows = await sql`
    UPDATE orders
    SET
      vendor = ${vendor},
      vendor_ref = COALESCE(${vendorReference}, vendor_ref),
      status = ${status},
      delivered_at = CASE
        WHEN ${status} = 'delivered' THEN COALESCE(delivered_at, NOW())
        ELSE delivered_at
      END
    WHERE checkout_ref = ${checkoutReference}
      AND line_no = ${lineNo}
    RETURNING id, checkout_ref, line_no, vendor, vendor_ref, status
  `;

  if (!rows.length) {
    throw new Error(
      `Mobile order not found for checkout ${checkoutReference}, line ${lineNo}.`,
    );
  }

  return rows[0];
}


export default updateMobileNeonOrder;