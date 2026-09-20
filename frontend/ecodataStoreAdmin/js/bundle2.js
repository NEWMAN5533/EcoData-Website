
// === firebase-config.js ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";



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
  query,
  setDoc,
  addDoc,
  orderBy,
  where,
  limit,
  getDocs,
  increment,
  serverTimestamp
} from
"https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

import { getVendorPrice, getPaystackFee, calculateProfit } from "./vendorPrice.js";



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

// =========================
// LOCAL STORAGE KEYS
// =========================
const DELIVERY_TIME_KEY = "ecoLastDeliveryTime";
const LAST_ORDER_KEY = "ecoLastDeliveredOrderId";
//=====================
// GLOBAL LEADERBOARD
//=====================
let leaderboardCustomers = [];

let profitChartInstance = null;
let currentMode = "weekly";



let bundleOrders = [];

let bundleCurrentPage = 1;

const BUNDLE_ITEMS_PER_PAGE = 10;



// =========================
// DOM READY
// =========================
document.addEventListener("DOMContentLoaded", () => {
  console.log("Bundle dashboard starting....");

  loadOrderRealTime();
 

});



function getFilteredBundleOrders() {

  let filtered = [...bundleOrders];

  // ==========================
  // SEARCH
  // ==========================

  const searchInput =
    document.getElementById("bundleOrderSearch");

  const searchTerm =
    searchInput?.value
      ?.trim()
      .toLowerCase() || "";

    //==================
    // SEARCH TERM
    //==================
  if (searchTerm) {

    filtered = filtered.filter(order => {

      const orderId =
        String(order.orderId || "").toLowerCase();

      const recipient =
        String(order.recipient || "").toLowerCase();

      const network =
        String(order.network || "").toLowerCase();

      return (
        orderId.includes(searchTerm) ||
        recipient.includes(searchTerm) ||
        network.includes(searchTerm)
      );

    });

  }

  // ==========================
  // STATUS FILTER
  // ==========================

  const statusFilter =
    document.getElementById("bundleStatusFilter");

  const selectedStatus =
    statusFilter?.value
      ?.trim()
      .toLowerCase() || "all";

  if (selectedStatus !== "all") {

    filtered = filtered.filter(order => {

      return getOrderStatus(order) ===
        selectedStatus;

    });

  }

  // ==========================
  // NETWORK FILTER
  // ==========================

  const networkFilter =
    document.getElementById("bundleNetworkFilter");

  const selectedNetwork =
    networkFilter?.value
      ?.trim()
      .toLowerCase() || "all";

  if (selectedNetwork !== "all") {

    filtered = filtered.filter(order => {

      return String(
        order.network || ""
      )
        .trim()
        .toLowerCase() === selectedNetwork;

    });

  }

  return filtered;

}


/* =========================================================
   MESSAGE
========================================================= */

function showBundleMessage(message) {

  if (!bundleAdminMessage) return;

  bundleAdminMessage.textContent = message;

  bundleAdminMessage.classList.add("show");

  clearTimeout(
    showBundleMessage.timer
  );

  showBundleMessage.timer =
    setTimeout(() => {

      bundleAdminMessage.classList.remove("show");

    }, 2600);
}


function normalizeBundleStatus(value){
  return String(
    value || ""
  )
  .trim()
  .toLowerCase();
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}



//========================
// FORMAT CURRENCY
//========================
function formatBundleCurrency(value){
  const amount = 
  Number(value) || 0;

  return `GHS ${amount.toFixed(2)}`;
}



/* =========================================================
   DATE FORMAT
========================================================= */

function formatBundleDate(value) {

  if (!value) return "—";

  let date;

  // Firestore Timestamp
  if (value?.toDate) {
    date = value.toDate();

  // JavaScript Date
  } else if (value instanceof Date) {
    date = value;

  // String / number timestamp
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });

}



