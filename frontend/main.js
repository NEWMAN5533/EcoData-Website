// --- Firebase Imports ---
import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 
"https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

  // ---------- CONFIG ----------
const API_BASE = (() => {
  // use current host in prod or localhost for local dev
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }
  return "https://ecodata-app.onrender.com"; // your deployed backend
})();


// ---------- GLOBAL VARIABLES ----------
let STATUS_POLL_INTERVAL = 5000;
let _statusPollTimer = null; // to hold the interval timer ID


// btn events//
document.addEventListener("DOMContentLoaded", () => {

  
document.querySelectorAll(".buy-btn").forEach(button => {
  button.addEventListener("click", () => {
    const packageName = button.dataset.package;
    const network = button.dataset.network;
    const size = button.dataset.size;
    const price = button.dataset.price;

    document.getElementById("priceTag").textContent = `GHS ${button.dataset.price}`;
    document.getElementById("networkTag").textContent = `${button.dataset.network.toUpperCase()} / ${button.dataset.size}GB`;




    // Show phone input modal first
    createPhoneModal(recipient => {


      payWithPaystack(network, recipient, packageName, size, price);
    });
  });
});
});

function createPhoneModal(callback) {

  const modal = document.getElementById("phoneModal");
  const confirmBtn = document.getElementById("confirmBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const input = document.getElementById("recipientInput");


  // Show modal
  modal.classList.add("show");

  cancelBtn.onclick = () => {
    modal.classList.remove("show");
  };

  confirmBtn.onclick = () => {
    const recipient = input.value.trim();
    if (!recipient) {
      showSnackBar("📱 Please enter your phone number");
      return;
    }

    // digit only + exactly 10 numbers
    if(!/^[0-9]{10}$/.test(recipient)) {
      showSnackBar("📱 Phone number must be exactly 10 digits");
      return; // stop
    }
    modal.classList.remove("show");
    callback(recipient);
};
}


// === PAYSTACK PAYMENT (Firebase version) ===
async function payWithPaystack(network, recipient, packageName, size, price) {
  // ✅ Get current user from Firebase Auth
  let user = null;
  try {
    user = firebase.auth().currentUser;
  } catch (err) {
    console.warn("Firebase Auth not initialized:", err);
  }

  // ✅ Collect user details
  const userEmail = user?.email || `${recipient}@ecodata.com`;
  const userName = user?.displayName || "Guest User";
  const userPhone = recipient;

  // ✅ Initialize Paystack
  let handler = PaystackPop.setup({
    key: "pk_live_635856447ee14b583349141b7271f64c9b969749",
    email: userEmail,
    amount: price * 100,
    currency: "GHS",
    metadata: {
      custom_fields: [
        {
          display_name: "Customer Name",
          variable_name: "customer_name",
          value: userName,
        },
        {
          display_name: "Phone Number",
          variable_name: "phone_number",
          value: userPhone,
        },
        {
          display_name: "Network",
          variable_name: "network",
          value: network,
        },
        {
          display_name: "Package",
          variable_name: "package_name",
          value: packageName,
        },
      ],
    },
    callback: function (response) {
      orderBundle(network, recipient, packageName, size, response.reference);
    },
    onClose: function () {
      showSnackBar("Payment cancelled.");
    },
  });

  handler.openIframe();
}




// SELECTED BUNDLE FOR UI UPDATE
let selectedBundle = null;

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".buy-btn");
  if (!btn) return;

  selectedBundle = {
    network: btn.dataset.network,
    packageName: btn.dataset.package,
    size: Number(btn.dataset.size),
    price: Number(btn.dataset.price),
  };
});


