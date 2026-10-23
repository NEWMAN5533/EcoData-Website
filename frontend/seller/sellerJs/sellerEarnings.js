/* ==========================================
   ECODATASTORE — SELLER EARNINGS
   Clerk authentication + Neon backend
========================================== */

const API_BASE_URL = "https://ecodata-app.onrender.com";

const CREATOR_SHARE = 0.70;
const PLATFORM_SHARE = 0.30;

let allSales = [];
let dashboardData = {};
let currentPeriod = "7";

/* ==========================================
   CURRENCY + DATE HELPERS
========================================== */

function formatMoney(value) {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function getDate(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = getDate(value);

  if (!date) return "—";

  return date.toLocaleDateString("en-GH", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function getSaleDate(sale) {
  return (
    sale.sold_at ||
    sale.soldAt ||
    sale.created_at ||
    sale.createdAt ||
    sale.paid_at ||
    sale.paidAt ||
    sale.date ||
    null
  );
}

function getSaleStatus(sale) {
  return String(
    sale.sale_status ||
    sale.saleStatus ||
    sale.status ||
    sale.order_status ||
    sale.orderStatus ||
    ""
  ).toLowerCase();
}

function getSaleAmount(sale) {
  return Number(
    sale.gross_amount ??
    sale.grossAmount ??
    sale.line_total ??
    sale.lineTotal ??
    sale.total_amount ??
    sale.totalAmount ??
    sale.sale_amount ??
    sale.saleAmount ??
    sale.amount ??
    0
  );
}

function getCreatorAmount(sale) {
  const existingAmount =
    sale.creatorShare ??
    sale.creator_share ??
    sale.creatorEarnings ??
    sale.creator_earnings ??
    sale.earnings;

  if (existingAmount !== undefined && existingAmount !== null) {
    return Number(existingAmount) || 0;
  }

  return getSaleAmount(sale) * CREATOR_SHARE;
}

function getPlatformFee(sale) {
  const existingFee =
    sale.platformFees ??
    sale.platformFee ??
    sale.platform_fee ??
    sale.platform_fees;

  if (existingFee !== undefined && existingFee !== null) {
    return Number(existingFee) || 0;
  }

  return getSaleAmount(sale) * PLATFORM_SHARE;
}

function isPendingSale(sale) {
  const status = getSaleStatus(sale);

  return [
    "pending",
    "processing",
    "awaiting_payment",
    "awaiting payment",
    "on_hold",
    "on hold"
  ].includes(status);
}

function isCompletedSale(sale) {
  const status = getSaleStatus(sale);

  return [
    "completed",
    "complete",
    "delivered",
    "paid",
    "successful",
    "succeeded"
  ].includes(status);
}

/* ==========================================
   CLERK AUTHENTICATION
========================================== */

async function waitForClerk() {
  for (let i = 0; i < 60; i++) {
    if (window.Clerk) {
      try {
        if (!window.Clerk.loaded) {
          await window.Clerk.load();
        }

        if (window.Clerk.session) {
          return window.Clerk;
        }
      } catch (error) {
        console.error("Clerk initialization error:", error);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 250));
  }

  throw new Error("Authentication is not ready. Please refresh the page.");
}

async function getAuthHeaders() {
  const clerk = await waitForClerk();

  if (!clerk.session) {
    throw new Error("Please sign in to view your earnings.");
  }

  const token = await clerk.session.getToken();

  if (!token) {
    throw new Error("Could not verify your session. Please sign in again.");
  }

  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json"
  };
}

/* ==========================================
   API REQUEST
========================================== */

async function fetchApi(path, headers) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers,
    credentials: "omit"
  });

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const preview = (await response.text()).slice(0, 180);

    throw new Error(
      `Expected JSON from ${path}. HTTP ${response.status}. ${preview}`
    );
  }

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(
      data.message || `Request failed with HTTP ${response.status}`
    );
  }

  return data;
}

/* ==========================================
   SUMMARY CARDS
========================================== */

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) element.textContent = value;
}

function renderSummary() {
  const dashboard = dashboardData.dashboard || {};

  const completedSales = allSales.filter(isCompletedSale);

  const totalEarnings = Number(
    dashboard.totalEarnings ??
    completedSales.reduce((sum, sale) => sum + getCreatorAmount(sale), 0)
  ) || 0;

  const availableBalance = Number(
    dashboard.availableBalance ?? 0
  ) || 0;

  const now = new Date();

  const monthlyEarnings = completedSales
    .filter(sale => {
      const date = getDate(getSaleDate(sale));

      return date &&
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth();
    })
    .reduce((sum, sale) => sum + getCreatorAmount(sale), 0);

  const pendingEarnings = allSales
    .filter(isPendingSale)
    .reduce((sum, sale) => sum + getCreatorAmount(sale), 0);

  setText("availableBalance", formatMoney(availableBalance));
  setText("totalEarnings", formatMoney(totalEarnings));
  setText("monthlyEarnings", formatMoney(monthlyEarnings));
  setText("pendingEarnings", formatMoney(pendingEarnings));
}