/* =========================================================
   CREATE ORDER ROW
========================================================= */
function createBundleOrderRow(order) {

  const orderId =
    order.orderId || "-";

  const network =
    order.network
      ? String(order.network).toUpperCase()
      : "-";

  const size =
    order.volume !== undefined &&
    order.volume !== null
      ? `${order.volume}GB`
      : "-";

  const amount =
    Number(order.amount) || 0;

  const recipient =
    order.recipient || "-";

  const paid = "Yes";

  const status =
    getOrderStatus(order) || "unknown";

  return `
    <tr>

      <td>
        <strong class="table-primary-text">
          ${escapeHtml(orderId)}
        </strong>
      </td>

      <td>
        ${escapeHtml(network)}
      </td>

      <td>
        ${escapeHtml(size)}
      </td>

      <td>
        ${formatBundleCurrency(amount)}
      </td>

      <td>
        ${escapeHtml(recipient)}
      </td>

      <td>
        <span class="bundle-paid-status">

          <i class="${
            paid
              ?"ri-checkbox-circle-line"
              : ""
          }"></i>

          ${paid}

        </span>
      </td>

      <td>
        ${formatBundleDate(order.createdAt)}
      </td>

      <td>

        <span class="bundle-order-status ${normalizeBundleStatus(status)}">

          <span>
            ${escapeHtml(status)}
          </span>

        </span>

      </td>

      <td>
        ${formatBundleDate(order.updatedAt)}
      </td>

      <!-- ACTION -->

      <td>

  <div class="bundle-order-actions">

    <button
      type="button"
      class="bundle-action-button"
      aria-label="Order actions"
      aria-expanded="false"
    >
      <i class="ri-more-2-fill"></i>
    </button>

    <div class="bundle-action-menu">

      <button
        type="button"
        data-status="pending"
        data-order-id="${escapeHtml(order.firestoreId)}"
      >
        <span class="action-status-dot pending"></span>
        Pending
      </button>

      <button
        type="button"
        data-status="processing"
        data-order-id="${escapeHtml(order.firestoreId)}"
      >
        <span class="action-status-dot processing"></span>
        Processing
      </button>

      <button
        type="button"
        data-status="delivered"
        data-order-id="${escapeHtml(order.firestoreId)}"
      >
        <span class="action-status-dot delivered"></span>
        Delivered
      </button>

      <button
        type="button"
        data-status="failed"
        data-order-id="${escapeHtml(order.firestoreId)}"
      >
        <span class="action-status-dot failed"></span>
        Failed
      </button>

    </div>

  </div>

</td>

    </tr>
  `;
}



function renderBundleOrders() {

  const rowWrapper =
    document.getElementById("rowWrapper");

  const emptyBody =
    document.getElementById("empty-body");

  if (!rowWrapper) {
    console.warn("rowWrapper not found");
    return;
  }

  const filteredOrders =
    getFilteredBundleOrders();

  // ==========================
  // EMPTY STATE
  // ==========================

  if (!filteredOrders.length) {

    rowWrapper.innerHTML = "";

    if (emptyBody) {
      emptyBody.style.display = "";
    }

    return;
  }

  if (emptyBody) {
    emptyBody.style.display = "none";
  }

  // ==========================
  // PAGINATION
  // ==========================

  const start =
    (bundleCurrentPage - 1) *
    BUNDLE_ITEMS_PER_PAGE;

  const end =
    start + BUNDLE_ITEMS_PER_PAGE;

  const pageOrders =
    filteredOrders.slice(start, end);

  // ==========================
  // RENDER ROWS
  // ==========================

  rowWrapper.innerHTML =
    pageOrders
      .map(order =>
        createBundleOrderRow(order)
      )
      .join("");


  updateBundlePagination(
    filteredOrders.length
  )

}


//======================
// SEARCH ORDER BY ID
//======================
const bundleOrderSearch = document.getElementById("bundleOrderSearch");

if(bundleOrderSearch){
  bundleOrderSearch.addEventListener("input", ()=> {
    // Start form page 1
    // whenever the search changes
    bundleCurrentPage = 1;
    renderBundleOrders();
  })
}


const bundleRowWrapper =
  document.getElementById("rowWrapper");

if (bundleRowWrapper) {

  bundleRowWrapper.addEventListener(
    "click",
    (event) => {

      // ==========================
      // THREE DOTS BUTTON
      // ==========================

      const actionButton =
        event.target.closest(
          ".bundle-action-button"
        );

      if (actionButton) {

        const container =
          actionButton.closest(
            ".bundle-order-actions"
          );

        if (!container) return;

        // Close other menus
        document
          .querySelectorAll(
            ".bundle-order-actions.active"
          )
          .forEach(item => {

            if (item !== container) {
              item.classList.remove("active");

              const button =
                item.querySelector(
                  ".bundle-action-button"
                );

              if (button) {
                button.setAttribute(
                  "aria-expanded",
                  "false"
                );
              }
            }

          });

        const isOpen =
          container.classList.toggle("active");

        actionButton.setAttribute(
          "aria-expanded",
          String(isOpen)
        );

        return;
      }


      // ==========================
      // STATUS ACTION
      // ==========================

      const statusButton =
        event.target.closest(
          ".bundle-action-menu button"
        );

      if (statusButton) {

        const orderId =
          statusButton.dataset.orderId;

        const status =
          statusButton.dataset.status;

        if (!orderId || !status) return;

        // Close menu
        const container =
          statusButton.closest(
            ".bundle-order-actions"
          );

        if (container) {
          container.classList.remove("active");

          const button =
            container.querySelector(
              ".bundle-action-button"
            );

          if (button) {
            button.setAttribute(
              "aria-expanded",
              "false"
            );
          }
        }

        // Existing API function
        changeOrderStatus(
          orderId,
          status
        );

      }

    }
  );

}


