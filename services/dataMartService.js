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
    String(pkg.network || "").trim().toUpperCase() === network &&
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
    providerPrice <= 0 ||
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




export async function getDataMartPackages(network) {
  const normalizedNetwork = mapNetworkToDataMart(network);

  if (!normalizedNetwork) {
    throw new Error("Unsupported DataMart network.");
  }

  const response = await datamart.get("/data-packages", {
    params: { network: normalizedNetwork },
    headers: {
      "X-API-Key": getApiKey()
    }
  });

  const body = response.data;

  if (body?.status !== "success") {
    throw new Error(
      body?.message || "Unable to retrieve DataMart packages."
    );
  }

  const data = body.data;
  let packages;

  // Documented response:
  // data: { YELLO: [...], TELECEL: [...], AT_PREMIUM: [...] }
  if (
    data &&
    !Array.isArray(data) &&
    typeof data === "object"
  ) {
    packages = data[normalizedNetwork];
  }

  // Alternative response: data is directly an array of packages.
  if (Array.isArray(data)) {
    packages = data.filter(pkg => {
      const packageNetwork = String(pkg?.network || "")
        .trim()
        .toUpperCase();

      return packageNetwork === normalizedNetwork;
    });
  }

  console.log("DataMart package parsing:", {
    requestedNetwork: normalizedNetwork,
    dataIsArray: Array.isArray(data),
    packageCount: Array.isArray(packages)
      ? packages.length
      : 0,
    firstPackage: Array.isArray(packages)
      ? packages[0]
      : null
  });

  if (!Array.isArray(packages) || packages.length === 0) {
    throw new Error(
      `No DataMart packages found for ${normalizedNetwork}.`
    );
  }

  return packages;
}






