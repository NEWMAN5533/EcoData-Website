// src/services/dataMartSellingPrices.js

const MINIMUM_PROFIT = 0.20;

// Enter your chosen fixed selling prices here.
// These prices exclude the Paystack fee.
export const DATAMART_SELLING_PRICES = {
  mtn: {
    // Example format:
    // 1: 6.00,
    // 2: 12.00,
    1: 4.40,
    2: 9.50,
    3: 13.95,
    4: 18.70,
    5: 23.90,
    6: 27.40,
    8: 36.30,
    10: 43.40,
    15: 62.70,
    20: 82.50,
    25: 102.80,
    30: 124.50,
    40: 161.70,
    50: 204.40
  },

  telecel: {
    // Example format:
    // 10: 49.00,
    10: 40.50,
    15: 56.90,
    20: 76.80,
    25: 102.50,
    30: 120.65,
    35: 145.50,
    45: 175.00,
    50: 195.80,
    100: 410.50
  },

  at: {
    // Example format:
    // 1: 7.50,
    1: 4.8,
    2: 9.00,
    3: 14.00,
    4: 19.10,
    5: 23.30,
    6: 27.80,
    8: 35.00,
    10: 43.30,
    12: 51.00,
    15: 62.20,
    25: 101.00,
    30: 121.50,
    40: 168.58,
    50: 197.80,
  },
};

export function getDataMartSellingPrice(network, volume) {
  const normalizedNetwork = String(network || "")
    .trim()
    .toLowerCase()
    .replace("airteltigo", "at")
    .replace("airtel-tigo", "at");

  const size = Number(volume);
  const price = DATAMART_SELLING_PRICES[normalizedNetwork]?.[size];

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(
      `No DataMart selling price configured for ${normalizedNetwork} ${size}GB.`
    );
  }

  return price;
}

export function checkDataMartProfit({
  network,
  volume,
  providerCost,
}) {
  const sellingPrice = getDataMartSellingPrice(network, volume);
  const cost = Number(providerCost);

  if (!Number.isFinite(cost) || cost < 0) {
    throw new Error("Invalid DataMart provider cost.");
  }

  const grossProfit = Number((sellingPrice - cost).toFixed(2));

  return {
    sellingPrice,
    providerCost: cost,
    grossProfit,
    minimumProfit: MINIMUM_PROFIT,
    profitable: grossProfit >= MINIMUM_PROFIT,
  };
}