// ==========================================
// ADMIN NOTIFICATIONS
// DEMO VERSION
// ==========================================


// ==========================================
// DEMO DATA
// ==========================================

let notifications = [

  {
    id: "NOT-10001",
    title: "New order received",
    message:
      "A new MTN Data Express order has been received and is waiting for processing.",
    type: "order",
    priority: "high",
    read: false,
    date: "2026-09-22T10:42:00"
  },

  {
    id: "NOT-10002",
    title: "Payment completed",
    message:
      "Payment PAY-10045 was successfully verified through Paystack.",
    type: "payment",
    priority: "normal",
    read: false,
    date: "2026-09-22T10:31:00"
  },

  {
    id: "NOT-10003",
    title: "New user registered",
    message:
      "A new user has created an EcoData account.",
    type: "user",
    priority: "normal",
    read: true,
    date: "2026-09-22T09:55:00"
  },

  {
    id: "NOT-10004",
    title: "Express order delivered",
    message:
      "Order ED-78432 has been successfully delivered to the recipient.",
    type: "order",
    priority: "normal",
    read: true,
    date: "2026-09-22T09:34:00"
  },

  {
    id: "NOT-10005",
    title: "Marketplace product submitted",
    message:
      "A new digital product has been submitted and is waiting for approval.",
    type: "marketplace",
    priority: "normal",
    read: false,
    date: "2026-09-22T08:47:00"
  },

  {
    id: "NOT-10006",
    title: "Payment verification required",
    message:
      "Payment PAY-10041 requires additional verification before fulfilment.",
    type: "payment",
    priority: "high",
    read: false,
    date: "2026-09-21T22:18:00"
  },

  {
    id: "NOT-10007",
    title: "System maintenance completed",
    message:
      "The scheduled system maintenance has been completed successfully.",
    type: "system",
    priority: "low",
    read: true,
    date: "2026-09-21T20:05:00"
  },

  {
    id: "NOT-10008",
    title: "Failed order reported",
    message:
      "Order ED-78411 failed during fulfilment. Review the order status for details.",
    type: "order",
    priority: "high",
    read: false,
    date: "2026-09-21T18:42:00"
  },

  {
    id: "NOT-10009",
    title: "New seller application",
    message:
      "A new marketplace seller has submitted an application for review.",
    type: "marketplace",
    priority: "normal",
    read: true,
    date: "2026-09-21T16:20:00"
  },

  {
    id: "NOT-10010",
    title: "User profile updated",
    message:
      "A user has updated their account profile information.",
    type: "user",
    priority: "low",
    read: true,
    date: "2026-09-21T14:12:00"
  },

  {
    id: "NOT-10011",
    title: "Vendor connection restored",
    message:
      "The data vendor connection is responding normally again.",
    type: "system",
    priority: "high",
    read: false,
    date: "2026-09-21T12:41:00"
  },

  {
    id: "NOT-10012",
    title: "Successful withdrawal",
    message:
      "A seller withdrawal request has been successfully processed.",
    type: "payment",
    priority: "normal",
    read: true,
    date: "2026-09-21T10:28:00"
  }

];


// ==========================================
// STATE
// ==========================================

let currentNotificationPage = 1;

const notificationsPerPage = 8;

let selectedNotificationId = null;


// ==========================================
// DOM READY
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

  initializeNotifications();

});


// ==========================================
// INITIALIZE
// ==========================================

function initializeNotifications() {

  setupNotificationFilters();

  setupNotificationActions();

  setupNotificationDrawer();

  renderNotifications();

}


// ==========================================
// FILTERS
// ==========================================

function setupNotificationFilters() {

  const searchInput =
    document.getElementById("notificationSearch");

  const typeFilter =
    document.getElementById("notificationTypeFilter");

  const statusFilter =
    document.getElementById("notificationStatusFilter");

  const priorityFilter =
    document.getElementById("notificationPriorityFilter");

  const clearButton =
    document.getElementById("clearNotificationFilters");


  if (searchInput) {

    searchInput.addEventListener("input", () => {

      currentNotificationPage = 1;

      renderNotifications();

    });

  }


  if (typeFilter) {

    typeFilter.addEventListener("change", () => {

      currentNotificationPage = 1;

      renderNotifications();

    });

  }


  if (statusFilter) {

    statusFilter.addEventListener("change", () => {

      currentNotificationPage = 1;

      renderNotifications();

    });

  }


  if (priorityFilter) {

    priorityFilter.addEventListener("change", () => {

      currentNotificationPage = 1;

      renderNotifications();

    });

  }


  if (clearButton) {

    clearButton.addEventListener("click", () => {

      if (searchInput) {
        searchInput.value = "";
      }

      if (typeFilter) {
        typeFilter.value = "all";
      }

      if (statusFilter) {
        statusFilter.value = "all";
      }

      if (priorityFilter) {
        priorityFilter.value = "all";
      }

      currentNotificationPage = 1;

      renderNotifications();

    });

  }

}


