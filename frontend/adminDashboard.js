// === firebase-config.js ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ✅ Your Firebase config
const firebaseConfig = {
 apiKey: "AIzaSyClNBlfigtQk8AZWdMZcU9sEtVcIrS0D1g",
  authDomain: "ecodata-2bee6.firebaseapp.com",
  projectId: "ecodata-2bee6",
  storageBucket: "ecodata-2bee6.firebasestorage.app",
  messagingSenderId: "544837123249",
  appId: "1:544837123249:web:6c362350a00c6dab10b690"
};

// ✅ Initialize Firebase app
const app = initializeApp(firebaseConfig);

// ✅ Initialize Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

// ✅ Expose to window so main.js can access it
window.FIRESTORE = db;

console.log("🔥 Firebase initialized and Firestore ready!");



// UPDATED ADMIN DASHBOARD JS

// =========================
// FIREBASE IMPORTS
// =========================
import {
  collection,
  onSnapshot,
  updateDoc,
  query as firestoreQuery,
  doc,
  orderBy,
} from
"https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// =========================
// DOM READY
// =========================
document.addEventListener("DOMContentLoaded", () => {

  loadOrderRealTime();

});



// =========================
// LOAD ORDERS REALTIME
// =========================
async function loadOrderRealTime() {

  try {

    const db = window.FIRESTORE;

    if (!db) {
      console.error("Firestore not initialized");
      return;
    }

    const orderRef =
      collection(db, "orders");

    const q =
      firestoreQuery(
        orderRef,
        orderBy("createdAt", "desc")
      );

    onSnapshot(q, (snapshot) => {

      const orders = [];

      snapshot.forEach(docSnap => {

        orders.push({
          firestoreId: docSnap.id,
          ...docSnap.data()
        });

      });

      renderOrders(orders);

      updateCards(orders);

      updateProfitCards(orders);

      buildProfitChart(orders);

    });

  } catch (err) {

    console.error(err);

  }

}



// =========================
// RENDER ORDERS TABLE
// =========================
function renderOrders(orders) {

  const rowWrapper =
    document.getElementById("rowWrapper");

  const emptyBody =
    document.getElementById("empty-body");

  rowWrapper.innerHTML = "";

  if (!orders.length) {

    emptyBody.hidden = false;

    return;

  }

  emptyBody.hidden = true;

  orders.forEach(order => {

    const row =
      document.createElement("div");

    row.className = "live-body-row";

    const date =
      order.createdAt?.toDate
        ? order.createdAt.toDate().toLocaleString()
        : "N/A";
           

        row.innerHTML = `

  <small>${order.orderId || "-"}</small>

  <small>${order.network ? order.network.toUpperCase() : "-"}</small>

  <small>${order.volume || "-"}GB</small>

  <small>₵ ${(Number(order.amount) || 0).toFixed(2)}</small>

  <small>${order.recipient || "-"}</small>

  <small>Yes</small>

  <small>${date}</small>

  <small>
    <span class="${order.status || "pending"}">
      ${order.status || "pending"}
    </span>
  </small>



      <small>

        <select
          onchange="changeOrderStatus(
            '${order.firestoreId}',
            this.value
          )"
        >

          <option value="">
            Action
          </option>

          <option value="pending">
            Pending
          </option>

          <option value="processing">
            Processing
          </option>

          <option value="delivered">
            Delivered
          </option>

          <option value="failed">
            Failed
          </option>

        </select>

      </small>

    `;

    rowWrapper.appendChild(row);

  });

}




// =========================
// CHANGE ORDER STATUS
// =========================
window.changeOrderStatus =
async function (firestoreId, status) {

  try {

    if (!status) return;

    const API_BASE =
      window.location.hostname === "localhost"
        ? "http://localhost:3000"
        : "https://ecodata-app.onrender.com";

    const response = await fetch(
      `${API_BASE}/api/admin/update-order-status`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          orderId: firestoreId,
          status
        })
      }
    );

    const result = await response.json();

    if (!result.success) {

      console.error(result.message);

      return;

    }

    console.log("✅ Status updated");

  } catch (err) {

    console.error("❌ Status update failed:", err);

  }

};

// =========================
// UPDATE ANALYTICS CARDS
// =========================

function updateCards(orders) {



  // =========================
  // BASIC TOTALS
  // =========================
  const totalOrders = 894 +
    orders.length;

  const pendingOrders =
    orders.filter(order =>
      order.status === "pending"
    ).length;

  const processingOrders =
    orders.filter(order =>
      order.status === "processing"
    ).length;

  const deliveredOrders = 894 +
    orders.filter(order =>
      order.status === "delivered"
    ).length;

  const failedOrders =
    orders.filter(order =>
      order.status === "failed"
    ).length;


// =========================
// DATE CALCULATIONS
// =========================
const now = new Date();

const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);

