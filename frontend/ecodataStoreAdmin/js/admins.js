/* =========================================================
   ADMINISTRATORS MANAGEMENT
   ========================================================= */


/* =========================================================
   STATE
   ========================================================= */

let administrators = [
  {
    id: "ADM-10001",
    name: "System Administrator",
    email: "admin@ecodata.com",
    phone: "0240000000",

    role: "super_admin",

    status: "active",

    access: "Full Access",

    permissions: {
      dashboard: "Full Access",
      users: "Full Access",
      sellers: "Full Access",
      orders: "Full Access",
      finance: "Full Access",
      settings: "Full Access"
    },

    twoFactor: "Enabled",

    lastLogin: "19 Sep 2026, 22:41",
    loginIp: "192.168.1.10",

    lastActivity: "19 Sep 2026, 22:47",
    created: "01 Jan 2026, 09:00",
    updated: "19 Sep 2026, 22:47",

    note: "Primary system administrator."
  },

  {
    id: "ADM-10002",
    name: "Operations Manager",
    email: "operations@ecodata.com",
    phone: "0550000000",

    role: "admin",

    status: "active",

    access: "Management",

    permissions: {
      dashboard: "Full Access",
      users: "Full Access",
      sellers: "Full Access",
      orders: "Full Access",
      finance: "View",
      settings: "Limited"
    },

    twoFactor: "Enabled",

    lastLogin: "19 Sep 2026, 18:21",
    loginIp: "192.168.1.21",

    lastActivity: "19 Sep 2026, 18:35",
    created: "15 Feb 2026, 10:15",
    updated: "19 Sep 2026, 18:35",

    note: "Operations and marketplace management."
  },

  {
    id: "ADM-10003",
    name: "Finance Admin",
    email: "finance@ecodata.com",
    phone: "0200000000",

    role: "admin",

    status: "active",

    access: "Finance",

    permissions: {
      dashboard: "View",
      users: "View",
      sellers: "View",
      orders: "View",
      finance: "Full Access",
      settings: "None"
    },

    twoFactor: "Enabled",

    lastLogin: "18 Sep 2026, 15:12",
    loginIp: "192.168.1.35",

    lastActivity: "18 Sep 2026, 15:20",
    created: "04 Mar 2026, 08:40",
    updated: "18 Sep 2026, 15:20",

    note: "Handles payment and withdrawal operations."
  },

  {
    id: "ADM-10004",
    name: "Support Moderator",
    email: "support@ecodata.com",
    phone: "0270000000",

    role: "support",

    status: "active",

    access: "Support",

    permissions: {
      dashboard: "View",
      users: "Limited",
      sellers: "None",
      orders: "Limited",
      finance: "None",
      settings: "None"
    },

    twoFactor: "Disabled",

    lastLogin: "18 Sep 2026, 11:42",
    loginIp: "192.168.1.44",

    lastActivity: "18 Sep 2026, 12:01",
    created: "21 Apr 2026, 13:20",
    updated: "18 Sep 2026, 12:01",

    note: "Customer and order support."
  },

  {
    id: "ADM-10005",
    name: "Content Moderator",
    email: "moderator@ecodata.com",
    phone: "0590000000",

    role: "moderator",

    status: "suspended",

    access: "Content",

    permissions: {
      dashboard: "View",
      users: "View",
      sellers: "View",
      orders: "View",
      finance: "None",
      settings: "None"
    },

    twoFactor: "Enabled",

    lastLogin: "10 Sep 2026, 09:15",
    loginIp: "192.168.1.51",

    lastActivity: "10 Sep 2026, 09:20",
    created: "02 May 2026, 14:10",
    updated: "12 Sep 2026, 16:30",

    note: "Account currently suspended."
  },

  {
    id: "ADM-10006",
    name: "Marketplace Admin",
    email: "marketplace@ecodata.com",
    phone: "0540000000",

    role: "admin",

    status: "active",

    access: "Marketplace",

    permissions: {
      dashboard: "Full Access",
      users: "Limited",
      sellers: "Full Access",
      orders: "Full Access",
      finance: "View",
      settings: "Limited"
    },

    twoFactor: "Enabled",

    lastLogin: "17 Sep 2026, 20:08",
    loginIp: "192.168.1.64",

    lastActivity: "17 Sep 2026, 20:19",
    created: "17 Jun 2026, 09:30",
    updated: "17 Sep 2026, 20:19",

    note: "Marketplace and seller management."
  },

  {
    id: "ADM-10007",
    name: "Service Moderator",
    email: "services@ecodata.com",
    phone: "0500000000",

    role: "moderator",

    status: "active",

    access: "Services",

    permissions: {
      dashboard: "View",
      users: "Limited",
      sellers: "View",
      orders: "Full Access",
      finance: "None",
      settings: "None"
    },

    twoFactor: "Enabled",

    lastLogin: "16 Sep 2026, 14:11",
    loginIp: "192.168.1.73",

    lastActivity: "16 Sep 2026, 14:20",
    created: "08 Jul 2026, 12:00",
    updated: "16 Sep 2026, 14:20",

    note: "Service request moderation."
  },

  {
    id: "ADM-10008",
    name: "Help Desk",
    email: "help@ecodata.com",
    phone: "0260000000",

    role: "support",

    status: "suspended",

    access: "Support",

    permissions: {
      dashboard: "View",
      users: "Limited",
      sellers: "None",
      orders: "Limited",
      finance: "None",
      settings: "None"
    },

    twoFactor: "Disabled",

    lastLogin: "02 Sep 2026, 08:12",
    loginIp: "192.168.1.81",

    lastActivity: "02 Sep 2026, 08:19",
    created: "11 Jul 2026, 10:00",
    updated: "03 Sep 2026, 12:30",

    note: "Support account temporarily suspended."
  }
];


