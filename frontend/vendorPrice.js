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
// GET VEN PRICE
//==================
export function getVendorPrice(volume){
  return(
    VENDOR_BUNDLES.find(
      bundle => bundle.volume === Number(volume)
    ) || null
  );
}


//===================
// PAYSTACK FEE
//===================
export function getPaystackFee(amount){
  return Number((amount * 0.0195).toFixed(2));
}

//===================
// CALCULATE PROFIT
//===================
export function calculateProfit(volume, ecoPrice){
  const vendorPrice =
  getVendorPrice(volume);

  const paystackFee = 
  getPaystackFee(ecoPrice);

  const grossProfit = 
  ecoPrice - vendorPrice;

  const netProfit =
  grossProfit - paystackFee;

  return{
    vendorPrice,
    paystackFee,
    grossProfit,
    netProfit
  };
}