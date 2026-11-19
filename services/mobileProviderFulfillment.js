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

/**
 * Mobile-only provider fulfillment.
 *
 * The caller must authenticate the user, verify the combined
 * Paystack payment, and validate the checkout amount first.
 *
 * This module must never verify Paystack or add a checkout fee.
 */
export async function submitMobileDataMartOrder({
  network,
  recipient,
  size,
  paymentReference,
}) {
  const capacity = Number(
    String(size ?? "")
      .trim()
      .replace(/\s*gb\s*/i, ""),
  );

  const phoneNumber = String(recipient ?? "").trim();
  const reference = String(paymentReference ?? "").trim();
  const normalizedNetwork = String(network ?? "")
    .trim()
    .toLowerCase();

  const invalidFields = [];

  if (!normalizedNetwork) invalidFields.push("network");
  if (!phoneNumber) invalidFields.push("recipient");
  if (!reference) invalidFields.push("paymentReference");

  if (!Number.isFinite(capacity) || capacity <= 0) {
    invalidFields.push("size");
  }

  if (invalidFields.length > 0) {
    console.error(
      "[EcoData][DataMart][INVALID_ORDER_DETAILS]",
      JSON.stringify({
        timestamp: new Date().toISOString(),
        invalidFields,
        network: normalizedNetwork || null,
        sizeReceived: String(size ?? ""),
        capacityParsed: Number.isFinite(capacity) ? capacity : null,
        hasRecipient: Boolean(phoneNumber),
        hasPaymentReference: Boolean(reference),
      }),
    );

    throw new Error("Invalid mobile DataMart order details.");
  }


  
  const packages = await getDataMartPackages(network);

  const matchedPackage = matchDataMartPackage(
    {
      network,
      size: capacity,
      price: sellingPrice,
    },
    packages,
  );

  if (!matchedPackage) {
    throw new Error("This DataMart bundle is unavailable.");
  }

  const profitCheck = checkDataMartProfit({
    network,
    volume: capacity,
    providerCost: matchedPackage.providerPrice,
  });

  if (!profitCheck.profitable) {
    throw new Error("This DataMart bundle is not currently available.");
  }

  // Stable key: retries must reuse this exact key.
  const providerOrder = await purchaseWithDataMart({
    phoneNumber,
    network: mapNetworkToDataMart(network),
    capacity,
    idempotencyKey: `ecodata-mobile-${reference}`,
  });

  return {
    provider: "datamart",
    providerOrderReference: providerOrder?.orderReference ?? null,
    transactionReference: providerOrder?.transactionReference ?? null,
    purchaseId: providerOrder?.purchaseId ?? null,
    network: providerOrder?.network ?? network,
    capacity: providerOrder?.capacity ?? capacity,
    sellingPrice: profitCheck.sellingPrice,
    providerPrice: providerOrder?.price ?? matchedPackage.providerPrice,
    orderStatus: providerOrder?.orderStatus ?? "unknown",
  };
}
