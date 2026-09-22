// =========================================================
// ADMINISTRATOR ACTIVITY LOG
// DEMO VERSION
// =========================================================


// =========================================================
// DEMO DATA
// =========================================================

let activityLogs = [

  {
    id: "ACT-10001",
    title: "New order received",
    description:
      "Administrator viewed a newly received MTN Data Express order.",
    actor: "Administrator",
    actorType: "admin",
    action: "viewed",
    type: "order",
    target: "Order ED-78432",
    date: "2026-09-22T01:08:00",
    ip: "192.168.1.20"
  },

  {
    id: "ACT-10002",
    title: "Order status updated",
    description:
      "Order ED-78429 was updated from processing to delivered.",
    actor: "Administrator",
    actorType: "admin",
    action: "updated",
    type: "order",
    target: "Order ED-78429",
    date: "2026-09-22T00:54:00",
    ip: "192.168.1.20"
  },

  {
    id: "ACT-10003",
    title: "Payment reviewed",
    description:
      "Administrator opened and reviewed payment PAY-10045.",
    actor: "Administrator",
    actorType: "admin",
    action: "viewed",
    type: "payment",
    target: "PAY-10045",
    date: "2026-09-22T00:41:00",
    ip: "192.168.1.20"
  },

  {
    id: "ACT-10004",
    title: "Product approved",
    description:
      "Administrator approved a marketplace product for publication.",
    actor: "Administrator",
    actorType: "admin",
    action: "approved",
    type: "marketplace",
    target: "Digital CV Template",
    date: "2026-09-21T23:48:00",
    ip: "192.168.1.20"
  },

  {
    id: "ACT-10005",
    title: "Leaderboard points updated",
    description:
      "Administrator manually updated customer leaderboard points.",
    actor: "Administrator",
    actorType: "admin",
    action: "updated",
    type: "system",
    target: "Leaderboard",
    date: "2026-09-21T22:36:00",
    ip: "192.168.1.20"
  },

  {
    id: "ACT-10006",
    title: "User profile viewed",
    description:
      "Administrator opened a user profile from the customer management page.",
    actor: "Administrator",
    actorType: "admin",
    action: "viewed",
    type: "user",
    target: "User ECO-2041",
    date: "2026-09-21T21:20:00",
    ip: "192.168.1.20"
  },

  {
    id: "ACT-10007",
    title: "Administrator login",
    description:
      "Administrator successfully signed into the dashboard.",
    actor: "Administrator",
    actorType: "admin",
    action: "login",
    type: "security",
    target: "Admin Dashboard",
    date: "2026-09-21T20:10:00",
    ip: "192.168.1.20"
  },

  {
    id: "ACT-10008",
    title: "Settings updated",
    description:
      "Administrator updated dashboard notification preferences.",
    actor: "Administrator",
    actorType: "admin",
    action: "updated",
    type: "settings",
    target: "Notification Settings",
    date: "2026-09-21T19:45:00",
    ip: "192.168.1.20"
  },

  {
    id: "ACT-10009",
    title: "Order deleted",
    description:
      "Administrator deleted an order document from the order management system.",
    actor: "Administrator",
    actorType: "admin",
    action: "deleted",
    type: "order",
    target: "Order ED-78398",
    date: "2026-09-21T18:32:00",
    ip: "192.168.1.20"
  },

  {
    id: "ACT-10010",
    title: "Vendor status synchronized",
    description:
      "System synchronized order status information with the delivery vendor.",
    actor: "System",
    actorType: "system",
    action: "updated",
    type: "system",
    target: "Order Status API",
    date: "2026-09-21T17:58:00",
    ip: "SYSTEM"
  },

  {
    id: "ACT-10011",
    title: "Payment verification failed",
    description:
      "A payment verification attempt failed during automatic processing.",
    actor: "System",
    actorType: "system",
    action: "failed",
    type: "payment",
    target: "PAY-10038",
    date: "2026-09-21T16:41:00",
    ip: "SYSTEM"
  },

  {
    id: "ACT-10012",
    title: "Seller application approved",
    description:
      "Administrator approved a marketplace seller application.",
    actor: "Administrator",
    actorType: "admin",
    action: "approved",
    type: "marketplace",
    target: "Seller Application #204",
    date: "2026-09-21T15:27:00",
    ip: "192.168.1.20"
  },

  {
    id: "ACT-10013",
    title: "User account updated",
    description:
      "Administrator updated account information for a registered user.",
    actor: "Administrator",
    actorType: "admin",
    action: "updated",
    type: "user",
    target: "User ECO-1987",
    date: "2026-09-21T14:18:00",
    ip: "192.168.1.20"
  },

  {
    id: "ACT-10014",
    title: "Administrator logout",
    description:
      "Administrator signed out of the dashboard.",
    actor: "Administrator",
    actorType: "admin",
    action: "logout",
    type: "security",
    target: "Admin Dashboard",
    date: "2026-09-21T13:42:00",
    ip: "192.168.1.20"
  },

  {
    id: "ACT-10015",
    title: "System backup completed",
    description:
      "The scheduled system backup completed successfully.",
    actor: "System",
    actorType: "system",
    action: "created",
    type: "system",
    target: "Database Backup",
    date: "2026-09-21T03:00:00",
    ip: "SYSTEM"
  },

  {
    id: "ACT-10016",
    title: "Marketplace product updated",
    description:
      "Administrator updated product information before publication.",
    actor: "Administrator",
    actorType: "admin",
    action: "updated",
    type: "marketplace",
    target: "BECE Notes PDF",
    date: "2026-09-20T21:14:00",
    ip: "192.168.1.20"
  }

];