let filteredAdministrators = [...administrators];

let currentAdministratorPage = 1;

const ADMINISTRATORS_PER_PAGE = 6;

let selectedAdministrator = null;


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const administratorTableBody =
  document.getElementById(
    "administratorTableBody"
  );

const administratorSearch =
  document.getElementById(
    "administratorSearch"
  );

const administratorStatusFilter =
  document.getElementById(
    "administratorStatusFilter"
  );

const administratorRoleFilter =
  document.getElementById(
    "administratorRoleFilter"
  );

const administratorSort =
  document.getElementById(
    "administratorSort"
  );

const administratorResultCount =
  document.getElementById(
    "administratorResultCount"
  );

const administratorPagination =
  document.getElementById(
    "administratorPagination"
  );

const administratorEmptyState =
  document.getElementById(
    "administratorEmptyState"
  );

const administratorDrawer =
  document.getElementById(
    "administratorDrawer"
  );

const administratorDrawerOverlay =
  document.getElementById(
    "administratorDrawerOverlay"
  );


/* =========================================================
   STATS
   ========================================================= */

function updateAdministratorStats() {

  const total =
    administrators.length;

  const active =
    administrators.filter(
      admin => admin.status === "active"
    ).length;

  const suspended =
    administrators.filter(
      admin => admin.status === "suspended"
    ).length;

  const superAdmins =
    administrators.filter(
      admin => admin.role === "super_admin"
    ).length;


  document.getElementById(
    "totalAdministrators"
  ).textContent = total;


  document.getElementById(
    "activeAdministrators"
  ).textContent = active;


  document.getElementById(
    "suspendedAdministrators"
  ).textContent = suspended;


  document.getElementById(
    "superAdministrators"
  ).textContent = superAdmins;


  document.getElementById(
    "administratorActivity"
  ).textContent =
    administrators.length
      ? "Today"
      : "—";
}


/* =========================================================
   INITIAL FILTER DATA
   ========================================================= */

