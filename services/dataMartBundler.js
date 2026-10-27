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



const PAYSTACK_FEE_RATE = 0.0195;
const VERIFICATION_TIMEOUT_MS = 1500;

function getCheckoutPrice(basePrice) {
  return Number(
    (Number(basePrice) * (1 + PAYSTACK_FEE_RATE)).toFixed(2)
  );
}

function sameMoney(a, b) {
  return Math.round(Number(a) * 100) === Math.round(Number(b) * 100);
}

function failure(status, message, extra = {}) {
  return {
    ok: false,
    status,
    body: { success: false, message, ...extra },
  };
}

function normalizeDataMartStatus(status) {
  const value = String(status ?? "").trim().toLowerCase();

  if (["completed", "success", "successful", "delivered"].includes(value)) {
    return "completed";
  }

  if (["failed", "cancelled", "canceled", "rejected"].includes(value)) {
    return "failed";
  }

  if (["pending", "processing", "in_progress", "in progress"].includes(value)) {
    return "processing";
  }

  return "unknown";
}

function verificationTimedOut(promise, timeoutMs) {
  let timer;

  return Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(new Error("RECIPIENT_VERIFICATION_TIMEOUT")),
        timeoutMs
      );
    }),
  ]).finally(() => clearTimeout(timer));
}

