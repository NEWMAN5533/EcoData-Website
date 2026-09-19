// ======================================================
// ECODATA ADMIN — PRODUCTS MANAGEMENT
// ======================================================


// ======================================================
// DEMO PRODUCT DATA
// ======================================================

let products = [

  {
    id: "PRD-10001",
    name: "BECE Mathematics Notes",
    seller: "Study Vault",
    sellerId: "SEL-10003",

    category: "Education",
    type: "digital",

    price: 25,
    unitsSold: 84,
    sales: 2100,

    status: "published",

    image: "",
    added: "2026-09-15"
  },


  {
    id: "PRD-10002",
    name: "Modern CV Template Pack",
    seller: "CreativeHub",
    sellerId: "SEL-10001",

    category: "Templates",
    type: "digital",

    price: 35,
    unitsSold: 42,
    sales: 1470,

    status: "published",

    image: "",
    added: "2026-09-13"
  },


  {
    id: "PRD-10003",
    name: "HTML & CSS Beginner Guide",
    seller: "Tech Resources",
    sellerId: "SEL-10007",

    category: "Education",
    type: "digital",

    price: 40,
    unitsSold: 31,
    sales: 1240,

    status: "pending",

    image: "",
    added: "2026-09-17"
  },


  {
    id: "PRD-10004",
    name: "Premium Black Hoodie",
    seller: "Creative Prints",
    sellerId: "SEL-10008",

    category: "Fashion",
    type: "physical",

    price: 180,
    unitsSold: 16,
    sales: 2880,

    status: "rejected",

    image: "",
    added: "2026-09-10"
  },


  {
    id: "PRD-10005",
    name: "Student Planner 2026",
    seller: "Learn More GH",
    sellerId: "SEL-10005",

    category: "Education",
    type: "digital",

    price: 20,
    unitsSold: 76,
    sales: 1520,

    status: "published",

    image: "",
    added: "2026-09-09"
  },


  {
    id: "PRD-10006",
    name: "Business Flyer Design",
    seller: "Design Corner",
    sellerId: "SEL-10004",

    category: "Design",
    type: "service",

    price: 75,
    unitsSold: 29,
    sales: 2175,

    status: "hidden",

    image: "",
    added: "2026-09-05"
  },


  {
    id: "PRD-10007",
    name: "JavaScript Project Templates",
    seller: "Tech Resources",
    sellerId: "SEL-10007",

    category: "Templates",
    type: "digital",

    price: 50,
    unitsSold: 21,
    sales: 1050,

    status: "published",

    image: "",
    added: "2026-09-03"
  },


  {
    id: "PRD-10008",
    name: "Social Media Design Pack",
    seller: "CreativeHub",
    sellerId: "SEL-10001",

    category: "Design",
    type: "digital",

    price: 60,
    unitsSold: 38,
    sales: 2280,

    status: "pending",

    image: "",
    added: "2026-09-16"
  },


  {
    id: "PRD-10009",
    name: "A4 Premium Notebook",
    seller: "Creative Prints",
    sellerId: "SEL-10008",

    category: "Stationery",
    type: "physical",

    price: 45,
    unitsSold: 33,
    sales: 1485,

    status: "published",

    image: "",
    added: "2026-08-29"
  }

];


// ======================================================
// STATE
// ======================================================

let filteredProducts = [...products];

let currentPage = 1;

const PRODUCTS_PER_PAGE = 5;

let selectedProduct = null;


// ======================================================
// ELEMENTS
// ======================================================

const productTableBody =
  document.getElementById(
    "productTableBody"
  );

const productEmpty =
  document.getElementById(
    "productEmpty"
  );

const productPagination =
  document.getElementById(
    "productPagination"
  );

const productSearch =
  document.getElementById(
    "productSearch"
  );

const statusFilter =
  document.getElementById(
    "statusFilter"
  );

const typeFilter =
  document.getElementById(
    "typeFilter"
  );

const categoryFilter =
  document.getElementById(
    "categoryFilter"
  );

const sortFilter =
  document.getElementById(
    "sortFilter"
  );

const productResultCount =
  document.getElementById(
    "productResultCount"
  );

const clearProductFilters =
  document.getElementById(
    "clearProductFilters"
  );

const refreshProducts =
  document.getElementById(
    "refreshProducts"
  );


// Stats

const totalProducts =
  document.getElementById(
    "totalProducts"
  );

const pendingProducts =
  document.getElementById(
    "pendingProducts"
  );

const publishedProducts =
  document.getElementById(
    "publishedProducts"
  );

