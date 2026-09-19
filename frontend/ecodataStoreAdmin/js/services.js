// =========================================================
// SERVICES MANAGEMENT
// =========================================================

const SERVICE_SELLERS = [
  {
    id: "SEL-10001",
    name: "CreativeHub"
  },
  {
    id: "SEL-10002",
    name: "Design Corner"
  },
  {
    id: "SEL-10003",
    name: "TechWorks"
  },
  {
    id: "SEL-10004",
    name: "WritePro Ghana"
  },
  {
    id: "SEL-10005",
    name: "EduAssist"
  }
];


let serviceRequests = [

  {
    id: "SRV-20260918-001",
    reference: "REQ-7H42P",
    customer: "Abdul Rahman",
    customerId: "USR-10001",
    phone: "024 123 4567",
    email: "abdul@example.com",

    service: "CV Design",
    category: "design",

    seller: "Design Corner",
    sellerId: "SEL-10002",

    amount: 80,
    payment: "paid",
    status: "in_progress",

    description:
      "Need a professional CV design suitable for job applications. Customer requested a clean modern layout.",

    submitted: "2026-09-18T15:30:00",
    updated: "2026-09-18T18:20:00"
  },


  {
    id: "SRV-20260918-002",
    reference: "REQ-3K91M",
    customer: "Fatima Ibrahim",
    customerId: "USR-10002",
    phone: "055 834 2910",
    email: "fatima@example.com",

    service: "BECE Result Checking",
    category: "education",

    seller: "EduAssist",
    sellerId: "SEL-10005",

    amount: 25,
    payment: "paid",
    status: "completed",

    description:
      "Check BECE result and provide the result details to the customer.",

    submitted: "2026-09-17T09:15:00",
    updated: "2026-09-17T10:02:00"
  },


  {
    id: "SRV-20260917-003",
    reference: "REQ-8D27Q",
    customer: "Kwame Mensah",
    customerId: "USR-10003",
    phone: "020 541 7832",
    email: "kwame@example.com",

    service: "Business Flyer Design",
    category: "design",

    seller: "CreativeHub",
    sellerId: "SEL-10001",

    amount: 65,
    payment: "paid",
    status: "assigned",

    description:
      "Customer needs a promotional flyer for a small business launch.",

    submitted: "2026-09-17T14:20:00",
    updated: "2026-09-17T15:10:00"
  },


  {
    id: "SRV-20260916-004",
    reference: "REQ-4L63A",
    customer: "Amina Sulemana",
    customerId: "USR-10004",
    phone: "024 872 1103",
    email: "amina@example.com",

    service: "Logo Design",
    category: "design",

    seller: "CreativeHub",
    sellerId: "SEL-10001",

    amount: 120,
    payment: "paid",
    status: "pending",

    description:
      "Create a simple brand logo for a new fashion business.",

    submitted: "2026-09-16T12:45:00",
    updated: "2026-09-16T12:45:00"
  },


  {
    id: "SRV-20260915-005",
    reference: "REQ-9B51T",
    customer: "Yaw Asare",
    customerId: "USR-10005",
    phone: "050 334 7211",
    email: "yaw@example.com",

    service: "Document Formatting",
    category: "documents",

    seller: "WritePro Ghana",
    sellerId: "SEL-10004",

    amount: 45,
    payment: "paid",
    status: "completed",

    description:
      "Format and clean up a business document supplied by the customer.",

    submitted: "2026-09-15T08:10:00",
    updated: "2026-09-15T11:25:00"
  },


  {
    id: "SRV-20260914-006",
    reference: "REQ-2P74C",
    customer: "Mary Owusu",
    customerId: "USR-10006",
    phone: "027 221 8490",
    email: "mary@example.com",

    service: "Website Setup",
    category: "technology",

    seller: "TechWorks",
    sellerId: "SEL-10003",

    amount: 350,
    payment: "pending",
    status: "pending",

    description:
      "Customer requested help setting up a small business website.",

    submitted: "2026-09-14T16:40:00",
    updated: "2026-09-14T16:40:00"
  },


  {
    id: "SRV-20260913-007",
    reference: "REQ-6R28N",
    customer: "Ibrahim Salifu",
    customerId: "USR-10007",
    phone: "054 901 7721",
    email: "ibrahim@example.com",

    service: "CV Writing",
    category: "writing",

    seller: "WritePro Ghana",
    sellerId: "SEL-10004",

    amount: 55,
    payment: "failed",
    status: "cancelled",

    description:
      "CV writing request. Payment could not be completed.",

    submitted: "2026-09-13T13:10:00",
    updated: "2026-09-13T13:35:00"
  },


  {
    id: "SRV-20260912-008",
    reference: "REQ-1M39X",
    customer: "Hassan Mohammed",
    customerId: "USR-10008",
    phone: "026 554 3381",
    email: "hassan@example.com",

    service: "School Document Assistance",
    category: "education",

    seller: "EduAssist",
    sellerId: "SEL-10005",

    amount: 40,
    payment: "refunded",
    status: "cancelled",

    description:
      "Customer requested assistance with school admission documents.",

    submitted: "2026-09-12T10:20:00",
    updated: "2026-09-12T14:30:00"
  }

];