//NEW UPDATED 2/12/2025 //
// === SEND ORDER TO BACKEND ===
async function orderBundle(network, recipient, packageName, size, reference) {
  try {
    if (!selectedBundle) {
      showSnackBar(" Please select a bundle first");
      return;
    }

    const API_BASE =
      window.location.hostname === "localhost"
        ? "http://localhost:3000"
        : "https://ecodata-app.onrender.com";

    const query = new URLSearchParams({
      network,
      recipient,
      package: packageName,
      size: size.toString(),
      paymentReference: reference,
    });

    const response = await fetch(
      `${API_BASE}/api/buy-data?${query.toString()}`,
      { method: "GET" }
    );

    const result = await response.json();

    if (!result.success) {
      showSnackBar(`❌ Failed: ${result.message || "Unknown error"}`);
      return;
    }

    showSnackBar("📱✅ Order Placed successfully!");

    // 🔴 Swift live order
    const returnedOrder = result.order?.order || result.order || result;
    console.log("📦 Swift order:", returnedOrder);

    // 🟢 EcoData accounting (UI prices)
    const orderData = {
      orderId: returnedOrder.orderId || returnedOrder.reference,
      reference: returnedOrder.reference,
      network: selectedBundle.network,
      volume: selectedBundle.size,
      amount: selectedBundle.price,
      source: "web",
      createdAt: Date.now(),
    };

    // ✅ Live stream (Swift)
    handleNewOrder(returnedOrder);

    // ✅ Analytics (EcoData)
    updateHomepageTotals(orderData);

    // ✅ Persistence
    saveOrderToFirestore(orderData);
    saveGuestOrder(orderData);

  } catch (err) {
    console.error("⚠ Server error:", err);
    showSnackBar("⚠ Server error. Please try again later.");
  }
}
//ends//


// ---------- FIRESTORE HELPER ----------
async function saveOrderToFirestore(orderData) {
  try {
    const db = window.FIRESTORE;
    if (!db) {
      console.warn("Firestore not initialized.");
      return null;
    }

    const { collection, addDoc, serverTimestamp } = await import(
      "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js"
    );

    const firestoreData = {
      orderId: orderData.orderId,
      reference: orderData.reference,
      status: String(orderData.status || "pending"),
      recipient: orderData.recipient || "-",
      volume: Number(orderData.volume || 0),
      amount: Number(orderData.amount || 0),
      network: orderData.network || "-",
      source: "web",
      createdAt: serverTimestamp(),
      createdBy: orderData.createdBy || "guest",
    };

    const ordersCol = collection(db, "orders");
    const result = await addDoc(ordersCol, firestoreData);

    console.log("✅ Order saved to Firestore:", result.id);
    return result.id;

  } catch (err) {
    console.error("❌ Error saving order to Firestore:", err);
    return null;
  }
}




// ---------- LOCAL STORAGE HELPER ----------

// ✅ Save Guest Orders to Local Storage
function saveGuestOrder(orderData) {
  try {
    // Load existing guest orders or start fresh
    const existing = JSON.parse(localStorage.getItem("guestOrders") || "[]");

    // Avoid saving duplicates
    const isDuplicate = existing.some(o => o.orderId === orderData.orderId);
    if (isDuplicate) return;

    existing.push(orderData);

    localStorage.setItem("guestOrders", JSON.stringify(existing));
    console.log("💾 Guest order saved locally:", orderData);

  } catch (err) {
    console.error("❌ Failed to save guest order:", err);
  }
}



// ---------- UPDATE HOME TOTALS ----------


// Called AFTER a successful order is confirmed
// ---------- UPDATE HOME TOTALS ----------

// Load stored totals or initialize
let ecoTotals = JSON.parse(localStorage.getItem("ecoTotals")) || {
  orders: 0,
  gb: 0,
  spend: 0,
};

// Called AFTER a successful EcoData order
function updateHomepageTotals(orderData) {
  if (!orderData || !orderData.orderId) return;

  // Prevent double-counting the same order
  const seenOrders = JSON.parse(localStorage.getItem("ecoSeenOrders") || "[]");
  if (seenOrders.includes(orderData.orderId)) return;

  // Mark this order as counted
  seenOrders.push(orderData.orderId);
  localStorage.setItem("ecoSeenOrders", JSON.stringify(seenOrders));

  // Update totals using EcoData values (from button/data-price, NOT Swift)
  ecoTotals.orders += 1;
  ecoTotals.gb += Number(orderData.volume || 0);
  ecoTotals.spend += Number(orderData.amount || 0);

  // Persist totals to localStorage
  localStorage.setItem("ecoTotals", JSON.stringify(ecoTotals));

  // Update UI
  renderHomepageTotals();
}





