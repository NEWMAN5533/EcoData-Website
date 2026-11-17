import { getSellingPrices } from "../frontend/sellingPrice.js";
import { getDataMartSellingPrice } from "../services/dataMartSellingPrices.js";

/**
 * Authoritative mobile selling prices.
 *
 * Normal   -> DataMart
 * Express  -> SwiftData userPrice
 * Verified -> SwiftData userPrice
 *
 * Prices exclude the additional Paystack fee.
 */
export function getMobileSellingPrice(network, size, packageName) {
  const normalizedPackage = String(packageName || "")
    .trim()
    .toLowerCase();

  const normalizedNetwork = String(network || "")
    .trim()
    .toLowerCase()
    .replace("airteltigo", "at")
    .replace("airtel-tigo", "at");

  const volume = Number(String(size).replace(/gb/i, "").trim());

  if (!Number.isFinite(volume) || volume <= 0) {
    throw new Error(`Invalid bundle size: ${size}`);
  }

  // Normal Delivery: DataMart prices.
  if (normalizedPackage === "normal") {
    return getDataMartSellingPrice(normalizedNetwork, volume);
  }

  // Express and All Verified: SwiftData prices.
  if (
    normalizedPackage === "express" ||
    normalizedPackage === "verified" ||
    normalizedPackage === "all verified"
  ) {
    const prices = getSellingPrices(normalizedNetwork, volume);

    if (!prices) {
      throw new Error(
        `No SwiftData selling price configured for ${normalizedNetwork} ${volume}GB.`,
      );
    }

    const price =
      normalizedNetwork === "mtn"
        ? prices.userPrice
        : prices.standardPrice;

    if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
      throw new Error(
        `No valid SwiftData selling price configured for ${normalizedNetwork} ${volume}GB.`,
      );
    }

    return Number(price);
  }

  throw new Error(`Unsupported mobile package "${packageName}".`);
}