document.addEventListener("click", (event) => {

  if (
    event.target.closest(
      ".bundle-order-actions"
    )
  ) {
    return;
  }

  document
    .querySelectorAll(
      ".bundle-order-actions.active"
    )
    .forEach(container => {

      container.classList.remove("active");

      const button =
        container.querySelector(
          ".bundle-action-button"
        );

      if (button) {
        button.setAttribute(
          "aria-expanded",
          "false"
        );
      }

    });

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


      //====================
      // STORE DATABASE ORDERS
      //====================
      bundleOrders = orders;

      // KEEP CURRENT PAGE IF STILL VALID

      const filteredOrders = getFilteredBundleOrders();

      const totalPages = Math.max(
        1, 
        Math.ceil(
          filteredOrders.length / BUNDLE_ITEMS_PER_PAGE
        )
      );

      if(bundleCurrentPage > totalPages){
        bundleCurrentPage = totalPages;
      }

      //====================
      // RENDER TABLE
      //====================
      renderBundleOrders();

      //==================
      // UPDATE ANALYTICS
      //==================

      updateCards(orders);

      updateProfitCards(orders);


      const leaderboard =
      buildCustomerLeaderboard(orders);


      console.log(leaderboard);

     //===================
     // NEW ANALYTICS
     //===================
     buildRevenueChart(orders);
     updateOrderSummary(orders);


    });

  } catch (err) {

    console.error(err);

  }

}



// ==========================================
// REVENUE OVERVIEW
// ==========================================

let currentRevenuePeriod = 30;

let currentRevenueOrders = [];


// ==========================================
// PERIOD SELECT
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

  const revenuePeriod =
    document.getElementById("revenuePeriod");

  if (!revenuePeriod) return;

  revenuePeriod.addEventListener("change", () => {

    currentRevenuePeriod =
      Number(revenuePeriod.value) || 30;

    buildRevenueChart(
      currentRevenueOrders
    );

  });

});

function getOrderStatus(order){
  return String(
    order?.status ||
    order?.["LD-Status"] ||
    order?.LD_Status ||
    ""
  )
  .toLowerCase()
  .trim();
}
// ==========================================
// BUILD REVENUE CHART
// ==========================================

function buildRevenueChart(orders = []) {

  currentRevenueOrders = orders;

  const svg =
    document.querySelector(".revenue-svg");

  if (!svg) return;


  // ========================================
  // FILTER DELIVERED ORDERS
  // ========================================

  const deliveredOrders =
   currentRevenueOrders.filter(order => 
    getOrderStatus(order) === "delivered"
   );


  // ========================================
  // DATE RANGE
  // ========================================

  const now = new Date();

  const startDate =
    new Date(now);


  if (currentRevenuePeriod === 7) {

    startDate.setDate(
      now.getDate() - 6
    );

  } else if (currentRevenuePeriod === 30) {

    startDate.setDate(
      now.getDate() - 29
    );

  } else if (currentRevenuePeriod === 90) {

    startDate.setDate(
      now.getDate() - 89
    );

  } else if (currentRevenuePeriod === 365) {

    startDate.setDate(
      now.getDate() - 364
    );

  }


  startDate.setHours(
    0,
    0,
    0,
    0
  );


  // ========================================
  // GROUP REVENUE BY DAY
  // ========================================

  const revenueByDay = {};


  deliveredOrders.forEach(order => {

    let orderDate = null;


    if (order.createdAt?.toDate) {

      orderDate =
        order.createdAt.toDate();

    } else if (order.createdAt) {

      orderDate =
        new Date(order.createdAt);

    }


    if (
      !orderDate ||
      Number.isNaN(
        orderDate.getTime()
      )
    ) {
      return;
    }


    if (orderDate < startDate) {
      return;
    }


    const key =
      getRevenueDateKey(
        orderDate
      );


    const amount =
      Number(order.amount || 0);


    revenueByDay[key] =
      (revenueByDay[key] || 0) +
      amount;

  });


  // ========================================
  // CREATE DATE POINTS
  // ========================================

  const points = [];

  const totalDays =
    currentRevenuePeriod;


  for (
    let i = 0;
    i < totalDays;
    i++
  ) {

    const date =
      new Date(startDate);


    date.setDate(
      startDate.getDate() + i
    );


    const key =
      getRevenueDateKey(date);


    points.push({
      date,
      revenue:
        revenueByDay[key] || 0
    });

  }


  // ========================================
  // REDUCE LARGE PERIODS
  // ========================================

  let chartPoints = points;


  if (currentRevenuePeriod === 90) {

    chartPoints =
      groupRevenueIntoPeriods(
        points,
        3
      );

  }


  if (currentRevenuePeriod === 365) {

    chartPoints =
      groupRevenueIntoPeriods(
        points,
        30
      );

  }


  // ========================================
  // GET MAXIMUM
  // ========================================

  const values =
    chartPoints.map(
      point => point.revenue
    );


  const maxRevenue =
    Math.max(
      ...values,
      1
    );


  // ========================================
  // CREATE PATHS
  // ========================================

  const linePath =
    createRevenuePath(
      chartPoints,
      maxRevenue
    );


  const areaPath =
    `${linePath} L700,240 L0,240 Z`;


  // ========================================
  // UPDATE SVG
  // ========================================

  const area =
    svg.querySelector(
      ".revenue-area"
    );


  const line =
    svg.querySelector(
      ".revenue-line"
    );


  if (area) {

    area.setAttribute(
      "d",
      areaPath
    );

  }


  if (line) {

    line.setAttribute(
      "d",
      linePath
    );

  }


  // ========================================
  // UPDATE Y AXIS
  // ========================================

  updateRevenueYAxis(
    maxRevenue
  );


  // ========================================
  // UPDATE LABELS
  // ========================================

  updateRevenueLabels(
    chartPoints
  );


  // ========================================
  // UPDATE TOOLTIP
  // ========================================

  updateRevenueTooltip(
    chartPoints,
    maxRevenue
  );

}


