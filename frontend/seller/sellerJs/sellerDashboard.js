"use strict";

// ==========================================
// ECODATA SELLER DASHBOARD
// Clerk-authenticated seller API
// ==========================================

const API_BASE = "https://ecodata-app.onrender.com";

const SELLER_PRODUCTS_API =
  `${API_BASE}/api/seller/products`;

const CREATOR_PRODUCTS_API = `${API_BASE}/api/creator/products/${encodeURIComponent}`;
const SELLER_PROFILE_API = `${API_BASE}/api/seller/profile`;

let creatorProducts = [];
let productsLoading = false;

// ==========================================
// SALES CHART STATE
// ==========================================

let creatorSalesChart = null;
let creatorSalesChartData = [];
let creatorSalesMetric = "revenue";
let creatorSalesPeriod = 7;

// ==========================================
// DASHBOARD INITIALIZATION
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {
  renderCreatorSalesChart();

  await Promise.allSettled([
    loadSellerProducts(),
    loadSellerStoreName()
  ]);

  initializeSalesControls();
});

// ==========================================
// API RESPONSE HELPER
// Handles HTML errors and invalid JSON safely
// ==========================================

async function readApiResponse(response) {
  const contentType =
    response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();

    throw new Error(
      response.status === 404
        ? "The requested API route was not found. Check the backend route."
        : `The server returned an unexpected response (${response.status}).`
    );
  }

  return response.json();
}

// ==========================================
// API ERROR MESSAGE
// ==========================================

function getErrorMessage(error, fallback) {
  return error instanceof Error && error.message
    ? error.message
    : fallback;
}

// ==========================================
// FORMAT CURRENCY
// ==========================================

function formatSalesCurrency(value) {
  const amount = Number(value || 0);

  return `GHS ${amount.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

// ==========================================
// FORMAT DATE
// Supports ISO strings and serialized timestamps
// ==========================================

function formatDate(timestamp) {
  if (!timestamp) return "-";

  let date;

  if (typeof timestamp.seconds === "number") {
    date = new Date(timestamp.seconds * 1000);
  } else if (typeof timestamp._seconds === "number") {
    date = new Date(timestamp._seconds * 1000);
  } else {
    date = new Date(timestamp);
  }

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ==========================================
// NORMALIZE PRODUCT DATA
// Supports database snake_case and frontend fields
// ==========================================

function normalizeProduct(product = {}) {
  return {
    ...product,

    id: String(
      product.id ??
      product.productId ??
      product.product_id ??
      ""
    ),

    title:
      product.title ??
      product.name ??
      "Untitled",

    description:
      product.description ?? "",

    category:
      product.category ??
      product.category_name ??
      "",

    type:
      product.digitalType ??
      product.digital_type ??
      product.productFormat ??
      product.product_format ??
      product.type ??
      product.productType ??
      product.product_type ??
      "-",

    price: Number(product.price || 0),

    status: String(
      product.status || "pending"
    ).toLowerCase(),

    imageUrl:
      product.coverUrl ??
      product.imageUrl ??
      product.image_url ??
      "",

    createdAt:
      product.createdAt ??
      product.created_at ??
      null,

    updatedAt:
      product.updatedAt ??
      product.updated_at ??
      null
  };
}

// ==========================================
// PRODUCT TYPE LABEL
// ==========================================

function formatProductType(type) {
  const value = String(type || "-").toLowerCase();

  const types = {
    ebook: "E-Book",
    notes: "Notes",
    video: "Video",
    template: "Template",
    zip: "ZIP",
    affiliate: "Affiliate",
    physical: "Physical",
    digital: "Digital"
  };

  return types[value] || value;
}

// ==========================================
// PRODUCT STATUS LABEL
// ==========================================

function formatStatus(status) {
  const value = String(status || "pending").toLowerCase();

  const statuses = {
    pending: "Pending",
    approved: "Published",
    published: "Published",
    rejected: "Rejected",
    suspended: "Suspended",
    draft: "Draft",
    archived: "Archived"
  };

  return statuses[value] || value;
}

// ==========================================
// LOAD SELLER STORE NAME
// Requires GET /api/seller/profile
// ==========================================

async function loadSellerStoreName() {
  const desktopName = document.getElementById(
    "sellerProfileUsername"
  );

  const mobileName = document.getElementById(
    "sellerProfileUsernameMobile"
  );

  try {
    const response = await fetch(SELLER_PROFILE_API, {
      method: "GET",
      credentials: "include",
      headers: await getClerkAuthHeaders()
    });


   const contentType = response.headers.get("Content-Type") || "";
const responseText = await response.clone().text();

console.log("SELLER PROFILE URL:", response.url);
console.log("SELLER PROFILE STATUS:", response.status);
console.log("SELLER PROFILE CONTENT-TYPE:", contentType);
console.log("SELLER PROFILE BODY:", responseText);

const data = await readApiResponse(response);


    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Unable to load your store profile."
      );
    }

    const storeName =
      data.seller?.storeName ??
      data.seller?.store_name;

    if (!storeName) {
      throw new Error("The API did not return a store name.");
    }

    if (desktopName) {
      desktopName.textContent = storeName;
    }

    if (mobileName) {
      mobileName.textContent = storeName;
    }
  } catch (error) {
    console.error("Load seller store name error:", error);

    // Keep a safe fallback without breaking the dashboard.
    if (desktopName && !desktopName.textContent.trim()) {
      desktopName.textContent = "My Store";
    }

    if (mobileName && !mobileName.textContent.trim()) {
      mobileName.textContent = "My Store";
    }
  }
}


async function getClerkAuthHeaders() {
  const clerk = window.Clerk;

  if (!clerk) {
    throw new Error(
      "Clerk is not loaded on the seller dashboard."
    );
  }

  if (typeof clerk.load === "function") {
    await clerk.load();
  }

  const session = clerk.session;

  if (!session) {
    throw new Error(
      "You must sign in before accessing your seller dashboard."
    );
  }

  const token = await session.getToken();

  if (!token) {
    throw new Error(
      "Unable to retrieve your Clerk session token."
    );
  }

  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`
  };
}