/* ==========================================
   EARNINGS TABLE
========================================== */

function createCell(className, text, tag = "small") {
  const element = document.createElement(tag);

  if (className) element.className = className;

  element.textContent = text;

  return element;
}

function getProductName(sale) {
  return (
    sale.product_name ||
    sale.productName ||
    sale.name ||
    sale.title ||
    "Product sale"
  );
}

function getProductType(sale) {
  return (
    sale.product_type ||
    sale.productType ||
    sale.product_subtype ||
    sale.productSubtype ||
    "Digital product"
  );
}

function renderEarningsTable(sales) {
  const tableBody = document.getElementById("earningsTableBody");
  const emptyState = document.getElementById("earningsEmpty");

  if (!tableBody) return;

  // Remove previous rows but preserve the existing empty-state element.
  tableBody.querySelectorAll(".earningsTableRow").forEach(row => row.remove());

  const visibleSales = [...sales].sort((a, b) => {
    const dateA = getDate(getSaleDate(a))?.getTime() || 0;
    const dateB = getDate(getSaleDate(b))?.getTime() || 0;

    return dateB - dateA;
  });

  if (emptyState) {
    emptyState.style.display = visibleSales.length ? "none" : "flex";
  }

  visibleSales.forEach(sale => {
    const row = document.createElement("div");
    row.className = "earningsTableRow";

    const product = document.createElement("div");
    product.className = "earningsProduct";

    product.append(
      createCell("", getProductName(sale), "strong"),
      createCell("", getProductType(sale), "small")
    );

    const saleAmount = getSaleAmount(sale);
    const creatorAmount = getCreatorAmount(sale);
    const platformFee = getPlatformFee(sale);

    const status = getSaleStatus(sale) || "unknown";

    row.append(
      product,
      createCell("", formatMoney(saleAmount)),
      createCell("earningsCreatorAmount", formatMoney(creatorAmount), "strong"),
      createCell("", formatMoney(platformFee)),
      createCell("", formatDate(getSaleDate(sale))),
      createCell(
        `earningsStatus ${status.replace(/[^a-z0-9_-]/g, "")}`,
        status.replace(/_/g, " "),
        "span"
      )
    );

    tableBody.insertBefore(row, emptyState || null);
  });
}

/* ==========================================
   PERIOD FILTER
========================================== */

function getFilteredSales() {
  if (currentPeriod === "all") return [...allSales];

  const days = Number(currentPeriod);

  if (!days) return [...allSales];

  const cutoff = new Date();

  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);

  return allSales.filter(sale => {
    const date = getDate(getSaleDate(sale));

    return date && date >= cutoff;
  });
}

/* ==========================================
   SIMPLE SVG EARNINGS CHART
   No extra chart library required
========================================== */

