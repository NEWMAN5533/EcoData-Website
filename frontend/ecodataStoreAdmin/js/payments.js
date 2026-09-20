// =========================================================
// ADMINISTRATOR PAYMENTS
// =========================================================


// =========================================================
// CONFIG
// =========================================================

const PAYMENTS_PER_PAGE = 6;


// =========================================================
// DEMO PAYMENT DATA
// Replace this with Firestore/API data later.
// =========================================================

let payments = [

  {
    id: "PAY-10001",
    reference: "ECO-PAY-8F21A",
    customer: "Kwame Mensah",
    email: "kwame@example.com",
    phone: "024 000 1122",
    type: "data",
    method: "paystack",
    amount: 25.00,
    status: "successful",
    createdAt: "2026-09-19T09:35:00Z",
    updatedAt: "2026-09-19T09:36:00Z"
  },

  {
    id: "PAY-10002",
    reference: "ECO-PAY-9K42B",
    customer: "Amina Yusuf",
    email: "amina@example.com",
    phone: "055 000 2244",
    type: "afa",
    method: "mobile_money",
    amount: 20.00,
    status: "successful",
    createdAt: "2026-09-19T08:20:00Z",
    updatedAt: "2026-09-19T08:21:00Z"
  },

  {
    id: "PAY-10003",
    reference: "ECO-PAY-3M91C",
    customer: "Daniel Owusu",
    email: "daniel@example.com",
    phone: "020 000 3366",
    type: "product",
    method: "card",
    amount: 75.00,
    status: "pending",
    createdAt: "2026-09-18T17:40:00Z",
    updatedAt: "2026-09-18T17:40:00Z"
  },

  {
    id: "PAY-10004",
    reference: "ECO-PAY-7Q52D",
    customer: "Sarah Boateng",
    email: "sarah@example.com",
    phone: "027 000 4488",
    type: "service",
    method: "paystack",
    amount: 45.00,
    status: "failed",
    createdAt: "2026-09-18T15:15:00Z",
    updatedAt: "2026-09-18T15:16:00Z"
  },

  {
    id: "PAY-10005",
    reference: "ECO-PAY-1P63E",
    customer: "Michael Asare",
    email: "michael@example.com",
    phone: "054 000 5599",
    type: "data",
    method: "mobile_money",
    amount: 50.00,
    status: "successful",
    createdAt: "2026-09-18T13:05:00Z",
    updatedAt: "2026-09-18T13:06:00Z"
  },

  {
    id: "PAY-10006",
    reference: "ECO-PAY-5R74F",
    customer: "Linda Ofori",
    email: "linda@example.com",
    phone: "026 000 6677",
    type: "product",
    method: "bank",
    amount: 120.00,
    status: "refunded",
    createdAt: "2026-09-17T11:30:00Z",
    updatedAt: "2026-09-17T14:10:00Z"
  },

  {
    id: "PAY-10007",
    reference: "ECO-PAY-6T85G",
    customer: "Emmanuel Addo",
    email: "emmanuel@example.com",
    phone: "059 000 7788",
    type: "data",
    method: "paystack",
    amount: 15.00,
    status: "successful",
    createdAt: "2026-09-17T09:25:00Z",
    updatedAt: "2026-09-17T09:26:00Z"
  },

  {
    id: "PAY-10008",
    reference: "ECO-PAY-2V96H",
    customer: "Grace Arthur",
    email: "grace@example.com",
    phone: "024 000 8899",
    type: "afa",
    method: "mobile_money",
    amount: 20.00,
    status: "pending",
    createdAt: "2026-09-16T18:40:00Z",
    updatedAt: "2026-09-16T18:40:00Z"
  },

  {
    id: "PAY-10009",
    reference: "ECO-PAY-4X17J",
    customer: "Joseph Kusi",
    email: "joseph@example.com",
    phone: "055 000 9900",
    type: "service",
    method: "card",
    amount: 60.00,
    status: "successful",
    createdAt: "2026-09-16T14:10:00Z",
    updatedAt: "2026-09-16T14:11:00Z"
  },

  {
    id: "PAY-10010",
    reference: "ECO-PAY-8Z28K",
    customer: "Martha Adjei",
    email: "martha@example.com",
    phone: "020 000 1010",
    type: "data",
    method: "paystack",
    amount: 30.00,
    status: "successful",
    createdAt: "2026-09-15T10:15:00Z",
    updatedAt: "2026-09-15T10:16:00Z"
  }

];