function applyAdministratorFilters() {

  const search =
    administratorSearch
      ? administratorSearch.value
          .trim()
          .toLowerCase()
      : "";

  const status =
    administratorStatusFilter
      ? administratorStatusFilter.value
      : "all";

  const role =
    administratorRoleFilter
      ? administratorRoleFilter.value
      : "all";

  const sort =
    administratorSort
      ? administratorSort.value
      : "newest";


  filteredAdministrators =
    administrators.filter(admin => {

      const matchesSearch =
        !search ||

        admin.id
          .toLowerCase()
          .includes(search) ||

        admin.name
          .toLowerCase()
          .includes(search) ||

        admin.email
          .toLowerCase()
          .includes(search);


      const matchesStatus =
        status === "all" ||
        admin.status === status;


      const matchesRole =
        role === "all" ||
        admin.role === role;


      return (
        matchesSearch &&
        matchesStatus &&
        matchesRole
      );

    });


  sortAdministrators(sort);


  currentAdministratorPage = 1;

  renderAdministrators();
}


/* =========================================================
   SORT
   ========================================================= */

function sortAdministrators(sort) {

  if (sort === "name_az") {

    filteredAdministrators.sort(
      (a, b) =>
        a.name.localeCompare(b.name)
    );

    return;
  }


  if (sort === "name_za") {

    filteredAdministrators.sort(
      (a, b) =>
        b.name.localeCompare(a.name)
    );

    return;
  }


  if (sort === "recent_activity") {

    filteredAdministrators.sort(
      (a, b) =>
        b.lastActivity.localeCompare(
          a.lastActivity
        )
    );

    return;
  }


  if (sort === "oldest") {

    filteredAdministrators.reverse();

    return;
  }


  if (sort === "newest") {

    filteredAdministrators.sort(
      (a, b) =>
        b.id.localeCompare(a.id)
    );

    return;
  }


  if (sort === "highest") {

    return;
  }
}


/* =========================================================
   ROLE LABEL
   ========================================================= */

function getAdministratorRoleLabel(role) {

  const labels = {

    super_admin: "Super Admin",

    admin: "Administrator",

    moderator: "Moderator",

    support: "Support"

  };


  return labels[role] || role;
}


/* =========================================================
   ROLE CLASS
   ========================================================= */

function getAdministratorRoleClass(role) {

  const classes = {

    super_admin:
      "administrator-role-super",

    admin:
      "administrator-role-admin",

    moderator:
      "administrator-role-moderator",

    support:
      "administrator-role-support"

  };


  return classes[role] ||
    "administrator-role-admin";
}


/* =========================================================
   STATUS LABEL
   ========================================================= */

function getAdministratorStatusLabel(status) {

  return status === "active"
    ? "Active"
    : "Suspended";
}


/* =========================================================
   STATUS CLASS
   ========================================================= */

function getAdministratorStatusClass(status) {

  return status === "active"
    ? "administrator-status-active"
    : "administrator-status-suspended";
}


/* =========================================================
   AVATAR
   ========================================================= */

function getInitials(name) {

  if (!name) return "A";


  return name
    .split(" ")
    .slice(0, 2)
    .map(word =>
      word.charAt(0)
    )
    .join("")
    .toUpperCase();
}


/* =========================================================
   TABLE
   ========================================================= */