// ==========================================
// ACTIONS
// ==========================================

function setupNotificationActions() {

  const refreshButton =
    document.getElementById("refreshNotifications");

  const markAllButton =
    document.getElementById("markAllNotificationsRead");

  const clearButton =
    document.getElementById("clearNotifications");


  if (refreshButton) {

    refreshButton.addEventListener("click", () => {

      refreshButton.classList.add("is-loading");

      setTimeout(() => {

        renderNotifications();

        refreshButton.classList.remove("is-loading");

        showNotificationMessage(
          "Notifications refreshed."
        );

      }, 450);

    });

  }


  if (markAllButton) {

    markAllButton.addEventListener("click", () => {

      notifications.forEach(notification => {

        notification.read = true;

      });

      renderNotifications();

      showNotificationMessage(
        "All notifications marked as read."
      );

    });

  }


  if (clearButton) {

    clearButton.addEventListener("click", () => {

      if (!notifications.length) {

        showNotificationMessage(
          "There are no notifications to clear."
        );

        return;

      }


      const confirmed =
        window.confirm(
          "Clear all notifications?"
        );

      if (!confirmed) return;


      notifications = [];

      currentNotificationPage = 1;

      renderNotifications();

      showNotificationMessage(
        "All notifications have been cleared."
      );

    });

  }

}


// ==========================================
// FILTERED DATA
// ==========================================

function getFilteredNotifications() {

  const search =
    document
      .getElementById("notificationSearch")
      ?.value
      .trim()
      .toLowerCase() || "";


  const type =
    document
      .getElementById("notificationTypeFilter")
      ?.value || "all";


  const status =
    document
      .getElementById("notificationStatusFilter")
      ?.value || "all";


  const priority =
    document
      .getElementById("notificationPriorityFilter")
      ?.value || "all";


  return notifications.filter(notification => {

    const matchesSearch =
      !search ||
      notification.title.toLowerCase().includes(search) ||
      notification.message.toLowerCase().includes(search) ||
      notification.id.toLowerCase().includes(search);


    const matchesType =
      type === "all" ||
      notification.type === type;


    const matchesStatus =
      status === "all" ||
      (status === "read" && notification.read) ||
      (status === "unread" && !notification.read);


    const matchesPriority =
      priority === "all" ||
      notification.priority === priority;


    return (
      matchesSearch &&
      matchesType &&
      matchesStatus &&
      matchesPriority
    );

  });

}


// ==========================================
// RENDER
// ==========================================