let filteredServices = [...serviceRequests];
let currentPage = 1;
let selectedService = null;

const SERVICES_PER_PAGE = 5;


// =========================================================
// DOM
// =========================================================

const serviceTableBody =
  document.getElementById("serviceTableBody");

const serviceEmptyState =
  document.getElementById("serviceEmptyState");

const servicePagination =
  document.getElementById("servicePagination");

const serviceResultCount =
  document.getElementById("serviceResultCount");

const serviceSearch =
  document.getElementById("serviceSearch");

const serviceStatusFilter =
  document.getElementById("serviceStatusFilter");

const servicePaymentFilter =
  document.getElementById("servicePaymentFilter");

const serviceCategoryFilter =
  document.getElementById("serviceCategoryFilter");

const serviceSort =
  document.getElementById("serviceSort");


// =========================================================
// DRAWER
// =========================================================

const serviceDrawer =
  document.getElementById("serviceDetailsDrawer");

const serviceDrawerOverlay =
  document.getElementById("serviceDrawerOverlay");


// =========================================================
// INIT
// =========================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    populateSellerSelect();

    applyServiceFilters();

  

  }
);


// =========================================================
// EVENTS
// =========================================================

function setupServiceEvents() {

  serviceSearch.addEventListener(
    "input",
    () => {
      currentPage = 1;
      applyServiceFilters();
    }
  );


  serviceStatusFilter.addEventListener(
    "change",
    () => {
      currentPage = 1;
      applyServiceFilters();
    }
  );


  servicePaymentFilter.addEventListener(
    "change",
    () => {
      currentPage = 1;
      applyServiceFilters();
    }
  );


  serviceCategoryFilter.addEventListener(
    "change",
    () => {
      currentPage = 1;
      applyServiceFilters();
    }
  );


  serviceSort.addEventListener(
    "change",
    () => {
      currentPage = 1;
      applyServiceFilters();
    }
  );


  document
    .getElementById("clearServiceFilters")
    .addEventListener(
      "click",
      clearServiceFilters
    );


  document
    .getElementById("refreshServices")
    .addEventListener(
      "click",
      () => {

        applyServiceFilters();

      }
    );


  serviceTableBody.addEventListener(
    "click",
    handleServiceTableClick
  );


  document
    .getElementById("closeServiceDrawer")
    .addEventListener(
      "click",
      closeServiceDrawer
    );


  serviceDrawerOverlay.addEventListener(
    "click",
    closeServiceDrawer
  );


  document
    .getElementById("serviceStatusBtn")
    .addEventListener(
      "click",
      updateSelectedServiceStatus
    );


  document
    .getElementById("serviceCancelBtn")
    .addEventListener(
      "click",
      cancelSelectedService
    );


  document
    .getElementById("drawerSellerSelect")
    .addEventListener(
      "change",
      assignSeller
    );


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape"
      ) {

        closeServiceDrawer();

      }

    }
  );

}