let filteredPayments = [...payments];

let currentPage = 1;

let selectedPaymentId = null;


// =========================================================
// ELEMENTS
// =========================================================

const paymentTableBody =
  document.getElementById(
    "paymentTableBody"
  );


const paymentEmptyState =
  document.getElementById(
    "paymentEmptyState"
  );


const paymentPagination =
  document.getElementById(
    "paymentPagination"
  );


const paymentResultCount =
  document.getElementById(
    "paymentResultCount"
  );


const paymentSearch =
  document.getElementById(
    "paymentSearch"
  );


const paymentStatusFilter =
  document.getElementById(
    "paymentStatusFilter"
  );


const paymentMethodFilter =
  document.getElementById(
    "paymentMethodFilter"
  );


const paymentTypeFilter =
  document.getElementById(
    "paymentTypeFilter"
  );


const paymentSort =
  document.getElementById(
    "paymentSort"
  );


const clearPaymentFilters =
  document.getElementById(
    "clearPaymentFilters"
  );


// =========================================================
// LABELS
// =========================================================

const paymentTypeLabels = {

  data: "Data Bundle",

  afa: "AFA",

  product: "Product",

  service: "Service"

};


const paymentMethodLabels = {

  paystack: "Paystack",

  mobile_money: "Mobile Money",

  card: "Card",

  bank: "Bank"

};


const paymentStatusLabels = {

  successful: "Successful",

  pending: "Pending",

  failed: "Failed",

  refunded: "Refunded"

};


// =========================================================
// ICONS
// =========================================================

const paymentMethodIcons = {

  paystack:
    "ri-secure-payment-line",

  mobile_money:
    "ri-smartphone-line",

  card:
    "ri-bank-card-line",

  bank:
    "ri-bank-line"

};


// =========================================================
// FORMAT HELPERS
// =========================================================

function formatAmount(amount) {

  return `GHS ${Number(amount || 0)
    .toFixed(2)}`;

}


function formatDate(date) {

  if (!date) {
    return "—";
  }

  const parsed =
    new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );

}


function formatTime(date) {

  if (!date) {
    return "—";
  }

  const parsed =
    new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleTimeString(
    "en-GB",
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );

}


function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// =========================================================
// STATS
// =========================================================

function renderPaymentStats() {

  const total =
    payments.length;


  const successful =
    payments.filter(
      payment =>
        payment.status === "successful"
    ).length;


  const pending =
    payments.filter(
      payment =>
        payment.status === "pending"
    ).length;


  const failed =
    payments.filter(
      payment =>
        payment.status === "failed"
    ).length;


  const volume =
    payments
      .filter(
        payment =>
          payment.status === "successful"
      )
      .reduce(
        (total, payment) =>
          total + Number(payment.amount || 0),
        0
      );


  const totalElement =
    document.getElementById(
      "totalPayments"
    );


  const successfulElement =
    document.getElementById(
      "successfulPayments"
    );


  const pendingElement =
    document.getElementById(
      "pendingPayments"
    );


  const failedElement =
    document.getElementById(
      "failedPayments"
    );


  const volumeElement =
    document.getElementById(
      "paymentVolume"
    );


  if (totalElement) {
    totalElement.textContent =
      total;
  }


  if (successfulElement) {
    successfulElement.textContent =
      successful;
  }


  if (pendingElement) {
    pendingElement.textContent =
      pending;
  }


  if (failedElement) {
    failedElement.textContent =
      failed;
  }


  if (volumeElement) {
    volumeElement.textContent =
      formatAmount(volume);
  }

}


// =========================================================
// FILTER PAYMENTS
// =========================================================