function renderNotifications() {

  updateNotificationStats();


  const filtered =
    getFilteredNotifications();


  const tableBody =
    document.getElementById(
      "notificationTableBody"
    );


  const resultCount =
    document.getElementById(
      "notificationResultCount"
    );


  if (!tableBody) return;


  const total =
    filtered.length;


  const start =
    (currentNotificationPage - 1) *
    notificationsPerPage;


  const end =
    start + notificationsPerPage;


  const pageItems =
    filtered.slice(start, end);


  if (resultCount) {

    resultCount.textContent =
      `Showing ${total} notification${total === 1 ? "" : "s"}`;

  }


  if (!pageItems.length) {

    tableBody.innerHTML = `

      <tr>

        <td colspan="6">

          <div class="admin-empty-state">

            <i class="ri-notification-off-line"></i>

            <strong>No notifications found</strong>

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
        .map(createNotificationRow)
        .join("");

  }


  setupNotificationRowActions();


  renderNotificationPagination(
    total
  );

}


// ==========================================
// CREATE TABLE ROW
// ==========================================

function createNotificationRow(notification) {

  const icon =
    getNotificationIcon(
      notification.type
    );


  const date =
    formatNotificationDate(
      notification.date
    );


  return `

    <tr
      class="${notification.read ? "" : "notification-unread"}"
      data-notification-id="${notification.id}"
    >

      <td>

        <div class="notification-main">

          <div class="notification-row-icon">
            <i class="${icon}"></i>
          </div>

          <div class="notification-main-content">

            <strong>
              ${escapeHTML(notification.title)}
            </strong>

            <span>
              ${escapeHTML(notification.message)}
            </span>

          </div>

        </div>

      </td>


      <td>

        <span class="notification-type-badge">

          ${escapeHTML(
            notification.type
          )}

        </span>

      </td>


      <td>

        <span
          class="
            notification-priority-badge
            priority-${notification.priority}
          "
        >

          ${escapeHTML(
            notification.priority
          )}

        </span>

      </td>


      <td>

        <span
          class="
            notification-status-badge
            status-${notification.read ? "read" : "unread"}
          "
        >

          <i
            class="
              ${notification.read
                ? "ri-mail-open-line"
                : "ri-mail-unread-line"}
            "
          ></i>

          ${notification.read
            ? "Read"
            : "Unread"}

        </span>

      </td>


      <td>

        <div class="notification-date">

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
          class="notification-view-button"
          data-notification-id="${notification.id}"
          aria-label="View notification"
        >
          <i class="ri-eye-line"></i>
        </button>

      </td>

    </tr>

  `;

}


// ==========================================
// ROW ACTIONS
// ==========================================

function setupNotificationRowActions() {

  document
    .querySelectorAll(
      ".notification-view-button"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.notificationId;

          openNotificationDrawer(id);

        }
      );

    });

}


// ==========================================
// STATS
// ==========================================

function updateNotificationStats() {

  const total =
    notifications.length;


  const unread =
    notifications.filter(
      notification => !notification.read
    ).length;


  const orders =
    notifications.filter(
      notification =>
        notification.type === "order"
    ).length;


  const payments =
    notifications.filter(
      notification =>
        notification.type === "payment"
    ).length;


  const system =
    notifications.filter(
      notification =>
        notification.type === "system"
    ).length;


  setText(
    "totalNotifications",
    total.toLocaleString()
  );

  setText(
    "unreadNotifications",
    unread.toLocaleString()
  );

  setText(
    "orderNotifications",
    orders.toLocaleString()
  );

  setText(
    "paymentNotifications",
    payments.toLocaleString()
  );

  setText(
    "systemNotifications",
    system.toLocaleString()
  );

}


// ==========================================
// PAGINATION
// ==========================================

function renderNotificationPagination(
  totalItems
) {

  const container =
    document.getElementById(
      "notificationPagination"
    );


  const info =
    document.getElementById(
      "notificationPaginationInfo"
    );


  if (!container) return;


  const totalPages =
    Math.ceil(
      totalItems /
      notificationsPerPage
    );


  if (!totalPages) {

    container.innerHTML = "";

    if (info) {
      info.textContent = "Showing 0 of 0";
    }

    return;

  }


  const start =
    (currentNotificationPage - 1) *
    notificationsPerPage + 1;


  const end =
    Math.min(
      currentNotificationPage *
      notificationsPerPage,
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
      class="pagination-nav"
      aria-label="Previous page"
      ${currentNotificationPage === 1 ? "disabled" : ""}
      data-page="${currentNotificationPage - 1}"
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
          pagination-number
          ${page === currentNotificationPage
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
      class="pagination-nav"
      aria-label="Next page"
      ${currentNotificationPage === totalPages ? "disabled" : ""}
      data-page="${currentNotificationPage + 1}"
    >
      <i class="ri-arrow-right-s-line"></i>
    </button>

  `;


  container.innerHTML = html;


  container
    .querySelectorAll(
      "[data-page]"
    )
    .forEach(button => {

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


          currentNotificationPage =
            page;


          renderNotifications();

        }
      );

    });

}


// ==========================================
// DRAWER
// ==========================================

function setupNotificationDrawer() {

  const drawer =
    document.getElementById(
      "notificationDrawer"
    );


  const closeButton =
    document.getElementById(
      "closeNotificationDrawer"
    );


  const drawerCloseButton =
    document.getElementById(
      "drawerCloseButton"
    );


  const markReadButton =
    document.getElementById(
      "drawerMarkRead"
    );


  if (closeButton) {

    closeButton.addEventListener(
      "click",
      closeNotificationDrawer
    );

  }


  if (drawerCloseButton) {

    drawerCloseButton.addEventListener(
      "click",
      closeNotificationDrawer
    );

  }


  if (drawer) {

    drawer.addEventListener(
      "click",
      event => {

        if (
          event.target === drawer
        ) {

          closeNotificationDrawer();

        }

      }
    );

  }


  if (markReadButton) {

    markReadButton.addEventListener(
      "click",
      () => {

        if (!selectedNotificationId) {
          return;
        }


        const notification =
          notifications.find(
            item =>
              item.id ===
              selectedNotificationId
          );


        if (!notification) return;


        notification.read = true;


        renderNotifications();


        updateNotificationDrawer(
          notification
        );


        showNotificationMessage(
          "Notification marked as read."
        );

      }
    );

  }

}