// =========================================================
// FILTER SERVICES
// =========================================================

function applyServiceFilters() {

  const search =
    serviceSearch.value
      .trim()
      .toLowerCase();

  const status =
    serviceStatusFilter.value;

  const payment =
    servicePaymentFilter.value;

  const category =
    serviceCategoryFilter.value;


  filteredServices =
    serviceRequests.filter(
      service => {

        const matchesSearch =
          !search ||
          service.id
            .toLowerCase()
            .includes(search) ||
          service.reference
            .toLowerCase()
            .includes(search) ||
          service.customer
            .toLowerCase()
            .includes(search) ||
          service.service
            .toLowerCase()
            .includes(search) ||
          service.seller
            .toLowerCase()
            .includes(search);


        const matchesStatus =
          status === "all" ||
          service.status === status;


        const matchesPayment =
          payment === "all" ||
          service.payment === payment;


        const matchesCategory =
          category === "all" ||
          service.category === category;


        return (
          matchesSearch &&
          matchesStatus &&
          matchesPayment &&
          matchesCategory
        );

      }
    );


  sortServices();

  renderServices();
  updateServiceStats();

}


// =========================================================
// SORT
// =========================================================

function sortServices() {

  const sort =
    serviceSort.value;


  filteredServices.sort(
    (a, b) => {

      if (sort === "oldest") {

        return (
          new Date(a.submitted) -
          new Date(b.submitted)
        );

      }


      if (sort === "highest") {

        return b.amount - a.amount;

      }


      if (sort === "lowest") {

        return a.amount - b.amount;

      }


      return (
        new Date(b.submitted) -
        new Date(a.submitted)
      );

    }
  );

}


// =========================================================
// RENDER
// =========================================================

function renderServices() {

  serviceResultCount.textContent =
    filteredServices.length;


  if (!filteredServices.length) {

    serviceTableBody.innerHTML = "";

    serviceEmptyState.hidden = false;

    servicePagination.innerHTML = "";

    return;

  }


  serviceEmptyState.hidden = true;


  const start =
    (currentPage - 1) *
    SERVICES_PER_PAGE;


  const pageServices =
    filteredServices.slice(
      start,
      start + SERVICES_PER_PAGE
    );


  serviceTableBody.innerHTML =
    pageServices
      .map(createServiceRow)
      .join("");
}


// =========================================================
// CREATE ROW
// =========================================================

function createServiceRow(service) {

  return `
    <tr>

      <td>

        <div class="admin-table-primary">

          <strong>
            ${escapeHTML(service.id)}
          </strong>

          <span>
            ${escapeHTML(service.reference)}
          </span>

        </div>

      </td>


      <td>

        <div class="admin-table-primary">

          <strong>
            ${escapeHTML(service.customer)}
          </strong>

          <span>
            ${escapeHTML(service.phone)}
          </span>

        </div>

      </td>


      <td>

        <div class="admin-table-primary">

          <strong>
            ${escapeHTML(service.service)}
          </strong>

          <span>
            ${capitalize(service.category)}
          </span>

        </div>

      </td>


      <td>

        ${
          service.seller
            ? `
              <span class="admin-table-secondary">
                ${escapeHTML(service.seller)}
              </span>
            `
            : `
              <span class="admin-table-secondary">
                Unassigned
              </span>
            `
        }

      </td>


      <td>

        <strong>
          ${formatMoney(service.amount)}
        </strong>

      </td>


      <td>

        ${createPaymentBadge(service.payment)}

      </td>


      <td>

        ${createStatusBadge(service.status)}

      </td>


      <td>

        <span class="admin-table-secondary">
          ${formatDate(service.submitted)}
        </span>

      </td>


      <td>


      

       <div class="management-action">

  <button
    type="button"
    class="management-action-button"
    data-action="open"
    data-id="${service.id}"
    title="Manage service request"
  >
    <i class="ri-more-2-fill"></i>
  </button>

  <div class="management-action-menu">

    <button
      type="button"
      data-action="view"
      data-id="${service.id}"
    >
      <i class="ri-eye-line"></i>
      View details
    </button>

    <button
      type="button"
      data-action="next"
      data-id="${service.id}"
    >
      <i class="ri-arrow-right-line"></i>
      Update status
    </button>

    ${
      service.status !== "completed" &&
      service.status !== "cancelled"
      ? `
        <button
          type="button"
          class="danger"
          data-action="cancel"
          data-id="${service.id}"
        >
          <i class="ri-close-circle-line"></i>
          Cancel request
        </button>
      `
      : ""
    }

  </div>

</div>
      </td>

    </tr>
  `;

}


