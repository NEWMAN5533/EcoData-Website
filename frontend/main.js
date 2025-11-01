// btn events//
document.addEventListener("DOMContentLoaded", () => {

document.querySelectorAll(".buy-btn").forEach(button => {
  button.addEventListener("click", () => {
    const packageName = button.dataset.package;
    const network = button.dataset.network;
    const size = button.dataset.size;
    const price = button.dataset.price;

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
      showSnackBar("Please enter your phone number");
      return;
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


// ---------- FIRESTORE HELPER ----------
async function saveOrderToFirestore(orderObj) {
  try {
    const db = window._FIRESTORE_;
    if (!db) {
      console.warn("Firestore not initialized. Make sure firebase-config.js is loaded before main.js");
      return null;
    }

    const { collection, addDoc, serverTimestamp } = await import(
      "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js"
    );

    const docData = {
      orderId: orderObj.orderId || orderObj.reference || null,
      reference: orderObj.reference || null,
      status: (orderObj.status || "pending").toString(),
      recipient: orderObj.recipient || (orderObj.items?.[0]?.recipient) || null,
      volume: Number(orderObj.volume ?? orderObj.items?.[0]?.volume ?? 0),
      amount: Number(orderObj.amount ?? orderObj.totalAmount ?? 0),
      network: orderObj.network || null,
      source: orderObj.source || "web",
      createdAt: serverTimestamp(),
      createdBy:
        window._FIREBASE_AUTH_?.currentUser?.uid || "guest"
    };

    const ordersCol = collection(db, "orders");
    const result = await addDoc(ordersCol, docData);
    console.log("✅ Order saved to Firestore:", result.id);
    return result.id;
  } catch (err) {
    console.error("❌ Error saving order to Firestore:", err);
    return null;
}
}

// === FIRESTORE ORDER FETCH ===
async function getUserOrders(userId) {
  try {
    const db = window.FIRESTORE;
    if (!db) {
      console.warn("Firestore not initialized. Make sure firebase-config.js is loaded.");
      return [];
    }

    const { collection, getDocs, query, where, orderBy } = await import(
      "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js"
    );

    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("createdBy", "==", userId || "guest"),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);
    const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("📦 Orders fetched:", orders);
    return orders;
  } catch (err) {
    console.error("❌ Error fetching user orders:", err);
    return[];
}
}


// === SEND ORDER TO BACKEND ===
async function orderBundle(network, recipient, packageName, size, reference) {
  try {
    const API_BASE = window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://ecodata-app.onrender.com/";

    const response = await fetch(`${API_BASE}api/buy-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ network, recipient, package: packageName, size: parseInt(size), paymentReference: reference })
    });

    const result = await response.json();
  if (result.success) {
  showSnackBar("✅ Data bundle purchased successfully!");
  const returnedOrder = result.order?.order || result.order || result;
  console.log("📦 Order details:", returnedOrder);

  // Save to Firestore (fire-and-forget)
  saveOrderToFirestore(returnedOrder).then(fireId => {
    if (fireId) {
      console.log("Order persisted in Firestore:", fireId);
    }
  });

  // Show status card + start polling
  handleNewOrder(returnedOrder);
} else {
  showSnackBar(`Failed to purchase data: ${result.message || "Unknown error"}`);
}
  } catch (err) {
    console.error("⚠ Server error:", err);
    showSnackBar("⚠ Server error. Please try again later.");
  }
}

  // ---------- CONFIG ----------
const API_BASE = (() => {
  // use current host in prod or localhost for local dev
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }
  return "https://ecodata-app.onrender.com"; // your deployed backend
})();

// POLLING FUNCTION //

const STATUS_POLL_INTERVAL = 5000; // ms
let _statusPollTimer = null;

// ---------- HELPERS ----------
function getStatusTextMapping(status) {
  const s = (status || "").toLowerCase();
  return {
    delivered: "Your bundle successfully delivered.",
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
      <p><strong>Order ID:</strong> ${order.orderId || order.reference || "N/A"}</p>
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
  return ["delivered","failed","cancelled","refunded","resolved"].includes(s);
}

// ---------- POLLING FUNCTION ----------
async function checkOrderStatusOnce(orderIdOrRef) {
  try {
    // 🟩 Talk to your own backend now (not directly to SwiftData)
    const res = await fetch(`/api/v1/order/status/${encodeURIComponent(orderIdOrRef)}`,{
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
  // clear existing poll
  stopStatusPolling();

  // initial immediate check
  (async () => {
    const order = await checkOrderStatusOnce(orderIdOrRef);
  if (order) {
  createOrUpdateStatusCard(order); // ✅ Update main color-coded card too
  const status = (order.status || "pending").toLowerCase();
  const desc = getStatusTextMapping(status);
  statusResult.innerHTML = `
    <div style="padding:12px;border-radius:8px;background:#fff">
      <p><strong>Order ID:</strong> ${order.orderId || order.reference}</p>
      <p><strong>Recipient:</strong> ${order.recipient}</p>
      <p><strong>Volume:</strong> ${order.volume} GB</p>
      <p><strong>Status:</strong> <span class="status-badge ${getStatusClass(status)}">${status}</span></p>
      <p style="color:#444;margin-top:6px">${desc}</p>
</div>
`;
}
  })();

  // schedule repeated checks
  _statusPollTimer = setInterval(async () => {
    const order = await checkOrderStatusOnce(orderIdOrRef);
    if (order) {
      createOrUpdateStatusCard(order);
      if (isTerminalStatus(order.status)) {
        stopStatusPolling();
      }
    }
  }, STATUS_POLL_INTERVAL);
}

// ---------- AFTER PURCHASE: show and poll ----------
/**
 * Call this after your backend returns an order reply.
 * Example usage inside orderBundle function after successful response:
 *    const returnedOrder = result.order || result.swift || result; 
 *    handleNewOrder(returnedOrder);
 */
function handleNewOrder(returnedOrder) {
  if (!returnedOrder) return;
  // The Swift response may place order data at top-level or inside order object.
  // Normalize fields:
  const normalized = {
    orderId: returnedOrder.orderId || returnedOrder.orderId || returnedOrder.reference || returnedOrder.reference,
    reference: returnedOrder.reference || returnedOrder.reference,
    status: returnedOrder.status || returnedOrder.status || "pending",
    recipient: returnedOrder.items?.[0]?.recipient || returnedOrder.recipient || "-",
    volume: returnedOrder.items?.[0]?.volume ?? returnedOrder.volume ?? "-"
  };

  // Save last order id/ref to localStorage for later check
  if (normalized.orderId) localStorage.setItem("lastOrderId", normalized.orderId);

  // show card immediately
  createOrUpdateStatusCard(normalized);

  // start polling by orderId or reference (prefer orderId)
  const idToPoll = normalized.orderId || normalized.reference;
  if (idToPoll) startAutoPolling(idToPoll);
}

// ---------- MANUAL CHECK UI binding ----------
document.addEventListener("DOMContentLoaded", () => {
  const last = localStorage.getItem("lastOrderId");
  const orderInput = document.getElementById("orderInput");
  if (orderInput && last) orderInput.value = last;

  const checkBtn = document.getElementById("checkBtn");
  const statusResult = document.getElementById("statusResult");

  if (checkBtn && orderInput && statusResult) {
    checkBtn.addEventListener("click", async () => {
      const id = orderInput.value.trim();
      if (!id) return showSnackBar("Please enter order ID or reference.");

      // Immediate feedback
      statusResult.innerHTML = `
        <div style="padding:10px; border-radius:8px; background:#f0f0f0; color:#333;">
          <p>⏳ Checking your order status <strong>${id}</strong>...</p>
        </div>
      `;

      try {
        const order = await checkOrderStatusOnce(id);

        if (order) {
          const status = (order.status || "pending").toLowerCase();
          const desc = getStatusTextMapping(status);
          const statusColor = {
            pending: "#ffcc00",
            processing: "#2196f3",
            completed: "#4caf50",
            failed: "#f44336",
          }[status] || "#ccc";

          statusResult.innerHTML = `
            <div style="padding:15px; border-radius:10px; background:${statusColor}20; border:2px solid ${statusColor};">
              <h3 style="color:${statusColor}; text-transform:capitalize;">${status}</h3>
              <p><strong>Order ID:</strong> ${order.orderId || order.reference}</p>
              <p><strong>Recipient:</strong> ${order.recipient}</p>
              <p><strong>Volume:</strong> ${order.volume} GB</p>
              <p style="margin-top:8px;">${desc}</p>
            </div>
          `;
        } else {
          statusResult.innerHTML = `
            <div style="padding:10px; background:#ffdddd; border:1px solid #f44336; border-radius:8px;">
              ⚠ Could not find order details for <strong>${id}</strong>.
            </div>
          `;
        }
      } catch (err) {
        console.error("Error checking order status:", err);
        statusResult.innerHTML = `
          <div style="padding:10px; background:#ffdddd; border:1px solid #f44336; border-radius:8px;">
            ❌ Error checking status. Please try again.
          </div>
        `;
      }
});
}
});


// === FETCH ORDERS FROM FIRESTORE AND UPDATE DASHBOARD ===
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const db = window.FIRESTORE;
    if (!db) {
      console.warn("Firestore not initialized. Make sure firebase-config.js is loaded first.");
      return;
    }

    const { collection, getDocs, query, orderBy } = await import(
      "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js"
    );

    const ordersCol = collection(db, "orders");
    const q = query(ordersCol, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    const tableBody = document.getElementById("ordersTableBody");
    tableBody.innerHTML = "";

    // For cards summary
    let totalAmount = 0;
    let totalGB = 0;
    let totalOrders = 0;
    let recentOrder = null;

    snapshot.forEach(doc => {
      const order = doc.data();
      const createdAt = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : "—";

      // Update table
      const row = `
        <tr>
          <td>${order.orderId || "—"}</td>
          <td>${order.volume || "—"} GB</td>
          <td>${order.recipient || "—"}</td>
          <td>${order.network || "—"}</td>
          <td class="status-cell ${order.status?.toLowerCase() || "pending"}">
            ${order.status || "Pending"}
          </td>
          <td>₵${order.amount?.toFixed(2) || "0.00"}</td>
          <td>${createdAt}</td>
        </tr>
      `;
      tableBody.insertAdjacentHTML("beforeend", row);

      // For summary cards
      totalOrders++;
      totalAmount += Number(order.amount || 0);
      totalGB += Number(order.volume || 0);
      if (!recentOrder) recentOrder = order;
    });

    // Update cards
    document.querySelector("#cardTotalSpent p").textContent = `₵${totalAmount.toFixed(2)}`;
    document.querySelector("#cardTotalGB p").textContent = `${totalGB.toFixed(2)} GB`;
    document.querySelector("#cardTotalOrders p").textContent = totalOrders;
    document.querySelector("#cardRecentOrder p").textContent =
      recentOrder ? `${recentOrder.network} (${recentOrder.status})` : "—";

  } catch (err) {
    console.error("❌ Error loading dashboard:",err);
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
  if (type === "success") snackbar.style.background = "#28a745";   // green
  else if (type === "error") snackbar.style.background = "#dc3545"; // red
  else if (type === "warning") snackbar.style.background = "#ffc107"; // yellow
  else snackbar.style.background = "#beddca"; // default dark

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
    setTimeout(() => snackbar.remove(), 500);
},3000);
}