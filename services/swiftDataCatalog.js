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

export async function findSwiftDataPackage(network, size) {
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

  const offers = await getSwiftDataCatalog();

  const matchingOffers = offers.filter((offer) => {
    const offerNetwork = String(offer.network || "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");

    const offerKind = String(offer.kind || "data")
      .trim()
      .toLowerCase();

    return (
      acceptedNetworks.includes(offerNetwork) &&
      offerKind === "data" &&
      Array.isArray(offer.packages)
    );
  });

  const matches = [];

  for (const offer of matchingOffers) {
    const pkg = offer.packages.find((item) => {
      const label = String(item.sizeLabel || "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");

      const match = label.match(/^(\d+(?:\.\d+)?)G(?:B)?$/);

      return match && Number(match[1]) === capacity;
    });

    if (pkg && (offer.offerSlug || offer.slug || offer.id)) {
      matches.push({
        offerSlug: offer.offerSlug || offer.slug || null,
        offerId: offer.id || null,
        offerName: offer.name || null,
        network: offer.network,
        sizeLabel: pkg.sizeLabel,
        volumeMb: pkg.volumeMb ?? null,
        priceMinor: pkg.priceMinor ?? null,
      });
    }
  }

  if (matches.length === 0) {
    throw new Error(
      `SwiftData has no matching ${capacity}GB ${network} data package in the v2 catalogue.`
    );
  }

  if (matches.length > 1) {
    throw new Error(
      `Multiple SwiftData offers match ${capacity}GB ${network}. Configure an explicit offer preference.`
    );
  }

  return matches[0];
}