// ---------- RENDER TOTALS ----------
function renderHomepageTotals() {
  const ordersEl = document.getElementById("totalOrders");
  const gbEl = document.getElementById("totalGB");
  const spendEl = document.getElementById("totalSpend");

  if (!ordersEl || !gbEl || !spendEl) return;

  ordersEl.textContent = ecoTotals.orders;
  gbEl.textContent = `${ecoTotals.gb} GB`;
  spendEl.textContent = `₵ ${ecoTotals.spend.toFixed(2)}`;
}

// Load totals on page refresh
document.addEventListener("DOMContentLoaded", () => {
  ecoTotals = JSON.parse(localStorage.getItem("ecoTotals")) || ecoTotals;
  renderHomepageTotals();
});




// ---------- LOAD TOTALS ON PAGE REFRESH ----------
document.addEventListener("DOMContentLoaded", () => {
  ecoTotals =
    JSON.parse(localStorage.getItem("ecoTotals")) || ecoTotals;
  renderHomepageTotals();
});



 

// POLLING FUNCTION //

// STATUS_POLL_INTERVAL and _statusPollTimer are declared earlier; avoid redeclaration to prevent errors.

 // ---------- HELPERS ----------
function getStatusTextMapping(status) {
  const s = (status || "").toLowerCase();
  return {
    delivered: "Your bundle is successfully delivered ✅.",
    pending: "Order awaiting processing.",
    processing: "Order is processing. Please wait.",
    failed: "Order failed. Contact support or try again.",
    cancelled: "Order was cancelled.",
    refunded: "Payment refunded.",
    resolved: "Issue resolved. Order completed."
  }[s] || "Status update in progress.";
}

function getStatusClass(status) {
  return `status-${(status || "").toLowerCase()}`;
}

// LIVE ORDER 
// LIVE ORDER (table-compatible)
function updateLiveOrderCard(order) {
  if (!order?.orderId) return;

  const row = document.querySelector(`[data-id="${order.orderId}"]`);
  if (!row) return;

  const statusCell = row.querySelector(".status-cell");
  if (!statusCell) return;

  const status = (order.status || "pending").toLowerCase();

  statusCell.innerHTML = `
    <span class="status-badge ${getStatusClass(status)}">
      ${status}
    </span>
  `;
}
/// live order card ends

function updateStatusBadge(newStatus) {
  const badge = document.querySelector("#liveStatusBadge");
  if (!badge) return;

  const currentStatus = badge.dataset.status;
  if (currentStatus === newStatus) return; // no change

  // Remove old status classes
  badge.className = "status-badge";

  // Add new status class
  badge.classList.add(getStatusClass(newStatus));

  // Update text
  badge.textContent = newStatus;
  badge.dataset.status = newStatus;

  // Trigger animation
  badge.classList.remove("status-animate");
  void badge.offsetWidth; // reflow trick
  badge.classList.add("status-animate");
}



document.addEventListener("DOMContentLoaded", async () => {
  const lastOrderId = localStorage.getItem("lastOrderId");
  if (!lastOrderId) return;

  // Try to fetch latest status
  const order = await checkOrderStatusOnce(lastOrderId);
  if (!order) return;

  // Rebuild UI
  updateLiveOrderCard(order);      // persistent

  // Resume polling
  startAutoPolling(lastOrderId);
});


// lIVE ORDER ENDS






// popup statusCard

function createOrUpdateStatusCard(order) {
  // order expected: { orderId, reference, status, recipient, volume, timestamp }
  const root = document.getElementById("orderStatusContainerRoot");
  if (!root) return;

  const existing = document.getElementById("orderStatusCard");
  const status = (order.status || "pending").toLowerCase();
  const badgeClass = getStatusClass(status);
  const desc = getStatusTextMapping(status);

  const html = `
    <div id="orderStatusCardInner">
      <h4>Order Status</h4>
      <p><strong>Order ID: 
      </strong> ${order.orderId || order.reference || "N/A"}</p>
      <p><strong>Recipient:</strong> ${order.recipient || "-"}</p>
      <p><strong>Volume:</strong> ${order.volume ?? "-"} GB</p>
      <p>
        <strong>Status:</strong>
        <span class="status-badge ${badgeClass}">${status}</span>
      </p>
      <p style="font-size:0.9rem;color:#555;margin-top:6px">${desc}</p>
    </div>
  `;

  if (existing) {
    existing.innerHTML = html;
    existing.classList.remove("hidden");
  } else {
    const card = document.createElement("div");
    card.id = "orderStatusCard";
    card.innerHTML = html;
    root.appendChild(card);
  }
}