// =========================================================
// TABLE ACTIONS
// =========================================================

function handleServiceTableClick(event) {

  const button =
    event.target.closest(
      "[data-action]"
    );

  if (!button) return;


  const action =
    button.dataset.action;

  const id =
    button.dataset.id;


  if (action === "menu") {

    toggleActionMenu(id);

    return;

  }


  if (action === "view") {

    openServiceDrawer(id);

    return;

  }


  if (action === "next") {

    openServiceDrawer(id);

    return;

  }


  if (action === "cancel") {

    cancelService(id);

  }

}


// =========================================================
// ACTION MENU
// =========================================================

function toggleActionMenu(id) {

  document
    .querySelectorAll(".admin-action-menu")
    .forEach(menu => {

      if (
        menu.dataset.menu !== id
      ) {

        menu.classList.remove("show");

      }

    });


  const menu =
    document.querySelector(
      `[data-menu="${id}"]`
    );


  if (menu) {

    menu.classList.toggle("show");

  }

}


document.addEventListener(
  "click",
  event => {

    if (
      !event.target.closest(
        ".admin-row-actions, .admin-action-menu"
      )
    ) {

      document
        .querySelectorAll(
          ".admin-action-menu"
        )
        .forEach(
          menu =>
            menu.classList.remove("show")
        );

    }

  }
);


// =========================================================
// OPEN DRAWER
// =========================================================

function openServiceDrawer(id) {

  selectedService =
    serviceRequests.find(
      service =>
        service.id === id
    );


  if (!selectedService) return;


  document.getElementById(
    "drawerServiceId"
  ).textContent =
    selectedService.id;


  document.getElementById(
    "drawerReference"
  ).textContent =
    selectedService.reference;


  document.getElementById(
    "drawerServiceName"
  ).textContent =
    selectedService.service;


  document.getElementById(
    "drawerCategory"
  ).textContent =
    capitalize(
      selectedService.category
    );


  document.getElementById(
    "drawerAmount"
  ).textContent =
    formatMoney(
      selectedService.amount
    );


  document.getElementById(
    "drawerSubmitted"
  ).textContent =
    formatDateTime(
      selectedService.submitted
    );


  document.getElementById(
    "drawerUpdated"
  ).textContent =
    formatDateTime(
      selectedService.updated
    );


  document.getElementById(
    "drawerDescription"
  ).textContent =
    selectedService.description;


  document.getElementById(
    "drawerCustomer"
  ).textContent =
    selectedService.customer;


  document.getElementById(
    "drawerCustomerPhone"
  ).textContent =
    selectedService.phone;


  document.getElementById(
    "drawerCustomerEmail"
  ).textContent =
    selectedService.email;


  document.getElementById(
    "drawerCustomerAvatar"
  ).textContent =
    selectedService.customer
      .charAt(0)
      .toUpperCase();


  document.getElementById(
    "drawerServiceAmount"
  ).textContent =
    formatMoney(
      selectedService.amount
    );


  const platformFee =
    selectedService.amount * 0.30;


  document.getElementById(
    "drawerPlatformFee"
  ).textContent =
    formatMoney(
      platformFee
    );


  document.getElementById(
    "drawerTotalPaid"
  ).textContent =
    formatMoney(
      selectedService.amount
    );


  document.getElementById(
    "drawerServiceStatus"
  ).innerHTML =
    createStatusBadge(
      selectedService.status
    );


  document.getElementById(
    "drawerServicePayment"
  ).innerHTML =
    createPaymentBadge(
      selectedService.payment
    );


  const sellerSelect =
    document.getElementById(
      "drawerSellerSelect"
    );


  sellerSelect.value =
    selectedService.sellerId || "";


  updateDrawerStatusButton();


  serviceDrawer.classList.add("open");

  serviceDrawerOverlay.classList.add("show");

  document.body.classList.add(
    "admin-drawer-open"
  );

}


