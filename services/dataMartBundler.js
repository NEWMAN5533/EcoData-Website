import {
  getDataMartSellingPrice,
  checkDataMartProfit,
} from "./datamartSellingPrice.js";

import {
  purchaseWithDataMart,
  getDataMartPackages,
  matchDataMartPackage,
  mapNetworkToDataMart,
} from "./dataMartService.js";

import {
  createDataMartOrder,
  updateDataMartOrder,
  getDataMartOrderByPaymentReference,
} from "./dataMartOrderRepository.js";

const PAYSTACK_FEE_RATE = 0.0195;

function getCheckoutPrice(basePrice) {
  return Number(
    (Number(basePrice) * (1 + PAYSTACK_FEE_RATE)).toFixed(2)
  );
}

function sameMoney(a, b) {
  return Math.round(Number(a) * 100) === Math.round(Number(b) * 100);
}

function normalizeDataMartStatus(status) {
  const normalized = String(status ?? "").trim().toLowerCase();

  if (
    ["completed", "success", "successful", "delivered"].includes(normalized)
  ) {
    return "completed";
  }

  if (
    ["failed", "cancelled", "canceled", "rejected"].includes(normalized)
  ) {
    return "failed";
  }

  if (
    ["pending", "processing", "in_progress", "in progress"].includes(normalized)
  ) {
    return "processing";
  }

  return "unknown";
}

function existingDataMartOrderResponse(order) {
  return {
    provider: "datamart",
    paymentReference: order.paymentReference,
    providerOrderReference: order.providerOrderReference ?? null,
    transactionReference: order.providerTransactionReference ?? null,
    purchaseId: order.providerPurchaseId ?? null,
    network: order.network,
    capacity: order.capacityGb,
    sellingPrice: order.sellingPrice,
    providerPrice: order.providerPrice ?? null,
    orderStatus: order.orderStatus,
  };
}

function failure(status, message, extra = {}) {
  return {
    ok: false,
    status,
    body: {
      success: false,
      message,
      ...extra,
    },
  };
}

/**
 * DataMart-only purchase handler.
 *
 * verifyPaystack and processedOrders are injected from server.js.
 * No SwiftData code or active-vendor selection belongs here.
 */