const totalProductSales =
  document.getElementById(
    "totalProductSales"
  );


// Drawer

const productDrawer =
  document.getElementById(
    "productDrawer"
  );

const productDrawerOverlay =
  document.getElementById(
    "productDrawerOverlay"
  );

const closeProductDrawer =
  document.getElementById(
    "closeProductDrawer"
  );

const drawerProductName =
  document.getElementById(
    "drawerProductName"
  );

const drawerProductTitle =
  document.getElementById(
    "drawerProductTitle"
  );

const drawerProductId =
  document.getElementById(
    "drawerProductId"
  );

const drawerProductImage =
  document.getElementById(
    "drawerProductImage"
  );

const drawerProductStatus =
  document.getElementById(
    "drawerProductStatus"
  );

const drawerCategory =
  document.getElementById(
    "drawerCategory"
  );

const drawerType =
  document.getElementById(
    "drawerType"
  );

const drawerPrice =
  document.getElementById(
    "drawerPrice"
  );

const drawerAdded =
  document.getElementById(
    "drawerAdded"
  );

const drawerSeller =
  document.getElementById(
    "drawerSeller"
  );

const drawerSellerId =
  document.getElementById(
    "drawerSellerId"
  );

const drawerUnitsSold =
  document.getElementById(
    "drawerUnitsSold"
  );

const drawerTotalSales =
  document.getElementById(
    "drawerTotalSales"
  );

const productPrimaryAction =
  document.getElementById(
    "productPrimaryAction"
  );

const viewProductSeller =
  document.getElementById(
    "viewProductSeller"
  );

const viewProductOrders =
  document.getElementById(
    "viewProductOrders"
  );

const openProduct =
  document.getElementById(
    "openProduct"
  );


// ======================================================
// INITIALIZE
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    populateCategories();

    updateStats();

    applyProductFilters();

  }
);


// ======================================================
// POPULATE CATEGORIES
// ======================================================

function populateCategories() {

  const categories =
    [
      ...new Set(
        products.map(
          product =>
            product.category
        )
      )
    ].sort();


  categories.forEach(category => {

    const option =
      document.createElement(
        "option"
      );

    option.value = category;

    option.textContent = category;

    categoryFilter.appendChild(
      option
    );

  });

}


// ======================================================
// FILTERING
// ======================================================

function applyProductFilters() {

  const search =
    productSearch.value
      .trim()
      .toLowerCase();


  const status =
    statusFilter.value;


  const type =
    typeFilter.value;


  const category =
    categoryFilter.value;


  const sort =
    sortFilter.value;


  filteredProducts =
    products.filter(product => {

      const matchesSearch =
        !search ||

        product.name
          .toLowerCase()
          .includes(search) ||

        product.seller
          .toLowerCase()
          .includes(search) ||

        product.category
          .toLowerCase()
          .includes(search) ||

        product.id
          .toLowerCase()
          .includes(search);


      const matchesStatus =
        status === "all" ||
        product.status === status;


      const matchesType =
        type === "all" ||
        product.type === type;


      const matchesCategory =
        category === "all" ||
        product.category === category;


      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesCategory
      );

    });


  sortProducts(sort);

  currentPage = 1;

  renderProducts();

}


// ======================================================
// SORT
// ======================================================

function sortProducts(sort) {

  filteredProducts.sort(
    (a, b) => {

      switch (sort) {

        case "oldest":

          return new Date(a.added)
            - new Date(b.added);


        case "sales":

          return b.sales - a.sales;


        case "priceHigh":

          return b.price - a.price;


        case "priceLow":

          return a.price - b.price;


        case "name":

          return a.name.localeCompare(
            b.name
          );


        case "newest":
        default:

          return new Date(b.added)
            - new Date(a.added);

      }

    }
  );

}


// ======================================================
// RENDER PRODUCTS
// ======================================================

function renderProducts() {

  productTableBody.innerHTML = "";


  const total =
    filteredProducts.length;


  productResultCount.textContent =
    `${total} product${total === 1 ? "" : "s"}`;


  if (!total) {

    productEmpty.hidden = false;

    productPagination.innerHTML = "";

    return;

  }


  productEmpty.hidden = true;


  const start =
    (currentPage - 1) *
    PRODUCTS_PER_PAGE;


  const end =
    start + PRODUCTS_PER_PAGE;


  const pageProducts =
    filteredProducts.slice(
      start,
      end
    );


  pageProducts.forEach(product => {

    productTableBody.appendChild(
      createProductRow(product)
    );

  });




}


// ======================================================
// PRODUCT ROW
// ======================================================