// stop polling
function stopStatusPolling() {
  if (_statusPollTimer) {
    clearInterval(_statusPollTimer);
    _statusPollTimer = null;
  }
}

// checks if status is terminal
function isTerminalStatus(status) {
  const s = (status || "").toLowerCase();
  return [
    "delivered",
    "completed",
    "success",
    "failed",
    "cancelled",
    "refunded",
    "resolved"].includes(s);
}

// ---------- POLLING FUNCTION ----------
async function checkOrderStatusOnce(orderIdOrRef) {
  try {
    // 🟩 Talk to your own backend now (not directly to SwiftData)
    const res = await fetch(`${API_BASE}/api/v1/order/status/${encodeURIComponent(orderIdOrRef)}`,{
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });


    if (!res.ok) {
      console.warn("Status endpoint returned non-200", res.status);
      return null;
    }
    const data = await res.json();
    if (data && data.success && data.order) return data.order;
    return null;
  } catch (err) {
    console.error("Error checking order status:", err);
    return null;
}
}

function startAutoPolling(orderIdOrRef) {

  const statusResult = 
  document.getElementById("statusResult");
  if (statusResult) (
    statusResult.innerHTML = ""
  );
  // clear existing poll
  stopStatusPolling();

  // initial immediate check
  (async () => {
    const order = await checkOrderStatusOnce(orderIdOrRef);
  if (order) {
  createOrUpdateStatusCard(order); // ✅ Update main color-coded card too
  const status = (order.status || "pending").toLowerCase();
  const desc = getStatusTextMapping(status);

}
  })();

  // schedule repeated checks
 _statusPollTimer = setInterval(async () => {
  const order = await checkOrderStatusOnce(orderIdOrRef);

  if (!order) return;

  const latestStatus = (order.status || "pending").toLowerCase();

  createOrUpdateStatusCard(order);   // popup card
  updateLiveOrderCard(order);        // permanent card

  updateStatusBadge(latestStatus);   // 🔥 animation happens here

  if (isTerminalStatus(latestStatus)) {
    stopStatusPolling();
  }
}, STATUS_POLL_INTERVAL);
}

// ---------- AFTER PURCHASE: show and poll ----------
/**
 * Call this after your backend returns an order reply.
 * Example usage inside orderBundle function after successful response:
 *    const returnedOrder = result.order || result.swift || result; 
 *    handleNewOrder(returnedOrder);
 * 
 * 
 */
// -----LIVE ORDER STORAGE------
const LIVE_ORDERS_KEY = "ecoLiveOrders";

function saveLiveOrder(order) {
  const existing = JSON.parse(localStorage.getItem(LIVE_ORDERS_KEY)) || [];

  // prevent duplicates
  if (existing.some(o => o.orderId === order.orderId)) return;

  existing.unshift(order); // newest first
  localStorage.setItem(LIVE_ORDERS_KEY, JSON.stringify(existing.slice(0, 20)));
}

function loadLiveOrders() {
  return
  JSON.parse(localStorage.getItem(LIVE_ORDERS_KEY)) || [];
}



// ---------- LIVE ORDER CARD ---------