const weekStart = new Date();
weekStart.setDate(now.getDate() - 7);

const monthStart = new Date();
monthStart.setMonth(now.getMonth() - 1);

// =========================
// TODAY ORDERS
// =========================
const todayOrders = orders.filter(order => {

  if (!order.createdAt?.toDate) return false;

  const orderDate =
    order.createdAt.toDate();

  return orderDate >= todayStart;

}).length;

// =========================
// WEEKLY ORDERS
// =========================
const weeklyOrders = orders.filter(order => {

  if (!order.createdAt?.toDate) return false;

  const orderDate =
    order.createdAt.toDate();

  return orderDate >= weekStart;

}).length;

// =========================
// MONTHLY ORDERS
// =========================
const monthlyOrders = orders.filter(order => {

  if (!order.createdAt?.toDate) return false;

  const orderDate =
    order.createdAt.toDate();

  return orderDate >= monthStart;

}).length;

  // =========================
  // TOTAL REVENUE
  // =========================
  let totalRevenue = 0;

  let todayRevenue = 0;

  orders.forEach(order => {

    if (order.status === "delivered") {

      const amount =
        Number(order.amount || 0);

      totalRevenue += amount;

      if (order.createdAt?.toDate) {

        const orderDate =
          order.createdAt.toDate();

        if (orderDate >= todayStart) {

          todayRevenue += amount;

        }

      }

    }

  });

    console.log({
  todayOrders,
  weeklyOrders,
  monthlyOrders
});


  // =========================
  // UPDATE DOM
  // =========================

  // TOTALS
  document.getElementById("totalOrder").textContent =
    totalOrders;

  document.getElementById("pendingOrder").textContent =
    pendingOrders;

  document.getElementById("processingOrder").textContent =
    processingOrders;

  document.getElementById("deliveredOrder").textContent =
    deliveredOrders;

  document.getElementById("failedOrder").textContent =
    failedOrders;



  // TIME-BASED
  document.getElementById("todayOrder").textContent =
    todayOrders;

  document.getElementById("weeklyOrder").textContent =
    weeklyOrders;

  document.getElementById("monthlyOrder").textContent =
    monthlyOrders;



  // MONEY
  document.getElementById("totalRevenue").textContent =
    `₵ ${totalRevenue.toFixed(2)}`;

  document.getElementById("todayRevenue").textContent =
    `₵ ${todayRevenue.toFixed(2)}`;

}



//==================================
// LOCALSTORAGE TO LISTEN TO ADMIN
//===================================
function listenToOrderStatus(orderId) {

  try {

    const db = window.FIRESTORE;

    if (!db || !orderId) return;

    const orderRef =
      doc(db, "orders", orderId);

    onSnapshot(orderRef, (snapshot) => {

      if (!snapshot.exists()) return;

      const data = snapshot.data();

      // =========================
      // UPDATE LOCAL STORAGE
      // =========================
      const existing =
        JSON.parse(
          localStorage.getItem(LIVE_ORDERS_KEY) || "[]"
        );

      const updated =
        existing.map(order => {

          if (order.orderId === orderId) {

            return {
              ...order,
              status: data.status
            };

          }

          return order;

        });

      localStorage.setItem(
        LIVE_ORDERS_KEY,
        JSON.stringify(updated)
      );

      // =========================
      // UPDATE UI
      // =========================
      updateLiveOrderUI({
        orderId,
        status: data.status
      });

      console.log(
        "🔥 Live status updated:",
        data.status
      );

    });

  } catch (err) {

    console.error(err);

  }

}

// =========================
// UPDATE PROFIT CARDS
// =========================
function updateProfitCards(orders) {

  let todayProfit = 0;
  let weeklyProfit = 0;
  let monthlyProfit = 0;
  let allProfit = 0;

  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  orders.forEach(order => {

    const amount = Number(order.amount || 0);
    const vendorPrice = Number(order.vendorPrice || 0);

    const orderDate = order.createdAt?.toDate
      ? order.createdAt.toDate()
      : null;

    if (!orderDate) return;

    // Paystack fee
    const paystackFee = amount * 0.0195;

    let profit = 0;

    // =========================
    // HYBRID LOGIC
    // =========================

    if (vendorPrice && orderDate >= today) {
      // NEW SYSTEM (TODAY onwards)
      profit = (amount - paystackFee) - vendorPrice;
    } else {
      // OLD SYSTEM fallback
      profit = amount - paystackFee;
    }

    allProfit += profit;

    if (orderDate >= today) {
      todayProfit += profit;
    }

    if (orderDate >= weekAgo) {
      weeklyProfit += profit;
    }

    if (orderDate >= monthAgo) {
      monthlyProfit += profit;
    }

  });

  document.getElementById("todayProfit").textContent =
    `₵ ${todayProfit.toFixed(2)}`;

  document.getElementById("weeklyProfit").textContent =
    `₵ ${weeklyProfit.toFixed(2)}`;

  document.getElementById("monthlyProfit").textContent =
    `₵ ${monthlyProfit.toFixed(2)}`;

  document.getElementById("allProfit").textContent =
    `₵ ${allProfit.toFixed(2)}`;
}