// ==========================================
// LOAD SELLER PRODUCTS
// GET /api/seller/products
// ==========================================

async function loadSellerProducts() {
  const productsBody = document.getElementById(
    "creatorProductsBody"
  );

  const emptyBody = document.getElementById("empty-body");

  if (!productsBody || productsLoading) return;

  productsLoading = true;

  try {
    productsBody.innerHTML = `
      <div class="loading-products">
        <div class="loading-spinner"></div>
        <span>Loading products...</span>
      </div>
    `;

    if (emptyBody) {
      emptyBody.hidden = true;
      emptyBody.textContent = "";
    }

    const response = await fetch(SELLER_PRODUCTS_API, {
      method: "GET",
      headers: await getClerkAuthHeaders(),
      credentials: "include"
    });

    const data = await readApiResponse(response);

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Unable to load your products."
      );
    }

    creatorProducts = Array.isArray(data.products)
      ? data.products.map(normalizeProduct)
      : [];

    updateSellerAnalytics(creatorProducts);

    if (!creatorProducts.length) {
      productsBody.replaceChildren();

      if (emptyBody) {
        emptyBody.hidden = false;
        emptyBody.textContent = "No products submitted yet.";
      }

      return;
    }

    if (emptyBody) {
      emptyBody.hidden = true;
    }

    renderSellerProducts(creatorProducts);
  } catch (error) {
    console.error("Load seller products error:", error);

    creatorProducts = [];
    productsBody.replaceChildren();

    if (emptyBody) {
      emptyBody.hidden = false;
      emptyBody.textContent = getErrorMessage(
        error,
        "Unable to load products."
      );
    }

    showSnackBar(
      getErrorMessage(error, "Unable to load products."),
      "error",
      4000
    );
  } finally {
    productsLoading = false;
  }
}

// ==========================================
// RENDER PRODUCT TABLE
// ==========================================