function applyPaymentFilters() {

  const search =
    paymentSearch
      ? paymentSearch.value
          .trim()
          .toLowerCase()
      : "";


  const status =
    paymentStatusFilter
      ? paymentStatusFilter.value
      : "all";


  const method =
    paymentMethodFilter
      ? paymentMethodFilter.value
      : "all";


  const type =
    paymentTypeFilter
      ? paymentTypeFilter.value
      : "all";


  filteredPayments =
    payments.filter(payment => {

      const matchesSearch =
        !search ||
        payment.id
          .toLowerCase()
          .includes(search) ||
        payment.reference
          .toLowerCase()
          .includes(search) ||
        payment.customer
          .toLowerCase()
          .includes(search) ||
        payment.email
          .toLowerCase()
          .includes(search) ||
        payment.phone
          .toLowerCase()
          .includes(search);


      const matchesStatus =
        status === "all" ||
        payment.status === status;


      const matchesMethod =
        method === "all" ||
        payment.method === method;


      const matchesType =
        type === "all" ||
        payment.type === type;


      return (
        matchesSearch &&
        matchesStatus &&
        matchesMethod &&
        matchesType
      );

    });


  sortPayments();

  currentPage = 1;

  renderPayments();

}


// =========================================================
// SORT
// =========================================================

function sortPayments() {

  const sort =
    paymentSort
      ? paymentSort.value
      : "newest";


  filteredPayments.sort(
    (a, b) => {

      switch (sort) {

        case "oldest":

          return (
            new Date(a.createdAt) -
            new Date(b.createdAt)
          );


        case "highest":

          return (
            Number(b.amount) -
            Number(a.amount)
          );


        case "lowest":

          return (
            Number(a.amount) -
            Number(b.amount)
          );


        case "newest":

        default:

          return (
            new Date(b.createdAt) -
            new Date(a.createdAt)
          );

      }

    }
  );

}


// =========================================================
// RENDER PAYMENTS
// =========================================================

function renderPayments() {

  if (!paymentTableBody) {
    return;
  }


  const totalItems =
    filteredPayments.length;


  if (paymentResultCount) {

    paymentResultCount.textContent =
      `${totalItems} ${
        totalItems === 1
          ? "payment"
          : "payments"
      }`;

  }


  if (!totalItems) {

    paymentTableBody.innerHTML = "";


    if (paymentEmptyState) {
      paymentEmptyState.hidden = false;
    }


    if (paymentPagination) {
      paymentPagination.innerHTML = "";
    }


    return;

  }


  if (paymentEmptyState) {
    paymentEmptyState.hidden = true;
  }


  const start =
    (currentPage - 1) *
    PAYMENTS_PER_PAGE;


  const end =
    start +
    PAYMENTS_PER_PAGE;


  const pagePayments =
    filteredPayments.slice(
      start,
      end
    );


  paymentTableBody.innerHTML =
    pagePayments
      .map(
        payment =>
          createPaymentRow(payment)
      )
      .join("");


  renderPaymentPagination();

}


// =========================================================
// PAYMENT ROW
// =========================================================