function createProductRow(product) {

  const tr =
    document.createElement("tr");


  const image =
    product.image
      ? `
        <img
          src="${escapeAttribute(product.image)}"
          alt="${escapeAttribute(product.name)}"
        >
      `
      : `
        <i class="ri-image-line"></i>
      `;


  tr.innerHTML = `

    <td>

      <div class="management-product">

        <div class="management-product-image">
          ${image}
        </div>

        <div class="management-product-info">

          <strong>
            ${escapeHTML(product.name)}
          </strong>

          <span>
            ${escapeHTML(product.id)}
          </span>

        </div>

      </div>

    </td>


    <td>
      ${escapeHTML(product.seller)}
    </td>


    <td>

      <span class="management-product-type">

        ${getTypeIcon(product.type)}

        ${capitalize(product.type)}

      </span>

    </td>


    <td>
      ${formatMoney(product.price)}
    </td>


    <td>
      ${product.unitsSold}
    </td>


    <td>
      ${createStatusBadge(product.status)}
    </td>


    <td>
      ${formatDate(product.added)}
    </td>


    <td>


      <div class="management-action">

  <button
    type="button"
    class="management-action-button"
    data-action="open"
    data-id="${product.id}"
    title="Manage product"
  >
    <i class="ri-more-2-fill"></i>
  </button>

  <div class="management-action-menu">

    <button
      type="button"
      data-action="view"
      data-id="${product.id}"
    >
      <i class="ri-eye-line"></i>
      View details
    </button>

    ${
      product.status === "pending"
      ? `
        <button
          type="button"
          data-action="approve"
          data-id="${product.id}"
        >
          <i class="ri-check-line"></i>
          Approve
        </button>

        <button
          type="button"
          data-action="reject"
          data-id="${product.id}"
        >
          <i class="ri-close-line"></i>
          Reject
        </button>
      `
      : ""
    }

    ${
      product.status === "published"
      ? `
        <button
          type="button"
          data-action="hide"
          data-id="${product.id}"
        >
          <i class="ri-eye-off-line"></i>
          Hide product
        </button>
      `
      : ""
    }

    ${
      product.status === "hidden"
      ? `
        <button
          type="button"
          data-action="publish"
          data-id="${product.id}"
        >
          <i class="ri-eye-line"></i>
          Publish
        </button>
      `
      : ""
    }

  </div>

</div>

    </td>

  `;


  return tr;

}


// ======================================================
// ACTION MENU
// ======================================================

productTableBody.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        "[data-action]"
      );


    if (!button) return;


    const action =
      button.dataset.action;


    const productId =
      button.dataset.id;


    const product =
      products.find(
        item =>
          item.id === productId
      );


    if (!product) return;


    if (action === "open") {

      const container =
        button.closest(
          ".management-action"
        );


      document
        .querySelectorAll(
          ".management-action.is-open"
        )
        .forEach(menu => {

          if (menu !== container) {

            menu.classList.remove(
              "is-open"
            );

          }

        });


      container.classList.toggle(
        "is-open"
      );

      return;

    }


    if (action === "view") {

      openProductDrawer(product);

      return;

    }


    if (action === "approve") {

      approveProduct(product);

      return;

    }


    if (action === "reject") {

      rejectProduct(product);

      return;

    }


    if (action === "hide") {

      hideProduct(product);

      return;

    }


    if (action === "publish") {

      publishProduct(product);

    }

  }
);


// ======================================================
// APPROVE
// ======================================================

function approveProduct(product) {

  const confirmed =
    confirm(
      `Approve "${product.name}"?`
    );


  if (!confirmed) return;


  product.status =
    "published";


  updateStats();

  applyProductFilters();


  if (
    selectedProduct?.id ===
    product.id
  ) {

    openProductDrawer(product);

  }

}


// ======================================================
// REJECT
// ======================================================

function rejectProduct(product) {

  const confirmed =
    confirm(
      `Reject "${product.name}"?`
    );


  if (!confirmed) return;


  product.status =
    "rejected";


  updateStats();

  applyProductFilters();


  if (
    selectedProduct?.id ===
    product.id
  ) {

    openProductDrawer(product);

  }

}


// ======================================================
// HIDE
// ======================================================

function hideProduct(product) {

  const confirmed =
    confirm(
      `Hide "${product.name}" from the store?`
    );


  if (!confirmed) return;


  product.status =
    "hidden";


  updateStats();

  applyProductFilters();


  if (
    selectedProduct?.id ===
    product.id
  ) {

    openProductDrawer(product);

  }

}


// ======================================================
// PUBLISH
// ======================================================