// ==========================================
// DATE KEY
// ==========================================

function getRevenueDateKey(date) {

  return [
    date.getFullYear(),

    String(
      date.getMonth() + 1
    ).padStart(2, "0"),

    String(
      date.getDate()
    ).padStart(2, "0")

  ].join("-");

}


// ==========================================
// GROUP LARGE PERIODS
// ==========================================

function groupRevenueIntoPeriods(
  points,
  daysPerGroup
) {

  const grouped = [];


  for (
    let i = 0;
    i < points.length;
    i += daysPerGroup
  ) {

    const chunk =
      points.slice(
        i,
        i + daysPerGroup
      );


    if (!chunk.length) {
      continue;
    }


    const revenue =
      chunk.reduce(
        (total, point) =>
          total + point.revenue,
        0
      );


    grouped.push({

      date:
        chunk[0].date,

      revenue

    });

  }


  return grouped;

}


// ==========================================
// CREATE SVG LINE PATH
// ==========================================

function createRevenuePath(
  points,
  maxRevenue
) {

  if (!points.length) {

    return `
      M0,220
      L700,220
    `.trim();

  }


  const width = 700;

  const height = 220;

  const usableWidth =
    width - 10;


  const step =
    points.length === 1
      ? usableWidth
      : usableWidth /
        (points.length - 1);


  const coordinates =
    points.map(
      (point, index) => {

        const x =
          points.length === 1
            ? width / 2
            : index * step;


        const ratio =
          maxRevenue > 0
            ? point.revenue /
              maxRevenue
            : 0;


        const y =
          height -
          (ratio * 180);


        return {
          x,
          y
        };

      }
    );


  if (!coordinates.length) {
    return "";
  }


  // ========================================
  // FIRST POINT
  // ========================================

  let path =
    `M${coordinates[0].x},${coordinates[0].y}`;


  // ========================================
  // CURVED LINE
  // ========================================

  for (
    let i = 1;
    i < coordinates.length;
    i++
  ) {

    const previous =
      coordinates[i - 1];


    const current =
      coordinates[i];


    const controlX =
      (previous.x + current.x) / 2;


    path +=
      ` C${controlX},${previous.y}` +
      ` ${controlX},${current.y}` +
      ` ${current.x},${current.y}`;

  }


  return path;

}


// ==========================================
// Y AXIS VALUES
// ==========================================

function updateRevenueYAxis(
  maxRevenue
) {

  const yAxis =
    document.querySelector(
      ".admin-chart-y"
    );


  if (!yAxis) return;


  const roundedMax =
    roundRevenueValue(
      maxRevenue
    );


  const values = [

    roundedMax,

    roundedMax * 0.75,

    roundedMax * 0.50,

    roundedMax * 0.25,

    0

  ];


  const spans =
    yAxis.querySelectorAll(
      "span"
    );


  spans.forEach(
    (span, index) => {

      const value =
        values[index] ?? 0;


      span.textContent =
        formatChartMoney(
          value
        );

    }
  );

}


// ==========================================
// ROUND CHART MAX
// ==========================================

function roundRevenueValue(
  value
) {

  if (value <= 100) {
    return 100;
  }


  const magnitude =
    Math.pow(
      10,
      Math.floor(
        Math.log10(value)
      )
    );


  const normalized =
    value / magnitude;


  let rounded;


  if (normalized <= 1) {

    rounded = 1;

  } else if (normalized <= 2) {

    rounded = 2;

  } else if (normalized <= 5) {

    rounded = 5;

  } else {

    rounded = 10;

  }


  return rounded * magnitude;

}


// ==========================================
// FORMAT CHART MONEY
// ==========================================

function formatChartMoney(
  value
) {

  if (value >= 1000) {

    return `${Math.round(
      value / 1000
    )}k`;

  }


  return Math.round(
    value
  );

}


// ==========================================
// UPDATE CHART LABELS
// ==========================================