function createPaymentRow(payment) {

  const methodLabel =
    paymentMethodLabels[
      payment.method
    ] || payment.method;


  const typeLabel =
    paymentTypeLabels[
      payment.type
    ] || payment.type;


  const statusLabel =
    paymentStatusLabels[
      payment.status
    ] || payment.status;


  const methodIcon =
    paymentMethodIcons[
      payment.method
    ] || "ri-wallet-line";


  return `

    <tr>

      <td>

        <div class="payment-transaction-cell">

          <div class="payment-transaction-icon">

            <i class="${methodIcon}"></i>

          </div>


          <div class="payment-transaction-info">

            <strong>
              ${escapeHtml(payment.id)}
            </strong>

            <span>
              ${escapeHtml(payment.reference)}
            </span>

          </div>

        </div>

      </td>


      <td>

        <div class="payment-customer">

          <strong>
            ${escapeHtml(payment.customer)}
          </strong>

          <span>
            ${escapeHtml(payment.email)}
          </span>

        </div>

      </td>


      <td>

        <span class="payment-type">

          ${escapeHtml(typeLabel)}

        </span>

      </td>


      <td>

        <span class="payment-method">

          <i class="${methodIcon}"></i>

          ${escapeHtml(methodLabel)}

        </span>

      </td>


      <td>

        <span class="payment-amount">

          ${formatAmount(payment.amount)}

        </span>

      </td>


      <td>

        <span
          class="
            payment-status
            payment-status-${escapeHtml(
              payment.status
            )}
          "
        >

          ${escapeHtml(statusLabel)}

        </span>

      </td>


      <td>

        <div class="payment-date">

          <strong>
            ${formatDate(payment.createdAt)}
          </strong>

          <span>
            ${formatTime(payment.createdAt)}
          </span>

        </div>

      </td>


      <td>

        <div class="management-action">

          <button
            type="button"
            class="management-action-button"
            aria-label="Payment actions"
          >
            <i class="ri-more-2-fill"></i>
          </button>


          <div class="management-action-menu">

            <button
              type="button"
              data-payment-action="view"
              data-payment-id="${escapeHtml(
                payment.id
              )}"
            >
              <i class="ri-eye-line"></i>
              View Details
            </button>


            <button
              type="button"
              data-payment-action="copy"
              data-payment-id="${escapeHtml(
                payment.id
              )}"
            >
              <i class="ri-file-copy-line"></i>
              Copy Reference
            </button>

          </div>

        </div>

      </td>

    </tr>

  `;

}


// =========================================================
// PAGINATION
// =========================================================

function renderPaymentPagination() {

  if (!paymentPagination) {
    return;
  }


  const totalItems =
    filteredPayments.length;


  const totalPages =
    Math.ceil(
      totalItems /
      PAYMENTS_PER_PAGE
    );


  if (totalPages <= 1) {

    paymentPagination.innerHTML = "";

    return;

  }


  const pages = [];


  pages.push(1);


  const startPage =
    Math.max(
      2,
      currentPage - 1
    );


  const endPage =
    Math.min(
      totalPages - 1,
      currentPage + 1
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


  if (endPage < totalPages - 1) {
    pages.push("...");
  }


  if (totalPages > 1) {
    pages.push(totalPages);
  }


  let html = `

    <button
      type="button"
      class="pagination-nav"
      data-page="${currentPage - 1}"
      aria-label="Previous page"
      ${currentPage === 1 ? "disabled" : ""}
    >

      <i class="ri-arrow-left-s-line"></i>

    </button>

  `;


  pages.forEach(page => {

    if (page === "...") {

      html += `
        <span class="pagination-ellipsis">
          ...
        </span>
      `;

      return;

    }


    html += `

      <button
        type="button"
        class="
          pagination-number
          ${page === currentPage ? "active" : ""}
        "
        data-page="${page}"
      >
        ${page}
      </button>

    `;

  });


  html += `

    <button
      type="button"
      class="pagination-nav"
      data-page="${currentPage + 1}"
      aria-label="Next page"
      ${currentPage === totalPages ? "disabled" : ""}
    >

      <i class="ri-arrow-right-s-line"></i>

    </button>

  `;


  paymentPagination.innerHTML =
    html;


  paymentPagination
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
          ) {
            return;
          }


          currentPage =
            page;


          renderPayments();

        }
      );

    });

}


// =========================================================
// PAYMENT DRAWER
// =========================================================

const paymentDrawer =
  document.getElementById(
    "paymentDrawer"
  );


const paymentDrawerOverlay =
  document.getElementById(
    "paymentDrawerOverlay"
  );


const closePaymentDrawer =
  document.getElementById(
    "closePaymentDrawer"
  );


