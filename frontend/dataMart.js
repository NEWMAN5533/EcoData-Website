// dataMart.js

export function normalizeOrder(responseData, bundle, recipient) {

  const raw = responseData?.order || responseData?.data || responseData;

  return {
    orderId:
      raw.orderId ||       // SwiftData
      raw.id ||            // DataMart
      raw.reference ||     // fallback
      null,

    reference:
      raw.reference ||
      raw.id ||
      null,

    status:
      raw.status ||
      raw.state ||
      "pending",

    recipient,
    volume: bundle?.size || 0,
    network: bundle?.network || "-",
    amount: bundle?.price || 0,
    createdAt: Date.now()
  };
}