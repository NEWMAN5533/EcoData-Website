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



// Create phone input modal dynamically
function createPhoneModal(callback) {
  // Remove existing modal if any
  const existing = document.getElementById("phoneModal");
  if (existing) existing.remove();

  // Modal container
  const modal = document.createElement("div");
  modal.id = "phoneModal";
  modal.style = `
    position: fixed;
    top: 0; 
    width: 100%; 
    height: 100%;
    display: flex; 
    align-items: center; 
    justify-content: center;
    max-width: 480px;
    justify-self: center;
    background: rgba(0,0,0,0.4);
    z-index: 9999;
  `;

  // Modal content
  const box = document.createElement("div");
  box.style = `
    background: #fff;
    padding: 25px;
    border-radius: 15px;
    width: 90%;
    height: 24rem;
    justify-content: center;
    display: flex;
    flex-direction: column;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 8px 25px rgba(0,0,0,0.4);
    animation: popUp 0.3s ease;
    z-index: 9999;
    position: relative;
  `;
  box.innerHTML = `
    <h3 style="margin-bottom: 15px; color: #000000ff;">Enter your phone number to receive the Bundle package</h3>
    <input type="tel" id="recipientInput" placeholder="e.g. 233241234567"
      style="width: 100%;
      padding: 12px; 
      border-radius: 10px; 
      border: 1px solid #222; 
      font-size: 24px; 
      text-align: center; 
      margin-bottom: 15px;
      color: white" 
      box-shadow: 0 2px 6px #ccc8c8ff;/>
    <div style="display: flex;
      gap: 40px; 
    justify-content: center;">
      <button id="cancelBtn" style="background:#999; color: white; padding:10px 18px; border:none; border-radius:10px;
      width: 50%; cursor:pointer;">Cancel</button>
      <button id="confirmBtn" style="background:#2196F3; color:white; width: 50%; padding:10px 18px; border:none; border-radius:10px; cursor:pointer;">Continue</button>
    </div>
  `;

  modal.appendChild(box);
  document.body.appendChild(modal);

  document.getElementById("cancelBtn").addEventListener("click", () => {
    modal.remove();
  });

  document.getElementById("confirmBtn").addEventListener("click", () => {
    const recipient = document.getElementById("recipientInput").value.trim();
    if (!recipient) {
      showSnackBar(" Please enter your phone number");
      return;
    }
    modal.style.display = "none";
    setTimeout(() => {
      modal.remove();
      callback(recipient);
    } , 200);
  });
}



// === PAYSTACK PAYMENT ===
async function payWithPaystack(network, recipient, packageName, size, price) {

  let handler = PaystackPop.setup({
    key: "pk_live_635856447ee14b583349141b7271f64c9b969749",
    email: "customer@gmail.com",
    amount: price * 100,
    currency: "GHS",
    callback: function(response) {
      orderBundle(network, recipient, packageName, size, response.reference);
    },
    onClose: function() {
      showSnackBar(" Payment cancelled.");
    }
  });
  handler.openIframe();
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
      console.log("📦 Order details:", 
        returnedOrder);
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
    const res = await fetch(`/api/v1/order/status/${encodeURIComponent(orderIdOrRef)}`);

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

// ---------- MANUAL CHECK UI binding (optional) ----------
document.addEventListener("DOMContentLoaded", () => {
  // fill order input if last order exists
  const last = localStorage.getItem("lastOrderId");
  const orderInput = document.getElementById("orderInput");
  if (orderInput && last) orderInput.value = last;

  const checkBtn = document.getElementById("checkBtn");
  const statusResult = document.getElementById("statusResult");

  if (checkBtn && orderInput && statusResult) {
    checkBtn.addEventListener("click", async () => {
      const id = orderInput.value.trim();
      if (!id) return alert("Please enter order ID or reference.");
      statusResult.innerHTML = "Checking status...";

      const order = await checkOrderStatusOnce(id);
      if (order) {
        // display nicely similar to card
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
  if (type === "success") snackbar.style.background = "#28a745";   // green
  else if (type === "error") snackbar.style.background = "#dc3545"; // red
  else if (type === "warning") snackbar.style.background = "#ffc107"; // yellow
  else snackbar.style.background = "#aaf1c6ff"; // default dark

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