// =========================================================
// STATE
// =========================================================

let currentActivityPage = 1;

const activitiesPerPage = 8;

let selectedActivityId = null;


// =========================================================
// INITIALIZE
// =========================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initializeActivityLog();

  }
);


// =========================================================
// INITIALIZE ACTIVITY LOG
// =========================================================

function initializeActivityLog() {

  setupActivityFilters();

  setupActivityActions();

  setupActivityDrawer();

  renderActivityLog();

}


// =========================================================
// FILTER SETUP
// =========================================================

function setupActivityFilters() {

  const search =
    document.getElementById(
      "activitySearch"
    );

  const type =
    document.getElementById(
      "activityTypeFilter"
    );

  const actor =
    document.getElementById(
      "activityActorFilter"
    );

  const action =
    document.getElementById(
      "activityActionFilter"
    );

  const clear =
    document.getElementById(
      "clearActivityFilters"
    );


  if (search) {

    search.addEventListener(
      "input",
      () => {

        currentActivityPage = 1;

        renderActivityLog();

      }
    );

  }


  if (type) {

    type.addEventListener(
      "change",
      () => {

        currentActivityPage = 1;

        renderActivityLog();

      }
    );

  }


  if (actor) {

    actor.addEventListener(
      "change",
      () => {

        currentActivityPage = 1;

        renderActivityLog();

      }
    );

  }


  if (action) {

    action.addEventListener(
      "change",
      () => {

        currentActivityPage = 1;

        renderActivityLog();

      }
    );

  }


  if (clear) {

    clear.addEventListener(
      "click",
      () => {

        if (search) {
          search.value = "";
        }

        if (type) {
          type.value = "all";
        }

        if (actor) {
          actor.value = "all";
        }

        if (action) {
          action.value = "all";
        }

        currentActivityPage = 1;

        renderActivityLog();

      }
    );

  }

}


// =========================================================
// HEADER ACTIONS
// =========================================================

function setupActivityActions() {

  const refresh =
    document.getElementById(
      "refreshActivityLog"
    );

  const exportButton =
    document.getElementById(
      "exportActivityLog"
    );


  if (refresh) {

    refresh.addEventListener(
      "click",
      () => {

        refresh.classList.add(
          "is-loading"
        );


        setTimeout(
          () => {

            renderActivityLog();

            refresh.classList.remove(
              "is-loading"
            );

            showActivityMessage(
              "Activity log refreshed."
            );

          },
          450
        );

      }
    );

  }


  if (exportButton) {

    exportButton.addEventListener(
      "click",
      exportActivityData
    );

  }

}


// =========================================================
// FILTERED ACTIVITIES
// =========================================================