function handleNewOrder(returnedOrder) {
  if (!returnedOrder) return;

  // 🔑 Get EcoData bundle (from button.dataset storage)
  const storedBundle =
    JSON.parse(localStorage.getItem("pendingOrderBundle")) || {};

  // Normalize Swift response
  const normalized = {
    orderId:
      returnedOrder.orderId ||
      returnedOrder.id ||
      returnedOrder.order_id ||
      returnedOrder.reference ||
      null,

    status: returnedOrder.status || returnedOrder.state || "pending",

    recipient:
      returnedOrder.items?.[0]?.recipient ||
      returnedOrder.recipient ||
      "-",

    // ✅ FIX: Always from EcoData dataset
    volume: Number(storedBundle.size || returnedOrder.volume || 0),
  };

  if (!normalized.orderId) return;

  // Persist last order ID
  localStorage.setItem("lastOrderId", normalized.orderId);

  // ---------- LIVE ORDERS TABLE ----------
  const tableBody = document.getElementById("liveOrderRows");
  if (!tableBody) return;

  // Remove empty placeholder
  const empty = tableBody.querySelector(".empty-state");
  if (empty) empty.remove();

  // Prevent duplicate row
  if (tableBody.querySelector(`[data-id="${normalized.orderId}"]`)) return;

  // Create row
  const row = document.createElement("div");
  row.className = "live-row";
  row.dataset.id = normalized.orderId;

  row.innerHTML = `
    <span>${normalized.orderId}</span>
    <span>${normalized.volume}GB</span>
    <span>${normalized.recipient}</span>
    <span class="status-cell">
      <span class="status-badge ${getStatusClass(normalized.status)}">
        ${normalized.status}
      </span>
    </span>
  `;

  // Add newest on top
  tableBody.prepend(row);

  // save for refresh persistence
  saveLiveOrder(normalized);

  // ---------- POPUP STATUS CARD ----------
  createOrUpdateStatusCard(normalized);

  // ---------- LIVE STATUS POLLING ----------
  startAutoPolling(normalized.orderId);
}
// handleNewOrder ends//


// ---------- LIVE ORDERS PERSISTENCE ----------
document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("liveOrderRows");
  if (!tableBody) return;

  const orders = loadLiveOrders();
  tableBody.innerHTML = "";

  if (!orders.length) {
    tableBody.innerHTML = `<p class="empty-state">No recent orders yet</p>`;
    return;
  }

  orders.forEach(order => {
    const row = document.createElement("div");
    row.className = "live-row";
    row.dataset.id = order.orderId;

    row.innerHTML = `
      <span>${order.orderId}</span>
      <span>${order.volume}GB</span>
      <span>${order.recipient}</span>
      <span class="status-cell">
        <span class="status-badge ${getStatusClass(order.status)}">
          ${order.status}
        </span>
      </span>
    `;

    tableBody.appendChild(row);
  });
});

// handleNewOrders Dom ends//





document.addEventListener("DOMContentLoaded", () => {
  const last = localStorage.getItem("lastOrderId");
  const orderInput = document.getElementById("orderInput");
  const checkBtn = document.getElementById("checkBtn");
  const statusResult = document.getElementById("statusResult");

  if (!orderInput || !checkBtn || !statusResult) return;

  // Prefill input only
  if (last) orderInput.value = last;

  // 🔒 Manual checker must start empty
  statusResult.innerHTML = "";

  let manualCheckTriggered = false;

  checkBtn.addEventListener("click", async () => {
    const id = orderInput.value.trim();
    if (!id) return showSnackBar("Please enter order ID.");

    manualCheckTriggered = true;

    statusResult.innerHTML = `
      <div style="padding:10px;border-radius:8px;background:#f0f0f0;">
        🌀 Checking order <strong>${id}</strong>...
      </div>
    `;

    try {
      const order = await checkOrderStatusOnce(id);
      if (!manualCheckTriggered) return;

      if (!order) {
        statusResult.innerHTML = `
          <div style="padding:10px;background:#ffdddd;border-radius:8px;">
            ⚠ Order not found
          </div>
        `;
        return;
      }

      const status = (order.status || "pending").toLowerCase();
      const desc = getStatusTextMapping(status);

      statusResult.innerHTML = `
        <div style="padding:15px;border-radius:10px;border:2px solid #4caf50;">
          <h3 style="text-transform:capitalize">${status}</h3>
          <p><strong>Order ID:</strong> ${order.orderId || order.reference}</p>
          <p><strong>Recipient:</strong> ${order.recipient}</p>
          <p><strong>Volume:</strong> ${order.volume} GB</p>
          <p>${desc}</p>
        </div>
      `;
    } catch (err) {
      statusResult.innerHTML = `
        <div style="padding:10px;background:#ffdddd;border-radius:8px;">
          ❌ Error checking status
        </div>
      `;
    }
  });
});