function publishProduct(product) {

  const confirmed =
    confirm(
      `Publish "${product.name}"?`
    );


  if (!confirmed) return;


  product.status =
    "published";


  updateStats();

  applyProductFilters();


  if (
    selectedProduct?.id ===
    product.id
  ) {

    openProductDrawer(product);

  }

}


// ======================================================
// PRODUCT DRAWER
// ======================================================

function openProductDrawer(product) {

  selectedProduct =
    product;


  drawerProductName.textContent =
    product.name;


  drawerProductTitle.textContent =
    product.name;


  drawerProductId.textContent =
    product.id;


  drawerProductStatus.innerHTML =
    createStatusBadge(
      product.status
    );


  drawerCategory.textContent =
    product.category;


  drawerType.textContent =
    capitalize(
      product.type
    );


  drawerPrice.textContent =
    formatMoney(
      product.price
    );


  drawerAdded.textContent =
    formatDate(
      product.added
    );


  drawerSeller.textContent =
    product.seller;


  drawerSellerId.textContent =
    product.sellerId;


  drawerUnitsSold.textContent =
    product.unitsSold;


  drawerTotalSales.textContent =
    formatMoney(
      product.sales
    );


  if (product.image) {

    drawerProductImage.innerHTML = `
      <img
        src="${escapeAttribute(product.image)}"
        alt="${escapeAttribute(product.name)}"
      >
    `;

  } else {

    drawerProductImage.innerHTML =
      `<i class="ri-image-line"></i>`;

  }


  updateDrawerAction();


  productDrawerOverlay.hidden =
    false;


  requestAnimationFrame(
    () => {

      productDrawerOverlay.classList.add(
        "is-visible"
      );

      productDrawer.classList.add(
        "is-open"
      );

      productDrawer.setAttribute(
        "aria-hidden",
        "false"
      );

    }
  );

}


// ======================================================
// CLOSE DRAWER
// ======================================================

function closeProductDetails() {

  productDrawer.classList.remove(
    "is-open"
  );


  productDrawerOverlay.classList.remove(
    "is-visible"
  );


  productDrawer.setAttribute(
    "aria-hidden",
    "true"
  );


  setTimeout(
    () => {

      productDrawerOverlay.hidden =
        true;

    },
    250
  );


  selectedProduct =
    null;

}


closeProductDrawer.addEventListener(
  "click",
  closeProductDetails
);


productDrawerOverlay.addEventListener(
  "click",
  closeProductDetails
);


// ======================================================
// DRAWER PRIMARY ACTION
// ======================================================

function updateDrawerAction() {

  if (!selectedProduct) return;


  const status =
    selectedProduct.status;


  productPrimaryAction.className =
    "admin-danger-button";


  if (status === "pending") {

    productPrimaryAction.className =
      "admin-secondary-button";


    productPrimaryAction.innerHTML = `
      <i class="ri-check-line"></i>
      <span>Approve Product</span>
    `;


    return;

  }


  if (status === "published") {

    productPrimaryAction.innerHTML = `
      <i class="ri-eye-off-line"></i>
      <span>Hide Product</span>
    `;


    return;

  }


  if (status === "hidden") {

    productPrimaryAction.className =
      "admin-secondary-button";


    productPrimaryAction.innerHTML = `
      <i class="ri-eye-line"></i>
      <span>Publish Product</span>
    `;


    return;

  }


  if (status === "rejected") {

    productPrimaryAction.className =
      "admin-secondary-button";


    productPrimaryAction.innerHTML = `
      <i class="ri-check-line"></i>
      <span>Approve Product</span>
    `;

  }

}


productPrimaryAction.addEventListener(
  "click",
  () => {

    if (!selectedProduct) return;


    switch (
      selectedProduct.status
    ) {

      case "pending":

      case "rejected":

        approveProduct(
          selectedProduct
        );

        break;


      case "published":

        hideProduct(
          selectedProduct
        );

        break;


      case "hidden":

        publishProduct(
          selectedProduct
        );

        break;

    }

  }
);


// ======================================================
// RELATED ACTIONS
// ======================================================

viewProductSeller.addEventListener(
  "click",
  () => {

    if (!selectedProduct) return;


    window.location.href =
      `sellers.html?seller=${encodeURIComponent(
        selectedProduct.sellerId
      )}`;

  }
);


viewProductOrders.addEventListener(
  "click",
  () => {

    if (!selectedProduct) return;


    window.location.href =
      `orders.html?product=${encodeURIComponent(
        selectedProduct.id
      )}`;

  }
);