function getFilteredActivities() {

  const search =
    document
      .getElementById(
        "activitySearch"
      )
      ?.value
      .trim()
      .toLowerCase() || "";


  const type =
    document
      .getElementById(
        "activityTypeFilter"
      )
      ?.value || "all";


  const actor =
    document
      .getElementById(
        "activityActorFilter"
      )
      ?.value || "all";


  const action =
    document
      .getElementById(
        "activityActionFilter"
      )
      ?.value || "all";


  return activityLogs.filter(
    activity => {

      const matchesSearch =
        !search ||

        activity.title
          .toLowerCase()
          .includes(search) ||

        activity.description
          .toLowerCase()
          .includes(search) ||

        activity.target
          .toLowerCase()
          .includes(search) ||

        activity.id
          .toLowerCase()
          .includes(search);


      const matchesType =
        type === "all" ||
        activity.type === type;


      const matchesActor =
        actor === "all" ||
        activity.actorType === actor;


      const matchesAction =
        action === "all" ||
        activity.action === action;


      return (
        matchesSearch &&
        matchesType &&
        matchesActor &&
        matchesAction
      );

    }
  );

}


// =========================================================
// RENDER ACTIVITY LOG
// =========================================================

function renderActivityLog() {

  updateActivityStats();


  const filtered =
    getFilteredActivities();


  const tableBody =
    document.getElementById(
      "activityTableBody"
    );


  const resultCount =
    document.getElementById(
      "activityResultCount"
    );


  if (!tableBody) return;


  const total =
    filtered.length;


  const start =
    (currentActivityPage - 1) *
    activitiesPerPage;


  const end =
    start +
    activitiesPerPage;


  const pageItems =
    filtered.slice(
      start,
      end
    );


  if (resultCount) {

    resultCount.textContent =
      `Showing ${total} activit${total === 1 ? "y" : "ies"}`;

  }


  if (!pageItems.length) {

    tableBody.innerHTML = `

      <tr>

        <td colspan="6">

          <div class="admin-empty-state">

            <i class="ri-history-line"></i>

            <strong>
              No activity found
            </strong>

            <span>
              Try changing your search or filter options.
            </span>

          </div>

        </td>

      </tr>

    `;

  } else {

    tableBody.innerHTML =
      pageItems
        .map(
          createActivityRow
        )
        .join("");

  }


  setupActivityRowActions();


  renderActivityPagination(
    total
  );

}


// =========================================================
// CREATE ACTIVITY ROW
// =========================================================

function createActivityRow(
  activity
) {

  const icon =
    getActivityIcon(
      activity.type
    );


  const date =
    formatActivityDate(
      activity.date
    );


  return `

    <tr>

      <td>

        <div class="activity-main">

          <div class="activity-row-icon">

            <i class="${icon}"></i>

          </div>


          <div class="activity-main-content">

            <strong>
              ${escapeHTML(
                activity.title
              )}
            </strong>

            <span>
              ${escapeHTML(
                activity.description
              )}
            </span>

          </div>

        </div>

      </td>


      <td>

        <div class="activity-actor">

          <div class="activity-actor-avatar">

            ${getActorInitial(
              activity.actor
            )}

          </div>


          <div class="activity-actor-info">

            <strong>
              ${escapeHTML(
                activity.actor
              )}
            </strong>

            <span>
              ${capitalize(
                activity.actorType
              )}
            </span>

          </div>

        </div>

      </td>


      <td>

        <span
          class="
            activity-action-badge
            action-${activity.action}
          "
        >

          ${escapeHTML(
            activity.action
          )}

        </span>

      </td>


      <td>

        <span class="activity-target">

          ${escapeHTML(
            activity.target
          )}

        </span>

      </td>


      <td>

        <div class="activity-date">

          <strong>
            ${date.date}
          </strong>

          <span>
            ${date.time}
          </span>

        </div>

      </td>


      <td>

        <button
          type="button"
          class="activity-view-button"
          data-activity-id="${activity.id}"
          aria-label="View activity details"
        >

          <i class="ri-eye-line"></i>

        </button>

      </td>

    </tr>

  `;

}


// =========================================================
// ROW ACTIONS
// =========================================================

function setupActivityRowActions() {

  document
    .querySelectorAll(
      ".activity-view-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            openActivityDrawer(
              button.dataset.activityId
            );

          }
        );

      }
    );

}


// =========================================================
// STATISTICS
// =========================================================

