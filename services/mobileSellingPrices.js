import { getSellingPrices } from "../frontend/sellingPrice.js";

/**
 * One authoritative selling-price source for the mobile app.
 *
 * Vendor selection (DataMart vs SwiftData) must never
 * change the selling price.
 */
export function getMobileSellingPrice(network, size, packageName) {
  const normalizedPackage = String(packageName || "")
    .trim()
    .toLowerCase();


  const normalizedSize = String(size)
  .trim()
  .toUpperCase()
  .replace(/\s*GB$/, "");

  const prices = getSellingPrices(network, normalizedSize);

  if (!prices) {
    throw new Error(`No selling price configured for ${network} ${size}GB.`);
  }

  // Keep the product's existing price category, but don't
  // choose a different price based on the fulfillment vendor.
  if (normalizedPackage === "express") {
    if (prices.userPrice != null) return Number(prices.userPrice);
    if (prices.standardPrice != null) return Number(prices.standardPrice);
  }

  if (
    normalizedPackage === "verified" ||
    normalizedPackage === "all verified"
  ) {
    if (prices.userPrice != null) return Number(prices.userPrice);
    if (prices.standardPrice != null) return Number(prices.standardPrice);
  }

  if (normalizedPackage === "normal") {
    if (prices.userPrice != null) return Number(prices.userPrice);
    if (prices.standardPrice != null) return Number(prices.standardPrice);
  }

  throw new Error(`Unsupported mobile package "${packageName}".`);
}
