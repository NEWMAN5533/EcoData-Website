export const VENDOR_BUNDLES = [
  { volume: 1, vendorPrice: 4 },
  { volume: 2, vendorPrice: 8.50 },
  { volume: 3, vendorPrice: 12.50 },
  { volume: 4, vendorPrice: 16 },
  { volume: 5, vendorPrice: 20 },
  { volume: 6, vendorPrice: 23.50 },
  { volume: 7, vendorPrice: 33.50 },
  { volume: 8, vendorPrice: 32.00 },
  { volume: 10, vendorPrice: 39.50 },
  { volume: 12, vendorPrice: 79.50 },
  { volume: 15, vendorPrice: 59.50 },
  { volume: 20, vendorPrice: 79.50 },
  { volume: 25, vendorPrice: 96.00 },
  { volume: 30, vendorPrice: 118.50 },
  { volume: 40, vendorPrice: 158.50 },
  { volume: 50, vendorPrice: 197.00 }
];

//==================
// GET VENDOR PRICE
//==================
export function getVendorPrice(volume) {

  const bundle = VENDOR_BUNDLES.find(
    item => item.volume === Number(volume)
  );

  return Number(bundle?.vendorPrice ?? 0);

}

//===================
// PAYSTACK FEE
//===================
export function getPaystackFee(amount) {

  const totalAmount = Number(amount) || 0;

  return Number((totalAmount * 0.0195).toFixed(2));

}

//===================
// CALCULATE PROFIT
//===================
export function calculateProfit(volume, ecoPrice) {

  const amount = Number(ecoPrice || 0);

  const vendorPrice = getVendorPrice(volume);

  const paystackFee = getPaystackFee(amount);

  const grossProfit = Number(
    (amount - vendorPrice).toFixed(2)
  );

  const netProfit = Number(
    (grossProfit - paystackFee).toFixed(2)
  );

  return {
    vendorPrice,
    paystackFee,
    grossProfit,
    netProfit
  };

}