// ==========================================
// OPEN DRAWER
// ==========================================

function openNotificationDrawer(id) {

  const notification =
    notifications.find(
      item => item.id === id
    );


  if (!notification) return;


  selectedNotificationId =
    notification.id;


  // Opening a notification marks it read.
  notification.read = true;


  updateNotificationDrawer(
    notification
  );


  const drawer =
    document.getElementById(
      "notificationDrawer"
    );


  if (!drawer) return;


  drawer.classList.add("show");

  drawer.setAttribute(
    "aria-hidden",
    "false"
  );


  renderNotifications();

}


// ==========================================
// UPDATE DRAWER
// ==========================================

function updateNotificationDrawer(
  notification
) {

  setText(
    "notificationDrawerTitle",
    "Notification details"
  );


  setText(
    "notificationDetailHeading",
    notification.title
  );


  setText(
    "notificationDetailMessage",
    notification.message
  );


  setText(
    "notificationDetailType",
    capitalize(
      notification.type
    )
  );


  setText(
    "notificationDetailPriority",
    capitalize(
      notification.priority
    )
  );


  setText(
    "notificationDetailStatus",
    notification.read
      ? "Read"
      : "Unread"
  );


  setText(
    "notificationDetailId",
    notification.id
  );


  setText(
    "notificationDetailDate",
    formatFullDate(
      notification.date
    )
  );


  const icon =
    document.getElementById(
      "notificationDetailIcon"
    );


  if (icon) {

    icon.innerHTML =
      `<i class="${getNotificationIcon(
        notification.type
      )}"></i>`;

  }


  const markReadButton =
    document.getElementById(
      "drawerMarkRead"
    );


  if (markReadButton) {

    markReadButton.innerHTML =
      notification.read

        ? `
          <i class="ri-mail-open-line"></i>
          Already read
        `

        : `
          <i class="ri-check-line"></i>
          Mark as read
        `;

  }

}


// ==========================================
// CLOSE DRAWER
// ==========================================

function closeNotificationDrawer() {

  const drawer =
    document.getElementById(
      "notificationDrawer"
    );


  if (!drawer) return;


  drawer.classList.remove(
    "show"
  );


  drawer.setAttribute(
    "aria-hidden",
    "true"
  );


  selectedNotificationId =
    null;

}


// ==========================================
// ICONS
// ==========================================

function getNotificationIcon(type) {

  const icons = {

    order:
      "ri-shopping-bag-3-line",

    payment:
      "ri-bank-card-line",

    user:
      "ri-user-add-line",

    system:
      "ri-settings-3-line",

    marketplace:
      "ri-store-2-line"

  };


  return (
    icons[type] ||
    "ri-notification-3-line"
  );

}


// ==========================================
// DATE HELPERS
// ==========================================

function formatNotificationDate(
  value
) {

  const date =
    new Date(value);


  if (Number.isNaN(date.getTime())) {

    return {
      date: "—",
      time: "—"
    };

  }


  return {

    date: date.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    ),

    time: date.toLocaleTimeString(
      "en-GB",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    )

  };

}


function formatFullDate(value) {

  const date =
    new Date(value);


  if (Number.isNaN(date.getTime())) {
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


function setText(id, value) {

  const element =
    document.getElementById(id);


  if (element) {

    element.textContent =
      value;

  }

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
// SNACKBAR
// ==========================================

function showNotificationMessage(
  message
) {

  const snackbar =
    document.getElementById(
      "notificationsMessage"
    );


  if (!snackbar) return;


  snackbar.textContent =
    message;


  snackbar.classList.add(
    "show"
  );


  clearTimeout(
    showNotificationMessage.timer
  );


  showNotificationMessage.timer =
    setTimeout(() => {

      snackbar.classList.remove(
        "show"
      );

    }, 2600);

}
