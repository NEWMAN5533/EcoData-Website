//====================================
// CREATOR CONFIG
//====================================


 const API_BASE =
  "https://ecodata-app.onrender.com";

 const CREATOR_PRODUCTS_API =
  `${API_BASE}/api/creator/products`;



  async function loadCreatorProducts() {
  const grid = document.getElementById("sellerProductGrid");
  const emptyState = document.getElementById("sellerProductsEmpty");

  if (!grid) return;

  try {
    const clerk = window.Clerk;

    if (!clerk) {
      throw new Error("Clerk has not loaded yet. Please refresh.");
    }

    if (typeof clerk.load === "function") {
      await clerk.load();
    }

    const session = clerk.session;

    if (!session) {
      throw new Error("Please sign in to view your products.");
    }

    const token = await session.getToken();

    if (!token) {
      throw new Error("Unable to obtain your authentication token.");
    }

    const response = await fetch(CREATOR_PRODUCTS_API, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    });

    const result = await response.json();

    if (!response.ok || result.success !== true) {
      throw new Error(
        result.message || "Unable to load your products."
      );
    }

    const products = Array.isArray(result.products)
      ? result.products
      : [];

    renderCreatorProducts(products);

    console.log("Creator products loaded:", products.length);

  } catch (error) {
    console.error("Failed to load creator products:", error);

    if (emptyState) {
      emptyState.style.display = "block";

      const heading = emptyState.querySelector("h3");
      const message = emptyState.querySelector("p");

      if (heading) heading.textContent = "Unable to load products";
      if (message) {
        message.textContent =
          error.message || "Please try again later.";
      }
    }

    showSnackBar(
      error.message || "Unable to load products.",
      "error"
    );
  }
}

function renderCreatorProducts(products) {
  const grid = document.getElementById("sellerProductGrid");
  const emptyState = document.getElementById("sellerProductsEmpty");

  if (!grid) return;

  // Remove old cards without removing the empty-state element.
  grid.querySelectorAll(".sellerProductCard").forEach(card => {
    card.remove();
  });

  if (emptyState) {
    emptyState.style.display = products.length === 0 ? "block" : "none";
  }

  const publishedCount = products.filter(product =>
    ["approved", "published"].includes(
      String(product.status || "").toLowerCase()
    )
  ).length;

  const pendingCount = products.filter(product =>
    String(product.status || "").toLowerCase() === "pending"
  ).length;

  setProductStat("productsTotal", products.length);
  setProductStat("productsPublished", publishedCount);
  setProductStat("productsPending", pendingCount);

  // Views are not yet supplied by the current API.
  setProductStat("productsViews", "—");

  products.forEach(product => {
    const card = document.createElement("article");
    card.className = "sellerProductCard";
    card.dataset.status = normalizeCreatorStatus(product.status);
    card.dataset.name = String(product.name || "").toLowerCase();

    const cover = document.createElement("div");
    cover.className = "sellerProductCover";

    const image = document.createElement("img");
    image.src = product.image_url || "";
    image.alt = `${product.name || "Product"} cover`;
    image.loading = "lazy";

    const status = document.createElement("span");
    status.className = "sellerProductStatus";
    status.textContent = product.status || "pending";

    cover.append(image, status);

    const body = document.createElement("div");
    body.className = "sellerProductCardBody";

    const type = document.createElement("div");
    type.className = "sellerProductType";
    type.textContent = formatCreatorProductType(
      product.product_subtype || product.product_type
    );

    const title = document.createElement("h3");
    title.textContent = product.name || "Untitled product";

    const description = document.createElement("p");
    description.textContent =
      product.description || "No description provided.";

    const meta = document.createElement("div");
    meta.className = "sellerProductMeta";

    const category = document.createElement("span");
    category.textContent = product.category_name || "Uncategorized";

    const date = document.createElement("span");
    date.textContent = product.created_at
      ? new Date(product.created_at).toLocaleDateString()
      : "Date unavailable";

    meta.append(category, date);

    const bottom = document.createElement("div");
    bottom.className = "sellerProductCardBottom";

    const price = document.createElement("strong");
    price.textContent =
      `GHS ${Number(product.price || 0).toFixed(2)}`;

    bottom.appendChild(price);
    body.append(type, title, description, meta, bottom);
    card.append(cover, body);

    grid.insertBefore(card, emptyState || null);
  });
}


document.addEventListener("DOMContentLoaded", () => {
  loadCreatorProducts();
});

function setProductStat(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function normalizeCreatorStatus(status) {
  const value = String(status || "").toLowerCase();

  if (value === "approved" || value === "published") {
    return "published";
  }

  if (value === "rejected") return "rejected";

  return value || "pending";
}

function formatCreatorProductType(type) {
  return String(type || "product")
    .replaceAll("_", " ")
    .replace(/\b\w/g, character => character.toUpperCase());
}














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