// =========================================
// PURCHASE DATA THROUGH DATAMART
// POST /purchase
// =========================================

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

  const apiSecret = process.env.DATAMART_API_SECRET;
  const referencePrefix = process.env.DATAMART_REFERENCE_PREFIX;

  if (!apiSecret) {
    throw new Error("DATAMART_API_SECRET is not configured.");
  }

  if (!referencePrefix) {
    throw new Error("DATAMART_REFERENCE_PREFIX is not configured.");
  }

  // Must match the reference prefix configured in DataMart.
  const ref = `${referencePrefix}${idempotencyKey}`;

  try {
    const response = await datamart.post(
      "/purchase",
      {
        phoneNumber: phone,
        network: normalizedNetwork,
        capacity: String(size),
        gateway: "wallet",
        ref
      },
      {
        headers: {
          "X-API-Key": getApiKey(),
          "X-API-Secret": apiSecret,
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
  const orderReference = String(reference || "").trim();

  if (!orderReference) {
    throw new Error("Ecodata order reference is required.");
  }

  const apiKey = getApiKey();
  const apiSecret = process.env.DATAMART_API_SECRET;

  if (!apiKey) {
    throw new Error("DATAMART_API_KEY is not configured.");
  }

  if (!apiSecret) {
    throw new Error("DATAMART_API_SECRET is not configured.");
  }

  try {
    const response = await datamart.get(
      `/order-status/${encodeURIComponent(orderReference)}`,
      {
        headers: {
          "X-API-Key": apiKey,
          "X-API-Secret": apiSecret,
          Accept: "application/json"
        }
      }
    );

    return response.data;
  } catch (error) {
    error.providerHttpStatus = error.response?.status ?? null;
    error.providerResponse = error.response?.data ?? null;

    console.error("Order status request rejected:", {
      httpStatus: error.providerHttpStatus,
      code: error.providerResponse?.code ?? null,
      message: error.providerResponse?.message ?? error.message
    });

    throw error;
  }
}








/* =========================================
   DATAMART MTN MASHUP
========================================= */

function getMashupHeaders() {
  const headers = {
    "X-API-Key": getApiKey(),
    "Accept": "application/json",
    "Content-Type": "application/json"
  };

  // DataMart's MashUp API is also subject to
  // the account's second-secret requirement.
  const apiSecret = process.env.DATAMART_API_SECRET;

  if (apiSecret) {
    headers["X-API-Secret"] = apiSecret;
  }

  return headers;
}

/* =========================================
   GET LIVE MASHUP CATALOGUE
   GET /mashup/packages
========================================= */

export async function getDataMartMashupPackages() {
  try {
    const response = await datamart.get(
      "/mashup/packages",
      {
        headers: getMashupHeaders()
      }
    );

    const body = response.data;

    if (
      body?.status !== "success" ||
      !Array.isArray(body.data)
    ) {
      const error = new Error(
        body?.message ||
        "Unable to retrieve DataMart MashUp packages."
      );

      error.providerHttpStatus = response.status;
      error.providerResponse = body;
      throw error;
    }

    // A closed lane means purchases cannot proceed.
    // Still return the catalogue so the route can report
    // availability accurately to the frontend.
    return {
      open: body.open === true,
      currency: body.currency || "GHS",
      pricingTier: body.pricingTier || null,

      packages: body.data.map(pkg => ({
        comboCost: Number(pkg.comboCost),
        price: Number(pkg.price),
        title: String(pkg.title || ""),
        mb: Number(pkg.mb),
        capacity: Number(pkg.capacity),
        onnetMins: Number(pkg.onnetMins),
        offnetMins: Number(pkg.offnetMins),
        sms: Number(pkg.sms),
        validityDays: Number(pkg.validityDays)
      }))
    };
  } catch (error) {
    error.providerHttpStatus =
      error.response?.status ??
      error.providerHttpStatus ??
      null;

    error.providerResponse =
      error.response?.data ??
      error.providerResponse ??
      null;

    console.error("DataMart MashUp catalogue error:", {
      status: error.providerHttpStatus,
      code: error.providerResponse?.code ?? null,
      message: error.providerResponse?.message || error.message
    });

    throw error;
  }
}

/* =========================================
   PURCHASE MASHUP PACKAGE
   POST /mashup/purchase
========================================= */

export async function purchaseDataMartMashup({
  phoneNumber,
  comboCost,
  reference
}) {
  // Normalize Ghanaian phone number.
  let phone = String(phoneNumber || "").trim();

  if (phone.startsWith("+233")) {
    phone = "0" + phone.slice(4);
  } else if (phone.startsWith("233")) {
    phone = "0" + phone.slice(3);
  }

  if (!/^0\d{9}$/.test(phone)) {
    throw new Error("Invalid recipient phone number.");
  }

  const selectedComboCost = Number(comboCost);

  if (
    !Number.isInteger(selectedComboCost) ||
    selectedComboCost <= 0
  ) {
    throw new Error("Invalid MashUp package selection.");
  }

  const orderReference = String(reference || "").trim();

  if (
    !orderReference ||
    orderReference.length > 100
  ) {
    throw new Error("A valid unique order reference is required.");
  }

  const apiSecret = process.env.DATAMART_API_SECRET;

  if (!apiSecret) {
    throw new Error("DATAMART_API_SECRET is not configured.");
  }

  // Re-fetch the provider catalogue on the backend.
  // Never trust a price submitted by the browser.
  const catalogue = await getDataMartMashupPackages();

  if (!catalogue.open) {
    const error = new Error(
      "DataMart MashUp is temporarily unavailable."
    );

    error.providerHttpStatus = 503;
    error.providerResponse = {
      code: "MASHUP_UNAVAILABLE"
    };

    throw error;
  }

  const selectedPackage = catalogue.packages.find(
    pkg => pkg.comboCost === selectedComboCost
  );

  if (!selectedPackage) {
    const error = new Error(
      "The selected MashUp package is not available."
    );

    error.providerHttpStatus = 400;
    error.providerResponse = {
      code: "UNKNOWN_PACKAGE"
    };

    throw error;
  }

  try {
    const response = await datamart.post(
      "/mashup/purchase",
      {
        phoneNumber: phone,
        comboCost: selectedPackage.comboCost,
        ref: orderReference
      },
      {
        headers: getMashupHeaders()
      }
    );

    const body = response.data;

    if (
      body?.status !== "success" ||
      !body?.data
    ) {
      const error = new Error(
        body?.message ||
        "DataMart MashUp purchase was unsuccessful."
      );

      error.providerHttpStatus = response.status;
      error.providerResponse = body;

      throw error;
    }

    const purchase = body.data;

    return {
      orderId: purchase.orderId ?? null,
      reference: purchase.reference ?? orderReference,
      phoneNumber: purchase.phoneNumber ?? phone,
      network: purchase.network ?? "MTN_COMBO",
      orderStatus: purchase.orderStatus ?? "pending",

      comboCost: Number(
        purchase.comboCost ?? selectedPackage.comboCost
      ),

      // Provider charge, not a customer-supplied price.
      price: Number(purchase.price),

      title: purchase.title ?? selectedPackage.title,
      mb: Number(purchase.mb ?? selectedPackage.mb),
      capacity: Number(
        purchase.capacity ?? selectedPackage.capacity
      ),
      onnetMins: Number(
        purchase.onnetMins ?? selectedPackage.onnetMins
      ),
      offnetMins: Number(
        purchase.offnetMins ?? selectedPackage.offnetMins
      ),
      sms: Number(purchase.sms ?? selectedPackage.sms),
      validityDays: Number(
        purchase.validityDays ?? selectedPackage.validityDays
      ),

      balanceAfter: purchase.balanceAfter ?? null,
      trackWith: purchase.trackWith ?? null,

      providerResponse: body
    };
  } catch (error) {
    error.providerHttpStatus =
      error.response?.status ??
      error.providerHttpStatus ??
      null;

    error.providerResponse =
      error.response?.data ??
      error.providerResponse ??
      null;

    console.error("DataMart MashUp purchase error:", {
      status: error.providerHttpStatus,
      code: error.providerResponse?.code ?? null,
      message: error.providerResponse?.message || error.message,
      reference: orderReference
    });

    throw error;
  }
}