function openPaymentDrawer(
  paymentId
) {

  const payment =
    payments.find(
      item =>
        item.id === paymentId
    );


  if (!payment) {
    return;
  }


  selectedPaymentId =
    payment.id;


  const drawerTitle =
    document.getElementById(
      "paymentDrawerTitle"
    );


  const amount =
    document.getElementById(
      "drawerPaymentAmount"
    );


  const status =
    document.getElementById(
      "drawerPaymentStatus"
    );


  const id =
    document.getElementById(
      "drawerPaymentId"
    );


  const reference =
    document.getElementById(
      "drawerPaymentReference"
    );


  const type =
    document.getElementById(
      "drawerPaymentType"
    );


  const method =
    document.getElementById(
      "drawerPaymentMethod"
    );


  const customer =
    document.getElementById(
      "drawerCustomerName"
    );


  const email =
    document.getElementById(
      "drawerCustomerEmail"
    );


  const phone =
    document.getElementById(
      "drawerCustomerPhone"
    );


  const created =
    document.getElementById(
      "drawerCreatedAt"
    );


  const updated =
    document.getElementById(
      "drawerUpdatedAt"
    );


  if (drawerTitle) {
    drawerTitle.textContent =
      payment.id;
  }


  if (amount) {
    amount.textContent =
      formatAmount(payment.amount);
  }


  if (status) {
    status.textContent =
      paymentStatusLabels[
        payment.status
      ] || payment.status;
  }


  if (id) {
    id.textContent =
      payment.id;
  }


  if (reference) {
    reference.textContent =
      payment.reference;
  }


  if (type) {
    type.textContent =
      paymentTypeLabels[
        payment.type
      ] || payment.type;
  }


  if (method) {
    method.textContent =
      paymentMethodLabels[
        payment.method
      ] || payment.method;
  }


  if (customer) {
    customer.textContent =
      payment.customer;
  }


  if (email) {
    email.textContent =
      payment.email;
  }


  if (phone) {
    phone.textContent =
      payment.phone;
  }


  if (created) {
    created.textContent =
      `${formatDate(payment.createdAt)} · ${
        formatTime(payment.createdAt)
      }`;
  }


  if (updated) {
    updated.textContent =
      `${formatDate(payment.updatedAt)} · ${
        formatTime(payment.updatedAt)
      }`;
  }


  if (paymentDrawer) {

    paymentDrawer.classList.add(
      "open"
    );

    paymentDrawer.setAttribute(
      "aria-hidden",
      "false"
    );

  }


  if (paymentDrawerOverlay) {
    paymentDrawerOverlay.classList.add(
      "open"
    );
  }


  document.body.classList.add(
    "admin-drawer-open"
  );

}


function closePaymentDetails() {

  if (paymentDrawer) {

    paymentDrawer.classList.remove(
      "open"
    );

    paymentDrawer.setAttribute(
      "aria-hidden",
      "true"
    );

  }


  if (paymentDrawerOverlay) {

    paymentDrawerOverlay.classList.remove(
      "open"
    );

  }


  document.body.classList.remove(
    "admin-drawer-open"
  );


  selectedPaymentId =
    null;

}


// =========================================================
// DRAWER EVENTS
// =========================================================

if (closePaymentDrawer) {

  closePaymentDrawer.addEventListener(
    "click",
    closePaymentDetails
  );

}


if (paymentDrawerOverlay) {

  paymentDrawerOverlay.addEventListener(
    "click",
    closePaymentDetails
  );

}


document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape" &&
      paymentDrawer &&
      paymentDrawer.classList.contains("open")
    ) {

      closePaymentDetails();

    }

  }
);


// =========================================================
// ACTION MENU
// =========================================================

document.addEventListener(
  "click",
  event => {

    const actionButton =
      event.target.closest(
        ".management-action-button"
      );


    if (actionButton) {

      event.stopPropagation();


      const wrapper =
        actionButton.closest(
          ".management-action"
        );


      if (!wrapper) {
        return;
      }


      document
        .querySelectorAll(
          ".management-action-menu.show"
        )
        .forEach(menu => {

          if (!wrapper.contains(menu)) {

            menu.classList.remove(
              "show"
            );

          }

        });


      const menu =
        wrapper.querySelector(
          ".management-action-menu"
        );


      if (menu) {

        menu.classList.toggle(
          "show"
        );

      }

      return;

    }


    if (
      !event.target.closest(
        ".management-action"
      )
    ) {

      document
        .querySelectorAll(
          ".management-action-menu.show"
        )
        .forEach(menu => {

          menu.classList.remove(
            "show"
          );

        });

    }

  }
);