function renderAdministrators() {

  if (!administratorTableBody) return;


  const totalItems =
    filteredAdministrators.length;


  administratorResultCount.textContent =
    `${totalItems} ${
      totalItems === 1
        ? "administrator"
        : "administrators"
    }`;


  if (totalItems === 0) {

    administratorTableBody.innerHTML = "";

    administratorEmptyState.hidden = false;

    renderAdministratorPagination();

    return;
  }


  administratorEmptyState.hidden = true;


  const start =
    (currentAdministratorPage - 1) *
    ADMINISTRATORS_PER_PAGE;


  const end =
    start +
    ADMINISTRATORS_PER_PAGE;


  const pageItems =
    filteredAdministrators.slice(
      start,
      end
    );


  administratorTableBody.innerHTML =
    pageItems.map(admin => {

      const initials =
        getInitials(admin.name);


      return `

        <tr data-id="${admin.id}">

          <!-- ADMINISTRATOR -->

          <td>

            <div class="administrator-cell">

              <div class="administrator-avatar">
                ${initials}
              </div>

              <div class="administrator-info">

                <strong>
                  ${admin.name}
                </strong>

                <span>
                  ${admin.id}
                </span>

              </div>

            </div>

          </td>


          <!-- ROLE -->

          <td>

            <span
              class="
                administrator-role-badge
                ${getAdministratorRoleClass(admin.role)}
              "
            >

              ${getAdministratorRoleLabel(admin.role)}

            </span>

          </td>


          <!-- EMAIL -->

          <td>

            <span class="administrator-email">
              ${admin.email}
            </span>

          </td>


          <!-- ACCESS -->

          <td>

            <span class="administrator-access">

              <i class="ri-lock-unlock-line"></i>

              ${admin.access}

            </span>

          </td>


          <!-- STATUS -->

          <td>

            <span
              class="
                administrator-status-badge
                ${getAdministratorStatusClass(admin.status)}
              "
            >

              <i class="${
                admin.status === "active"
                  ? "ri-checkbox-circle-line"
                  : "ri-pause-circle-line"
              }"></i>

              ${getAdministratorStatusLabel(
                admin.status
              )}

            </span>

          </td>


          <!-- ACTIVITY -->

          <td>

            <div class="administrator-date">

              <strong>
                ${admin.lastActivity.split(",")[0]}
              </strong>

              <span>
                ${admin.lastActivity.split(",").slice(1).join(",")}
              </span>

            </div>

          </td>


          <!-- CREATED -->

          <td>

            <div class="administrator-date">

              <strong>
                ${admin.created.split(",")[0]}
              </strong>

              <span>
                ${admin.created.split(",").slice(1).join(",")}
              </span>

            </div>

          </td>


          <!-- ACTION -->

          <td>

            <div class="administrator-action-wrap">

              <button
                class="administrator-action-btn"
                type="button"
                data-action-menu="${admin.id}"
                aria-label="Administrator actions"
              >

                <i class="ri-more-2-fill"></i>

              </button>


              <div
                class="administrator-action-menu"
                data-menu="${admin.id}"
              >

                <button
                  type="button"
                  data-action="view"
                  data-id="${admin.id}"
                >

                  <i class="ri-eye-line"></i>

                  View Details

                </button>


                <button
                  type="button"
                  data-action="edit"
                  data-id="${admin.id}"
                >

                  <i class="ri-edit-line"></i>

                  Edit

                </button>


                ${
                  admin.status === "active"

                  ? `

                    <button
                      type="button"
                      data-action="suspend"
                      data-id="${admin.id}"
                    >

                      <i class="ri-pause-circle-line"></i>

                      Suspend

                    </button>

                  `

                  : `

                    <button
                      type="button"
                      data-action="activate"
                      data-id="${admin.id}"
                    >

                      <i class="ri-play-circle-line"></i>

                      Activate

                    </button>

                  `
                }


                <button
                  type="button"
                  class="danger"
                  data-action="delete"
                  data-id="${admin.id}"
                >

                  <i class="ri-delete-bin-line"></i>

                  Delete

                </button>

              </div>

            </div>

          </td>

        </tr>

      `;

    }).join("");


  renderAdministratorPagination();

}


/* =========================================================
   PAGINATION
   ========================================================= */

