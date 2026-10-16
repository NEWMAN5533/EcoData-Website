/**
 * ECODATA SELLING PRICE VERIFICATION
 * MTN + AT + TELECEL
 * Base prices include no Paystack fee.
 */

const PAYSTACK_FEE_RATE = 0.0195;

// ==========================================
// NORMALIZE NETWORK NAME
// ==========================================
function normalizeNetwork(network) {
  const value = String(network || "").trim().toLowerCase();

  if (value === "airteltigo" || value === "airtel-tigo") {
    return "at";
  }

  return value;
}

// ==========================================
// CALCULATE SELLING PRICE WITH PAYSTACK FEE
// Must match the frontend calculation.
// ==========================================
function calculateSellingPrice(basePrice) {
  const price = Number(basePrice);

  if (!Number.isFinite(price) || price <= 0) {
    return 0;
  }

  return Number((price * (1 + PAYSTACK_FEE_RATE)).toFixed(2));
}

// ==========================================
// MTN BASE PRICES
// ==========================================
export const SELLING_PRICES = [
  { volume: 1, promoPrice: 5.70, agentPrice: 5.70, userPrice: 5.99 },
  { volume: 2, promoPrice: 11.50, agentPrice: 11.50, userPrice: 11.99 },
  { volume: 3, promoPrice: 17.20, agentPrice: 15.90, userPrice: 17.99 },
  { volume: 4, promoPrice: 21.60, agentPrice: 19.90, userPrice: 22.90 },
  { volume: 5, promoPrice: 25.50, agentPrice: 24.60, userPrice: 26.99 },
  { volume: 6, promoPrice: 28.90, agentPrice: 29.60, userPrice: 32.99 },
  { volume: 8, promoPrice: 39.00, agentPrice: 38.60, userPrice: 47.99 },
  { volume: 10, promoPrice: 46.20, agentPrice: 45.60, userPrice: 47.99 },
  { volume: 15, promoPrice: 67.00, agentPrice: 65.99, userPrice: 69.97 },
  { volume: 20, promoPrice: 88.00, agentPrice: 85.99, userPrice: 92.98 },
  { volume: 25, promoPrice: 109.00, agentPrice: 107.99, userPrice: 112.99 },
  { volume: 30, promoPrice: 129.00, agentPrice: 126.99, userPrice: 132.97 },
  { volume: 40, promoPrice: 168.00, agentPrice: 165.99, userPrice: 171.98 },
  { volume: 50, promoPrice: 209.00, agentPrice: 205.99, userPrice: 218.98 },
];

// ==========================================
// AT BASE PRICES
// ==========================================
export const AT_SELLING_PRICES = [
  { volume: 1, price: 6.98 },
  { volume: 2, price: 12.90 },
  { volume: 3, price: 16.98 },
  { volume: 4, price: 22.98 },
  { volume: 5, price: 26.98 },
  { volume: 6, price: 30.98 },
  { volume: 7, price: 34.98 },
  { volume: 8, price: 38.98 },
  { volume: 9, price: 43.99 },
  { volume: 10, price: 46.98 },
  { volume: 12, price: 55.98 },
  { volume: 15, price: 68.98 },
  { volume: 20, price: 88.99 },
  { volume: 25, price: 109.98 },
  { volume: 30, price: 131.99 },
  { volume: 40, price: 169.98 },
  { volume: 50, price: 209.99 },
];

// ==========================================
// TELECEL BASE PRICES
// ==========================================
export const TELECEL_SELLING_PRICES = [
  { volume: 10, price: 47.99 },
  { volume: 15, price: 67.99 },
  { volume: 20, price: 89.99 },
  { volume: 25, price: 109.99 },
  { volume: 30, price: 133.96 },
  { volume: 35, price: 142.99 },
  { volume: 40, price: 174.98 },
  { volume: 50, price: 209.99 },
  { volume: 100, price: 396.99 },
];

// ==========================================
// FIND APPROVED SELLING PRICES
// ==========================================
export function getSellingPrices(network, volume) {
  const normalizedNetwork = normalizeNetwork(network);
  const requestedVolume = Number(volume);

  if (normalizedNetwork === "mtn") {
    const bundle = SELLING_PRICES.find(
      item => item.volume === requestedVolume
    );

    if (!bundle) return null;

    return {
      promoPrice: calculateSellingPrice(bundle.promoPrice),
      agentPrice: calculateSellingPrice(bundle.agentPrice),
      userPrice: calculateSellingPrice(bundle.userPrice),
    };
  }

  let bundle;

  if (normalizedNetwork === "at") {
    bundle = AT_SELLING_PRICES.find(
      item => item.volume === requestedVolume
    );
  } else if (normalizedNetwork === "telecel") {
    bundle = TELECEL_SELLING_PRICES.find(
      item => item.volume === requestedVolume
    );
  } else {
    return null;
  }

  if (!bundle) return null;

  return {
    standardPrice: calculateSellingPrice(bundle.price),
  };
}

// ==========================================
// VERIFY SUBMITTED SELLING PRICE
// ==========================================
export function verifySellingPrice(network, volume, amount) {
  const normalizedNetwork = normalizeNetwork(network);
  const prices = getSellingPrices(normalizedNetwork, volume);

  if (!prices) {
    return {
      valid: false,
      message: "Unsupported network or bundle volume.",
    };
  }

  const submittedAmount = Number(amount);

  if (!Number.isFinite(submittedAmount) || submittedAmount <= 0) {
    return {
      valid: false,
      message: "Invalid bundle price.",
    };
  }

  const acceptedPrices = Object.entries(prices).map(([type, price]) => ({
    type,
    amount: price,
  }));

  const matchedPrice = acceptedPrices.find(
    item =>
      Math.round(item.amount * 100) ===
      Math.round(submittedAmount * 100)
  );

  if (!matchedPrice) {
    return {
      valid: false,
      message:
        "The submitted price does not match an approved selling price.",
    };
  }

  return {
    valid: true,
    network: normalizedNetwork,
    priceType: matchedPrice.type,
    expectedPrice: matchedPrice.amount,
  };
}