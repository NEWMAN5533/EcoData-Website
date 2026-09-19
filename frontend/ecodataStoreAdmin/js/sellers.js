// ======================================================
// ECOData ADMIN — SELLERS MANAGEMENT
// ======================================================


// ======================================================
// DEMO DATA
// ======================================================

let sellers = [

  {
    id: "SEL-10001",
    name: "CreativeHub",
    owner: "Fatima Mohammed",
    email: "creativehub@example.com",
    phone: "055 321 7788",

    status: "active",

    products: 18,
    orders: 86,
    sales: 8420,
    earnings: 5894,

    joined: "2026-08-10",
    applicationDate: "2026-08-08"
  },


  {
    id: "SEL-10002",
    name: "Digital Nest",
    owner: "Abdul Karim",
    email: "digitalnest@example.com",
    phone: "024 765 1122",

    status: "pending",

    products: 0,
    orders: 0,
    sales: 0,
    earnings: 0,

    joined: null,
    applicationDate: "2026-09-17"
  },


  {
    id: "SEL-10003",
    name: "Study Vault",
    owner: "Mary Asante",
    email: "studyvault@example.com",
    phone: "020 443 9812",

    status: "active",

    products: 31,
    orders: 142,
    sales: 12680,
    earnings: 8876,

    joined: "2026-07-19",
    applicationDate: "2026-07-17"
  },


  {
    id: "SEL-10004",
    name: "Design Corner",
    owner: "Ibrahim Salifu",
    email: "designcorner@example.com",
    phone: "050 982 3344",

    status: "suspended",

    products: 12,
    orders: 41,
    sales: 3650,
    earnings: 2555,

    joined: "2026-06-21",
    applicationDate: "2026-06-19"
  },


  {
    id: "SEL-10005",
    name: "Learn More GH",
    owner: "Hawa Osman",
    email: "learnmore@example.com",
    phone: "027 881 5522",

    status: "active",

    products: 24,
    orders: 108,
    sales: 9340,
    earnings: 6538,

    joined: "2026-08-02",
    applicationDate: "2026-07-30"
  },


  {
    id: "SEL-10006",
    name: "Template House",
    owner: "Samuel Mensah",
    email: "templatehouse@example.com",
    phone: "054 612 3341",

    status: "pending",

    products: 4,
    orders: 0,
    sales: 0,
    earnings: 0,

    joined: null,
    applicationDate: "2026-09-15"
  },


  {
    id: "SEL-10007",
    name: "Tech Resources",
    owner: "Mubarak Fuseini",
    email: "techresources@example.com",
    phone: "026 778 4321",

    status: "active",

    products: 15,
    orders: 67,
    sales: 7280,
    earnings: 5096,

    joined: "2026-07-02",
    applicationDate: "2026-06-30"
  },


  {
    id: "SEL-10008",
    name: "Creative Prints",
    owner: "Aisha Yakubu",
    email: "creativeprints@example.com",
    phone: "059 228 7711",

    status: "rejected",

    products: 0,
    orders: 0,
    sales: 0,
    earnings: 0,

    joined: null,
    applicationDate: "2026-08-28"
  }

];


// ======================================================
// STATE
// ======================================================

let filteredSellers = [...sellers];

let currentPage = 1;

const SELLERS_PER_PAGE = 5;

let selectedSeller = null;


// ======================================================
// ELEMENTS
// ======================================================

const sellerTableBody =
  document.getElementById("sellerTableBody");

const sellerEmpty =
  document.getElementById("sellerEmpty");

const sellerPagination =
  document.getElementById("sellerPagination");

const sellerSearch =
  document.getElementById("sellerSearch");

const statusFilter =
  document.getElementById("statusFilter");

const sortFilter =
  document.getElementById("sortFilter");

const sellerResultCount =
  document.getElementById("sellerResultCount");

const clearSellerFilters =
  document.getElementById("clearSellerFilters");

const refreshSellers =
  document.getElementById("refreshSellers");


// Stats

const totalSellers =
  document.getElementById("totalSellers");

const pendingSellers =
  document.getElementById("pendingSellers");

const activeSellers =
  document.getElementById("activeSellers");