function renderAdministratorPagination() {

  if (!administratorPagination) return;


  const totalItems =
    filteredAdministrators.length;


  const totalPages =
    Math.ceil(
      totalItems /
      ADMINISTRATORS_PER_PAGE
    );


  administratorPagination.innerHTML = "";


  if (totalPages <= 1) {

    return;

  }


  const previous =
    document.createElement("button");

  previous.type = "button";

  previous.innerHTML =
    `<i class="ri-arrow-left-s-line"></i>`;

  previous.disabled =
    currentAdministratorPage === 1;


  previous.addEventListener(
    "click",
    () => {

      if (
        currentAdministratorPage <= 1
      ) return;

      currentAdministratorPage--;

      renderAdministrators();

    }
  );


  administratorPagination.appendChild(
    previous
  );


  const pages = [];


  pages.push(1);


  const startPage =
    Math.max(
      2,
      currentAdministratorPage - 1
    );


  const endPage =
    Math.min(
      totalPages - 1,
      currentAdministratorPage + 1
    );


  if (startPage > 2) {

    pages.push("...");

  }


  for (
    let page = startPage;
    page <= endPage;
    page++
  ) {

    pages.push(page);

  }


  if (
    endPage <
    totalPages - 1
  ) {

    pages.push("...");

  }


  if (totalPages > 1) {

    pages.push(totalPages);

  }


  pages.forEach(page => {

    if (page === "...") {

      const ellipsis =
        document.createElement("span");

      ellipsis.textContent = "...";

      ellipsis.style.padding =
        "0 5px";

      ellipsis.style.color =
        "var(--admin-text-muted)";

      administratorPagination.appendChild(
        ellipsis
      );

      return;

    }


    const button =
      document.createElement("button");

    button.type = "button";

    button.textContent = page;


    if (
      page ===
      currentAdministratorPage
    ) {

      button.classList.add("active");

    }


    button.addEventListener(
      "click",
      () => {

        currentAdministratorPage =
          page;

        renderAdministrators();

      }
    );


    administratorPagination.appendChild(
      button
    );

  });


  const next =
    document.createElement("button");

  next.type = "button";

  next.innerHTML =
    `<i class="ri-arrow-right-s-line"></i>`;

  next.disabled =
    currentAdministratorPage ===
    totalPages;


  next.addEventListener(
    "click",
    () => {

      if (
        currentAdministratorPage >=
        totalPages
      ) return;

      currentAdministratorPage++;

      renderAdministrators();

    }
  );


  administratorPagination.appendChild(
    next
  );

}


/* =========================================================
   OPEN DRAWER
   ========================================================= */

function openAdministratorDrawer(id) {

  const admin =
    administrators.find(
      item => item.id === id
    );


  if (!admin || !administratorDrawer)
    return;


  selectedAdministrator = admin;


  document.getElementById(
    "drawerAdministratorId"
  ).textContent =
    admin.id;


  document.getElementById(
    "drawerAdministratorAvatar"
  ).textContent =
    getInitials(admin.name);


  document.getElementById(
    "drawerAdministratorName"
  ).textContent =
    admin.name;


  document.getElementById(
    "drawerAdministratorEmail"
  ).textContent =
    admin.email;


  document.getElementById(
    "drawerAdministratorPhone"
  ).textContent =
    admin.phone;


  document.getElementById(
    "drawerAdministratorAccountId"
  ).textContent =
    admin.id;


  document.getElementById(
    "drawerAdministratorRole"
  ).textContent =
    getAdministratorRoleLabel(
      admin.role
    );


  document.getElementById(
    "drawerAdministratorStatusText"
  ).textContent =
    getAdministratorStatusLabel(
      admin.status
    );


  document.getElementById(
    "drawerAdministratorCreated"
  ).textContent =
    admin.created;


  document.getElementById(
    "drawerAdministratorUpdated"
  ).textContent =
    admin.updated;


  document.getElementById(
    "drawerAdministratorLastActivity"
  ).textContent =
    admin.lastActivity;


  document.getElementById(
    "permissionDashboard"
  ).textContent =
    admin.permissions.dashboard;


  document.getElementById(
    "permissionUsers"
  ).textContent =
    admin.permissions.users;


  document.getElementById(
    "permissionSellers"
  ).textContent =
    admin.permissions.sellers;


  document.getElementById(
    "permissionOrders"
  ).textContent =
    admin.permissions.orders;


  document.getElementById(
    "permissionFinance"
  ).textContent =
    admin.permissions.finance;


  document.getElementById(
    "permissionSettings"
  ).textContent =
    admin.permissions.settings;


  document.getElementById(
    "drawerTwoFactor"
  ).textContent =
    admin.twoFactor;


  document.getElementById(
    "drawerLastLogin"
  ).textContent =
    admin.lastLogin;


  document.getElementById(
    "drawerLoginIp"
  ).textContent =
    admin.loginIp;


  document.getElementById(
    "drawerAdministratorNote"
  ).textContent =
    admin.note || "No note added.";


  const statusContainer =
    document.getElementById(
      "drawerAdministratorStatus"
    );


  statusContainer.innerHTML = `

    <span
      class="
        administrator-status-badge
        ${getAdministratorStatusClass(admin.status)}
      "
    >

      <i class="${
        admin.status === "active"
          ? "ri-checkbox-circle-line"
          : "ri-pause-circle-line"
      }"></i>

      ${getAdministratorStatusLabel(
        admin.status
      )}

    </span>

  `;


  const suspendButton =
    document.getElementById(
      "suspendAdministratorBtn"
    );


  if (admin.status === "active") {

    suspendButton.innerHTML = `
      <i class="ri-pause-circle-line"></i>
      Suspend
    `;

  } else {

    suspendButton.innerHTML = `
      <i class="ri-play-circle-line"></i>
      Activate
    `;

  }


  administratorDrawer.classList.add(
    "open"
  );

  administratorDrawer.setAttribute(
    "aria-hidden",
    "false"
  );


  administratorDrawerOverlay.classList.add(
    "open"
  );


  document.body.classList.add(
    "drawer-open"
  );

}