function updateRevenueLabels(
  points
) {

  const labels =
    document.querySelector(
      ".admin-chart-labels"
    );


  if (!labels) return;


  if (!points.length) {

    labels.innerHTML = "";

    return;

  }


  const indexes = [

    0,

    Math.floor(
      (points.length - 1) * 0.25
    ),

    Math.floor(
      (points.length - 1) * 0.50
    ),

    Math.floor(
      (points.length - 1) * 0.75
    ),

    points.length - 1

  ];


  labels.innerHTML =
    [...new Set(indexes)]
      .map(index => {

        const point =
          points[index];


        return `
          <span>
            ${formatRevenueDate(
              point.date
            )}
          </span>
        `;

      })
      .join("");

}


// ==========================================
// FORMAT REVENUE DATE
// ==========================================

function formatRevenueDate(
  date
) {

  if (
    currentRevenuePeriod === 365
  ) {

    return date.toLocaleDateString(
      "en-US",
      {
        month: "short"
      }
    );

  }


  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric"
    }
  );

}


// ==========================================
// TOOLTIP
// ==========================================

function updateRevenueTooltip(
  points,
  maxRevenue
) {

  const tooltip =
    document.getElementById(
      "chartTooltip"
    );


  if (
    !tooltip ||
    !points.length
  ) {
    return;
  }


  let highest =
    points[0];


  points.forEach(point => {

    if (
      point.revenue >
      highest.revenue
    ) {

      highest = point;

    }

  });


  const ratio =
    maxRevenue > 0
      ? highest.revenue /
        maxRevenue
      : 0;


  const x =
    Math.min(
      78,
      Math.max(
        8,
        ratio * 100
      )
    );


  tooltip.style.left =
    `${x}%`;


  const strong =
    tooltip.querySelector(
      "strong"
    );


  const span =
    tooltip.querySelector(
      "span"
    );


  if (strong) {

    strong.textContent =
      `₵${highest.revenue.toLocaleString(
        "en-GH",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }
      )}`;

  }


  if (span) {

    span.textContent =
      highest.date.toLocaleDateString(
        "en-US",
        {
          month: "long",
          day: "numeric"
        }
      );

  }

}








// ==========================================
// ORDER SUMMARY
// ==========================================

function updateOrderSummary(orders) {

const summaryCard =
document.querySelector(
".order-summary-card"
);

if (!summaryCard) return;

// ========================================
// COUNT ORDERS
// ========================================

const counts = {

pending: 0,

processing: 0,

delivered: 0,

failed: 0

};

orders.forEach(order => {

const status =
  String(
    order.status || ""
  ).toLowerCase().trim();


if (
  Object.prototype.hasOwnProperty
  .call(counts, status)
) {

  counts[status]++;

}

});

// ========================================
// GET SUMMARY ITEMS
// ========================================

const items =
summaryCard.querySelectorAll(
".order-summary-item"
);

const statusOrder = [

"pending",

"processing",

"delivered",

"failed"

];

const total =
orders.length;

items.forEach(
(item, index) => {

  const status =
    statusOrder[index];


  if (!status) return;


  const count =
    counts[status];


  const strong =
    item.querySelector(
      ".order-summary-info strong"
    );


  const bar =
    item.querySelector(
      ".order-summary-bar span"
    );


  if (strong) {

    strong.textContent =
      count.toLocaleString();

  }


  // ====================================
  // BAR WIDTH
  // ====================================

  if (bar) {

    let percentage = 0;


    if (total > 0) {

      percentage =
        (count / total) * 100;

    }


    /*
     * Keep a small visible width
     * when there are orders.
     */

    if (
      count > 0 &&
      percentage < 5
    ) {

      percentage = 5;

    }


    bar.style.width =
      `${Math.min(
        100,
        percentage
      )}%`;

  }

}

);

}