// ScrollBtn 
 const scrollBtn =
  document.querySelector(".floating-scroll");
  const bundleSection = 
  document.getElementById("bundles");

 scrollBtn.addEventListener("click", () => {
  if ( bundleSection) {
    bundleSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
 });

 // Auto-hide after scroll
 window.addEventListener("scroll", ()=> {
  if (window.scrollY > 80) {
    scrollBtn.style.opacity = "0";
    scrollBtn.style.pointerEvents = 'none';
  } else {
    scrollBtn.style.opacity = "1";
    scrollBtn.style.pointerEvents = "auto";
  }
 });




 // SHARE BTN
 const shareBtn = document.getElementById("shareBtn");

 shareBtn.addEventListener('click', async () =>
{
  const shareData = {
    title: "Ecodata",
    text: "Check out Ecodata Website, the smartest, digital and trusted data bundle purchase website y'll love to use.",
    url: window.location.href
  };

  // Native share
  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      console.log("Share Cancelled");
    }
  }
  // FallBack (Desktop)
  else {
    navigator.clipboard.writeText(shareData.url).then(() => {
      showSnackBar("Link copied! ");
  });
}
});




// SNACKBAR SECTION //
// ===== SNACKBAR FUNCTION ===== //
function showSnackBar(message, type = "info") {
  // Remove existing snackbar if visible
  const existing = document.querySelector(".snackbar");
  if (existing) existing.remove();

  // Create snackbar element
  const snackbar = document.createElement("div");
  snackbar.className = "snackbar";

  // Color scheme based on type
  if (type === "success") snackbar.style.background = "#7adabaff";   // green
  else if (type === "error") snackbar.style.background = "#dc3545"; // red
  else if (type === "warning") snackbar.style.background = "#ffc107"; // yellow
  else snackbar.style.background = "rgba(7, 29, 26, 0.86)"; // default dark

  snackbar.textContent = message;

  // Add snackbar to the body
  document.body.appendChild(snackbar);

  // Force reflow (to trigger CSS animation)
  void snackbar.offsetWidth;

  // Show snackbar
  snackbar.classList.add("show");

  // Hide snackbar after 3 seconds
  setTimeout(() => {
    snackbar.classList.remove("show");
    setTimeout(() => snackbar.remove(), 300);
},4000);
};


// SCROLL TO SECTION BY CLICKING ON THE CARD-BOX
const mtnScrollBtn = document.querySelector(".mtnBt");

const mtnScrollSection = document.getElementById("mtnArea");

mtnScrollBtn.addEventListener("click", () =>{
  if (mtnScrollSection) {
    mtnScrollSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
});

// do same for telecel
const teleScrollBtn = document.querySelector(".telecel");

const teleScrollSection = document.getElementById("teleArea");

teleScrollBtn.addEventListener("click", () => {
 if (teleScrollSection) {
  teleScrollSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
 }
});

// same for AirtelTigo
const airtelScrollBtn = document.querySelector(".at");

const airtelScrollSection = document.getElementById("tigoArea");

airtelScrollBtn.addEventListener("click", () => {
  if (airtelScrollSection) {
    airtelScrollSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
});



// whatsApp sending message btn
 // === CONFIG ===
  const whatsappNumber = "233535565637";

  // === ELEMENTS ===
  const chatButton = document.getElementById("chatButton");
  const chatBox = document.getElementById("chatBox");
  const sendBtn = document.getElementById("sendMsgBtn");

  // === TOGGLE CHAT BOX ===
  chatButton.addEventListener("click", () => {
    chatBox.classList.toggle("show");
  });

  // === SEND MESSAGE ===
  sendBtn.addEventListener("click", () => {
    const message = document.getElementById("whatsappMessage").value.trim();
    if (!message) {
      showSnackBar("Please type your message before sending.");
      return;
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappURL =` https://wa.me/${233535565637}?text=${encodedMessage}`;
    window.open(whatsappURL, "_blank");
    document.getElementById("whatsappMessage").value = ""; // clear after sending
});