/* =========================================================
   CLOSE DRAWER
   ========================================================= */

function closeAdministratorDrawer() {

  if (!administratorDrawer)
    return;


  administratorDrawer.classList.remove(
    "open"
  );


  administratorDrawer.setAttribute(
    "aria-hidden",
    "true"
  );


  administratorDrawerOverlay.classList.remove(
    "open"
  );


  document.body.classList.remove(
    "drawer-open"
  );


  selectedAdministrator = null;

}


/* =========================================================
   UPDATE ADMIN STATUS
   ========================================================= */

function updateAdministratorStatus(
  id,
  status
) {

  const admin =
    administrators.find(
      item => item.id === id
    );


  if (!admin) return;


  admin.status = status;

  admin.updated =
    new Date().toLocaleString();


  admin.lastActivity =
    new Date().toLocaleString();


  updateAdministratorStats();

  applyAdministratorFilters();


  if (
    selectedAdministrator &&
    selectedAdministrator.id === id
  ) {

    openAdministratorDrawer(id);

  }

}


/* =========================================================
   DELETE ADMINISTRATOR
   ========================================================= */

function deleteAdministrator(id) {

  const admin =
    administrators.find(
      item => item.id === id
    );


  if (!admin) return;


  /*
   * Prevent deleting the last
   * super administrator.
   */

  if (
    admin.role === "super_admin" &&
    administrators.filter(
      item =>
        item.role === "super_admin"
    ).length <= 1
  ) {

    alert(
      "The last Super Admin cannot be deleted."
    );

    return;

  }


  const confirmed =
    confirm(
      `Delete administrator "${admin.name}"?`
    );


  if (!confirmed) return;


  administrators =
    administrators.filter(
      item => item.id !== id
    );


  updateAdministratorStats();

  applyAdministratorFilters();


  closeAdministratorDrawer();

}


/* =========================================================
   ACTION MENU
   ========================================================= */

document.addEventListener(
  "click",
  event => {

    const menuButton =
      event.target.closest(
        "[data-action-menu]"
      );


    if (menuButton) {

      event.stopPropagation();


      const id =
        menuButton.dataset.actionMenu;


      document
        .querySelectorAll(
          ".administrator-action-menu"
        )
        .forEach(menu => {

          if (
            menu.dataset.menu !== id
          ) {

            menu.classList.remove(
              "open"
            );

          }

        });


      const menu =
        document.querySelector(
          `[data-menu="${id}"]`
        );


      if (menu) {

        menu.classList.toggle(
          "open"
        );

      }


      return;

    }


    const actionButton =
      event.target.closest(
        ".administrator-action-menu button"
      );


    if (actionButton) {

      const action =
        actionButton.dataset.action;

      const id =
        actionButton.dataset.id;


      document
        .querySelectorAll(
          ".administrator-action-menu"
        )
        .forEach(menu =>
          menu.classList.remove("open")
        );


      if (action === "view") {

        openAdministratorDrawer(id);

      }


      if (action === "edit") {

        openAdministratorDrawer(id);

        /*
         * Connect your edit modal/form here.
         */

      }


      if (action === "suspend") {

        updateAdministratorStatus(
          id,
          "suspended"
        );

      }


      if (action === "activate") {

        updateAdministratorStatus(
          id,
          "active"
        );

      }


      if (action === "delete") {

        deleteAdministrator(id);

      }


      return;

    }


    /*
     * Close action menus when
     * clicking elsewhere.
     */

    if (
      !event.target.closest(
        ".administrator-action-wrap"
      )
    ) {

      document
        .querySelectorAll(
          ".administrator-action-menu"
        )
        .forEach(menu =>
          menu.classList.remove("open")
        );

    }

  }
);