// =========================================================
// CLOSE DRAWER
// =========================================================

function closeServiceDrawer() {

  serviceDrawer.classList.remove(
    "open"
  );

  serviceDrawerOverlay.classList.remove(
    "show"
  );

  document.body.classList.remove(
    "admin-drawer-open"
  );

  selectedService = null;

}


// =========================================================
// ASSIGN SELLER
// =========================================================

function assignSeller() {

  if (!selectedService) return;


  const sellerId =
    document.getElementById(
      "drawerSellerSelect"
    ).value;


  const seller =
    SERVICE_SELLERS.find(
      seller =>
        seller.id === sellerId
    );


  selectedService.sellerId =
    sellerId || null;


  selectedService.seller =
    seller
      ? seller.name
      : null;


  selectedService.updated =
    new Date().toISOString();


  if (
    seller &&
    selectedService.status === "pending"
  ) {

    selectedService.status =
      "assigned";

  }


  openServiceDrawer(
    selectedService.id
  );

  applyServiceFilters();

}


// =========================================================
// UPDATE STATUS
// =========================================================

function updateSelectedServiceStatus() {

  if (!selectedService) return;


  const nextStatus =
    getNextStatus(
      selectedService.status
    );


  if (!nextStatus) return;


  updateServiceStatus(
    selectedService.id,
    nextStatus
  );


  openServiceDrawer(
    selectedService.id
  );

}


// =========================================================
// STATUS LOGIC
// =========================================================

function getNextStatus(status) {

  if (status === "pending") {

    return selectedService?.sellerId
      ? "assigned"
      : "assigned";

  }


  if (status === "assigned") {

    return "in_progress";

  }


  if (status === "in_progress") {

    return "completed";

  }


  return null;

}


function updateServiceStatus(
  id,
  status
) {

  const service =
    serviceRequests.find(
      item =>
        item.id === id
    );


  if (!service) return;


  service.status =
    status;


  service.updated =
    new Date().toISOString();


  applyServiceFilters();

}


// =========================================================
// CANCEL
// =========================================================

function cancelSelectedService() {

  if (!selectedService) return;


  cancelService(
    selectedService.id
  );

}


function cancelService(id) {

  const service =
    serviceRequests.find(
      item =>
        item.id === id
    );


  if (!service) return;


  if (
    service.status === "completed" ||
    service.status === "cancelled"
  ) {

    return;

  }


  const confirmed =
    window.confirm(
      `Cancel service request ${service.id}?`
    );


  if (!confirmed) return;


  service.status =
    "cancelled";


  service.updated =
    new Date().toISOString();


  applyServiceFilters();


  closeServiceDrawer();

}


// =========================================================
// DRAWER BUTTON
// =========================================================

function updateDrawerStatusButton() {

  const button =
    document.getElementById(
      "serviceStatusBtn"
    );


  if (!selectedService) return;


  if (
    selectedService.status ===
      "pending"
  ) {

    button.innerHTML =
      `<i class="ri-user-add-line"></i>
       Assign / Update Status`;

    button.disabled = false;

    return;

  }


  if (
    selectedService.status ===
      "assigned"
  ) {

    button.innerHTML =
      `<i class="ri-play-line"></i>
       Start Service`;

    button.disabled = false;

    return;

  }


  if (
    selectedService.status ===
      "in_progress"
  ) {

    button.innerHTML =
      `<i class="ri-checkbox-circle-line"></i>
       Mark Completed`;

    button.disabled = false;

    return;

  }


  button.innerHTML =
    "No Further Action";

  button.disabled = true;

}