const totalSales =
  document.getElementById("totalSales");


// Drawer

const sellerDrawer =
  document.getElementById("sellerDrawer");

const sellerDrawerOverlay =
  document.getElementById("sellerDrawerOverlay");

const closeSellerDrawer =
  document.getElementById("closeSellerDrawer");

const drawerSellerName =
  document.getElementById("drawerSellerName");

const drawerSellerTitle =
  document.getElementById("drawerSellerTitle");

const drawerSellerId =
  document.getElementById("drawerSellerId");

const drawerSellerAvatar =
  document.getElementById("drawerSellerAvatar");

const drawerSellerStatus =
  document.getElementById("drawerSellerStatus");

const drawerOwner =
  document.getElementById("drawerOwner");

const drawerId =
  document.getElementById("drawerId");

const drawerJoined =
  document.getElementById("drawerJoined");

const drawerApplicationDate =
  document.getElementById("drawerApplicationDate");

const drawerEmail =
  document.getElementById("drawerEmail");

const drawerPhone =
  document.getElementById("drawerPhone");

const drawerProducts =
  document.getElementById("drawerProducts");

const drawerOrders =
  document.getElementById("drawerOrders");

const drawerSales =
  document.getElementById("drawerSales");

const drawerEarnings =
  document.getElementById("drawerEarnings");

const sellerPrimaryAction =
  document.getElementById("sellerPrimaryAction");

const viewSellerProducts =
  document.getElementById("viewSellerProducts");

const viewSellerOrders =
  document.getElementById("viewSellerOrders");

const viewSellerWithdrawals =
  document.getElementById("viewSellerWithdrawals");


// ======================================================
// INITIALIZE
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

  updateStats();

  applySellerFilters();

});


// ======================================================
// FILTERING
// ======================================================

function applySellerFilters() {

  const search =
    sellerSearch.value
      .trim()
      .toLowerCase();

  const status =
    statusFilter.value;

  const sort =
    sortFilter.value;


  filteredSellers =
    sellers.filter(seller => {

      const matchesSearch =
        !search ||

        seller.name
          .toLowerCase()
          .includes(search) ||

        seller.owner
          .toLowerCase()
          .includes(search) ||

        seller.email
          .toLowerCase()
          .includes(search) ||

        seller.phone
          .toLowerCase()
          .includes(search) ||

        seller.id
          .toLowerCase()
          .includes(search);


      const matchesStatus =
        status === "all" ||
        seller.status === status;


      return matchesSearch && matchesStatus;

    });


  sortSellers(sort);

  currentPage = 1;

  renderSellers();

}


// ======================================================
// SORT
// ======================================================

function sortSellers(sort) {

  filteredSellers.sort((a, b) => {

    switch (sort) {

      case "oldest":

        return new Date(a.applicationDate || 0)
          - new Date(b.applicationDate || 0);


      case "sales":

        return b.sales - a.sales;


      case "earnings":

        return b.earnings - a.earnings;


      case "products":

        return b.products - a.products;


      case "orders":

        return b.orders - a.orders;


      case "name":

        return a.name.localeCompare(b.name);


      case "newest":
      default:

        return new Date(b.applicationDate || 0)
          - new Date(a.applicationDate || 0);

    }

  });

}


// ======================================================
// RENDER SELLERS
// ======================================================

function renderSellers() {

  sellerTableBody.innerHTML = "";

  const total =
    filteredSellers.length;


  sellerResultCount.textContent =
    `${total} seller${total === 1 ? "" : "s"}`;


  if (!total) {

    sellerEmpty.hidden = false;

    sellerPagination.innerHTML = "";

    return;

  }


  sellerEmpty.hidden = true;


  const start =
    (currentPage - 1) *
    SELLERS_PER_PAGE;


  const end =
    start + SELLERS_PER_PAGE;


  const pageSellers =
    filteredSellers.slice(start, end);


  pageSellers.forEach(seller => {

    sellerTableBody.appendChild(
      createSellerRow(seller)
    );

  });



}


// ======================================================
// CREATE TABLE ROW
// ======================================================