function renderSellerProducts(products) {
  const productsBody = document.getElementById(
    "creatorProductsBody"
  );

  if (!productsBody) return;

  productsBody.replaceChildren();

  const fragment = document.createDocumentFragment();

  products.forEach(product => {
    const row = document.createElement("div");

    row.className = "live-body-rowT product-row";
    row.dataset.productId = product.id;

    // Product image
    const cover = document.createElement("small");
    const imageUrl = product.imageUrl;

    if (imageUrl) {
      const img = document.createElement("img");

      img.src = imageUrl;
      img.alt = product.title;
      img.className = "product-cover";
      img.loading = "lazy";

      img.onerror = () => {
        const placeholder = document.createElement("span");

        placeholder.className = "no-cover";
        placeholder.textContent = "No image";

        img.replaceWith(placeholder);
      };

      cover.appendChild(img);
    } else {
      const placeholder = document.createElement("div");

      placeholder.className = "no-cover";
      placeholder.innerHTML = '<i class="ri-image-line"></i>';

      cover.appendChild(placeholder);
    }

    // Product title
    const titleCell = document.createElement("small");
    const titleWrapper = document.createElement("div");

    titleWrapper.className = "product-title-wrapper";

    const shortTitle = document.createElement("span");
    shortTitle.className = "product-title-short";

    const fullTitle = document.createElement("div");
    fullTitle.className = "product-title-tooltip";

    const words = product.title.trim().split(/\s+/);

    shortTitle.textContent =
      words.length > 2
        ? `${words.slice(0, 2).join(" ")}...`
        : product.title;

    fullTitle.textContent = product.title;

    titleWrapper.append(shortTitle, fullTitle);
    titleCell.appendChild(titleWrapper);

    // Type
    const typeCell = document.createElement("small");
    typeCell.textContent = formatProductType(product.type);

    // Price
    const priceCell = document.createElement("small");
    priceCell.textContent = formatSalesCurrency(product.price);

    // Status
    const statusCell = document.createElement("small");
    statusCell.textContent = formatStatus(product.status);
    statusCell.className = `status-${product.status}`;

    // Sales are only shown if supplied by a real API field.
    const salesCell = document.createElement("small");

    const hasSalesData =
      product.sales !== undefined &&
      product.sales !== null &&
      Number.isFinite(Number(product.sales));

    salesCell.textContent = hasSalesData
      ? Number(product.sales).toLocaleString()
      : "—";

    // Dates
    const updatedCell = document.createElement("small");
    updatedCell.textContent = formatDate(product.updatedAt);

    const createdCell = document.createElement("small");
    createdCell.textContent = formatDate(product.createdAt);

    // Action menu
    const actionCell = document.createElement("small");
    actionCell.className = "product-action-cell";

    const actionWrapper = document.createElement("div");
    actionWrapper.className = "product-action-wrapper";

    const actionButton = document.createElement("button");

    actionButton.type = "button";
    actionButton.className = "product-action-btn";
    actionButton.dataset.productId = product.id;
    actionButton.setAttribute("aria-label", "Product actions");
    actionButton.setAttribute("aria-expanded", "false");
    actionButton.innerHTML = '<i class="ri-more-2-fill"></i>';

    const menu = document.createElement("div");
    menu.className = "product-action-menu";

    const actions = [
      ["edit", "ri-edit-line", "Edit Product"],
      ["view", "ri-eye-line", "View Product"],
      ["sales", "ri-bar-chart-line", "View Sales"],
      ["duplicate", "ri-file-copy-line", "Duplicate"],
      ["delete", "ri-delete-bin-line", "Delete Product"]
    ];

    actions.forEach(([actionName, iconName, label]) => {
      const menuButton = document.createElement("button");

      menuButton.type = "button";
      menuButton.className =
        `product-menu-item${actionName === "delete" ? " delete-action" : ""}`;

      menuButton.dataset.action = actionName;
      menuButton.innerHTML =
        `<i class="${iconName}"></i><span>${label}</span>`;

      menu.appendChild(menuButton);
    });

    actionWrapper.append(actionButton, menu);
    actionCell.appendChild(actionWrapper);

    row.append(
      cover,
      titleCell,
      typeCell,
      priceCell,
      statusCell,
      salesCell,
      updatedCell,
      createdCell,
      actionCell
    );

    fragment.appendChild(row);
  });

  productsBody.appendChild(fragment);
}