//======================
// LEADERBOARD MANAGER
//======================
const addLeaderBtn =
  document.getElementById("addLeaderPoints");



  if (addLeaderBtn) {

  addLeaderBtn.addEventListener("click", async () => {

    const phone =
      document.getElementById("phone").value.trim();

    const manualPoints =
      Number(
        document.getElementById("manualPoints").value
      );

    const gb =
      Number(
        document.getElementById("leaderGB").value
      );

    if (!phone) {
      showSnackBar(
        "Enter customer phone.",
        "warning"
      );
      return;
    }

    if (!gb || gb <= 0) {
      showSnackBar(
        "Enter valid GB.",
        "warning"
      );
      return;
    }


    //=========================
    // CALCULATE POINTS
    //=========================
    const points =
      manualPoints > 0
        ? manualPoints
        : gb * 6;


    try {

      const db = window.FIRESTORE;

      if (!db) {
        showSnackBar(
          "Firestore is not available.",
          "error"
        );
        return;
      }


      //========================================
      // GET ORDERS
      //========================================
      const q =
        query(
          collection(db, "orders")
        );

      const snapshot =
        await getDocs(q);


      //========================================
      // FIND ONLY ADMIN LEADERBOARD RECORDS
      //========================================
      let manualRecord = null;
      let latestManualTime = 0;


      snapshot.forEach(doc => {

        const order = doc.data();

        const orderPhone =
          String(
            order.recipient || ""
          ).trim();


        if (orderPhone !== phone) {
          return;
        }


        // IMPORTANT:
        // Only records specifically created
        // for leaderboard management.
        if (
          order.source !== "admin" ||
          order.LD_Status !== "leaderboard"
        ) {
          return;
        }


        const updatedTime =
          order.manualUpdatedAt?.toMillis
            ? order.manualUpdatedAt.toMillis()
            : new Date(
                order.manualUpdatedAt || 0
              ).getTime();


        if (
          !manualRecord ||
          updatedTime > latestManualTime
        ) {

          manualRecord = {
            ref: doc.ref,
            data: order
          };

          latestManualTime =
            updatedTime;

        }

      });


      //========================================
      // ADMIN LEADERBOARD RECORD EXISTS
      //========================================
      if (manualRecord) {

        await updateDoc(
          manualRecord.ref,
          {

            manualPoints: points,

            manualGB: gb,

            // Keep this record separate
            // from normal delivery orders.
            volume: 0,

            source: "admin",

            LD_Status: "leaderboard",

            manualUpdatedAt:
              serverTimestamp(),

          }
        );


        showSnackBar(
          `${phone} updated to ${points} points.`,
          "success"
        );

        return;
      }


      //========================================
      // NO ADMIN RECORD
      //
      // CREATE A SEPARATE RECORD.
      //
      // NEVER MODIFY A REAL ORDER.
      //========================================
      await addDoc(
        collection(db, "orders"),
        {

          recipient: phone,

          manualPoints: points,

          manualGB: gb,

          // IMPORTANT:
          // Do NOT put the assigned GB here.
          // This is not a data purchase.
          volume: 0,

          amount: 0,

          // Dedicated leaderboard marker
          LD_Status: "leaderboard",

          source: "admin",

          createdAt:
            serverTimestamp(),

          manualUpdatedAt:
            serverTimestamp()

        }
      );


      showSnackBar(
        "New leaderboard member created.",
        "success"
      );


    } catch (err) {

      console.error(
        "Leaderboard update error:",
        err
      );

      showSnackBar(
        "Unable to update points.",
        "error"
      );

    }

  });

}





//======================
// ADD / UPDATE POINTS
//======================
function addPoints(phone, points, gb) {

  let customer =
    leaderboardCustomers.find(
      c => c.phone === phone
    );

  if (customer) {

    customer.points = points;
    customer.totalGB = gb;

  } else {

    leaderboardCustomers.push({

      phone,
      points,
      totalGB: gb,
      totalOrders: 1,
      totalSpent: 0

    });

  }

  leaderboardCustomers.sort(
    (a, b) => b.points - a.points
  );

  renderLeaderboard(
    leaderboardCustomers.slice(0, 5)
  );

}



//=========================
// SAVE MANUAL POINTS
//=========================
async function saveManualPoints(
  phone,
  points,
  gb
) {

  const db = window.FIRESTORE;

  if (!db) return;

  try {

    //========================================
    // GET ALL ORDERS FOR CUSTOMER
    // NO ORDERBY / INDEX REQUIRED
    //========================================
    const q =
      query(
        collection(db, "orders"),
        where("recipient", "==", phone)
      );

    const snapshot =
      await getDocs(q);


    if (snapshot.empty) {

      showSnackBar(
        "Customer not found.",
        "warning"
      );

      return;
    }


    //========================================
    // FIND EXISTING ADMIN LEADERBOARD RECORD
    //========================================
    let leaderboardDoc = null;

    let latestManualUpdate = 0;


    snapshot.forEach(doc => {

      const order = doc.data();

      if (
        order.source !== "admin" ||
        order.LD_Status !== "leaderboard"
      ) {
        return;
      }


      const updatedTime =
        order.manualUpdatedAt?.toMillis
          ? order.manualUpdatedAt.toMillis()
          : new Date(
              order.manualUpdatedAt || 0
            ).getTime();


      if (
        !leaderboardDoc ||
        updatedTime > latestManualUpdate
      ) {

        leaderboardDoc = doc;

        latestManualUpdate =
          updatedTime;

      }

    });


    //========================================
    // IF NO ADMIN RECORD EXISTS
    // USE LATEST ORDER
    //========================================
    if (!leaderboardDoc) {

      let latestDoc = null;

      let latestTime = 0;


      snapshot.forEach(doc => {

        const order = doc.data();

        const time =
          order.createdAt?.toMillis
            ? order.createdAt.toMillis()
            : new Date(
                order.createdAt || 0
              ).getTime();


        if (time > latestTime) {

          latestTime = time;

          latestDoc = doc;

        }

      });


      leaderboardDoc = latestDoc;

    }


    if (!leaderboardDoc) {

      showSnackBar(
        "Customer record not found.",
        "warning"
      );

      return;

    }


    //========================================
    // UPDATE MANUAL POINTS
    //========================================
    await updateDoc(
      leaderboardDoc.ref,
      {

        manualPoints: Number(points),

        manualGB: Number(gb),

        manualUpdatedAt: new Date(),

        updatedAt: new Date(),

        source: "admin",

        LD_Status: "leaderboard"

      }
    );


    showSnackBar(
      "Leaderboard updated successfully.",
      "success"
    );


  } catch (err) {

    console.error(
      "Save manual points error:",
      err
    );

    showSnackBar(
      "Unable to update leaderboard.",
      "error"
    );

  }

}