export async function handleDataMartBuyDataRequest(
  {
    network,
    recipient,
    pkg,
    size,
    paymentReference,
  },
  {
    verifyPaystack,
    processedOrders,
  }
) {
  if (
    !network ||
    !recipient ||
    !pkg ||
    !paymentReference ||
    size === undefined
  ) {
    return failure(400, "Missing required fields.");
  }

  const reference = String(paymentReference).trim();

  if (!reference) {
    return failure(400, "Invalid payment reference.");
  }

  if (typeof verifyPaystack !== "function" || !processedOrders) {
    console.error("Ecodata handler dependencies are missing.");

    return failure(500, "Ecodata purchase service is not configured.");
  }

  // Check the persistent DataMart record before the in-memory cache.
  // Neon remains the authoritative record for DataMart orders.
  try {
    const existingOrder =
      await getDataMartOrderByPaymentReference(reference);

    if (existingOrder) {
      const orderResponse = existingDataMartOrderResponse(existingOrder);
      const orderStatus = existingOrder.orderStatus;

      processedOrders.set(reference, {
        status:
          orderStatus === "failed" ? "failed" : "processing",
        response: orderResponse,
      });

      if (orderStatus === "completed") {
        return {
          ok: true,
          status: 200,
          body: {
            success: true,
            message: "This Ecodata order was already processed.",
            order: orderResponse,
          },
        };
      }

      if (orderStatus === "failed") {
        return failure(
          409,
          "This Ecodata order previously failed. Check its saved record before taking further action.",
          { order: orderResponse }
        );
      }

      return failure(
        202,
        "This Ecodata order is already recorded and was not resubmitted.",
        { order: orderResponse }
      );
    }
  } catch (error) {
    console.error("Failed to check existing Ecodata order:", error.message);

    return failure(
      500,
      "Unable to check the existing Ecodata order. No new purchase was submitted."
    );
  }

  // Prevent duplicate requests within this server process.
  if (processedOrders.has(reference)) {
    const existing = processedOrders.get(reference);

    return {
      ok: existing.status !== "failed",
      status: existing.status === "failed" ? 400 : 200,
      body: {
        success: existing.status !== "failed",
        message: "This payment reference has already been processed.",
        order: existing.response,
      },
    };
  }

  try {
    // 1. Verify Paystack payment server-side.
    const verification = await verifyPaystack(reference);
    const transaction = verification?.data?.data;

    if (
      transaction?.status !== "success" ||
      transaction.reference !== reference
    ) {
      return failure(400, "Payment verification failed.");
    }

    const amountPesewas = Number(transaction.amount);

    if (!Number.isFinite(amountPesewas) || amountPesewas <= 0) {
      return failure(400, "Invalid payment amount.");
    }

    const actualAmountGHS = amountPesewas / 100;

    // 2. Validate DataMart's selling price.
    // This is the base price before the Paystack fee.
    const baseSellingPrice = getDataMartSellingPrice(network, size);

    if (
      !Number.isFinite(Number(baseSellingPrice)) ||
      Number(baseSellingPrice) <= 0
    ) {
      return failure(400, "Invalid Ecodata selling price.");
    }

    const expectedCheckoutPrice = getCheckoutPrice(baseSellingPrice);

    console.log("Ecodata payment price check:", {
  paymentReference: reference,
  paystackAmountPesewas: amountPesewas,
  actualAmountGHS,
  baseSellingPrice,
  expectedCheckoutPrice,
  feeRate: PAYSTACK_FEE_RATE
});

console.log("Backend price debug:", {
  network,
  size,
  baseSellingPrice,
  expectedCheckoutPrice,
  actualAmountGHS,
  paystackAmountPesewas: amountPesewas
});

    if (!sameMoney(actualAmountGHS, expectedCheckoutPrice)) {
      return failure(
        400,
        "The payment amount does not match the configured base price."
      );
    }



    // 3. Retrieve and match the DataMart provider package.
    const packages = await getDataMartPackages(network);

    const matchedPackage = matchDataMartPackage(
      {
        network,
        size,
        price: baseSellingPrice,
      },
      packages
    );

    if (!matchedPackage) {
      return failure(
        400,
        "This bundle is not currently available from DataMart."
      );
    }

    // 4. Enforce at least GH₵1.00 gross profit.
    // Paystack fees are excluded from this calculation.
    const profitCheck = checkDataMartProfit({
      network,
      volume: size,
      providerCost: matchedPackage.providerPrice,
    });

    console.log("DataMart pricing check:", {
      network,
      size: Number(size),
      sellingPrice: profitCheck.sellingPrice,
      providerCost: profitCheck.providerCost,
      grossProfit: profitCheck.grossProfit,
      minimumProfit: profitCheck.minimumProfit,
      profitable: profitCheck.profitable,
    });

    const idempotencyKey = `ecodata-${reference}`;

    // 5. Create the persistent order before submitting to the provider.
    const result = await createDataMartOrder({
      paymentReference: reference,
      idempotencyKey,
      customerPhone: String(recipient).trim(),
      network: mapNetworkToDataMart(network),
      capacityGb: Number(size),
      sellingPrice: profitCheck.sellingPrice,
    });

    const savedOrder = result.order;

    if (!result.created) {
      const orderResponse = existingDataMartOrderResponse(savedOrder);

      return failure(
        202,
        "This DataMart payment is already recorded. No additional purchase was submitted.",
        { order: orderResponse }
      );
    }

    // 6. Record and block an order that fails the profit requirement.
    if (!profitCheck.profitable) {
      const errorMessage =
        `DataMart order blocked: gross profit GH₵${profitCheck.grossProfit.toFixed(2)} ` +
        `is below the required GH₵${profitCheck.minimumProfit.toFixed(2)}.`;

      const blockedOrder = await updateDataMartOrder(reference, {
        orderStatus: "failed",
        providerPrice: profitCheck.providerCost,
        lastError: errorMessage,
        providerResponse: {
          reason: "minimum_profit_not_met",
          sellingPrice: profitCheck.sellingPrice,
          providerCost: profitCheck.providerCost,
          grossProfit: profitCheck.grossProfit,
          minimumProfit: profitCheck.minimumProfit,
        },
      });

      const orderResponse = existingDataMartOrderResponse(blockedOrder);

      processedOrders.set(reference, {
        status: "failed",
        response: orderResponse,
      });

      console.error(errorMessage);

      return failure(
        409,
        "This bundle does not meet the minimum GH₵1.00 gross-profit requirement. The verified payment has been recorded for review.",
        { order: orderResponse }
      );
    }

    // 7. Submit the purchase to DataMart.
    try {
      const providerOrder = await purchaseWithDataMart({
        phoneNumber: recipient,
        network,
        capacity: size,
        idempotencyKey: savedOrder.idempotencyKey,
      });

      const normalizedStatus = normalizeDataMartStatus(
        providerOrder.orderStatus
      );

      const updatedOrder = await updateDataMartOrder(reference, {
        orderStatus: normalizedStatus,
        providerOrderReference: providerOrder.orderReference,
        providerTransactionReference:
          providerOrder.transactionReference,
        providerPurchaseId: providerOrder.purchaseId,
        providerPrice: providerOrder.price,
        providerResponse: providerOrder,
        lastError: null,
      });

      const orderResponse = {
        provider: "datamart",
        paymentReference: reference,
        providerOrderReference: providerOrder.orderReference ?? null,
        transactionReference:
          providerOrder.transactionReference ?? null,
        purchaseId: providerOrder.purchaseId ?? null,
        network: providerOrder.network,
        capacity: providerOrder.capacity,
        sellingPrice: profitCheck.sellingPrice,
        checkoutAmount: actualAmountGHS,
        providerPrice: providerOrder.price ?? null,
        grossProfit: profitCheck.grossProfit,
        orderStatus: updatedOrder.orderStatus,
      };

      processedOrders.set(reference, {
        status:
          updatedOrder.orderStatus === "failed"
            ? "failed"
            : "processing",
        response: orderResponse,
      });

      const successful = updatedOrder.orderStatus !== "failed";

      return {
        ok: successful,
        status: successful ? 200 : 400,
        body: {
          success: successful,
          message:
            updatedOrder.orderStatus === "completed"
              ? "Data bundle purchased successfully."
              : successful
                ? "DataMart accepted the purchase request."
                : "DataMart reported that the purchase failed.",
          order: orderResponse,
        },
      };
    } catch (providerError) {
      const httpStatus = providerError.providerHttpStatus;

      const definitelyRejected =
        Number.isInteger(httpStatus) &&
        httpStatus >= 400 &&
        httpStatus < 500 &&
        httpStatus !== 408 &&
        httpStatus !== 429;

      const savedFailure = await updateDataMartOrder(reference, {
        orderStatus: definitelyRejected ? "failed" : "unknown",
        providerResponse: providerError.providerResponse ?? {
          message:
            providerError.providerMessage ?? providerError.message,
        },
        lastError:
          providerError.providerMessage ?? providerError.message,
      });

      const orderResponse =
        existingDataMartOrderResponse(savedFailure);

      processedOrders.set(reference, {
        status: definitelyRejected ? "failed" : "processing",
        response: orderResponse,
      });

      console.error("DataMart purchase outcome:", {
        paymentReference: reference,
        orderStatus: savedFailure.orderStatus,
        httpStatus: httpStatus ?? null,
      });

      return failure(
        definitelyRejected ? 400 : 202,
        definitelyRejected
          ? "DataMart rejected the purchase. Check the saved order before retrying."
          : "The DataMart purchase outcome is uncertain. Verify the provider order before attempting another purchase.",
        { order: orderResponse }
      );
    }
  } catch (error) {
    console.error("DataMart buy-data handler error:", {
      message: error.message,
      paymentReference: reference,
    });

    return failure(500, "Failed to process the DataMart order.");
  }
}