/* =========================================================
   SEARCH
   ========================================================= */

if (administratorSearch) {

  administratorSearch.addEventListener(
    "input",
    applyAdministratorFilters
  );

}


/* =========================================================
   FILTERS
   ========================================================= */

if (administratorStatusFilter) {

  administratorStatusFilter.addEventListener(
    "change",
    applyAdministratorFilters
  );

}


if (administratorRoleFilter) {

  administratorRoleFilter.addEventListener(
    "change",
    applyAdministratorFilters
  );

}


if (administratorSort) {

  administratorSort.addEventListener(
    "change",
    applyAdministratorFilters
  );

}


/* =========================================================
   CLEAR FILTERS
   ========================================================= */

function clearAdministratorFilters() {

  if (administratorSearch)
    administratorSearch.value = "";


  if (administratorStatusFilter)
    administratorStatusFilter.value =
      "all";


  if (administratorRoleFilter)
    administratorRoleFilter.value =
      "all";


  if (administratorSort)
    administratorSort.value =
      "newest";


  applyAdministratorFilters();

}


document.getElementById(
  "clearAdministratorFilters"
)?.addEventListener(
  "click",
  clearAdministratorFilters
);


document.getElementById(
  "emptyClearAdministratorFilters"
)?.addEventListener(
  "click",
  clearAdministratorFilters
);


/* =========================================================
   DRAWER EVENTS
   ========================================================= */

document.getElementById(
  "closeAdministratorDrawer"
)?.addEventListener(
  "click",
  closeAdministratorDrawer
);


administratorDrawerOverlay?.addEventListener(
  "click",
  closeAdministratorDrawer
);


/* =========================================================
   ESCAPE KEY
   ========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape" &&
      administratorDrawer?.classList.contains(
        "open"
      )
    ) {

      closeAdministratorDrawer();

    }

  }
);


/* =========================================================
   SUSPEND / ACTIVATE
   ========================================================= */

document.getElementById(
  "suspendAdministratorBtn"
)?.addEventListener(
  "click",
  () => {

    if (!selectedAdministrator)
      return;


    const newStatus =
      selectedAdministrator.status ===
      "active"
        ? "suspended"
        : "active";


    updateAdministratorStatus(
      selectedAdministrator.id,
      newStatus
    );

  }
);


/* =========================================================
   DELETE
   ========================================================= */

document.getElementById(
  "deleteAdministratorBtn"
)?.addEventListener(
  "click",
  () => {

    if (!selectedAdministrator)
      return;


    deleteAdministrator(
      selectedAdministrator.id
    );

  }
);


/* =========================================================
   EDIT
   ========================================================= */

document.getElementById(
  "editAdministratorBtn"
)?.addEventListener(
  "click",
  () => {

    if (!selectedAdministrator)
      return;


    /*
     * Replace this with your
     * administrator edit modal.
     */

    alert(
      `Edit ${selectedAdministrator.name}`
    );

  }
);


/* =========================================================
   ADD ADMINISTRATOR
   ========================================================= */

document.getElementById(
  "addAdministratorBtn"
)?.addEventListener(
  "click",
  () => {

    /*
     * Replace this with your
     * Add Administrator modal/form.
     */

    alert(
      "Add Administrator form will open here."
    );

  }
);


/* =========================================================
   REFRESH
   ========================================================= */

function refreshAdministrators() {

  /*
   * Later this can fetch the
   * administrators from Firestore/API.
   */

  updateAdministratorStats();

  applyAdministratorFilters();

}


document.getElementById(
  "refreshAdministrators"
)?.addEventListener(
  "click",
  refreshAdministrators
);


/* =========================================================
   INITIALIZE
   ========================================================= */

updateAdministratorStats();

applyAdministratorFilters();