function createSellerRow(seller) {

  const tr =
    document.createElement("tr");


  tr.innerHTML = `

    <td>

      <div class="management-seller">

        <div class="management-seller-avatar">
          ${getInitials(seller.name)}
        </div>

        <div class="management-seller-info">

          <strong>
            ${escapeHTML(seller.name)}
          </strong>

          <span>
            ${escapeHTML(seller.owner)}
          </span>

        </div>

      </div>

    </td>


    <td>
      ${seller.products}
    </td>


    <td>
      ${seller.orders}
    </td>


    <td>
      ${formatMoney(seller.sales)}
    </td>


    <td>
      ${formatMoney(seller.earnings)}
    </td>


    <td>
      ${createStatusBadge(seller.status)}
    </td>


    <td>
      ${formatDate(seller.joined || seller.applicationDate)}
    </td>


    <td>

    <div class="management-action">

  <button
    type="button"
    class="management-action-button"
    data-action="open"
    data-id="${seller.id}"
    title="Manage seller"
  >
    <i class="ri-more-2-fill"></i>
  </button>

  <div class="management-action-menu">

    <button
      type="button"
      data-action="view"
      data-id="${seller.id}"
    >
      <i class="ri-eye-line"></i>
      View details
    </button>

    ${
      seller.status === "pending"
      ? `
        <button
          type="button"
          data-action="approve"
          data-id="${seller.id}"
        >
          <i class="ri-check-line"></i>
          Approve
        </button>

        <button
          type="button"
          data-action="reject"
          data-id="${seller.id}"
        >
          <i class="ri-close-line"></i>
          Reject
        </button>
      `
      : ""
    }

    ${
      seller.status === "active"
      ? `
        <button
          type="button"
          data-action="suspend"
          data-id="${seller.id}"
        >
          <i class="ri-forbid-2-line"></i>
          Suspend
        </button>
      `
      : ""
    }

    ${
      seller.status === "suspended"
      ? `
        <button
          type="button"
          data-action="activate"
          data-id="${seller.id}"
        >
          <i class="ri-checkbox-circle-line"></i>
          Activate
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

sellerTableBody.addEventListener("click", event => {

  const button =
    event.target.closest(
      "[data-action]"
    );


  if (!button) return;


  const action =
    button.dataset.action;

  const sellerId =
    button.dataset.id;


  const seller =
    sellers.find(
      item => item.id === sellerId
    );


  if (!seller) return;


  if (action === "open") {

    const actionContainer =
      button.closest(
        ".management-action"
      );

    document
      .querySelectorAll(
        ".management-action.is-open"
      )
      .forEach(menu => {

        if (menu !== actionContainer) {
          menu.classList.remove("is-open");
        }

      });


    actionContainer
      .classList
      .toggle("is-open");

    return;

  }


  if (action === "view") {

    openSellerDrawer(seller);

    return;

  }


  if (action === "approve") {

    approveSeller(seller);

    return;

  }


  if (action === "reject") {

    rejectSeller(seller);

    return;

  }


  if (action === "suspend") {

    suspendSeller(seller);

    return;

  }


  if (action === "activate") {

    activateSeller(seller);

  }

});


// ======================================================
// APPROVE SELLER
// ======================================================

function approveSeller(seller) {

  const confirmed =
    confirm(
      `Approve ${seller.name} as a seller?`
    );


  if (!confirmed) return;


  seller.status = "active";

  seller.joined =
    new Date()
      .toISOString()
      .split("T")[0];


  updateStats();

  applySellerFilters();


  if (selectedSeller?.id === seller.id) {
    openSellerDrawer(seller);
  }

}


// ======================================================
// REJECT SELLER
// ======================================================

function rejectSeller(seller) {

  const confirmed =
    confirm(
      `Reject the application from ${seller.name}?`
    );


  if (!confirmed) return;


  seller.status = "rejected";


  updateStats();

  applySellerFilters();


  if (selectedSeller?.id === seller.id) {
    openSellerDrawer(seller);
  }

}


// ======================================================
// SUSPEND SELLER
// ======================================================

function suspendSeller(seller) {

  const confirmed =
    confirm(
      `Suspend ${seller.name}?`
    );


  if (!confirmed) return;


  seller.status = "suspended";


  updateStats();

  applySellerFilters();


  if (selectedSeller?.id === seller.id) {
    openSellerDrawer(seller);
  }

}


// ======================================================
// ACTIVATE SELLER
// ======================================================

function activateSeller(seller) {

  const confirmed =
    confirm(
      `Activate ${seller.name}?`
    );


  if (!confirmed) return;


  seller.status = "active";


  if (!seller.joined) {

    seller.joined =
      new Date()
        .toISOString()
        .split("T")[0];

  }


  updateStats();

  applySellerFilters();


  if (selectedSeller?.id === seller.id) {
    openSellerDrawer(seller);
  }

}


// ======================================================
// DRAWER
// ======================================================

function openSellerDrawer(seller) {

  selectedSeller = seller;


  drawerSellerName.textContent =
    seller.name;

  drawerSellerTitle.textContent =
    seller.name;

  drawerSellerId.textContent =
    seller.id;

  drawerSellerAvatar.textContent =
    getInitials(seller.name);


  drawerSellerStatus.innerHTML =
    createStatusBadge(
      seller.status
    );


  drawerOwner.textContent =
    seller.owner;

  drawerId.textContent =
    seller.id;

  drawerJoined.textContent =
    seller.joined
      ? formatDate(seller.joined)
      : "Not approved";


  drawerApplicationDate.textContent =
    formatDate(
      seller.applicationDate
    );


  drawerEmail.textContent =
    seller.email;

  drawerPhone.textContent =
    seller.phone;


  drawerProducts.textContent =
    seller.products;

  drawerOrders.textContent =
    seller.orders;

  drawerSales.textContent =
    formatMoney(
      seller.sales
    );

  drawerEarnings.textContent =
    formatMoney(
      seller.earnings
    );


  updateDrawerPrimaryAction();


  sellerDrawerOverlay.hidden = false;

  requestAnimationFrame(() => {

    sellerDrawerOverlay.classList.add(
      "is-visible"
    );

    sellerDrawer.classList.add(
      "is-open"
    );

    sellerDrawer.setAttribute(
      "aria-hidden",
      "false"
    );

  });

}


// ======================================================
// CLOSE DRAWER
// ======================================================

function closeSellerDetails() {

  sellerDrawer.classList.remove(
    "is-open"
  );

  sellerDrawerOverlay.classList.remove(
    "is-visible"
  );

  sellerDrawer.setAttribute(
    "aria-hidden",
    "true"
  );


  setTimeout(() => {

    sellerDrawerOverlay.hidden = true;

  }, 250);


  selectedSeller = null;

}


closeSellerDrawer.addEventListener(
  "click",
  closeSellerDetails
);


sellerDrawerOverlay.addEventListener(
  "click",
  closeSellerDetails
);


// ======================================================
// DRAWER PRIMARY ACTION
// ======================================================

function updateDrawerPrimaryAction() {

  if (!selectedSeller) return;


  const status =
    selectedSeller.status;


  sellerPrimaryAction.className =
    "admin-danger-button";


  if (status === "pending") {

    sellerPrimaryAction.innerHTML = `
      <i class="ri-check-line"></i>
      <span>Approve Seller</span>
    `;

    sellerPrimaryAction.className =
      "admin-secondary-button";

    return;

  }


  if (status === "active") {

    sellerPrimaryAction.innerHTML = `
      <i class="ri-forbid-2-line"></i>
      <span>Suspend Seller</span>
    `;

    return;

  }


  if (status === "suspended") {

    sellerPrimaryAction.innerHTML = `
      <i class="ri-checkbox-circle-line"></i>
      <span>Activate Seller</span>
    `;

    sellerPrimaryAction.className =
      "admin-secondary-button";

    return;

  }


  if (status === "rejected") {

    sellerPrimaryAction.innerHTML = `
      <i class="ri-check-line"></i>
      <span>Approve Seller</span>
    `;

    sellerPrimaryAction.className =
      "admin-secondary-button";

  }

}


sellerPrimaryAction.addEventListener(
  "click",
  () => {

    if (!selectedSeller) return;


    switch (selectedSeller.status) {

      case "pending":
      case "rejected":

        approveSeller(selectedSeller);

        break;


      case "active":

        suspendSeller(selectedSeller);

        break;


      case "suspended":

        activateSeller(selectedSeller);

        break;

    }

  }
);


// ======================================================
// SELLER RELATED PAGES
// ======================================================

viewSellerProducts.addEventListener(
  "click",
  () => {

    if (!selectedSeller) return;

    window.location.href =
      `products.html?seller=${encodeURIComponent(
        selectedSeller.id
      )}`;

  }
);


viewSellerOrders.addEventListener(
  "click",
  () => {

    if (!selectedSeller) return;

    window.location.href =
      `orders.html?seller=${encodeURIComponent(
        selectedSeller.id
      )}`;

  }
);


viewSellerWithdrawals.addEventListener(
  "click",
  () => {

    if (!selectedSeller) return;

    window.location.href =
      `withdrawals.html?seller=${encodeURIComponent(
        selectedSeller.id
      )}`;

  }
);




// ======================================================
// SEARCH / FILTER EVENTS
// ======================================================

sellerSearch.addEventListener(
  "input",
  applySellerFilters
);


statusFilter.addEventListener(
  "change",
  applySellerFilters
);


sortFilter.addEventListener(
  "change",
  applySellerFilters
);


clearSellerFilters.addEventListener(
  "click",
  () => {

    sellerSearch.value = "";

    statusFilter.value = "all";

    sortFilter.value = "newest";

    applySellerFilters();

  }
);


// ======================================================
// REFRESH
// ======================================================

refreshSellers.addEventListener(
  "click",
  () => {

    refreshSellers.disabled = true;

    const icon =
      refreshSellers.querySelector("i");

    const text =
      refreshSellers.querySelector("span");


    icon.classList.add(
      "admin-spin"
    );

    if (text) {
      text.textContent = "Refreshing...";
    }


    setTimeout(() => {

      updateStats();

      applySellerFilters();


      icon.classList.remove(
        "admin-spin"
      );

      if (text) {
        text.textContent = "Refresh";
      }

      refreshSellers.disabled = false;

    }, 500);

  }
);


// ======================================================
// STATISTICS
// ======================================================

function updateStats() {

  const total =
    sellers.length;


  const pending =
    sellers.filter(
      seller =>
        seller.status === "pending"
    ).length;


  const active =
    sellers.filter(
      seller =>
        seller.status === "active"
    ).length;


  const sales =
    sellers.reduce(
      (sum, seller) =>
        sum + Number(seller.sales || 0),
      0
    );


  totalSellers.textContent =
    total;


  pendingSellers.textContent =
    pending;


  activeSellers.textContent =
    active;


  totalSales.textContent =
    formatMoney(sales);

}


// ======================================================
// STATUS BADGE
// ======================================================

function createStatusBadge(status) {

  const label =
    capitalize(status);


  return `
    <span
      class="management-status status-${status}"
    >
      <span></span>
      ${label}
    </span>
  `;

}


// ======================================================
// INITIALS
// ======================================================

function getInitials(name) {

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(
      word =>
        word.charAt(0)
          .toUpperCase()
    )
    .join("");

}


// ======================================================
// MONEY
// ======================================================

function formatMoney(amount) {

  return `GH₵${Number(amount || 0).toLocaleString(
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

  if (!date) return "—";


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

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// ======================================================
// CLOSE MENUS WHEN CLICKING OUTSIDE
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
// ESCAPE KEY
// ======================================================

document.addEventListener(
  "keydown",
  event => {

    if (event.key === "Escape") {

      closeSellerDetails();

    }

  }
);


// =========================================================
// PAGINATION
// =========================================================
const container = 
document.getElementById("paginationButtons");

const infoElement = 
document.getElementById("paginationInfo");

renderPagination({
container: paginationButtons,
infoElement: paginationInfo,
totalItems: filteredSellers.length,

currentPage,

itemsPerPage: SELLERS_PER_PAGE,

onPageChange: (page) => {
  currentPage = page;

  renderSellers();
}
});
