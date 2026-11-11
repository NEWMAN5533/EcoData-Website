import { db } from "./firebase-config.js";

import {
  collection,
  where,
  onSnapshot,
  doc,
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



function normalizePackageName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getPortalKey(packageName) {
  const value = normalizePackageName(packageName);

  if (value.includes("mtn_data_express_delivery")) {
    return "express";
  }

  if (value.includes("mtn_data_normal_delivery")) {
    return "normal";
  }

  if (
    value.includes("mtn_verified_numbers") ||
    value.includes("mtn_all_verified_portal") ||
    value.includes("all_verified")
  ) {
    return "verified";
  }

  return null;
}





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


function renderCurrentOrder(key, order) {
  const prefix = PORTALS[key].prefix;

  const container = document.getElementById(
    `${prefix}CurrentOrder`
  );

  const orderIdEl = document.getElementById(
    `${prefix}CurrentOrderId`
  );

  if (!container || !orderIdEl) return;

  if (!order) {
    container.classList.remove("is-tracking");
    container.classList.add("is-empty");
    orderIdEl.textContent = "No current order";

    updatePortalVisibility();
    return;
  }

  const orderId = String(order.orderId || "").trim();

  if (!orderId) {
    container.classList.remove("is-tracking");
    container.classList.add("is-empty");
    orderIdEl.textContent = "ID unavailable";

    updatePortalVisibility();
    return;
  }

  container.classList.remove("is-empty");
  container.classList.add("is-tracking");
  orderIdEl.textContent = orderId;



  updatePortalVisibility();
}



function listenToCurrentOrder(key, portal) {
  const activeStatuses = ["processing", "pending"];

  const latestByStatus = {};
  const unsubscribers = [];

  function updateCurrentOrder() {
    const orders = Object.values(latestByStatus)
      .flat()
      .filter(Boolean)
      .filter(order => {
        const orderPortal = normalizePackageName(
          order.packageName
        );

        return getPortalKey(orderPortal) === key;
      })
      .sort((a, b) =>
        getTimestamp(b.createdAt) -
        getTimestamp(a.createdAt)
      );

    renderCurrentOrder(key, orders[0] || null);
  }

  activeStatuses.forEach(status => {
    // Only filter by status in Firestore.
    // Portal filtering happens in JavaScript.
    const activeQuery = query(
      collection(db, "orders"),
      where("status", "==", status),
      orderBy("updatedAt", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(
      activeQuery,
      snapshot => {
        latestByStatus[status] = snapshot.docs.map(
          docSnapshot => docSnapshot.data()
        );

        updateCurrentOrder();
      },
      error => {
        console.error(
          `Current-order tracking failed for ${portal.name}:`,
          error
        );
      }
    );

    unsubscribers.push(unsubscribe);
  });

  return () => {
    unsubscribers.forEach(unsubscribe => unsubscribe());
  };
}



// =========================
// LISTEN TO ONE PORTAL
// =========================
function listenToPortal(key, portal) {
  //  status + updatedAt index.
  const deliveredQuery = query(
    collection(db, "orders"),
    where("status", "==", "delivered"),
    orderBy("updatedAt", "desc"),
    limit(10)
  );

  return onSnapshot(
    deliveredQuery,
    (snapshot) => {
      const matchingOrders = snapshot.docs
        .map((docSnapshot) => docSnapshot.data())
        .filter((order) => {
          return getPortalKey(order.packageName) === key;
        })
        .filter((order) => {
          const createdAt = getTimestamp(order.createdAt);
          const updatedAt = getTimestamp(order.updatedAt);

          return (
            Number.isFinite(createdAt) &&
            Number.isFinite(updatedAt) &&
            createdAt > 0 &&
            updatedAt >= createdAt
          );
        });

      // The query is already ordered by updatedAt descending.
      // The first matching order is the latest for this portal.
      renderPortal(key, matchingOrders[0] || null);
    },
    (error) => {
      console.error(
        `Error loading ${portal.name}:`,
        error
      );

      const card = document.getElementById(
        `${portal.prefix}Tracker`
      );

      const statusEl = document.getElementById(
        `${portal.prefix}Status`
      );

      const timeEl = document.getElementById(
        `${portal.prefix}Time`
      );

      if (card) card.className = "dp-item";
      if (statusEl) statusEl.textContent = "Unable to load";
      if (timeEl) timeEl.textContent = "--";
    }
  );
}





//UPDATED TRACKERS WHEN NO ORDERS

function updatePortalVisibility() {
  const activePortals = Object.keys(PORTALS).filter(key => {
    const prefix = PORTALS[key].prefix;
    const container = document.getElementById(`${prefix}CurrentOrder`);

    return container?.classList.contains("is-tracking");
  });

  // Show only portals that have a current order
  Object.entries(PORTALS).forEach(([key, portal]) => {
    const card = document.getElementById(`${portal.prefix}Tracker`);

    if (!card) return;

    card.style.display = activePortals.includes(key) ? "" : "none";
  });

  // Show the message only when no portal has an active order
  const message = document.getElementById("noCurrentOrdersMessage");

  if (message) {
    message.classList.toggle("show", activePortals.length === 0);
  }
}

// =========================
// START ALL PORTAL LISTENERS
// =========================
Object.entries(PORTALS).forEach(([key, portal]) => {
  listenToPortal(key, portal);
  listenToCurrentOrder(key, portal);
});