//=============================
// BUILD CUSTOMER LEADERBOARD
//=============================
function buildCustomerLeaderboard(orders){
  const customers = {};

  orders.forEach(order => {

  const phone = order.recipient;
  if(!phone) return;

  if(!customers[phone]){
    customers[phone] = {
      phone,
      totalGB: 0,
      totalOrders: 0,
      totalSpent: 0,
      points: 0
    };
  }

  customers[phone].totalGB +=
  Number(order.volume || 0);
  customers[phone].totalOrders++;
  customers[phone].totalSpent +=
  Number(order.amount || 0);


  if(order.manualPoints !== undefined && order.manualPoints !== null){
    // Admin override
    customers[phone].points =
    Number(order.manualPoints);
  } else{
    // Default calculation
     // 1GB = 1 point
  customers[phone].points +=
  Number(order.volume || 0);
  }
 

  });

  // save every customer globally

 leaderboardCustomers = Object.values(customers)
  .sort((a, b) => b.points - a.points);

 const leaderboard = Object.values(customers)
 .sort((a,b)=>b.points-a.points);

 console.table(leaderboardCustomers.slice(0,9));


 return leaderboardCustomers.slice(0,9);
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
  const totalOrders = 947 +
    orders.length;

  const pendingOrders =
    orders.filter(order =>
      getOrderStatus(order) === "pending"
    ).length;

  const processingOrders =
    orders.filter(order =>
      getOrderStatus(order) === "processing"
    ).length;

  const deliveredOrders = 947 +
    orders.filter(order =>
      getOrderStatus(order) === "delivered"
    ).length;

  const failedOrders =
    orders.filter(order =>
      getOrderStatus(order) === "failed"
    ).length;
//====================
// GET STATUS ICON 
//====================




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
setDashboardText(
  "activeBadge",
  todayOrders
);

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
  setDashboardText(
    "totalOrder",
    totalOrders
  );

  
// Pending orders
  setDashboardText(
    "pendingOrder",
    pendingOrders
  );


  // processing orders
  setDashboardText(
    "processingOrder",
    processingOrders
  );

  // delivered orders
  setDashboardText(
    "deliveredOrder",
    deliveredOrders
  );


  // failed orders
  setDashboardText(
    "failedOrder",
    failedOrders
  );
 

  // TIME-BASED
  setDashboardText(
    "todayOrder",
    totalOrders
  )
 

  // WEEKLY ORDERS
  setDashboardText(
    "weeklyOrder",
    weeklyOrders
  );


// MONTHLY ORDERS
setDashboardText(
  "monthlyOrder",
  monthlyOrders
);


  // MONEY\
  setDashboardText(
    "totalRevenue",
    `₵ ${totalRevenue.toFixed(2)}`
  );

  setDashboardText(
    "todayRevenue",
    `₵ ${todayRevenue.toFixed(2)}`
  );

}



