// ==========================================
// ECODATA ADMIN — USERS
// ==========================================


// ==========================================
// DEMO USERS
// ==========================================

let users = [

  {
    id: "USR-10001",
    name: "Abdul Rahman",
    email: "abdul@example.com",
    phone: "024 123 4567",
    type: "customer",
    status: "active",
    orders: 14,
    spending: 845,
    joined: "2026-09-14"
  },

  {
    id: "USR-10002",
    name: "Fatima Mohammed",
    email: "fatima@example.com",
    phone: "055 321 7788",
    type: "creator",
    status: "active",
    orders: 28,
    spending: 2140,
    joined: "2026-09-10"
  },

  {
    id: "USR-10003",
    name: "Samuel Mensah",
    email: "samuel@example.com",
    phone: "020 555 8812",
    type: "customer",
    status: "active",
    orders: 9,
    spending: 430,
    joined: "2026-09-05"
  },

  {
    id: "USR-10004",
    name: "Michael Owusu",
    email: "michael@example.com",
    phone: "027 449 2031",
    type: "customer",
    status: "suspended",
    orders: 21,
    spending: 1120,
    joined: "2026-08-29"
  },

  {
    id: "USR-10005",
    name: "Aisha Ibrahim",
    email: "aisha@example.com",
    phone: "050 912 4431",
    type: "creator",
    status: "active",
    orders: 36,
    spending: 3890,
    joined: "2026-08-22"
  },

  {
    id: "USR-10006",
    name: "Daniel Boateng",
    email: "daniel@example.com",
    phone: "024 883 1204",
    type: "customer",
    status: "active",
    orders: 7,
    spending: 290,
    joined: "2026-08-18"
  },

  {
    id: "USR-10007",
    name: "Mary Adjei",
    email: "mary@example.com",
    phone: "055 742 0012",
    type: "customer",
    status: "active",
    orders: 18,
    spending: 930,
    joined: "2026-08-10"
  },

  {
    id: "USR-10008",
    name: "Ibrahim Sulemana",
    email: "ibrahim@example.com",
    phone: "020 332 4419",
    type: "creator",
    status: "suspended",
    orders: 11,
    spending: 740,
    joined: "2026-07-29"
  }

];


// ==========================================
// STATE
// ==========================================

let filteredUsers = [...users];

let currentPage = 1;

const USERS_PER_PAGE = 5;

let selectedUser = null;


// ==========================================
// ELEMENTS
// ==========================================

const userSearch =
  document.getElementById("userSearch");

const userStatusFilter =
  document.getElementById(
    "userStatusFilter"
  );

const userTypeFilter =
  document.getElementById(
    "userTypeFilter"
  );

const userSort =
  document.getElementById("userSort");

const usersTableBody =
  document.getElementById(
    "usersTableBody"
  );

const usersEmpty =
  document.getElementById("usersEmpty");

const userResultCount =
  document.getElementById(
    "userResultCount"
  );

const clearUserFilters =
  document.getElementById(
    "clearUserFilters"
  );

const emptyClearFilters =
  document.getElementById(
    "emptyClearFilters"
  );

const refreshUsers =
  document.getElementById(
    "refreshUsers"
  );

const paginationInfo =
  document.getElementById(
    "paginationInfo"
  );

const previousPage =
  document.getElementById(
    "previousPage"
  );

const nextPage =
  document.getElementById(
    "nextPage"
  );

const userDrawer =
  document.getElementById(
    "userDrawer"
  );

const userDrawerOverlay =
  document.getElementById(
    "userDrawerOverlay"
  );

const closeUserDrawer =
  document.getElementById(
    "closeUserDrawer"
  );

const userDrawerContent =
  document.getElementById(
    "userDrawerContent"
  );

const drawerSuspend =
  document.getElementById(
    "drawerSuspend"
  );


// ==========================================
// INITIAL
// ==========================================

filteredUsers = [...users];


// ==========================================
// INITIAL
// STATISTICS
// ==========================================

function updateStatistics() {

  const total =
    users.length;

  const active =
    users.filter(
      user => user.status === "active"
    ).length;

  const suspended =
    users.filter(
      user => user.status === "suspended"
    ).length;

  document.getElementById(
    "usersTotal"
  ).textContent =
    total.toLocaleString();

  document.getElementById(
    "usersActive"
  ).textContent =
    active.toLocaleString();

  document.getElementById(
    "usersSuspended"
  ).textContent =
    suspended.toLocaleString();

}


// ==========================================
// INITIAL
// MONTHLY USERS
// ==========================================

function updateMonthlyUsers() {

  /*
    Demo value for now.

    Later this will come from:
    Firestore/backend analytics.
  */

  document.getElementById(
    "usersNew"
  ).textContent = "186";

}


// ==========================================
// INITIALS
// ==========================================