// =========================================================
// SELLER OPTIONS
// =========================================================

function populateSellerSelect() {

  const select =
    document.getElementById(
      "drawerSellerSelect"
    );


  select.innerHTML = `
    <option value="">
      Unassigned
    </option>

    ${
      SERVICE_SELLERS
        .map(
          seller => `
            <option value="${seller.id}">
              ${escapeHTML(seller.name)}
            </option>
          `
        )
        .join("")
    }
  `;

}


// =========================================================
// STATS
// =========================================================

function updateServiceStats() {

  document.getElementById(
    "totalServices"
  ).textContent =
    serviceRequests.length;


  document.getElementById(
    "pendingServices"
  ).textContent =
    serviceRequests.filter(
      service =>
        service.status === "pending"
    ).length;


  document.getElementById(
    "progressServices"
  ).textContent =
    serviceRequests.filter(
      service =>
        service.status === "in_progress" ||
        service.status === "assigned"
    ).length;


  document.getElementById(
    "completedServices"
  ).textContent =
    serviceRequests.filter(
      service =>
        service.status === "completed"
    ).length;


  const revenue =
    serviceRequests
      .filter(
        service =>
          service.status === "completed" &&
          service.payment === "paid"
      )
      .reduce(
        (total, service) =>
          total + service.amount,
        0
      );


  document.getElementById(
    "serviceRevenue"
  ).textContent =
    formatMoney(revenue);

}


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
totalItems: filteredServices.length,

currentPage,

itemsPerPage: SERVICES_PER_PAGE,

onPageChange: (page) => {
  currentPage = page;

  renderServices();
}
});

// =========================================================
// CLEAR FILTERS
// =========================================================

function clearServiceFilters() {

  serviceSearch.value = "";

  serviceStatusFilter.value =
    "all";

  servicePaymentFilter.value =
    "all";

  serviceCategoryFilter.value =
    "all";

  serviceSort.value =
    "newest";


  currentPage = 1;

  applyServiceFilters();

}


// =========================================================
// BADGES
// =========================================================

function createStatusBadge(status) {

  const labels = {

    pending: "Pending",

    assigned: "Assigned",

    in_progress: "In Progress",

    completed: "Completed",

    cancelled: "Cancelled"

  };


  const icons = {

    pending: "ri-time-line",

    assigned: "ri-user-add-line",

    in_progress: "ri-loader-4-line",

    completed: "ri-checkbox-circle-line",

    cancelled: "ri-close-circle-line"

  };


  return `
    <span
      class="service-status-badge ${status}"
    >
      <i class="${icons[status] || "ri-information-line"}"></i>
      ${labels[status] || capitalize(status)}
    </span>
  `;

}


function createPaymentBadge(payment) {

  const labels = {

    paid: "Paid",

    pending: "Pending",

    failed: "Failed",

    refunded: "Refunded"

  };


  return `
    <span
      class="service-payment-badge ${payment}"
    >
      ${labels[payment] || capitalize(payment)}
    </span>
  `;

}


// =========================================================
// HELPERS
// =========================================================

function formatMoney(amount) {

  return (
    "GH₵" +
    Number(amount || 0)
      .toLocaleString(
        "en-GH",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }
      )
  );

}


function formatDate(date) {

  return new Date(date)
    .toLocaleDateString(
      "en-GH",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );

}


function formatDateTime(date) {

  return new Date(date)
    .toLocaleString(
      "en-GH",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    );

}


function capitalize(value) {

  if (!value) return "";

  return value
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      char =>
        char.toUpperCase()
    );

}


function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}