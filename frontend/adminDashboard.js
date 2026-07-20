// === firebase-config.js ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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
  query,
  doc,
  setDoc,
  orderBy,
  where,
  limit,
  getDocs,
} from
"https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";


// =========================
// LOCAL STORAGE KEYS
// =========================
const DELIVERY_TIME_KEY = "ecoLastDeliveryTime";
const LAST_ORDER_KEY = "ecoLastDeliveredOrderId";









const lapOutBtn = document.getElementById("lapOut");
const logOutBtn = document.getElementById("logOut");

lapOutBtn.addEventListener("click", async()=> {
 if(lapOutBtn){
  try{
    await signOut(auth);
    showSnackBar("Logout successful!");
  } catch(err){
    console.error("Error logging out:", err);
    showSnackBar("Error logging out", "warning");
  }
 }
  }
)

// phone-sidebar logout
logOutBtn.addEventListener("click", async() => {
  if(logOutBtn){
    try{
      await signOut(auth);
      showSnackBar("Success Logged Out", "success");
    } catch(err){
      console.error("Error Logging Out", err);
      showSnackBar("Error, try again");
    }
  }
})



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

    emptyBody.style.display = "flex";

    return;

  }

  emptyBody.style.display = "none";

  orders.forEach(order => {

    const row =
      document.createElement("div");

    row.className = "live-body-row";


    // FETCH ORDER SUBMITTED DATE
    const date =
      order.createdAt?.toDate
        ? (() =>{
          const d = order.createdAt.toDate();
          const datePart =
          d.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric"
          });

          const timePart =
          d.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
          }).toUpperCase();

          return `${datePart} ${timePart}`;
        })() : "N/A";


      // FETCH ORDER STATUS UPDATED TIME
        const statusUpdatedAt = 
        order.updatedAt?.toDate 
        ? order.updatedAt
        .toDate()
        .toLocaleTimeString("en-US",
          {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
          })
          .toUpperCase() 
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

    <small>${statusUpdatedAt}</small>



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
    showSnackBar("✅ Status updated", "success", 2000);

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
  const totalOrders = 924 +
    orders.length;

  const pendingOrders =
    orders.filter(order =>
      order.status === "pending"
    ).length;

  const processingOrders =
    orders.filter(order =>
      order.status === "processing"
    ).length;

  const deliveredOrders = 924 +
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