function getInitials(name) {

  return name
    .split(" ")
    .map(word => word.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

}


// ==========================================
// FORMAT MONEY
// ==========================================

function formatMoney(amount) {

  return `GH₵${Number(amount).toLocaleString()}`;

}


// ==========================================
// TYPE LABEL
// ==========================================

function getTypeLabel(type) {

  return type === "creator"
    ? "Creator"
    : "Customer";

}


// ==========================================
// FILTER + SORT
// ==========================================

function applyUserFilters() {

  const search =
    userSearch.value
      .trim()
      .toLowerCase();

  const status =
    userStatusFilter.value;

  const type =
    userTypeFilter.value;

  const sort =
    userSort.value;


  filteredUsers =
    users.filter(user => {

      const matchesSearch =

        !search ||

        user.name
          .toLowerCase()
          .includes(search) ||

        user.email
          .toLowerCase()
          .includes(search) ||

        user.phone
          .replace(/\s/g, "")
          .includes(search.replace(/\s/g, "")) ||

        user.id
          .toLowerCase()
          .includes(search);


      const matchesStatus =
        status === "all" ||
        user.status === status;


      const matchesType =
        type === "all" ||
        user.type === type;


      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      );

    });


  filteredUsers.sort(
    (a, b) => {

      switch (sort) {

        case "oldest":

          return (
            new Date(a.joined) -
            new Date(b.joined)
          );


        case "name":

          return a.name.localeCompare(
            b.name
          );


        case "orders":

          return b.orders - a.orders;


        case "spending":

          return b.spending - a.spending;


        case "newest":
        default:

          return (
            new Date(b.joined) -
            new Date(a.joined)
          );

      }

    }
  );


  currentPage = 1;

  renderUsers();

}


// ==========================================
// RENDER USERS
// ==========================================

function renderUsers() {

  

  const total =
    filteredUsers.length;


  if (!total) {

    usersTableBody.innerHTML = "";

    usersEmpty.hidden = false;

    userResultCount.textContent =
      "0 users";



    return;

  }


  usersEmpty.hidden = true;


  const start =
    (currentPage - 1) *
    USERS_PER_PAGE;

  const end =
    Math.min(
      start + USERS_PER_PAGE,
      total
    );


  const pageUsers =
    filteredUsers.slice(
      start,
      end
    );


  usersTableBody.innerHTML =
    pageUsers
      .map(renderUserRow)
      .join("");


  userResultCount.textContent =
    `${total.toLocaleString()} ${
      total === 1
        ? "user"
        : "users"
    }`;


}


// ==========================================
// USER ROW
// ==========================================

function renderUserRow(user) {

  return `

    <tr>

      <td>

        <div class="management-user">

          <span class="management-avatar">
            ${getInitials(user.name)}
          </span>

          <div class="management-user-info">

            <strong>
              ${escapeHTML(user.name)}
            </strong>

            <span>
              ${escapeHTML(user.email)}
            </span>

          </div>

        </div>

      </td>


      <td>

        <span class="management-type">
          ${getTypeLabel(user.type)}
        </span>

      </td>


      <td>
        ${user.orders}
      </td>


      <td>

        <strong>
          ${formatMoney(user.spending)}
        </strong>

      </td>


      <td>

        <span class="
          management-status
          ${user.status}
        ">

          ${capitalize(user.status)}

        </span>

      </td>


      <td>
        ${formatDate(user.joined)}
      </td>


      <td>

        <div class="management-action-wrapper">

          <button
            class="management-action-button"
            data-action="view"
            data-id="${user.id}"
            aria-label="View user"
          >

            <i class="ri-more-2-fill"></i>

          </button>

        </div>

      </td>

    </tr>

  `;

}


// ==========================================
// TABLE ACTION
// ==========================================

usersTableBody.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        "[data-action='view']"
      );

    if (!button) return;

    const userId =
      button.dataset.id;

    openUserDrawer(userId);

  }
);


// ==========================================
// OPEN DRAWER
// ==========================================

