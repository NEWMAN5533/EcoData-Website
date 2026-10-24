// =========================
 // FIREBASE IMPORTS
 // =========================
import { db } from "./firebase-config.js";

import {
  collection,
  where,
  onSnapshot,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";


// =========================
// LOCAL STORAGE KEYS
// =========================
const DELIVERY_TIME_KEY = "ecoLastDeliveryTime";
const LAST_ORDER_KEY = "ecoLastDeliveredOrderId";
const LAST_DELIVERED_AT_KEY = "lastDeliveredAt";


// =========================
// DATE HELPERS
// =========================
function getTimestamp(value) {
  if (value == null) return NaN;

  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }

  if (typeof value.toDate === "function") {
    return value.toDate().getTime();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "number") {
    return value;
  }

  return new Date(value).getTime();
}


function formatDateTime(date) {
  return `${date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  })} • ${date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).toUpperCase()}`;
}


function formatDuration(totalMinutes) {
  const minutes = Math.max(0, Math.floor(totalMinutes));

  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const remainingMinutes = minutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${remainingMinutes}m`;
  }

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }

  return `${remainingMinutes} min`;
}


// =========================
// DELIVERY INDICATOR
// =========================
function updateDeliveryIndicator(snapshot) {
  try {
    // =========================
    // CHECK SNAPSHOT
    // =========================
    if (snapshot.empty) {
      console.log("No delivered orders found.");
      return;
    }

    // =========================
    // GET LATEST DELIVERED ORDER
    // =========================
    const doc = snapshot.docs[0];

    const order = {
      ...doc.data(),
      id: doc.id
    };

    console.log("Latest delivered order:", order);

    // =========================
    // GET TIMESTAMPS
    // =========================
    const createdAt = getTimestamp(order.createdAt);
    const updatedAt = getTimestamp(order.updatedAt);

    if (
      !Number.isFinite(createdAt) ||
      !Number.isFinite(updatedAt) ||
      createdAt <= 0 ||
      updatedAt <= 0 ||
      updatedAt < createdAt
    ) {
      console.error("Invalid order timestamps:", {
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      });

      return;
    }

    const createdDate = new Date(createdAt);
    const deliveredDate = new Date(updatedAt);

    // =========================
    // ORDER IDENTIFICATION
    // =========================
    const currentOrderKey = String(order.orderId || order.id);

    const storedOrderKey =
      localStorage.getItem(LAST_ORDER_KEY);

    let deliveredAt = Number(
      localStorage.getItem(LAST_DELIVERED_AT_KEY)
    );

    if (
      storedOrderKey !== currentOrderKey ||
      !Number.isFinite(deliveredAt) ||
      deliveredAt <= 0
    ) {
      deliveredAt = updatedAt;

      localStorage.setItem(
        LAST_DELIVERED_AT_KEY,
        String(deliveredAt)
      );

      localStorage.setItem(
        LAST_ORDER_KEY,
        currentOrderKey
      );

      console.log("Saved latest delivery timestamp.");
    } else {
      console.log("Using cached delivery timestamp.");
    }

    // =========================
    // CALCULATE DELIVERY DURATION
    // =========================
    const elapsed = updatedAt - createdAt;

    const elapsedMinutes = Math.max(
      0,
      Math.floor(elapsed / 60000)
    );

    const deliveryTime = formatDuration(elapsedMinutes);

    console.log("Delivery duration:", deliveryTime);
    console.log("Elapsed minutes:", elapsedMinutes);

    // =========================
    // FORMAT ORDER TIMES
    // =========================
    const placedAtFormatted = formatDateTime(createdDate);
    const deliveredAtFormatted = formatDateTime(deliveredDate);

    // =========================
    // GET INDICATOR ELEMENTS
    // =========================
    const bubble = document.getElementById("deliveryBubble1");
    const bubble2 = document.getElementById("deliveryBubble2");
    const messageEl = document.getElementById("deliveryMessage");

    // =========================
    // DELIVERY STATUS RULES
    // =========================
    let deliveryClass;
    let deliveryMessage;

    if (elapsedMinutes <= 10) {
      deliveryClass = "instant";

      deliveryMessage =
        "Instant Delivery! Most orders are completed in under 10 minutes.";

    } else if (elapsedMinutes <= 30) {
      deliveryClass = "fast";

      deliveryMessage =
        "MTN is delivering fast right now. Enjoy the speedy delivery!";

    } else if (elapsedMinutes <= 90) {
      deliveryClass = "normal";

      deliveryMessage =
        "Orders are processing normally. Please allow up to 90 minutes.";

    } else {
      deliveryClass = "slow";

      deliveryMessage =
        "Orders are taking longer than usual. Please allow additional processing time.";
    }

    // =========================
    // UPDATE INDICATOR CLASSES
    // =========================
    if (bubble) {
      bubble.className = "delivery-bubble";
      bubble.classList.add(deliveryClass);
    }

    if (bubble2) {
      bubble2.className = "delivery-bubble2";
      bubble2.classList.add(deliveryClass);
    }

    if (messageEl) {
      messageEl.textContent = deliveryMessage;
    }

    // =========================
    // UPDATE DELIVERY TIME UI
    // =========================
    const deliveryTimeEl =
      document.getElementById("deliveryTime");

    const lastDeliveredEl =
      document.getElementById("lastDelivered");

    const actualTimeEl =
      document.getElementById("actualDateWithTime");

    const turnAroundTime =
      document.getElementById("turnAroundTime");

    const placedAtTime =
      document.getElementById("placedAtTime");

    const deliveredAtTime =
      document.getElementById("deliveredAtTime");

    if (deliveryTimeEl) {
      deliveryTimeEl.textContent = deliveryTime;
    }

    if (actualTimeEl) {
      actualTimeEl.textContent = deliveryTime;
    }

    if (turnAroundTime) {
      turnAroundTime.textContent = deliveryTime;
    }

    if (placedAtTime) {
      placedAtTime.textContent = placedAtFormatted;
    }

    if (deliveredAtTime) {
      deliveredAtTime.textContent = deliveredAtFormatted;
    }

    if (lastDeliveredEl) {
      lastDeliveredEl.textContent = deliveredAtFormatted;
    }

    // =========================
    // CACHE DISPLAY VALUES
    // =========================
    localStorage.setItem(
      DELIVERY_TIME_KEY,
      deliveryTime
    );

    // =========================
    // DEBUG
    // =========================
    console.log("Current order:", currentOrderKey);
    console.log("Stored order:", storedOrderKey);
    console.log("Delivered at:", deliveredDate);
    console.log("Current time:", new Date());
    console.log("Delivery class:", deliveryClass);

  } catch (error) {
    console.error("Delivery indicator error:", error);
  }
}


// =========================
// FIRESTORE QUERY
// =========================
const deliveredQuery = query(
  collection(db, "orders"),
  where("status", "==", "delivered"),
  orderBy("updatedAt", "desc"),
  limit(1)
);


// =========================
// LISTEN FOR DELIVERY UPDATES
// =========================
onSnapshot(
  deliveredQuery,
  (snapshot) => {
    console.log("Delivery data updated.");

    updateDeliveryIndicator(snapshot);
  },
  (error) => {
    console.error("Delivery snapshot error:", error);
  }
);