// ==========================================
// PRODUCT ACTIONS
// One delegated listener; no duplicate listeners
// ==========================================

function setupProductActions() {
  // Kept as a compatibility function.
  // Actions are handled by the single delegated listener below.
}

document.addEventListener("click", async event => {
  const actionButton = event.target.closest(
    ".product-action-btn"
  );

  if (actionButton) {
    event.stopPropagation();

    const wrapper = actionButton.closest(
      ".product-action-wrapper"
    );

    if (!wrapper) return;

    document.querySelectorAll(
      ".product-action-wrapper.menu-open"
    ).forEach(other => {
      if (other !== wrapper) {
        other.classList.remove("menu-open");

        other.querySelector(".product-action-btn")
          ?.setAttribute("aria-expanded", "false");
      }
    });

    const isOpen = wrapper.classList.toggle("menu-open");

    actionButton.setAttribute(
      "aria-expanded",
      String(isOpen)
    );

    return;
  }

  const menuItem = event.target.closest(".product-menu-item");

  if (menuItem) {
    event.stopPropagation();

    const wrapper = menuItem.closest(
      ".product-action-wrapper"
    );

    const productId = wrapper
      ?.querySelector(".product-action-btn")
      ?.dataset.productId;

    wrapper?.classList.remove("menu-open");

    wrapper?.querySelector(".product-action-btn")
      ?.setAttribute("aria-expanded", "false");

    if (!productId) return;

    const action = menuItem.dataset.action;

    if (action === "edit") {
      openEditProductModal(productId);
      return;
    }

    if (action === "view") {
      showSnackBar(
        "The product detail page is not connected yet.",
        "info"
      );
      return;
    }

    if (action === "sales") {
      showSnackBar(
        "Sales details will be available when the sales API is connected.",
        "info"
      );
      return;
    }

    if (action === "duplicate") {
      showSnackBar(
        "Product duplication is not connected yet.",
        "info"
      );
      return;
    }

   

    if (action === "delete") {
  const confirmed = await showDeleteConfirmation(productId);

  if (!confirmed) return;

  try {
    // Get the active Clerk session
    const clerk = window.Clerk;
    const session = clerk?.session;

    if (!session) {
      showSnackBar(
        "Please sign in before deleting a product.",
        "warning"
      );
      return;
    }

    const token = await session.getToken();

    if (!token) {
      showSnackBar(
        "Authentication failed. Please sign in again.",
        "error"
      );
      return;
    }

    // Send the authenticated DELETE request
    const response = await fetch(
      `${CREATOR_PRODUCTS_API}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        }
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success) {
      showSnackBar(
        result.message || "Unable to delete this product.",
        "error",
        5000
      );
      return;
    }

    showSnackBar(
      result.message || "Product deleted successfully.",
      "success"
    );

    // Refresh the existing seller product list
    await loadCreatorProducts();

  } catch (error) {
    console.error("Delete product request failed:", error);

    showSnackBar(
      "A network error occurred. Please try again.",
      "error",
      5000
    );
  }

  return;
}




  }

  // Close menus when clicking outside.
  if (!event.target.closest(".product-action-wrapper")) {
    document.querySelectorAll(
      ".product-action-wrapper.menu-open"
    ).forEach(wrapper => {
      wrapper.classList.remove("menu-open");

      wrapper.querySelector(".product-action-btn")
        ?.setAttribute("aria-expanded", "false");
    });
  }
});

// ==========================================
// EDIT PRODUCT MODAL
// UI preserved; saving waits for backend route
// ==========================================

function openEditProductModal(productId) {
  const product = creatorProducts.find(
    item => String(item.id) === String(productId)
  );

  if (!product) {
    showSnackBar(
      "Product information could not be found.",
      "error"
    );
    return;
  }

  document.querySelector(".edit-product-overlay")?.remove();

  const overlay = document.createElement("div");
  overlay.className = "edit-product-overlay";

  const modal = document.createElement("div");
  modal.className = "edit-product-modal";

  modal.innerHTML = `
    <div class="edit-product-header">
      <div>
        <h3>Edit Product</h3>
        <p>Update your product information</p>
      </div>

      <button type="button" class="edit-product-close"
        aria-label="Close edit form">
        <i class="ri-close-line"></i>
      </button>
    </div>

    <form class="edit-product-form" id="editProductForm">
      <div class="edit-product-field">
        <label for="editProductTitle">Product Title</label>
        <input type="text" id="editProductTitle"
          value="${escapeHtml(product.title)}" required>
      </div>

      <div class="edit-product-field">
        <label for="editProductDescription">Description</label>
        <textarea id="editProductDescription"
          required>${escapeHtml(product.description)}</textarea>
      </div>

      <div class="edit-product-grid">
        <div class="edit-product-field">
          <label for="editProductCategory">Category</label>
          <input type="text" id="editProductCategory"
            value="${escapeHtml(product.category)}">
        </div>

        <div class="edit-product-field">
          <label for="editProductPrice">Price (GHS)</label>
          <input type="number" id="editProductPrice"
            min="0" step="0.01"
            value="${product.price.toFixed(2)}" required>
        </div>
      </div>

      <div class="edit-product-field">
        <label for="editProductType">Product Type</label>
        <select id="editProductType">
          <option value="physical">Physical</option>
          <option value="digital">Digital</option>
        </select>
      </div>

      <div class="edit-product-actions">
        <button type="button" class="edit-cancel-btn">Cancel</button>
        <button type="submit" class="edit-save-btn">
          <i class="ri-save-line"></i>
          Save Changes
        </button>
      </div>
    </form>
  `;

  const typeSelect = modal.querySelector("#editProductType");

  typeSelect.value =
    ["physical", "digital"].includes(String(product.type).toLowerCase())
      ? String(product.type).toLowerCase()
      : "digital";

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  function closeModal() {
    overlay.classList.remove("show");

    setTimeout(() => overlay.remove(), 180);
  }

  modal.querySelector(".edit-product-close")
    .addEventListener("click", closeModal);

  modal.querySelector(".edit-cancel-btn")
    .addEventListener("click", closeModal);

  overlay.addEventListener("click", event => {
    if (event.target === overlay) closeModal();
  });

  modal.querySelector("#editProductForm")
    .addEventListener("submit", event => {
      event.preventDefault();

      const title = modal.querySelector(
        "#editProductTitle"
      ).value.trim();

      const description = modal.querySelector(
        "#editProductDescription"
      ).value.trim();

      const category = modal.querySelector(
        "#editProductCategory"
      ).value.trim();

      const price = Number(
        modal.querySelector("#editProductPrice").value
      );

      const type = typeSelect.value;

      if (!title) {
        showSnackBar("Product title is required.", "warning");
        return;
      }

      if (!description) {
        showSnackBar("Product description is required.", "warning");
        return;
      }

      if (!Number.isFinite(price) || price < 0) {
        showSnackBar("Enter a valid price.", "warning");
        return;
      }

      // The backend PUT/PATCH route is not confirmed yet.
      // Do not report success or send data to the old creator endpoint.
      showSnackBar(
        "Editing is ready in the interface, but saving requires an authenticated PUT/PATCH /api/seller/products/:id backend route.",
        "warning",
        6000
      );
    });

  requestAnimationFrame(() => {
    overlay.classList.add("show");
  });
}

// ==========================================
// SELLER ANALYTICS
// Product counts are real; sales/wallet data
// remain unavailable until backed by real APIs.
// ==========================================

function updateSellerAnalytics(products) {
  const totalProducts = products.length;

  const published = products.filter(product =>
    ["approved", "published"].includes(product.status)
  ).length;

  const pending = products.filter(product =>
    product.status === "pending"
  ).length;

  const hasSalesData = products.some(product =>
    product.sales !== undefined &&
    product.sales !== null &&
    Number.isFinite(Number(product.sales))
  );

  const totalSales = hasSalesData
    ? products.reduce(
        (total, product) => total + Number(product.sales || 0),
        0
      )
    : null;

  setText("totalEbooks", totalProducts);
  setText("publishedEbooks", published);
  setText("pendingEbooks", pending);

  setText(
    "totalSales",
    totalSales === null ? "—" : totalSales.toLocaleString()
  );

  // Product rows cannot establish real earnings or wallet balance.
  setText("totalEarnings", "—");
  setText("availableBalance", "—");

  // Sales overview cards also remain unavailable until real sales data exists.
  setText("salesOverviewTotalSales", "—");
  setText("salesOverviewRevenue", "—");
  setText("salesOverviewEarnings", "—");
  setText("salesOverviewBalance", "—");

  console.log("Seller product analytics:", {
    totalProducts,
    published,
    pending,
    salesDataAvailable: hasSalesData
  });
}

// ==========================================
// SET TEXT
// ==========================================

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = String(value ?? "");
  }
}

// ==========================================
// SET MONEY
// ==========================================

function setMoney(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = formatSalesCurrency(value);
  }
}

// ==========================================
// SALES CHART FILTERING
// ==========================================

function getFilteredSalesChartData() {
  if (creatorSalesPeriod === "all") {
    return [...creatorSalesChartData];
  }

  const days = Number(creatorSalesPeriod);

  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (days - 1));

  return creatorSalesChartData.filter(item => {
    const date = new Date(`${item.date}T00:00:00`);

    return !Number.isNaN(date.getTime()) && date >= cutoff;
  });
}

// ==========================================
// RENDER SALES CHART
// Requires ApexCharts CDN
// ==========================================

function renderCreatorSalesChart() {
  const chartElement = document.querySelector(
    "#creatorSalesChart"
  );

  const emptyElement = document.querySelector(
    "#salesChartEmpty"
  );

  if (!chartElement || !emptyElement) return;

  if (typeof ApexCharts === "undefined") {
    chartElement.style.display = "none";
    emptyElement.style.display = "flex";
    emptyElement.textContent =
      "Chart library unavailable. Check the ApexCharts script.";
    return;
  }

  const filteredData = getFilteredSalesChartData();

  if (!filteredData.length) {
    chartElement.style.display = "none";
    emptyElement.style.display = "flex";

    if (creatorSalesChart) {
      creatorSalesChart.destroy();
      creatorSalesChart = null;
    }

    return;
  }

  chartElement.style.display = "block";
  emptyElement.style.display = "none";

  const categories = filteredData.map(item => {
    const date = new Date(`${item.date}T00:00:00`);

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  });

  const values = filteredData.map(item =>
    Number(item[creatorSalesMetric] || 0)
  );

  let chartTitle = "Revenue";
  let chartSubtitle = "Daily revenue";

  let tooltipFormatter = value =>
    formatSalesCurrency(value);

  if (creatorSalesMetric === "sales") {
    chartTitle = "Sales";
    chartSubtitle = "Daily completed sales";

    tooltipFormatter = value =>
      `${Number(value).toLocaleString()} sales`;
  } else if (creatorSalesMetric === "earnings") {
    chartTitle = "Creator Earnings";
    chartSubtitle = "Daily creator earnings";
  }

  setText("salesChartTitle", chartTitle);
  setText("salesChartSubtitle", chartSubtitle);

  const options = {
    chart: {
      type: "bar",
      height: 320,
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 500
      },
      fontFamily: "inherit"
    },

    series: [{
      name: chartTitle,
      data: values
    }],

    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { fontSize: "11px" }
      }
    },

    yaxis: {
      labels: {
        formatter: value => {
          if (creatorSalesMetric === "sales") {
            return Math.round(value);
          }

          return `GHS ${Number(value).toLocaleString("en-GH", {
            maximumFractionDigits: 0
          })}`;
        }
      }
    },

    plotOptions: {
      bar: {
        borderRadius: 7,
        borderRadiusApplication: "end",
        columnWidth: "42%"
      }
    },

    dataLabels: { enabled: false },

    grid: {
      borderColor: "rgba(128,128,128,0.12)",
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } }
    },

    tooltip: {
      theme: document.documentElement.classList.contains("dark")
        ? "dark"
        : "light",
      y: { formatter: tooltipFormatter }
    },

    legend: { show: false },

    responsive: [{
      breakpoint: 600,
      options: {
        chart: { height: 280 },
        plotOptions: {
          bar: { columnWidth: "52%" }
        }
      }
    }]
  };

  if (creatorSalesChart) {
    creatorSalesChart.destroy();
  }

  creatorSalesChart = new ApexCharts(chartElement, options);
  creatorSalesChart.render();
}

// ==========================================
// SET SALES CHART DATA
// Call this when the real analytics API exists.
// Expected: [{ date: "2026-10-20", sales: 2,
//              revenue: 100, earnings: 70 }]
// ==========================================

function setCreatorSalesChartData(chartData) {
  creatorSalesChartData = Array.isArray(chartData)
    ? chartData.filter(item =>
        item &&
        typeof item.date === "string" &&
        !Number.isNaN(new Date(`${item.date}T00:00:00`).getTime())
      )
    : [];

  renderCreatorSalesChart();
}

// ==========================================
// SALES FILTER CONTROLS
// ==========================================

function initializeSalesControls() {
  document.querySelectorAll(".salesPeriodBtn").forEach(button => {
    button.classList.toggle(
      "active",
      String(button.dataset.period) === String(creatorSalesPeriod)
    );
  });

  document.querySelectorAll(".salesMetricBtn").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.metric === creatorSalesMetric
    );
  });
}

document.addEventListener("click", event => {
  const periodButton = event.target.closest(".salesPeriodBtn");

  if (periodButton) {
    document.querySelectorAll(".salesPeriodBtn").forEach(button => {
      button.classList.toggle("active", button === periodButton);
    });

    const period = periodButton.dataset.period;

    creatorSalesPeriod =
      period === "all" ? "all" : Number(period);

    renderCreatorSalesChart();
    return;
  }

  const metricButton = event.target.closest(".salesMetricBtn");

  if (metricButton) {
    const metric = metricButton.dataset.metric;

    if (!["sales", "revenue", "earnings"].includes(metric)) {
      return;
    }

    document.querySelectorAll(".salesMetricBtn").forEach(button => {
      button.classList.toggle("active", button === metricButton);
    });

    creatorSalesMetric = metric;
    renderCreatorSalesChart();
  }
});

// ==========================================
// DELETE CONFIRMATION
// ==========================================

function showDeleteConfirmation(productId) {
  return new Promise(resolve => {
    document.querySelector(".delete-confirmation")?.remove();

    const confirmation = document.createElement("div");
    confirmation.className = "delete-confirmation";

    confirmation.innerHTML = `
      <div class="delete-confirmation-content">
        <div class="delete-confirmation-icon">
          <i class="ri-delete-bin-line"></i>
        </div>

        <div class="delete-confirmation-text">
          <strong>Delete product?</strong>
          <span>This action cannot be undone.</span>
        </div>

        <div class="delete-confirmation-actions">
          <button type="button" class="delete-cancel-btn">
            Cancel
          </button>

          <button type="button" class="delete-confirm-btn">
            Delete
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(confirmation);

    requestAnimationFrame(() => {
      confirmation.classList.add("show");
    });

    let resolved = false;

    const close = value => {
      if (resolved) return;

      resolved = true;
      confirmation.classList.remove("show");

      setTimeout(() => {
        confirmation.remove();
        resolve(value);
      }, 200);
    };

    confirmation.querySelector(".delete-cancel-btn")
      .addEventListener("click", () => close(false));

    confirmation.querySelector(".delete-confirm-btn")
      .addEventListener("click", () => close(true));

    confirmation.addEventListener("click", event => {
      if (event.target === confirmation) {
        close(false);
      }
    });
  });
}

// ==========================================
// SNACKBAR FALLBACK
// Uses your existing showSnackBar if available.
// ==========================================


  
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