function updateActivityStats() {

  const total =
    activityLogs.length;


  const today =
    activityLogs.filter(
      activity =>
        isToday(
          activity.date
        )
    ).length;


  const admin =
    activityLogs.filter(
      activity =>
        activity.actorType === "admin"
    ).length;


  const system =
    activityLogs.filter(
      activity =>
        activity.actorType === "system"
    ).length;


  const security =
    activityLogs.filter(
      activity =>
        activity.type === "security"
    ).length;


  setText(
    "totalActivities",
    total.toLocaleString()
  );


  setText(
    "todayActivities",
    today.toLocaleString()
  );


  setText(
    "adminActivities",
    admin.toLocaleString()
  );


  setText(
    "systemActivities",
    system.toLocaleString()
  );


  setText(
    "securityActivities",
    security.toLocaleString()
  );

}


// =========================================================
// PAGINATION
// =========================================================

function renderActivityPagination(
  totalItems
) {

  const container =
    document.getElementById(
      "activityPagination"
    );


  const info =
    document.getElementById(
      "activityPaginationInfo"
    );


  if (!container) return;


  const totalPages =
    Math.ceil(
      totalItems /
      activitiesPerPage
    );


  if (!totalPages) {

    container.innerHTML = "";

    if (info) {
      info.textContent =
        "Showing 0 of 0";
    }

    return;

  }


  const start =
    (currentActivityPage - 1) *
    activitiesPerPage + 1;


  const end =
    Math.min(
      currentActivityPage *
      activitiesPerPage,
      totalItems
    );


  if (info) {

    info.textContent =
      `Showing ${start}–${end} of ${totalItems}`;

  }


  if (totalPages <= 1) {

    container.innerHTML = "";

    return;

  }


  let html = "";


  html += `

    <button
      type="button"
      aria-label="Previous page"
      data-page="${currentActivityPage - 1}"
      ${currentActivityPage === 1 ? "disabled" : ""}
    >

      <i class="ri-arrow-left-s-line"></i>

    </button>

  `;


  for (
    let page = 1;
    page <= totalPages;
    page++
  ) {

    html += `

      <button
        type="button"
        class="
          ${page === currentActivityPage
            ? "active"
            : ""}
        "
        data-page="${page}"
      >

        ${page}

      </button>

    `;

  }


  html += `

    <button
      type="button"
      aria-label="Next page"
      data-page="${currentActivityPage + 1}"
      ${currentActivityPage === totalPages ? "disabled" : ""}
    >

      <i class="ri-arrow-right-s-line"></i>

    </button>

  `;


  container.innerHTML =
    html;


  container
    .querySelectorAll(
      "[data-page]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const page =
              Number(
                button.dataset.page
              );


            if (
              page < 1 ||
              page > totalPages
            ) return;


            currentActivityPage =
              page;


            renderActivityLog();

          }
        );

      }
    );

}


// =========================================================
// DRAWER
// =========================================================

function setupActivityDrawer() {

  const drawer =
    document.getElementById(
      "activityDrawer"
    );


  const close =
    document.getElementById(
      "closeActivityDrawer"
    );


  const closeButton =
    document.getElementById(
      "closeActivityDrawerButton"
    );


  if (close) {

    close.addEventListener(
      "click",
      closeActivityDrawer
    );

  }


  if (closeButton) {

    closeButton.addEventListener(
      "click",
      closeActivityDrawer
    );

  }


  if (drawer) {

    drawer.addEventListener(
      "click",
      event => {

        if (
          event.target === drawer
        ) {

          closeActivityDrawer();

        }

      }
    );

  }

}


// =========================================================
// OPEN DRAWER
// =========================================================

function openActivityDrawer(id) {

  const activity =
    activityLogs.find(
      item =>
        item.id === id
    );


  if (!activity) return;


  selectedActivityId =
    activity.id;


  setText(
    "activityDetailTitle",
    activity.title
  );


  setText(
    "activityDetailDescription",
    activity.description
  );


  setText(
    "activityDetailId",
    activity.id
  );


  setText(
    "activityDetailActor",
    activity.actor
  );


  setText(
    "activityDetailAction",
    capitalize(
      activity.action
    )
  );


  setText(
    "activityDetailType",
    capitalize(
      activity.type
    )
  );


  setText(
    "activityDetailTarget",
    activity.target
  );


  setText(
    "activityDetailDate",
    formatFullDate(
      activity.date
    )
  );


  setText(
    "activityDetailIP",
    activity.ip
  );


  const icon =
    document.getElementById(
      "activityDetailIcon"
    );


  if (icon) {

    icon.innerHTML =
      `<i class="${getActivityIcon(
        activity.type
      )}"></i>`;

  }


  const drawer =
    document.getElementById(
      "activityDrawer"
    );


  if (!drawer) return;


  drawer.classList.add(
    "show"
  );


  drawer.setAttribute(
    "aria-hidden",
    "false"
  );

}