function renderEarningsChart() {
  const container = document.getElementById("earningsChart");

  if (!container) return;

  const filteredSales = getFilteredSales()
    .filter(isCompletedSale)
    .filter(sale => getDate(getSaleDate(sale)));

  const dailyTotals = new Map();

  filteredSales.forEach(sale => {
    const date = getDate(getSaleDate(sale));
    const key = date.toISOString().slice(0, 10);

    dailyTotals.set(
      key,
      (dailyTotals.get(key) || 0) + getCreatorAmount(sale)
    );
  });

  let points = [...dailyTotals.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]));

  // For shorter periods, include zero-sale days to make the trend readable.
  if (currentPeriod !== "all") {
    const days = Number(currentPeriod) || 7;
    const filledPoints = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      const key = date.getFullYear() + "-" +
        String(date.getMonth() + 1).padStart(2, "0") + "-" +
        String(date.getDate()).padStart(2, "0");

      filledPoints.push([key, dailyTotals.get(key) || 0]);
    }

    points = filledPoints;
  }

  if (!points.length || !points.some(point => point[1] > 0)) {
    container.innerHTML = `
      <div class="earningsEmpty">
        <div class="earningsEmptyIcon">
          <i class="ri-line-chart-line"></i>
        </div>
        <h3>No earnings to chart yet</h3>
        <p>Your completed sales will appear here.</p>
      </div>
    `;

    return;
  }

  const width = 760;
  const height = 260;
  const padding = { top: 20, right: 20, bottom: 42, left: 68 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...points.map(point => point[1]), 1);
  const stepX = points.length > 1 ? chartWidth / (points.length - 1) : 0;

  const coords = points.map((point, index) => ({
    x: padding.left + index * stepX,
    y: padding.top + chartHeight - (point[1] / maxValue) * chartHeight,
    date: point[0],
    value: point[1]
  }));

  const line = coords
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const area = `${line} L ${coords[coords.length - 1].x} ${
    padding.top + chartHeight
  } L ${coords[0].x} ${padding.top + chartHeight} Z`;

  const gridLines = Array.from({ length: 5 }, (_, index) => {
    const y = padding.top + (chartHeight / 4) * index;
    const value = maxValue * (1 - index / 4);

    return `
      <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}"
        y2="${y}" stroke="currentColor" opacity="0.12" />
      <text x="${padding.left - 10}" y="${y + 4}" text-anchor="end"
        fill="currentColor" font-size="11">${value.toFixed(0)}</text>
    `;
  }).join("");

  const labelIndexes = new Set([
    0,
    Math.floor((coords.length - 1) / 2),
    coords.length - 1
  ]);

  const labels = coords.map((point, index) => {
    if (!labelIndexes.has(index)) return "";

    const date = getDate(point.date);

    const label = date
      ? date.toLocaleDateString("en-GH", {
          day: "numeric",
          month: "short"
        })
      : "";

    return `
      <text x="${point.x}" y="${height - 12}" text-anchor="middle"
        fill="currentColor" font-size="11">${label}</text>
    `;
  }).join("");

  const circles = coords.map(point => `
    <circle cx="${point.x}" cy="${point.y}" r="3.5"
      fill="currentColor">
      <title>${point.date}: ${formatMoney(point.value)}</title>
    </circle>
  `).join("");

  container.innerHTML = `
    <div style="width:100%;overflow-x:auto;">
      <svg viewBox="0 0 ${width} ${height}"
        role="img" aria-label="Creator earnings over time"
        style="width:100%;min-width:320px;height:auto;color:inherit;">
        ${gridLines}
        <path d="${area}" fill="currentColor" opacity="0.08"></path>
        <path d="${line}" fill="none" stroke="currentColor"
          stroke-width="2.5" stroke-linejoin="round"
          stroke-linecap="round"></path>
        ${circles}
        ${labels}
      </svg>
    </div>
  `;
}

/* ==========================================
   LOAD DATA FROM BACKEND
========================================== */

async function initializeEarningsPage() {
  try {
    const headers = await getAuthHeaders();

    const [dashboardResponse, salesResponse] = await Promise.all([
      fetchApi("/api/creator/dashboard", headers),
      fetchApi("/api/creator/sales", headers)
    ]);

    dashboardData = dashboardResponse;

    allSales = Array.isArray(salesResponse.sales)
      ? salesResponse.sales
      : [];

    renderSummary();
    renderEarningsTable(getFilteredSales());
    renderEarningsChart();

    console.log("Earnings page loaded:", {
      salesCount: allSales.length,
      dashboard: dashboardData.dashboard
    });

  } catch (error) {
    console.error("Could not load earnings:", error);

    const tableBody = document.getElementById("earningsTableBody");
    const emptyState = document.getElementById("earningsEmpty");

    if (tableBody && emptyState) {
      tableBody.querySelectorAll(".earningsTableRow")
        .forEach(row => row.remove());

      emptyState.style.display = "flex";

      const message = emptyState.querySelector("p");

      if (message) {
        message.textContent =
          error.message || "Unable to load earnings. Please refresh.";
      }
    }
  }
}

/* ==========================================
   FILTER BUTTONS + WITHDRAWAL LINK
========================================== */

function initializeEarningsControls() {
  document.querySelectorAll(".earningsPeriodBtn").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".earningsPeriodBtn")
        .forEach(item => item.classList.remove("active"));

      button.classList.add("active");

      currentPeriod = button.dataset.period || "7";

      renderEarningsTable(getFilteredSales());
      renderEarningsChart();
    });
  });

  const withdrawButton = document.getElementById("earningsWithdrawButton");

  if (withdrawButton) {
    withdrawButton.addEventListener("click", () => {
      window.location.href = "sellerWithdrawalPage.html";
    });
  }
}

/* ==========================================
   START
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  initializeEarningsControls();
  initializeEarningsPage();
});




//=======================
// SIDEBAR TOGGLE
//=======================

const sidebarMenu = document.querySelector(".sidebarPhone");
const sidebarToggler = document.getElementById("menu");

// Add event listener
sidebarToggler.addEventListener("click", function(e) {
  e.stopPropagation();

  if(sidebarToggler){
    sidebarMenu.style.left = "0";
  }

});

// Window click
window.addEventListener("click", function(e){
  if(!sidebarMenu.contains(e.target) && !sidebarToggler.contains(e.target)){
    sidebarMenu.style.left = "-500px";
  }
});



// SNACKBAR SECTION //
// ===== SNACKBAR FUNCTION ===== //
let snackTimeout = null;

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
  if (snackTimeout) clearTimeout(snackTimeout);

  snackTimeout = setTimeout(() => {
    snackbar.classList.remove("show");
  }, duration);
}
// snackbar ends

