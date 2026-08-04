export const VENDOR_BUNDLES = [
  { volume: 1, vendorPrice: 4.90 },
  { volume: 2, vendorPrice: 10.00 },
  { volume: 3, vendorPrice: 14.50 },
  { volume: 4, vendorPrice: 18.50 },
  { volume: 5, vendorPrice: 23.50 },
  { volume: 6, vendorPrice: 26.50 },
  { volume: 7, vendorPrice: 33.50 },
  { volume: 8, vendorPrice: 37.00 },
  { volume: 10, vendorPrice: 43.90 },
  { volume: 12, vendorPrice: 52.00 },
  { volume: 15, vendorPrice: 63.50 },
  { volume: 20, vendorPrice: 83.50 },
  { volume: 25, vendorPrice: 103.50 },
  { volume: 30, vendorPrice: 123.50 },
  { volume: 40, vendorPrice: 162.50 },
  { volume: 50, vendorPrice: 203.00 }
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

  const amount = Number(ecoPrice) || 0;

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