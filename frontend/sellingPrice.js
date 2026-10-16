

//=============================
// PAYSTACK FEE ATTACHED
//=============================
function calculateSellingPrice(basePrice){
  const price = Number(basePrice);

  if(!Number.isFinite(price) || price <= 0) {
    return 0;
  }



  return Number((price * 1.0195).toFixed(2));
}





//=============================
// PRICE ARRAY
//=============================
export const SELLING_PRICES = [
  {
    volume: 1,
    promoPrice: 5.70,
    agentPrice: 5.70,
    userPrice: 5.99
  },

   {
    volume: 2,
    promoPrice: 11.50,
    agentPrice: 11.50,
    userPrice: 11.99
  },

   {
    volume: 3,
    promoPrice: 17.20,
    agentPrice: 15.90,
    userPrice: 17.99
  },

   {
    volume: 4,
    promoPrice: 21.60,
    agentPrice: 19.90,
    userPrice: 22.90
  },

   {
    volume: 5,
    promoPrice: 25.50,
    agentPrice: 24.60,
    userPrice: 26.99
  },

   {
    volume: 6,
    promoPrice: 28.90,
    agentPrice: 29.60,
    userPrice: 32.99
  },

 

   {
    volume: 8,
    promoPrice: 39,
    agentPrice: 38.60,
    userPrice: 47.99
  },

   {
    volume: 10,
    promoPrice: 46.20,
    agentPrice: 45.60,
    userPrice: 47.99
  },


   {
    volume: 15,
    promoPrice: 67,
    agentPrice: 65.99,
    userPrice: 69.97
  },


   {
    volume: 20,
    promoPrice: 88,
    agentPrice: 85.99,
    userPrice: 92.98
  },


   {
    volume: 25,
    promoPrice: 109,
    agentPrice: 107.99,
    userPrice: 112.99
  },


   {
    volume: 30,
    promoPrice: 129,
    agentPrice: 126.99,
    userPrice: 132.97
  },


   {
    volume: 40,
    promoPrice: 168,
    agentPrice: 165.99,
    userPrice: 171.98
  },


   {
    volume: 50,
    promoPrice: 209,
    agentPrice: 205.99,
    userPrice: 218.98
  },


];

//====================
// FIND SELLING PRICE
//====================

export function getSellingPrices(volume){
  const bundle = SELLING_PRICES.find(item => item.volume === Number(volume));

  if(!bundle){
    return null;
  }

  return {
    promoPrice: calculateSellingPrice(bundle.promoPrice),

    agentPrice: calculateSellingPrice(bundle.agentPrice),

    userPrice: calculateSellingPrice(bundle.userPrice)
  };
}


//=================================
// VERIFY SUBMITTED SELLING PRICE
//=================================
export function verifySellingPrice(volume, amount){
  const prices = getSellingPrices(volume);

  if(!prices){
    return {
      valid: false,
      message: "Unsupported bundle volume."
    };
  }

  const submittedAmount = Number(amount);

  if(!Number.isFinite(submittedAmount) || submittedAmount <= 0 ){
    return {
      valid: false,
      message: "Invalid bundle price."
    };
  }

  const acceptedPrices = [
    {
    type: "promoPrice",
    amount: prices.promoPrice
    },
    {
    type: "agentPrice",
    amount: prices.agentPrice
    },
    {
    type: "userPrice",
    amount: prices.userPrice
    }
  ];

  const matchedPrice = acceptedPrices.find(price => 
    Math.round(price.amount * 100) === Math.round(submittedAmount * 100)
  );

  if(!matchedPrice){
    return {
      valid: false,
      message: "The submitted price does not match an approved selling price."
    };
  }

  return {
    valid: true,
    priceType: matchedPrice.type,
    expectedPrice: matchedPrice.amount
  }
}