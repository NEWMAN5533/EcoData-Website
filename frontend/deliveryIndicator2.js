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
// PORTAL CONFIGURATION
// =========================
const PORTALS = {
  express: {
    name: "MTN DATA EXPRESS DELIVERY",
    packageName: "mtn_data_express_delivery",
    prefix: "express"
  },

  normal: {
    name: "MTN DATA NORMAL DELIVERY",
    packageName: "mtn_data_normal_delivery",
    prefix: "normal"
  },

  verified: {
    name: "MTN VERIFIED NUMBERS",
    packageName: "mtn_verified_numbers",
    prefix: "verified"
  }
};


// =========================
// TIMESTAMP HELPER
// Aligned with deliveryTracker.js
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


// =========================
// FORMAT DELIVERY DURATION
// =========================
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
// FORMAT DELIVERY DATE
// =========================
function formatDeliveredDate(timestamp) {
  return new Date(timestamp).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}


// =========================
// GET DELIVERY PERFORMANCE
// =========================
function getDeliveryPerformance(elapsedMinutes) {
  if (elapsedMinutes <= 10) {
    return {
      state: "instant",
      label: "Instant",
      message: "Excellent turnaround on the latest completed order."
    };
  }

  if (elapsedMinutes <= 30) {
    return {
      state: "fast",
      label: "Fast",
      message: "The latest completed order was delivered quickly."
    };
  }

  if (elapsedMinutes <= 90) {
    return {
      state: "normal",
      label: "Normal",
      message: "The latest completed order was processed normally."
    };
  }

  return {
    state: "slow",
    label: "Slow",
    message: "The latest completed order took longer than usual."
  };
}


// =========================
// RENDER ONE PORTAL
// =========================
function renderPortal(key, order) {
  const portal = PORTALS[key];
  const prefix = portal.prefix;

  const card = document.getElementById(`${prefix}Tracker`);
  const statusEl = document.getElementById(`${prefix}Status`);
  const timeEl = document.getElementById(`${prefix}Time`);

  // Optional elements supported by the larger card design.
  const messageEl = document.getElementById(`${prefix}Message`);
  const lastDeliveredEl = document.getElementById(
    `${prefix}LastDelivered`
  );

  if (!card || !statusEl || !timeEl) {
    console.warn(
      `Missing required UI elements for ${portal.name}`
    );
    return;
  }

  // Reset the state while preserving the compact card class.
  function resetCard() {
    card.className = "dp-item";
  }

  // No delivered order exists for this portal yet.
  if (!order) {
    resetCard();

    statusEl.textContent = "Awaiting delivery";
    timeEl.textContent = "--";

    if (messageEl) {
      messageEl.textContent =
        "Performance will appear after a new order from this portal is delivered.";
    }

    if (lastDeliveredEl) {
      lastDeliveredEl.textContent = "--";
    }

    return;
  }

  // =========================
  // VALIDATE TIMESTAMPS
  // =========================
  const createdAt = getTimestamp(order.createdAt);
  const deliveredAt = getTimestamp(order.updatedAt);

  if (
    !Number.isFinite(createdAt) ||
    !Number.isFinite(deliveredAt) ||
    createdAt <= 0 ||
    deliveredAt <= 0 ||
    deliveredAt < createdAt
  ) {
    resetCard();

    statusEl.textContent = "Data unavailable";
    timeEl.textContent = "--";

    if (messageEl) {
      messageEl.textContent =
        "The latest order has missing or invalid timestamps.";
    }

    if (lastDeliveredEl) {
      lastDeliveredEl.textContent = "--";
    }

    console.warn(
      `Invalid timestamps for ${portal.name}:`,
      order
    );

    return;
  }

  // =========================
  // CALCULATE DELIVERY TIME
  // =========================
  const elapsedMinutes = Math.floor(
    (deliveredAt - createdAt) / 60000
  );

  const deliveryTime = formatDuration(elapsedMinutes);
  const performance = getDeliveryPerformance(elapsedMinutes);

  // =========================
  // UPDATE CARD
  // =========================
  resetCard();
  card.classList.add(performance.state);

  statusEl.textContent = performance.label;
  timeEl.textContent = deliveryTime;

  if (messageEl) {
    messageEl.textContent = performance.message;
  }

  if (lastDeliveredEl) {
    lastDeliveredEl.textContent =
      formatDeliveredDate(deliveredAt);
  }

  console.log(`${portal.name} performance:`, {
    orderId: order.orderId || null,
    deliveryTime,
    elapsedMinutes,
    state: performance.state
  });
}


// =========================
// LISTEN TO ONE PORTAL
// =========================
function listenToPortal(key, portal) {
  const portalQuery = query(
    collection(db, "orders"),
    where("status", "==", "delivered"),
    where("packageName", "==", portal.packageName),
    orderBy("updatedAt", "desc"),
    limit(1)
  );

  return onSnapshot(
    portalQuery,

    (snapshot) => {
      console.log(
        `${portal.name}:`,
        snapshot.size ? "Delivery data updated." : "No matching delivery yet."
      );

      if (snapshot.empty) {
        renderPortal(key, null);
        return;
      }

      const latestOrder = snapshot.docs[0].data();

      renderPortal(key, latestOrder);
    },

    (error) => {
      console.error(
        `Error loading ${portal.name}:`,
        error
      );

      const prefix = portal.prefix;
      const card = document.getElementById(`${prefix}Tracker`);
      const statusEl = document.getElementById(`${prefix}Status`);
      const timeEl = document.getElementById(`${prefix}Time`);
      const messageEl = document.getElementById(`${prefix}Message`);

      if (card) {
        card.className = "dp-item";
      }

      if (statusEl) {
        statusEl.textContent = "Unable to load";
      }

      if (timeEl) {
        timeEl.textContent = "--";
      }

      if (messageEl) {
        messageEl.textContent =
          "Delivery performance could not be loaded. Please try again later.";
      }
    }
  );
}


// =========================
// START ALL PORTAL LISTENERS
// =========================
Object.entries(PORTALS).forEach(([key, portal]) => {
  listenToPortal(key, portal);
});