//=======================
// SAFE DOM TEXT UPDATE
//=======================
function setDashboardText(id, value){
 const element = 
 document.getElementById(id);

 if(element){
  element.textContent = value;
 }
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

  let totalVendorCost = 0;
  let totalPaystackFee = 0;
  let totalSales = 0;
  let grossProfit = 0;
  let netProfit = 0;

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
  weekAgo.setDate(now.getDate() - 7);

  const monthAgo = new Date();
  monthAgo.setMonth(now.getMonth() - 1);

   

  orders.forEach(order => {

    const amount = Number(order.amount || 0);
    const volume = Number(order.volume || 0);
    

    const {
      vendorPrice,
      paystackFee,
      netProfit: orderNetProfit,
      grossProfit: orderGrossProfit

    } = calculateProfit(order.volume, amount);


    totalSales += (amount);
    totalPaystackFee += (paystackFee);
    totalVendorCost += (vendorPrice);

    grossProfit += (orderGrossProfit);
    netProfit += (orderNetProfit) ;


    const profit = (orderNetProfit);

    allProfit += profit;



  let orderDate = null;

  if(order.createdAt?.toDate){
    orderDate = order.createdAt.toDate();

  } 
  
  else if(order.createdAt){
      orderDate = new Date(order.createdAt);
    }

  

  if(!orderDate || isNaN(orderDate.getTime())){
    return; // skip
  }


    if(orderDate.toDateString() ===
      today.toDateString()){
      todayProfit += profit;
    }


    if(orderDate >= weekAgo){
      weeklyProfit += profit;
    }


    if(orderDate >= monthAgo){
      monthlyProfit += profit;
     
    }
  
  });

  // Give away fund (zaka);
  const giveawayFund = Number((monthlyProfit * 0.025).toFixed(2));

  setDashboardText(
  "totalSales",
  `₵ ${totalSales.toFixed(2)}`
);

setDashboardText(
  "grossProfit",
  `₵ ${grossProfit.toFixed(2)}`
);

setDashboardText(
  "netProfit",
  `₵ ${netProfit.toFixed(2)}`
);

setDashboardText(
  "vendorCost",
  `₵ ${totalVendorCost.toFixed(2)}`
);

setDashboardText(
  "paystackFees",
  `₵ ${totalPaystackFee.toFixed(2)}`
);

setDashboardText(
  "todayProfit",
  `₵ ${todayProfit.toFixed(2)}`
);

setDashboardText(
  "weeklyProfit",
  `₵ ${weeklyProfit.toFixed(2)}`
);

setDashboardText(
  "monthlyProfit",
  `₵ ${monthlyProfit.toFixed(2)}`
);

setDashboardText(
  "giveawayFund",
  `₵ ${giveawayFund.toFixed(2)}`
);

setDashboardText(
  "allProfit",
  `₵ ${allProfit.toFixed(2)}`
);

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
    : new Date(order.updatedAt).getTime();

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

 if(!bubble  || !bubble2 || !messageEl){
  console.warn("Delivery indicator elements are not found.");
 } else{

bubble.className = "delivery-bubble";

bubble2.classList = "delivery-bubble2";
 }

const elapsedMinutes = Math.floor(elapsed / 60000);

if(elapsedMinutes <= 10 ) {
  bubble.classList.add("instant");
  bubble2.classList.add("instant");

   messageEl.textContent =
    "Instant Delivery. Most Orders are completed in under 10 minutes.";
}

else if(elapsedMinutes <= 30 ){
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

  messageEl.textContent = 
  "Orders are taking longer than usual. Please allow additional processing time."

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






function updateBundlePagination(totalItems) {

  const pagination =
    document.getElementById("bundlePagination");

  if (!pagination) return;

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalItems / BUNDLE_ITEMS_PER_PAGE
      )
    );

  if (bundleCurrentPage > totalPages) {
    bundleCurrentPage = totalPages;
  }

  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  const pages = [];

  // Always show first page
  pages.push(1);

  // Pages around current page
  const start =
    Math.max(2, bundleCurrentPage - 1);

  const end =
    Math.min(
      totalPages - 1,
      bundleCurrentPage + 1
    );

  // Ellipsis before current range
  if (start > 2) {
    pages.push("ellipsis-left");
  }

  // Middle pages
  for (let page = start; page <= end; page++) {
    pages.push(page);
  }

  // Ellipsis after current range
  if (end < totalPages - 1) {
    pages.push("ellipsis-right");
  }

  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  let html = "";

  // ==========================
  // PREVIOUS
  // ==========================

  html += `
    <button
      type="button"
      class="bundle-page-btn"
      data-page-action="prev"
      ${bundleCurrentPage === 1 ? "disabled" : ""}
    >
      <i class="ri-arrow-left-s-line"></i>
    </button>
  `;

  // ==========================
  // PAGE NUMBERS
  // ==========================

  pages.forEach(page => {

    if (
      page === "ellipsis-left" ||
      page === "ellipsis-right"
    ) {

      html += `
        <span class="bundle-page-ellipsis">
          ...
        </span>
      `;

      return;
    }

    html += `
      <button
        type="button"
        class="bundle-page-btn ${
          page === bundleCurrentPage
            ? "active"
            : ""
        }"
        data-page="${page}"
      >
        ${page}
      </button>
    `;

  });

  // ==========================
  // NEXT
  // ==========================

  html += `
    <button
      type="button"
      class="bundle-page-btn"
      data-page-action="next"
      ${
        bundleCurrentPage === totalPages
          ? "disabled"
          : ""
      }
    >
      <i class="ri-arrow-right-s-line"></i>
    </button>
  `;

  pagination.innerHTML = html;
}



const bundlePagination =
  document.getElementById("bundlePagination");

if (bundlePagination) {

  bundlePagination.addEventListener(
    "click",
    (event) => {

      const button =
        event.target.closest(
          ".bundle-page-btn"
        );

      if (!button ||
          button.disabled) {
        return;
      }

      const filteredOrders =
        getFilteredBundleOrders();

      const totalPages =
        Math.max(
          1,
          Math.ceil(
            filteredOrders.length /
            BUNDLE_ITEMS_PER_PAGE
          )
        );

      // Specific page
      if (button.dataset.page) {

        bundleCurrentPage =
          Number(button.dataset.page);

      }

      // Previous
      else if (
        button.dataset.pageAction === "prev"
      ) {

        if (bundleCurrentPage > 1) {
          bundleCurrentPage--;
        }

      }

      // Next
      else if (
        button.dataset.pageAction === "next"
      ) {

        if (
          bundleCurrentPage <
          totalPages
        ) {
          bundleCurrentPage++;
        }

      }

      renderBundleOrders();

    }
  );

}
















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