function openUserDrawer(userId) {

  const user =
    users.find(
      item => item.id === userId
    );

  if (!user) return;


  selectedUser = user;


  userDrawerContent.innerHTML = `

    <div class="drawer-user-profile">

      <span class="drawer-user-avatar">
        ${getInitials(user.name)}
      </span>

      <div>

        <strong>
          ${escapeHTML(user.name)}
        </strong>

        <span>
          ${escapeHTML(user.email)}
        </span>

      </div>

    </div>


    <div class="drawer-section">

      <span class="drawer-section-title">
        Account
      </span>

      <div class="drawer-info-grid">

        <div class="drawer-info-item">

          <span>
            User ID
          </span>

          <strong>
            ${user.id}
          </strong>

        </div>


        <div class="drawer-info-item">

          <span>
            Account Type
          </span>

          <strong>
            ${getTypeLabel(user.type)}
          </strong>

        </div>


        <div class="drawer-info-item">

          <span>
            Status
          </span>

          <strong>
            ${capitalize(user.status)}
          </strong>

        </div>


        <div class="drawer-info-item">

          <span>
            Joined
          </span>

          <strong>
            ${formatDate(user.joined)}
          </strong>

        </div>

      </div>

    </div>


    <div class="drawer-section">

      <span class="drawer-section-title">
        Contact
      </span>

      <div class="drawer-list">

        <div class="drawer-list-item">

          <span>
            Email
          </span>

          <strong>
            ${escapeHTML(user.email)}
          </strong>

        </div>


        <div class="drawer-list-item">

          <span>
            Phone
          </span>

          <strong>
            ${escapeHTML(user.phone)}
          </strong>

        </div>

      </div>

    </div>


    <div class="drawer-section">

      <span class="drawer-section-title">
        Activity
      </span>

      <div class="drawer-info-grid">

        <div class="drawer-info-item">

          <span>
            Orders
          </span>

          <strong>
            ${user.orders}
          </strong>

        </div>


        <div class="drawer-info-item">

          <span>
            Total Spending
          </span>

          <strong>
            ${formatMoney(user.spending)}
          </strong>

        </div>

      </div>

    </div>

  `;


  drawerSuspend.innerHTML =
    user.status === "suspended"

      ? `
        <i class="ri-user-follow-line"></i>
        Activate
      `

      : `
        <i class="ri-user-forbid-line"></i>
        Suspend
      `;


  userDrawer.classList.add("show");

  userDrawerOverlay.classList.add("show");

  document.body.style.overflow =
    "hidden";

}


// ==========================================
// CLOSE DRAWER
// ==========================================

function closeDrawer() {

  userDrawer.classList.remove("show");

  userDrawerOverlay.classList.remove(
    "show"
  );

  document.body.style.overflow = "";

  selectedUser = null;

}


closeUserDrawer.addEventListener(
  "click",
  closeDrawer
);


userDrawerOverlay.addEventListener(
  "click",
  closeDrawer
);


// ==========================================
// ESCAPE
// ==========================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape" &&
      userDrawer.classList.contains("show")
    ) {

      closeDrawer();

    }

  }
);


// ==========================================
// SUSPEND / ACTIVATE
// ==========================================

drawerSuspend.addEventListener(
  "click",
  () => {

    if (!selectedUser) return;


    const isSuspended =
      selectedUser.status === "suspended";


    const action =
      isSuspended
        ? "activate"
        : "suspend";


    const confirmed =
      confirm(
        `Are you sure you want to ${action} ${selectedUser.name}?`
      );


    if (!confirmed) return;


    selectedUser.status =
      isSuspended
        ? "active"
        : "suspended";


    updateStatistics();

    applyUserFilters();

    openUserDrawer(
      selectedUser.id
    );

  }
);


// ==========================================
// VIEW ORDERS
// ==========================================

document
  .getElementById("drawerViewOrders")
  ?.addEventListener(
    "click",
    () => {

      if (!selectedUser) return;

      window.location.href =
        `orders.html?user=${encodeURIComponent(
          selectedUser.id
        )}`;

    }
  );


// ==========================================
// SEARCH
// ==========================================

userSearch.addEventListener(
  "input",
  applyUserFilters
);


userStatusFilter.addEventListener(
  "change",
  applyUserFilters
);


userTypeFilter.addEventListener(
  "change",
  applyUserFilters
);


userSort.addEventListener(
  "change",
  applyUserFilters
);


// ==========================================
// CLEAR FILTERS
// ==========================================

function clearFilters() {

  userSearch.value = "";

  userStatusFilter.value =
    "all";

  userTypeFilter.value =
    "all";

  userSort.value =
    "newest";

  applyUserFilters();

}


clearUserFilters.addEventListener(
  "click",
  clearFilters
);


emptyClearFilters.addEventListener(
  "click",
  clearFilters
);


// ==========================================
// PAGINATION
// ==========================================
const container = 
document.getElementById("paginationButtons");

const infoElement = 
document.getElementById("paginationInfo");


renderPagination({
container: paginationButtons,
infoElement: paginationInfo,
totalItems: filteredUsers.length,

currentPage,

itemsPerPage: USERS_PER_PAGE,

onPageChange: (page) => {
  currentPage = page;

  renderUsers();
}
});


// ==========================================
// REFRESH
// ==========================================

refreshUsers.addEventListener(
  "click",
  event => {

    const button =
      event.currentTarget;

    const icon =
      button.querySelector("i");


    icon?.classList.add(
      "ri-spin"
    );

    button.disabled = true;


    setTimeout(() => {

      icon?.classList.remove(
        "ri-spin"
      );

      button.disabled = false;

      updateStatistics();

      applyUserFilters();

    }, 600);

  }
);


// ==========================================
// HELPERS
// ==========================================

function capitalize(value) {

  if (!value) return "";

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
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


function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// ==========================================
// INITIALIZE
// ==========================================

updateStatistics();

updateMonthlyUsers();

renderUsers();