//======================
// GRAPH ANALYTICS
//======================

let profitChartInstance = null;
let currentMode = "daily";

window.setChartMode =
function(mode, btn) {
  currentMode = mode;

  document.querySelectorAll(".chart-toggle button")
    .forEach(button => button.classList.remove("active"));

  if(btn){
    btn.classList.add("active");
  }

  buildProfitChart(window.ALL_ORDERS || []);
}




function getWeekNumber(date) {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const pastDays = (date - firstDay) / 86400000;
  return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
}



function buildProfitChart(orders) {

  window.ALL_ORDERS = orders; // store globally

  const grouped = {};

  const now = new Date();

  const weekAgo = new Date();
  weekAgo.setDate(now.getDate() - 7);

  const monthAgo = new Date();
  monthAgo.setMonth(now.getMonth() - 1);

  orders.forEach(order => {

    const amount = Number(order.amount || 0);
    const vendorPrice = Number(order.vendorPrice || 0);

    const date = order.createdAt?.toDate?.();
    if (!date) return;

    const paystackFee = amount * 0.0195;
    const profit = (amount - paystackFee) - vendorPrice;

    let key;

    // =========================
    // GROUPING LOGIC
    // =========================

    if (currentMode === "daily") {
      key = date.toISOString().split("T")[0];
    }

    if (currentMode === "weekly") {
      const week = getWeekNumber(date);
      key = `Week ${week}`;
    }

    if (currentMode === "monthly") {
      key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    }

    grouped[key] = (grouped[key] || 0) + profit;
  });

  const labels = Object.keys(grouped);
  const data = Object.values(grouped);

  const ctx = document.getElementById("profitChart");

  if (!ctx) return;

  if (profitChartInstance) {
    profitChartInstance.destroy();
  }

  profitChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: `Profit (${currentMode})`,
        data,
        borderWidth: 2,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}


















// =========================
// PHONE SIDEBAR TOGGLE
// =========================
const phoneSidebar =
  document.querySelector(".sidebar-phone");

const toggler =
  document.getElementById("menu");

toggler.addEventListener("click", function (e) {

  e.stopPropagation();

  phoneSidebar.classList.toggle("active");

});



// =========================
// CLOSE SIDEBAR OUTSIDE CLICK
// =========================
window.addEventListener("click", function (e) {

  if (
    !phoneSidebar.contains(e.target) &&
    !toggler.contains(e.target)
  ) {

    phoneSidebar.classList.remove("active");

  }

});



// SNACKBAR SECTION //
// ===== SNACKBAR FUNCTION ===== //
let snackbarTimeout = null;

function showSnackBar(message, type = "info", duration = 4000) {
  let snackbar = document.querySelector(".snackbar");

  // Create snackbar if it doesn't exist
  if (!snackbar) {
    snackbar = document.createElement("div");
    snackbar.className = "snackbar";

    snackbar.innerHTML = `
      <span class="snackbar-text"></span>
      <div class="snackbar-progress"></div>
    `;

    document.body.appendChild(snackbar);
  }

  // Update text
  snackbar.querySelector(".snackbar-text").textContent = message;

  // Color by type
  if (type === "success") snackbar.style.background = "rgba(7, 29, 26, 0.95)";
  else if (type === "error") snackbar.style.background = "#88353f";
  else if (type === "warning") snackbar.style.background = "#413b2a";
  else snackbar.style.background = "rgba(7, 29, 26, 0.95)";


  // Reset progress animation
  const progress = snackbar.querySelector(".snackbar-progress");
  progress.style.animation = "none";
  void progress.offsetWidth;
  progress.style.animation = `snackbar-progress ${duration}ms linear forwards`;

  snackbar.classList.add("show");

  // Clear previous timeout
  if (snackbarTimeout) clearTimeout(snackbarTimeout);

  snackbarTimeout = setTimeout(() => {
    snackbar.classList.remove("show");
  }, duration);
}
// snackbar ends