openProduct.addEventListener(
  "click",
  () => {

    if (!selectedProduct) return;


    /*
      Replace this later with your
      actual marketplace product URL.
    */

    window.open(
      `../product.html?id=${encodeURIComponent(
        selectedProduct.id
      )}`,
      "_blank"
    );

  }
);


// ======================================================
// PAGINATION
// ======================================================
const container = 
document.getElementById("paginationButtons");

const infoElement = 
document.getElementById("paginationInfo");


renderPagination({
container: paginationButtons,
infoElement: paginationInfo,
totalItems: filteredProducts.length,

currentPage,

itemsPerPage: PRODUCTS_PER_PAGE,

onPageChange: (page) => {
  currentPage = page;

  renderProducts();
}
});


// ======================================================
// EVENTS
// ======================================================

productSearch.addEventListener(
  "input",
  applyProductFilters
);


statusFilter.addEventListener(
  "change",
  applyProductFilters
);


typeFilter.addEventListener(
  "change",
  applyProductFilters
);


categoryFilter.addEventListener(
  "change",
  applyProductFilters
);


sortFilter.addEventListener(
  "change",
  applyProductFilters
);


clearProductFilters.addEventListener(
  "click",
  () => {

    productSearch.value =
      "";

    statusFilter.value =
      "all";

    typeFilter.value =
      "all";

    categoryFilter.value =
      "all";

    sortFilter.value =
      "newest";


    applyProductFilters();

  }
);


// ======================================================
// REFRESH
// ======================================================

refreshProducts.addEventListener(
  "click",
  () => {

    refreshProducts.disabled =
      true;


    const icon =
      refreshProducts.querySelector(
        "i"
      );


    const text =
      refreshProducts.querySelector(
        "span"
      );


    icon.classList.add(
      "admin-spin"
    );


    if (text) {

      text.textContent =
        "Refreshing...";

    }


    setTimeout(
      () => {

        updateStats();

        applyProductFilters();


        icon.classList.remove(
          "admin-spin"
        );


        if (text) {

          text.textContent =
            "Refresh";

        }


        refreshProducts.disabled =
          false;

      },
      500
    );

  }
);


// ======================================================
// STATISTICS
// ======================================================

function updateStats() {

  const total =
    products.length;


  const pending =
    products.filter(
      product =>
        product.status ===
        "pending"
    ).length;


  const published =
    products.filter(
      product =>
        product.status ===
        "published"
    ).length;


  const sales =
    products.reduce(
      (sum, product) =>
        sum +
        Number(
          product.sales || 0
        ),
      0
    );


  totalProducts.textContent =
    total;


  pendingProducts.textContent =
    pending;


  publishedProducts.textContent =
    published;


  totalProductSales.textContent =
    formatMoney(sales);

}


// ======================================================
// TYPE ICON
// ======================================================

function getTypeIcon(type) {

  switch (type) {

    case "digital":
      return `<i class="ri-file-download-line"></i>`;

    case "physical":
      return `<i class="ri-t-shirt-line"></i>`;

    case "service":
      return `<i class="ri-customer-service-2-line"></i>`;

    default:
      return `<i class="ri-product-hunt-line"></i>`;

  }

}


// ======================================================
// STATUS
// ======================================================

function createStatusBadge(status) {

  return `
    <span
      class="management-status status-${status}"
    >
      <span></span>
      ${capitalize(status)}
    </span>
  `;

}


// ======================================================
// MONEY
// ======================================================

function formatMoney(amount) {

  return `GH₵${Number(
    amount || 0
  ).toLocaleString(
    "en-GH",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  )}`;

}


// ======================================================
// DATE
// ======================================================

function formatDate(date) {

  if (!date)
    return "—";


  const parsed =
    new Date(date);


  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {

    return "—";

  }


  return parsed.toLocaleDateString(
    "en-GH",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );

}


// ======================================================
// CAPITALIZE
// ======================================================

function capitalize(value) {

  return value
    .charAt(0)
    .toUpperCase() +
    value.slice(1);

}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHTML(value) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


function escapeAttribute(value) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    );

}


// ======================================================
// CLOSE MENUS
// ======================================================

document.addEventListener(
  "click",
  event => {

    if (
      !event.target.closest(
        ".management-action"
      )
    ) {

      document
        .querySelectorAll(
          ".management-action.is-open"
        )
        .forEach(menu => {

          menu.classList.remove(
            "is-open"
          );

        });

    }

  }
);


// ======================================================
// ESCAPE
// ======================================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Escape"
    ) {

      closeProductDetails();

    }

  }
);