/**
 * Direct DataMart purchase handler.
 *
 * No Neon repository calls.
 * No webhook waiting.
 * No Firestore integration.
 *
 * verifyRecipient is optional and must be passed in if available.
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
    verifyRecipient,
    processedOrders,
  }
) {
  if (
    !network ||
    !recipient ||
    !pkg ||
    !paymentReference ||
    size === undefined ||
    !String(recipient).trim()
  ) {
    return failure(400, "Missing required fields.");
  }

  const reference = String(paymentReference).trim();
  const phoneNumber = String(recipient).trim();
  const capacity = Number(size);

  if (!reference || !Number.isFinite(capacity) || capacity <= 0) {
    return failure(400, "Invalid payment reference or bundle size.");
  }

  if (
    typeof verifyPaystack !== "function" ||
    !(processedOrders instanceof Map)
  ) {
    return failure(500, "Purchase service is not configured.");
  }

  // Prevent concurrent requests with the same payment reference
  // within this running server process.
  if (processedOrders.has(reference)) {
    const existing = processedOrders.get(reference);

    return {
      ok: existing.status !== "failed",
      status: existing.status === "failed" ? 409 : 202,
      body: {
        success: existing.status !== "failed",
        message: "This payment reference is already being processed or was processed.",
        order: existing.response ?? null,
      },
    };
  }

  const reservation = {
    status: "processing",
    response: {
      provider: "datamart",
      paymentReference: reference,
      orderStatus: "processing",
    },
  };

  processedOrders.set(reference, reservation);

  // Before a provider request has been attempted, a failure can release
  // the in-memory reservation. After submission, keep it to avoid retries.
  let providerAttempted = false;

  const releaseReservation = () => {
    if (!providerAttempted && processedOrders.get(reference) === reservation) {
      processedOrders.delete(reference);
    }
  };

  try {
    // 1. Verify the payment with Paystack.
    const verification = await verifyPaystack(reference);
    const transaction = verification?.data?.data;

    if (
      transaction?.status !== "success" ||
      transaction.reference !== reference
    ) {
      releaseReservation();
      return failure(400, "Payment verification failed.");
    }

    const amountPesewas = Number(transaction.amount);

    if (!Number.isFinite(amountPesewas) || amountPesewas <= 0) {
      releaseReservation();
      return failure(400, "Invalid payment amount.");
    }

    const actualAmountGHS = amountPesewas / 100;

    // 2. Validate the selling price and checkout amount.
    const baseSellingPrice = getDataMartSellingPrice(network, capacity);

    if (!Number.isFinite(Number(baseSellingPrice)) || Number(baseSellingPrice) <= 0) {
      releaseReservation();
      return failure(400, "Invalid Ecodata selling price.");
    }

    const expectedCheckoutPrice = getCheckoutPrice(baseSellingPrice);

    if (!sameMoney(actualAmountGHS, expectedCheckoutPrice)) {
      releaseReservation();
      return failure(400, "The payment amount does not match the configured price.");
    }

    // 3. Attempt recipient verification only when a verifier is available.
    // A timeout or service outage fails open; a confirmed rejection does not.
    if (typeof verifyRecipient === "function") {
      try {
        const result = await verificationTimedOut(
          verifyRecipient({
            network,
            recipient: phoneNumber,
            size: capacity,
          }),
          VERIFICATION_TIMEOUT_MS
        );

        if (result?.available === false || result?.unavailable === true) {
          console.warn("Recipient verification unavailable; proceeding.", {
            paymentReference: reference,
          });
        } else if (
          result?.valid === false ||
          result?.verified === false ||
          result?.rejected === true
        ) {
          releaseReservation();
          return failure(400, "The recipient could not be verified.");
        }
      } catch (error) {
        console.warn("Recipient verification unavailable; proceeding.", {
          paymentReference: reference,
          reason: error.message,
        });
      }
    } else {
      console.warn("No recipient verifier configured; proceeding with purchase.", {
        paymentReference: reference,
      });
    }

    // 4. Retrieve and match the DataMart package.
    const packages = await getDataMartPackages(network);

    const matchedPackage = matchDataMartPackage(
      {
        network,
        size: capacity,
        price: Number(baseSellingPrice),
      },
      packages
    );

    if (!matchedPackage) {
      releaseReservation();
      return failure(400, "This bundle is not currently available.");
    }

    // 5. Enforce the minimum gross-profit requirement.
    const profitCheck = checkDataMartProfit({
      network,
      volume: capacity,
      providerCost: matchedPackage.providerPrice,
    });

    if (!profitCheck.profitable) {
      releaseReservation();

      return failure(409, "This bundle does not meet the minimum gross-profit requirement.", {
        grossProfit: profitCheck.grossProfit,
        minimumProfit: profitCheck.minimumProfit,
      });
    }

    // 6. Submit directly to DataMart. No webhook is awaited.
    const idempotencyKey = `ecodata-${reference}`;

    // From this point, don't automatically release the reservation after
    // an error: backend may have received the request despite a timeout.
    providerAttempted = true;

    const providerOrder = await purchaseWithDataMart({
      phoneNumber,
      network: mapNetworkToDataMart(network),
      capacity,
      idempotencyKey,
    });

    const orderStatus = normalizeDataMartStatus(providerOrder?.orderStatus);

    const order = {
      provider: "datamart",
      paymentReference: reference,
      providerOrderReference: providerOrder?.orderReference ?? null,
      transactionReference: providerOrder?.transactionReference ?? null,
      purchaseId: providerOrder?.purchaseId ?? null,
      network: providerOrder?.network ?? network,
      capacity: providerOrder?.capacity ?? capacity,
      sellingPrice: profitCheck.sellingPrice,
      checkoutAmount: actualAmountGHS,
      providerPrice: providerOrder?.price ?? matchedPackage.providerPrice,
      grossProfit: profitCheck.grossProfit,
      orderStatus,
    };

    const successful = orderStatus !== "failed";

    processedOrders.set(reference, {
      status: successful ? "processing" : "failed",
      response: order,
    });

    return {
      ok: successful,
      status: successful ? 200 : 400,
      body: {
        success: successful,
        message:
          orderStatus === "completed"
            ? "Data bundle purchased successfully."
            : successful
              ? "EcoData accepted the purchase request."
              : "EcoData reported that the purchase failed.",
        order,
      },
    };
  } catch (error) {
    console.error("Direct purchase error:", {
      paymentReference: reference,
      message: error.message,
      providerHttpStatus: error.providerHttpStatus ?? null,
    });

    if (providerAttempted) {
      // The provider outcome may be uncertain. Keep the reference blocked
      // until the order can be checked, rather than risking a duplicate.
      const order = {
        ...reservation.response,
        orderStatus: "unknown",
      };

      processedOrders.set(reference, {
        status: "processing",
        response: order,
      });

      return failure(
        202,
        "The purchase outcome is uncertain. Check the provider order before retrying.",
        { order }
      );
    }

    releaseReservation();

    return failure(502, "Unable to prepare the DataMart purchase. No provider purchase was submitted.");
  }
}