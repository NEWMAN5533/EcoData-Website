/**
 * services/mobileOrderPolling.js
 *
 * Polls existing mobile orders from SwiftData and DataMart.
 * This module never submits new purchases.
 */

function normalizeMobileProviderStatus(rawStatus) {
  const status = String(rawStatus || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (
    ["processed", "delivered", "completed", "successful", "success"].includes(
      status,
    )
  ) {
    return "delivered";
  }

  if (
    ["failed", "failure", "rejected", "cancelled", "canceled"].includes(status)
  ) {
    return "failed";
  }

  if (["pending", "queued", "accepted"].includes(status)) {
    return "pending";
  }

  if (["processing", "in_progress", "inprogress"].includes(status)) {
    return "processing";
  }

  return "review";
}

function extractProviderStatus(item) {
  return (
    item?.status ??
    item?.orderStatus ??
    item?.order_status ??
    item?.data?.status ??
    null
  );
}

function extractSwiftOrders(response) {
  const result = response?.data ?? response;

  if (result?.success === false) {
    throw new Error(result.message || "SwiftData status lookup failed.");
  }

  const orders = result?.orders ?? result?.data?.orders;

  if (!Array.isArray(orders)) {
    throw new Error("Unexpected SwiftData status response.");
  }

  return {
    orders,
    missing: result?.missing ?? result?.data?.missing ?? [],
  };
}

function getSwiftIdentifier(item) {
  return String(
    item?.orderId ?? item?.reference ?? item?.orderReference ?? item?.id ?? "",
  ).trim();
}

function extractDataMartOrder(response) {
  const result = response?.data ?? response;

  if (result?.success === false) {
    throw new Error(result.message || "DataMart status lookup failed.");
  }

  return result?.order ?? result?.data?.order ?? result?.data ?? result;
}

/**
 * Inject the existing project dependencies from server.js.
 */
export function createMobileOrderPolling({
  sql,
  fetchSwiftDataBulkStatus,
  getDataMartOrderStatus,
  updateMobileNeonOrder,
}) {
  if (
    !sql ||
    !fetchSwiftDataBulkStatus ||
    !getDataMartOrderStatus ||
    !updateMobileNeonOrder
  ) {
    throw new Error("Mobile order polling dependencies are incomplete.");
  }

  async function pollMobileOrders({ limit = 100 } = {}) {
    const safeLimit = Math.min(
      Math.max(Number.parseInt(limit, 10) || 100, 1),
      200,
    );

    // Only select existing mobile orders that still need reconciliation.
    const orders = await sql`
      SELECT
        id,
        checkout_ref,
        line_no,
        vendor,
        vendor_ref,
        status
      FROM orders
      WHERE checkout_ref LIKE 'ECM%'
        AND vendor IN ('swiftdata', 'datamart')
        AND status IN ('processing', 'pending', 'unknown', 'review')
        AND vendor_ref IS NOT NULL
        AND TRIM(vendor_ref) <> ''
      ORDER BY created_at ASC
      LIMIT ${safeLimit}
    `;

    const results = [];
    const swiftOrders = orders.filter(
      (order) => String(order.vendor).toLowerCase() === "swiftdata",
    );
    const dataMartOrders = orders.filter(
      (order) => String(order.vendor).toLowerCase() === "datamart",
    );

    // SwiftData: one bulk request for all selected SwiftData references.
    if (swiftOrders.length > 0) {
      try {
        const identifiers = [
          ...new Set(
            swiftOrders.map((order) => String(order.vendor_ref).trim()),
          ),
        ];

        const response = await fetchSwiftDataBulkStatus(identifiers);
        const { orders: providerOrders, missing } =
          extractSwiftOrders(response);

        const byReference = new Map(
          providerOrders.map((item) => [getSwiftIdentifier(item), item]),
        );

        const missingSet = new Set(
          (Array.isArray(missing) ? missing : []).map((item) =>
            String(
              typeof item === "string"
                ? item
                : (item?.orderId ?? item?.reference ?? ""),
            ).trim(),
          ),
        );

        for (const order of swiftOrders) {
          const reference = String(order.vendor_ref).trim();
          const providerOrder = byReference.get(reference);

          if (!providerOrder) {
            // Missing references are not proof of a failed purchase.
            results.push({
              checkoutReference: order.checkout_ref,
              lineNo: order.line_no,
              vendor: "swiftdata",
              status: "review",
              message: missingSet.has(reference)
                ? "Provider reported this reference as missing; purchase was not resubmitted."
                : "Reference was not present in the provider response; purchase was not resubmitted.",
            });
            continue;
          }

          const status = normalizeMobileProviderStatus(
            extractProviderStatus(providerOrder),
          );

          await updateMobileNeonOrder({
            checkoutReference: order.checkout_ref,
            lineNo: order.line_no,
            vendor: "swiftdata",
            vendorReference: reference,
            status,
          });

          results.push({
            checkoutReference: order.checkout_ref,
            lineNo: order.line_no,
            vendor: "swiftdata",
            status,
          });
        }
      } catch (error) {
        console.error(
          "Mobile SwiftData polling failed:",
          error.response?.data || error.message,
        );

        results.push({
          vendor: "swiftdata",
          status: "lookup_error",
          message:
            "Status lookup failed. Existing order statuses were not changed.",
        });
      }
    }

    // DataMart: check each existing reference separately.
    for (const order of dataMartOrders) {
      try {
        const response = await getDataMartOrderStatus(order.vendor_ref);
        const providerOrder = extractDataMartOrder(response);
        const rawStatus = extractProviderStatus(providerOrder);

        if (!rawStatus) {
          results.push({
            checkoutReference: order.checkout_ref,
            lineNo: order.line_no,
            vendor: "datamart",
            status: "review",
            message:
              "DataMart response did not contain a recognized status field.",
          });
          continue;
        }

        const status = normalizeMobileProviderStatus(rawStatus);

        await updateMobileNeonOrder({
          checkoutReference: order.checkout_ref,
          lineNo: order.line_no,
          vendor: "datamart",
          vendorReference: order.vendor_ref,
          status,
        });

        results.push({
          checkoutReference: order.checkout_ref,
          lineNo: order.line_no,
          vendor: "datamart",
          status,
        });
      } catch (error) {
        console.error(
          "Mobile DataMart polling failed:",
          error.providerResponse || error.response?.data || error.message,
        );

        results.push({
          checkoutReference: order.checkout_ref,
          lineNo: order.line_no,
          vendor: "datamart",
          status: "lookup_error",
          message:
            "Status lookup failed. Existing order status was not changed.",
        });
      }
    }

    return {
      success: true,
      checked: results.filter((item) =>
        ["delivered", "failed", "pending", "processing", "review"].includes(
          item.status,
        ),
      ).length,
      results,
    };
  }

  return { pollMobileOrders };
}