// =========================================================
// CLOSE DRAWER
// =========================================================

function closeActivityDrawer() {

  const drawer =
    document.getElementById(
      "activityDrawer"
    );


  if (!drawer) return;


  drawer.classList.remove(
    "show"
  );


  drawer.setAttribute(
    "aria-hidden",
    "true"
  );


  selectedActivityId =
    null;

}


// =========================================================
// ICONS
// =========================================================

function getActivityIcon(
  type
) {

  const icons = {

    order:
      "ri-shopping-bag-3-line",

    payment:
      "ri-bank-card-line",

    user:
      "ri-user-line",

    marketplace:
      "ri-store-2-line",

    settings:
      "ri-settings-3-line",

    security:
      "ri-shield-keyhole-line",

    system:
      "ri-cpu-line"

  };


  return (
    icons[type] ||
    "ri-history-line"
  );

}


// =========================================================
// ACTOR INITIAL
// =========================================================

function getActorInitial(
  actor
) {

  if (!actor) {
    return "?";
  }


  return actor
    .trim()
    .charAt(0)
    .toUpperCase();

}


// =========================================================
// DATE
// =========================================================

function formatActivityDate(
  value
) {

  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return {
      date: "—",
      time: "—"
    };

  }


  return {

    date:
      date.toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "short",
          year: "numeric"
        }
      ),

    time:
      date.toLocaleTimeString(
        "en-GB",
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      )

  };

}


function formatFullDate(
  value
) {

  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "—";

  }


  return date.toLocaleString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  );

}


// =========================================================
// TODAY
// =========================================================

function isToday(
  value
) {

  const date =
    new Date(value);


  const now =
    new Date();


  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );

}


// =========================================================
// HELPERS
// =========================================================

function capitalize(
  value
) {

  if (!value) {
    return "";
  }


  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );

}


function setText(
  id,
  value
) {

  const element =
    document.getElementById(id);


  if (element) {

    element.textContent =
      value;

  }

}


function escapeHTML(
  value
) {

  return String(value)
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


// =========================================================
// EXPORT
// =========================================================

function exportActivityData() {

  if (!activityLogs.length) {

    showActivityMessage(
      "There is no activity to export."
    );

    return;

  }


  const headers = [
    "Activity ID",
    "Title",
    "Description",
    "Actor",
    "Actor Type",
    "Action",
    "Category",
    "Target",
    "Date",
    "IP Address"
  ];


  const rows =
    activityLogs.map(
      activity => [

        activity.id,

        activity.title,

        activity.description,

        activity.actor,

        activity.actorType,

        activity.action,

        activity.type,

        activity.target,

        activity.date,

        activity.ip

      ]
    );


  const csv = [

    headers,

    ...rows

  ]
    .map(
      row =>
        row
          .map(
            value =>
              `"${String(value)
                .replaceAll(
                  '"',
                  '""'
                )}"`
          )
          .join(",")
    )
    .join("\n");


  const blob =
    new Blob(
      [csv],
      {
        type:
          "text/csv;charset=utf-8;"
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const link =
    document.createElement(
      "a"
    );


  link.href =
    url;


  link.download =
    "ecodata-activity-log.csv";


  document.body.appendChild(
    link
  );


  link.click();


  link.remove();


  URL.revokeObjectURL(
    url
  );


  showActivityMessage(
    "Activity log exported successfully."
  );

}


// =========================================================
// SNACKBAR
// =========================================================

function showActivityMessage(
  message
) {

  const snackbar =
    document.getElementById(
      "activityMessage"
    );


  if (!snackbar) return;


  snackbar.textContent =
    message;


  snackbar.classList.add(
    "show"
  );


  clearTimeout(
    showActivityMessage.timer
  );


  showActivityMessage.timer =
    setTimeout(
      () => {

        snackbar.classList.remove(
          "show"
        );

      },
      2600
    );

}