// Update bundles badge
const activeBadgeCount = document.getElementById("activeBadge").textContent = todayOrders;

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
// DELIVERY INDICATOR
// =========================
function updateDeliveryIndicator(snapshot) {

  try {

   if(snapshot.empty) {
    console.log("No delivered orders.");
    return;
   }



    // =========================
    // FIND LATEST DELIVERED ORDER
    // =========================
    const order = {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    };

    console.log("Latest delivered order:", order);

    // =========================
    // LAST DELIVERED DATE
    // =========================
    const deliveredDate = order.updatedAt?.toDate
      ? order.updatedAt.toDate()
      : new Date(order.updatedAt);

    const lastDelivered =
      `${deliveredDate.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric"
      })} • ${deliveredDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      }).toUpperCase()}`;

    // =========================
    // CACHE DELIVERY TIMESTAMP
    // =========================
    const currentOrderKey =
      order.orderId || order.id;

    const storedOrderKey =
      localStorage.getItem(LAST_ORDER_KEY);

    let deliveredAt =
      Number(localStorage.getItem("lastDeliveredAt"));

    if (
      storedOrderKey !== currentOrderKey ||
      !deliveredAt
    ) {

      deliveredAt = order.updatedAt?.toMillis
        ? order.updatedAt.toMillis()
        : order.updatedAt;

      localStorage.setItem(
        "lastDeliveredAt",
        deliveredAt
      );

      localStorage.setItem(
        LAST_ORDER_KEY,
        currentOrderKey
      );

      console.log("✅ Saved new delivery timestamp");

    } else {

      console.log("📦 Using cached timestamp");

    }

    // =========================
    // CALCULATE DELIVERY TIME
    // =========================
    const createdAt = 
    order.createdAt?.toMillis
    ? order.createdAt.toMillis()
    : new Date(order.createdAt).getTime();

    const updatedAt = 
    order.updatedAt?.toMillis
    ? order.updatedAt.toMillis()
    : new (order.updatedAt).getTime();

    const elapsed = updatedAt - createdAt;

    const totalMinutes = Math.max(
      1,
      Math.floor(elapsed / 60000)
    );

    const days =
      Math.floor(totalMinutes / 1440);

    const hours =
      Math.floor((totalMinutes % 1440) / 60);

    const minutes =
      totalMinutes % 60;

    let deliveryTime = "";

    if (days > 0) {

      deliveryTime =
        `${days}d ${hours}h ${minutes}m`;

    } else if (hours > 0) {

      deliveryTime =
        `${hours}h ${minutes}m`;

    } else {

      deliveryTime =
        `${minutes} min`;

    }


    // =========================
// PLACED AT TIME
// =========================

const createdDate = 
order.createdAt?.toDate
? order.createdAt.toDate()
: new Date(order.createdAt);


// Format Placed At
const placedAtFormatted =
`${createdDate.toLocaleDateString("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric"
})} • ${createdDate.toLocaleTimeString("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true
}).toUpperCase()}`;

  // change text colors when there's slow, fast or normal deliveryTime

 // change text colors when there's slow, fast or normal deliveryTime


const bubble = document.getElementById("deliveryBubble1");

const bubble2 = document.getElementById("deliveryBubble2");

const messageEl = document.getElementById("deliveryMessage");

bubble.className = "delivery-bubble";

bubble2.classList = "delivery-bubble2";

const elapsedMinutes = Math.floor(elapsed / 60000);

if(elapsedMinutes <= 10 ) {
  bubble.classList.add("instant");
  bubble2.classList.add("instant");

   messageEl.textContent =
    "Instant Delivery. Most Orders are completed in under 10 minutes.";
}

if(elapsedMinutes <= 30 ){
  bubble.classList.add("fast");
  bubble2.classList.add("fast");

   
  messageEl.textContent =
    "MTN is delivering Fast like Lightning  right now, let enjoy this moment of fast delivering.";
 

} else if(elapsedMinutes <= 90) {
  bubble.classList.add("normal");
  bubble2.classList.add("normal");

   messageEl.textContent =
    "Orders are processing normally. Please allow up to 90 minutes.";

} else {
  bubble.classList.add("slow");
  bubble2.classList.add("slow");

}





    // =========================
    // UPDATE UI
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

    if (deliveryTimeEl)
      deliveryTimeEl.textContent = deliveryTime;

    if (actualTimeEl)
      actualTimeEl.textContent = deliveryTime;

    if (turnAroundTime)
      turnAroundTime.textContent = deliveryTime;

    if (placedAtTime)
      placedAtTime.textContent = placedAtFormatted;

    if (deliveredAtTime)
      deliveredAtTime.textContent = deliveryTime;

    if (lastDeliveredEl) {
     // =========================
// LAST DELIVERED
// =========================
const lastDeliveredFormatted =
`${deliveredDate.toLocaleDateString("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric"
})} • ${deliveredDate.toLocaleTimeString("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true
}).toUpperCase()}`;

if (lastDeliveredEl) {
  lastDeliveredEl.textContent = lastDeliveredFormatted;
}
    }
    // =========================
    // DEBUG
    // =========================
    console.log("Current Order:", currentOrderKey);
    console.log("Stored Order:", storedOrderKey);
    console.log("Delivered At:", new Date(deliveredAt));
    console.log("Current Time:", new Date());
    console.log("Elapsed:", deliveryTime);

  } catch (err) {

    console.error("Delivery indicator error:", err);

  }

}

// =========================
// START
// =========================
const deliveredQuery = query(
  collection(db, "orders"),
  where("status", "==", "delivered"),
  orderBy("updatedAt", "desc"),
  limit(1)
);

onSnapshot(
  deliveredQuery,
  (snapshot) => {
    console.log("Delivery update");
    updateDeliveryIndicator(snapshot);
  },
  (error) => {
    console.error("Snapshot error:", error);
  }
);

setInterval(() => {
  const lastDeliveredEl = document.getElementById("lastDelivered");

  if (!lastDeliveredEl) return;

 // =========================
// LAST DELIVERED
// =========================
const lastDeliveredFormatted =
`${deliveredDate.toLocaleDateString("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric"
})} • ${deliveredDate.toLocaleTimeString("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true
}).toUpperCase()}`;

if (lastDeliveredEl) {
  lastDeliveredEl.textContent = lastDeliveredFormatted;
}

}, 5000);
























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
