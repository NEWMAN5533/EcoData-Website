import { getDataMartOrderStatus } from "./dataMartService.js";

const normalizeDataMartStatus = (rawStatus) => {
  const status = String(rawStatus ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (["delivered", "completed", "successful", "success"].includes(status)) {
    return "delivered";
  }

  if (["failed", "cancelled", "canceled", "rejected"].includes(status)) {
    return "failed";
  }

  if (
    ["pending", "processing", "queued", "accepted", "in_progress"].includes(
      status,
    )
  ) {
    return "processing";
  }

  return "review";
};

function extractDataMartStatus(response) {
  // Support common response wrappers without assuming one
  // provider response shape.
  const result = response?.data?.data ?? response?.data ?? response;

  const order = result?.order ?? result?.data ?? result;

  return {
    status: order?.orderStatus ?? order?.status ?? order?.state ?? null,
    reference:
      order?.orderReference ??
      order?.order_reference ??
      order?.reference ??
      order?.purchaseId ??
      null,
  };
}

export function createMobileDataMartReconciliation({
  sql,
  updateMobileNeonOrder,
}) {
  if (typeof sql !== "function") {
    throw new Error("Neon SQL client is required.");
  }

  if (typeof updateMobileNeonOrder !== "function") {
    throw new Error("updateMobileNeonOrder is required.");
  }

  async function reconcileOrder(order) {
    const reference = String(order.vendor_ref ?? "").trim();

    if (!reference) {
      await updateMobileNeonOrder({
        checkoutReference: order.checkout_ref,
        lineNo: order.line_no,
        vendor: "datamart",
        status: "review",
      });

      return { success: false, reason: "missing_vendor_reference" };
    }

    try {
      const response = await getDataMartOrderStatus(reference);
      const provider = extractDataMartStatus(response);

      if (!provider.status) {
        await updateMobileNeonOrder({
          checkoutReference: order.checkout_ref,
          lineNo: order.line_no,
          vendor: "datamart",
          status: "review",
        });

        return { success: false, reason: "missing_provider_status" };
      }

      const status = normalizeDataMartStatus(provider.status);

      // Never replace a saved reference with a different,
      // unverified identifier from a status response.
      await updateMobileNeonOrder({
        checkoutReference: order.checkout_ref,
        lineNo: order.line_no,
        vendor: "datamart",
        vendorReference: reference,
        status,
      });

      return { success: true, status };
    } catch (error) {
      console.error(
        "[Mobile DataMart Reconciliation]",
        order.checkout_ref,
        order.line_no,
        error.message,
      );

      // A temporary provider/API error is not a purchase failure.
      return {
        success: false,
        reason: "provider_lookup_error",
      };
    }
  }

  async function pollMobileDataMartOrders({ limit = 100 } = {}) {
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);

    const orders = await sql`
      SELECT id, checkout_ref, line_no, vendor, vendor_ref, status
      FROM orders
      WHERE vendor = 'datamart'
        AND status IN ('processing', 'pending', 'unknown', 'review')
        AND vendor_ref IS NOT NULL
      ORDER BY created_at ASC
      LIMIT ${safeLimit}
    `;

    const results = [];

    for (const order of orders) {
      results.push(await reconcileOrder(order));
    }

    return {
      checked: orders.length,
      updated: results.filter((result) => result.success).length,
      results,
    };
  }

  return { reconcileOrder, pollMobileDataMartOrders };
}