// =========================================================
// PAYMENT ACTIONS
// =========================================================

document.addEventListener(
  "click",
  async event => {

    const actionButton =
      event.target.closest(
        "[data-payment-action]"
      );


    if (!actionButton) {
      return;
    }


    const action =
      actionButton.dataset.paymentAction;


    const paymentId =
      actionButton.dataset.paymentId;


    document
      .querySelectorAll(
        ".management-action-menu.show"
      )
      .forEach(menu => {

        menu.classList.remove(
          "show"
        );

      });


    if (action === "view") {

      openPaymentDrawer(
        paymentId
      );

      return;

    }


    if (action === "copy") {

      const payment =
        payments.find(
          item =>
            item.id === paymentId
        );


      if (!payment) {
        return;
      }


      copyPaymentReference(
        payment.reference
      );

    }

  }
);


// =========================================================
// COPY REFERENCE
// =========================================================

async function copyPaymentReference(
  reference
) {

  if (!reference) {
    return;
  }


  try {

    await navigator.clipboard.writeText(
      reference
    );


    showPaymentMessage(
      "Payment reference copied."
    );

  } catch (error) {

    console.error(
      "Copy failed:",
      error
    );

    showPaymentMessage(
      "Unable to copy reference."
    );

  }

}


const copyPaymentReferenceButton =
  document.getElementById(
    "copyPaymentReference"
  );


if (copyPaymentReferenceButton) {

  copyPaymentReferenceButton.addEventListener(
    "click",
    () => {

      const payment =
        payments.find(
          item =>
            item.id === selectedPaymentId
        );


      if (!payment) {
        return;
      }


      copyPaymentReference(
        payment.reference
      );

    }
  );

}


// =========================================================
// SIMPLE PAYMENT MESSAGE
// =========================================================

let paymentMessageTimer;


function showPaymentMessage(
  message
) {

  clearTimeout(
    paymentMessageTimer
  );


  let messageElement =
    document.getElementById(
      "paymentActionMessage"
    );


  if (!messageElement) {

    messageElement =
      document.createElement(
        "div"
      );

    messageElement.id =
      "paymentActionMessage";

    messageElement.className =
      "admin-settings-message";

    messageElement.innerHTML = `
      <i class="ri-check-line"></i>
      <span></span>
    `;


    document.body.appendChild(
      messageElement
    );

  }


  const text =
    messageElement.querySelector(
      "span"
    );


  if (text) {
    text.textContent =
      message;
  }


  messageElement.classList.add(
    "show"
  );


  paymentMessageTimer =
    setTimeout(
      () => {

        messageElement.classList.remove(
          "show"
        );

      },
      2400
    );

}


// =========================================================
// CLEAR FILTERS
// =========================================================

if (clearPaymentFilters) {

  clearPaymentFilters.addEventListener(
    "click",
    () => {

      if (paymentSearch) {
        paymentSearch.value = "";
      }


      if (paymentStatusFilter) {
        paymentStatusFilter.value =
          "all";
      }


      if (paymentMethodFilter) {
        paymentMethodFilter.value =
          "all";
      }


      if (paymentTypeFilter) {
        paymentTypeFilter.value =
          "all";
      }


      if (paymentSort) {
        paymentSort.value =
          "newest";
      }


      applyPaymentFilters();

    }
  );

}


// =========================================================
// FILTER EVENTS
// =========================================================

if (paymentSearch) {

  paymentSearch.addEventListener(
    "input",
    applyPaymentFilters
  );

}


[
  paymentStatusFilter,
  paymentMethodFilter,
  paymentTypeFilter,
  paymentSort
]
.forEach(select => {

  if (!select) return;

  select.addEventListener(
    "change",
    applyPaymentFilters
  );

});


// =========================================================
// INITIAL RENDER
// =========================================================

renderPaymentStats();

sortPayments();

renderPayments();