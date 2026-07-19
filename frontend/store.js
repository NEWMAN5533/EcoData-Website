// store.js

import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Default fallback
const DEFAULT_MARKUP = 2;

// Get store ID from URL
function getStoreId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("store");
}

// Fetch store pricing
export async function getStorePricing() {
  try {
    const storeId = getStoreId();

    // No store → return empty pricing
    if (!storeId) {
      console.warn("No storeId → default pricing");
      return {}; // ✅ IMPORTANT
    }

    const ref = doc(db, "stores", storeId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      console.warn("Store not found → default pricing");
      return {}; // ✅ IMPORTANT
    }

    const data = snap.data();
    return data.pricing || {};

  } catch (err) {
    console.error("Error loading store:", err);
    return {}; // ✅ ALWAYS return object
  }
}

// Helper to calculate final price
export function calculatePrice(pricing, network, size, basePrice) {
  const key = `${network}_${size}`;

  const agentPrice = pricing[key]; // ✅ FIXED

  if (agentPrice) return agentPrice;

  return basePrice + DEFAULT_MARKUP;
}