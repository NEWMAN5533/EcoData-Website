import axios from "axios";

/* =========================================
  DATAMART API CLIENT
========================================= */

const datamart = axios.create({
  baseURL: "https://api.datamartgh.shop/api/developer",
  timeout: 20000,
  headers: {
    "Content-Type": "application/json"
  }
});

function getApiKey() {
  const apiKey = process.env.DATAMART_API_KEY;

  if (!apiKey) {
    throw new Error("DATAMART_API_KEY is not configured.");
  }

  return apiKey;
}

/* =========================================
   NETWORK MAPPING
   Frontend -> DataMart
========================================= */

export function mapNetworkToDataMart(network) {
  const networks = {
    mtn: "YELLO",
    yello: "YELLO",
    telecel: "TELECEL",
    at: "AT_PREMIUM",
    at_premium: "AT_PREMIUM"
  };

  return networks[
    String(network || "").trim().toLowerCase()
  ] || null;
}

/* =========================================
   GET AVAILABLE DATAMART PACKAGES
   GET /data-packages?network=YELLO
========================================= */





export async function getDataMartPackages(network) {
  const normalizedNetwork = mapNetworkToDataMart(network);

  if (!normalizedNetwork) {
    throw new Error("Unsupported DataMart network.");
  }

  const response = await datamart.get("/data-packages", {
    params: {
      network: normalizedNetwork
    },
    headers: {
      "X-API-Key": getApiKey()
    }
  });

  if (response.data?.status !== "success") {
    throw new Error("Unable to retrieve DataMart packages.");
  }

  const packages = response.data.data?.[normalizedNetwork];

  if (!Array.isArray(packages)) {
    throw new Error(
      `Invalid package list returned for ${normalizedNetwork}.`
    );
  }

  return packages;
}

/* =========================================
   MATCH EXISTING BUNDLE CARD TO DATAMART
========================================= */

export function matchDataMartPackage(bundle, packages) {
  if (!bundle || !Array.isArray(packages)) {
    throw new Error("Bundle or DataMart package list is invalid.");
  }

  const network = mapNetworkToDataMart(bundle.network);

  if (!network) {
    throw new Error("Unsupported DataMart network.");
  }

  const capacity = Number(bundle.size);

  if (!Number.isFinite(capacity) || capacity <= 0) {
    throw new Error("Invalid selected bundle capacity.");
  }

  const match = packages.find(pkg =>
    pkg.network === network &&
    Number(pkg.capacity) === capacity
  );

  if (!match) {
    throw new Error(
      `DataMart does not offer a matching ${capacity}GB ${network} package.`
    );
  }

  const providerPrice = Number(match.price);
  const sellingPrice = Number(bundle.price);

  if (
    !Number.isFinite(providerPrice) ||
    providerPrice < 0 ||
    !Number.isFinite(sellingPrice) ||
    sellingPrice <= 0
  ) {
    throw new Error("Invalid provider or selling price.");
  }

  return {
    network,
    capacity: String(match.capacity),
    providerPrice,
    sellingPrice,
    dataValue: bundle.dataValue
  };
}

/* =========================================
   PURCHASE DATA THROUGH DATAMART
   POST /purchase
========================================= */

export async function purchaseWithDataMart({
  phoneNumber,
  network,
  capacity,
  idempotencyKey
}) {
  const normalizedNetwork = mapNetworkToDataMart(network);

  if (!normalizedNetwork) {
    throw new Error("Unsupported DataMart network.");
  }

  let phone = String(phoneNumber || "").trim();

  if (phone.startsWith("+233")) {
    phone = "0" + phone.slice(4);
  } else if (phone.startsWith("233")) {
    phone = "0" + phone.slice(3);
  }

  if (!/^0\d{9}$/.test(phone)) {
    throw new Error("Invalid recipient phone number.");
  }

  const size = Number(capacity);

  if (!Number.isFinite(size) || size <= 0) {
    throw new Error("Invalid bundle capacity.");
  }

  if (!idempotencyKey) {
    throw new Error("A unique order idempotency key is required.");
  }

  try {
    const response = await datamart.post(
      "/purchase",
      {
        phoneNumber: phone,
        network: normalizedNetwork,
        capacity: String(size),
        gateway: "wallet"
      },
      {
        headers: {
          "X-API-Key": getApiKey(),
          "X-Idempotency-Key": idempotencyKey
        }
      }
    );

    if (
      response.data?.status !== "success" ||
      !response.data?.data
    ) {
      const error = new Error(
        response.data?.message ||
        "DataMart purchase was unsuccessful."
      );

      error.providerResponse = response.data;
      error.providerHttpStatus = response.status;

      throw error;
    }

    const purchase = response.data.data;

    return {
      purchaseId: purchase.purchaseId ?? null,
      orderReference: purchase.orderReference ?? null,
      transactionReference: purchase.transactionReference ?? null,
      network: purchase.network ?? normalizedNetwork,
      capacity: Number(purchase.capacity ?? size),
      price: Number(purchase.price),
      balanceBefore: purchase.balanceBefore ?? null,
      balanceAfter: purchase.balanceAfter ?? null,
      orderStatus: purchase.orderStatus ?? "unknown",
      processingMethod: purchase.processingMethod ?? null,
      providerResponse: response.data,
    };

  } catch (error) {
    error.providerHttpStatus =
      error.response?.status ?? error.providerHttpStatus;

    error.providerResponse =
      error.response?.data ?? error.providerResponse;

    throw error;
  }
}

/* =========================================
   GET DATAMART ORDER STATUS
   GET /order-status/:reference
========================================= */

export async function getDataMartOrderStatus(reference) {
  if (!reference) {
    throw new Error("DataMart order reference is required.");
  }

  try {
    const response = await datamart.get(
      `/order-status/${encodeURIComponent(reference)}`,
      {
        headers: {
          "X-API-Key": getApiKey()
        }
      }
    );

    return response.data;

  } catch (error) {
    error.providerHttpStatus = error.response?.status;
    error.providerResponse = error.response?.data;
    throw error;
  }
}



