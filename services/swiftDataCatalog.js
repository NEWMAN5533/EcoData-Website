import axios from "axios";

const SWIFT_V2_BASE_URL = (
  process.env.SWIFT_BASE_URL ||
  "https://api.swiftdata-link.com/v2"
).replace(/\/+$/, "");

function getSwiftDataApiKey() {
  const apiKey = process.env.SWIFT_API_KEY;

  if (!apiKey) {
    throw new Error("SWIFT_API_KEY is not configured.");
  }

  return apiKey;
}

const swiftDataClient = axios.create({
  baseURL: SWIFT_V2_BASE_URL,
  timeout: 20000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

/* =========================================
   GET SWIFTDATA V2 CATALOGUE
   GET /catalog
========================================= */

export async function getSwiftDataCatalog() {
  const response = await swiftDataClient.get("/catalog", {
    headers: {
      "X-API-Key": getSwiftDataApiKey(),
    },
  });

  const body = response.data;

  if (
    body?.success !== true ||
    !Array.isArray(body?.data?.offers)
  ) {
    const error = new Error(
      body?.error?.message ||
        "SwiftData returned an invalid catalogue."
    );

    error.providerHttpStatus = response.status;
    error.providerResponse = body;

    throw error;
  }

  return body.data.offers;
}

/* =========================================
   FIND A DATA OFFER AND PACKAGE
========================================= */

export async function findSwiftDataPackage(network, size, pkg) {
  const normalizedNetwork = String(network || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  const networkAliases = {
    mtn: ["mtn", "yello"],
    yello: ["mtn", "yello"],
    telecel: ["telecel"],
    airteltigo: ["airteltigo", "at", "atpremium"],
    at: ["airteltigo", "at", "atpremium"],
  };

  const acceptedNetworks = networkAliases[normalizedNetwork];

  if (!acceptedNetworks) {
    throw new Error(`Unsupported SwiftData network: ${network}`);
  }

  const capacity = Number(
    String(size)
      .trim()
      .replace(/gb$/i, "")
      .replace(/g$/i, "")
  );

  if (!Number.isFinite(capacity) || capacity <= 0) {
    throw new Error("Invalid data bundle size.");
  }

  // Match EcoData's package identifier to the SwiftData offer.
  const packageName = String(pkg || "")
    .trim()
    .toLowerCase();

  const offerMap = {
    mtn_data_express_delivery: "mtn_data_express_delivery",
    mtn_verified_numbers: "mtn_verified_numbers",
    telecel_expiry_bundle: "telecel_expiry_bundle",
    ishare_data_bundle: "ishare_data_bundle",
  };

  const expectedOfferSlug = offerMap[packageName];

  if (!expectedOfferSlug) {
    throw new Error(
      `No SwiftData offer mapping exists for EcoData package: ${pkg}`
    );
  }

  const offers = await getSwiftDataCatalog();

  // Match both the network and the exact offer.
  const matchingOffers = offers.filter((offer) => {
    const offerNetwork = String(offer.network || "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");

    const offerKind = String(offer.kind || "data")
      .trim()
      .toLowerCase();

    const actualOfferSlug = String(
      offer.offerSlug || offer.slug || ""
    )
      .trim()
      .toLowerCase();

    return (
      acceptedNetworks.includes(offerNetwork) &&
      offerKind === "data" &&
      actualOfferSlug === expectedOfferSlug &&
      Array.isArray(offer.packages)
    );
  });

  const matches = [];

  for (const offer of matchingOffers) {
    const selected = offer.packages.find((item) => {
      const label = String(item.sizeLabel || "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");

      const match = label.match(/^(\d+(?:\.\d+)?)G(?:B)?$/);

      return match && Number(match[1]) === capacity;
    });

    if (selected) {
      matches.push({
        offerSlug: offer.offerSlug || offer.slug || null,
        offerId: offer.id || null,
        offerName: offer.name || null,
        network: offer.network,
        sizeLabel: selected.sizeLabel,
        volumeMb: selected.volumeMb ?? null,
        priceMinor: selected.priceMinor ?? null,
      });
    }
  }

  if (matches.length === 0) {
    throw new Error(
      `SwiftData has no matching ${capacity}GB ${network} package for offer ${expectedOfferSlug}.`
    );
  }

  if (matches.length > 1) {
    throw new Error(
      `Multiple SwiftData offers match ${capacity}GB ${network} for ${expectedOfferSlug}.`
    );
  }

  return matches[0];
}
