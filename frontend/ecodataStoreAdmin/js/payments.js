// =========================================================
// PAYMENTS MANAGEMENT
// =========================================================


// =========================================================
// STATE
// =========================================================

let payments = [];
let filteredPayments = [];

let currentPage = 1;

const PAYMENTS_PER_PAGE = 7;

let selectedPayment = null;


// =========================================================
// DEMO PAYMENT DATA
// =========================================================
// Frontend demo only.
// Later this can be replaced with Firestore/API data.

const DEMO_PAYMENTS = [

  {
    id: "PAY-20260918-001",
    reference: "ECO-9F42K1",
    gatewayReference: "PSK_9F42K1A82",
    customer: "Abdul Rahman",
    customerId: "USR-10001",
    customerEmail: "abdul@example.com",
    customerPhone: "024 123 4567",

    type: "order",

    relatedReference: "ORD-20260918-001",
    relatedItem: "Modern CV Template Pack",
    seller: "CreativeHub",
    sellerId: "SEL-10001",

    amount: 35,
    fee: 0.68,
    netAmount: 34.32,

    method: "card",
    channel: "card",

    status: "successful",

    currency: "GHS",

    gateway: "Paystack",
    gatewayStatus: "success",

    refundStatus: "not_refunded",
    refundAmount: 0,

    created: "2026-09-18T15:30:00",
    updated: "2026-09-18T15:31:10"
  },


  {
    id: "PAY-20260918-002",
    reference: "ECO-7K91LM",
    gatewayReference: "PSK_7K91LM22Q",
    customer: "Fatima Mohammed",
    customerId: "USR-10002",
    customerEmail: "fatima@example.com",
    customerPhone: "055 678 9012",

    type: "service",

    relatedReference: "SRV-20260918-001",
    relatedItem: "CV Design",
    seller: "Design Corner",
    sellerId: "SEL-10002",

    amount: 80,
    fee: 1.56,
    netAmount: 78.44,

    method: "mobile_money",
    channel: "mobile_money",

    status: "successful",

    currency: "GHS",

    gateway: "Paystack",
    gatewayStatus: "success",

    refundStatus: "not_refunded",
    refundAmount: 0,

    created: "2026-09-18T14:12:00",
    updated: "2026-09-18T14:13:24"
  },


  {
    id: "PAY-20260918-003",
    reference: "ECO-3T81PX",
    gatewayReference: "PSK_3T81PX91A",
    customer: "Kwame Mensah",
    customerId: "USR-10003",
    customerEmail: "kwame@example.com",
    customerPhone: "020 445 7821",

    type: "order",

    relatedReference: "ORD-20260918-004",
    relatedItem: "Premium Hoodie",
    seller: "EcoWear",
    sellerId: "SEL-10006",

    amount: 150,
    fee: 2.93,
    netAmount: 147.07,

    method: "mobile_money",
    channel: "mobile_money",

    status: "pending",

    currency: "GHS",

    gateway: "Paystack",
    gatewayStatus: "pending",

    refundStatus: "not_refunded",
    refundAmount: 0,

    created: "2026-09-18T12:45:00",
    updated: "2026-09-18T12:45:00"
  },


  {
    id: "PAY-20260917-004",
    reference: "ECO-2N73QA",
    gatewayReference: "PSK_2N73QA77M",
    customer: "Amina Yakubu",
    customerId: "USR-10004",
    customerEmail: "amina@example.com",
    customerPhone: "054 231 9087",

    type: "service",

    relatedReference: "SRV-20260917-002",
    relatedItem: "Business Flyer Design",
    seller: "CreativeHub",
    sellerId: "SEL-10001",

    amount: 65,
    fee: 1.27,
    netAmount: 63.73,

    method: "card",
    channel: "card",

    status: "successful",

    currency: "GHS",

    gateway: "Paystack",
    gatewayStatus: "success",

    refundStatus: "not_refunded",
    refundAmount: 0,

    created: "2026-09-17T19:20:00",
    updated: "2026-09-17T19:21:02"
  },


  {
    id: "PAY-20260917-005",
    reference: "ECO-8B62FD",
    gatewayReference: "PSK_8B62FD19R",
    customer: "Ibrahim Salifu",
    customerId: "USR-10005",
    customerEmail: "ibrahim@example.com",
    customerPhone: "027 556 3421",

    type: "order",

    relatedReference: "ORD-20260917-009",
    relatedItem: "Study Notes Bundle",
    seller: "EduAssist",
    sellerId: "SEL-10005",

    amount: 42,
    fee: 0.82,
    netAmount: 41.18,

    method: "mobile_money",
    channel: "mobile_money",

    status: "failed",

    currency: "GHS",

    gateway: "Paystack",
    gatewayStatus: "failed",

    refundStatus: "not_refunded",
    refundAmount: 0,

    created: "2026-09-17T17:42:00",
    updated: "2026-09-17T17:43:08"
  },


  {
    id: "PAY-20260917-006",
    reference: "ECO-4M52ZX",
    gatewayReference: "PSK_4M52ZX84B",
    customer: "Mariam Osman",
    customerId: "USR-10006",
    customerEmail: "mariam@example.com",
    customerPhone: "059 883 1120",

    type: "order",

    relatedReference: "ORD-20260917-011",
    relatedItem: "Digital Marketing Ebook",
    seller: "WritePro Ghana",
    sellerId: "SEL-10004",

    amount: 55,
    fee: 1.07,
    netAmount: 53.93,

    method: "card",
    channel: "card",

    status: "refunded",

    currency: "GHS",

    gateway: "Paystack",
    gatewayStatus: "success",

    refundStatus: "refunded",
    refundAmount: 55,

    created: "2026-09-17T15:10:00",
    updated: "2026-09-18T09:20:00"
  },


  {
    id: "PAY-20260916-007",
    reference: "ECO-1Q83CV",
    gatewayReference: "PSK_1Q83CV44T",
    customer: "Samuel Owusu",
    customerId: "USR-10007",
    customerEmail: "samuel@example.com",
    customerPhone: "024 781 4432",

    type: "service",

    relatedReference: "SRV-20260916-006",
    relatedItem: "Website Setup",
    seller: "TechWorks",
    sellerId: "SEL-10003",

    amount: 350,
    fee: 6.83,
    netAmount: 343.17,

    method: "bank",
    channel: "bank",

    status: "successful",

    currency: "GHS",

    gateway: "Paystack",
    gatewayStatus: "success",

    refundStatus: "not_refunded",
    refundAmount: 0,

    created: "2026-09-16T13:25:00",
    updated: "2026-09-16T13:27:12"
  },


  {
    id: "PAY-20260916-008",
    reference: "ECO-5R29HS",
    gatewayReference: "PSK_5R29HS18L",
    customer: "Nana Asare",
    customerId: "USR-10008",
    customerEmail: "nana@example.com",
    customerPhone: "050 441 2998",

    type: "order",

    relatedReference: "ORD-20260916-014",
    relatedItem: "Canvas Backpack",
    seller: "EcoWear",
    sellerId: "SEL-10006",

    amount: 120,
    fee: 2.34,
    netAmount: 117.66,

    method: "mobile_money",
    channel: "mobile_money",

    status: "successful",

    currency: "GHS",

    gateway: "Paystack",
    gatewayStatus: "success",

    refundStatus: "not_refunded",
    refundAmount: 0,

    created: "2026-09-16T10:42:00",
    updated: "2026-09-16T10:43:15"
  },


  {
    id: "PAY-20260915-009",
    reference: "ECO-6P42YU",
    gatewayReference: "PSK_6P42YU31K",
    customer: "Hassan Abdulai",
    customerId: "USR-10009",
    customerEmail: "hassan@example.com",
    customerPhone: "026 900 3214",

    type: "order",

    relatedReference: "ORD-20260915-017",
    relatedItem: "CV Template Pack",
    seller: "CreativeHub",
    sellerId: "SEL-10001",

    amount: 30,
    fee: 0.59,
    netAmount: 29.41,

    method: "card",
    channel: "card",

    status: "successful",

    currency: "GHS",

    gateway: "Paystack",
    gatewayStatus: "success",

    refundStatus: "not_refunded",
    refundAmount: 0,

    created: "2026-09-15T18:20:00",
    updated: "2026-09-15T18:21:04"
  },


  {
    id: "PAY-20260915-010",
    reference: "ECO-9X18DW",
    gatewayReference: "PSK_9X18DW73N",
    customer: "Zainab Ibrahim",
    customerId: "USR-10010",
    customerEmail: "zainab@example.com",
    customerPhone: "055 210 4433",

    type: "service",

    relatedReference: "SRV-20260915-008",
    relatedItem: "Document Formatting",
    seller: "WritePro Ghana",
    sellerId: "SEL-10004",

    amount: 45,
    fee: 0.88,
    netAmount: 44.12,

    method: "mobile_money",
    channel: "mobile_money",

    status: "pending",

    currency: "GHS",

    gateway: "Paystack",
    gatewayStatus: "pending",

    refundStatus: "not_refunded",
    refundAmount: 0,

    created: "2026-09-15T11:05:00",
    updated: "2026-09-15T11:05:00"
  }

];


// =========================================================
// DOM ELEMENTS
// =========================================================

const paymentTableBody =
  document.getElementById("paymentTableBody");

const paymentEmptyState =
  document.getElementById("paymentEmptyState");

const paymentPagination =
  document.getElementById("paymentPagination");

const paymentResultCount =
  document.getElementById("paymentResultCount");

const paymentSearch =
  document.getElementById("paymentSearch");

const paymentStatusFilter =
  document.getElementById("paymentStatusFilter");

const paymentMethodFilter =
  document.getElementById("paymentMethodFilter");

const paymentTypeFilter =
  document.getElementById("paymentTypeFilter");

const paymentSort =
  document.getElementById("paymentSort");

const clearPaymentFilters =
  document.getElementById("clearPaymentFilters");

const emptyClearPaymentFilters =
  document.getElementById("emptyClearPaymentFilters");

const refreshPayments =
  document.getElementById("refreshPayments");


// Drawer

const paymentDrawer =
  document.getElementById("paymentDrawer");

const paymentDrawerOverlay =
  document.getElementById("paymentDrawerOverlay");

const closePaymentDrawer =
  document.getElementById("closePaymentDrawer");

const verifyPaymentBtn =
  document.getElementById("verifyPaymentBtn");

const refundPaymentBtn =
  document.getElementById("refundPaymentBtn");


// =========================================================
// INITIALIZE
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  payments = DEMO_PAYMENTS.map(payment => ({
    ...payment
  }));

  applyPaymentFilters();

  bindPaymentEvents();

});


// =========================================================
// EVENT LISTENERS
// =========================================================

function bindPaymentEvents() {

  paymentSearch?.addEventListener(
    "input",
    handlePaymentFilterChange
  );

  paymentStatusFilter?.addEventListener(
    "change",
    handlePaymentFilterChange
  );

  paymentMethodFilter?.addEventListener(
    "change",
    handlePaymentFilterChange
  );

  paymentTypeFilter?.addEventListener(
    "change",
    handlePaymentFilterChange
  );

  paymentSort?.addEventListener(
    "change",
    handlePaymentFilterChange
  );


  clearPaymentFilters?.addEventListener(
    "click",
    clearAllPaymentFilters
  );


  emptyClearPaymentFilters?.addEventListener(
    "click",
    clearAllPaymentFilters
  );


  refreshPayments?.addEventListener(
    "click",
    refreshPaymentList
  );


  paymentTableBody?.addEventListener(
    "click",
    handlePaymentTableClick
  );


  closePaymentDrawer?.addEventListener(
    "click",
    closePaymentDetails
  );


  paymentDrawerOverlay?.addEventListener(
    "click",
    closePaymentDetails
  );


  verifyPaymentBtn?.addEventListener(
    "click",
    verifySelectedPayment
  );


  refundPaymentBtn?.addEventListener(
    "click",
    refundSelectedPayment
  );


  paymentPagination?.addEventListener(
    "click",
    handlePaginationClick
  );


  document.addEventListener(
    "click",
    handleDocumentClick
  );


  document.addEventListener(
    "keydown",
    event => {

      if (event.key === "Escape") {

        closePaymentDetails();

        closePaymentMenus();

      }

    }
  );

}


// =========================================================
// FILTER HANDLER
// =========================================================

function handlePaymentFilterChange() {

  currentPage = 1;

  applyPaymentFilters();

}


// =========================================================
// APPLY FILTERS
// =========================================================

function applyPaymentFilters() {

  const search =
    paymentSearch?.value
      ?.trim()
      .toLowerCase() || "";


  const status =
    paymentStatusFilter?.value || "all";


  const method =
    paymentMethodFilter?.value || "all";


  const type =
    paymentTypeFilter?.value || "all";


  filteredPayments = payments.filter(payment => {

    const searchableText = [

      payment.id,

      payment.reference,

      payment.gatewayReference,

      payment.customer,

      payment.customerEmail,

      payment.customerPhone,

      payment.relatedReference,

      payment.relatedItem,

      payment.seller

    ]
      .join(" ")
      .toLowerCase();


    const matchesSearch =
      !search ||
      searchableText.includes(search);


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

  renderPayments();

  updatePaymentStats();

}


// =========================================================
// SORT PAYMENTS
// =========================================================

function sortPayments() {

  const sort =
    paymentSort?.value || "newest";


  filteredPayments.sort((a, b) => {

    switch (sort) {

      case "oldest":

        return (
          new Date(a.created) -
          new Date(b.created)
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
          new Date(b.created) -
          new Date(a.created)
        );

    }

  });

}


// =========================================================
// RENDER PAYMENTS
// =========================================================

function renderPayments() {

  if (!paymentTableBody) return;


  paymentTableBody.innerHTML = "";


  const total =
    filteredPayments.length;


  if (paymentResultCount) {

    paymentResultCount.textContent =
      `${total} transaction${total === 1 ? "" : "s"}`;

  }


  if (!total) {

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


  const startIndex =
    (currentPage - 1) *
    PAYMENTS_PER_PAGE;


  const pagePayments =
    filteredPayments.slice(
      startIndex,
      startIndex + PAYMENTS_PER_PAGE
    );


  pagePayments.forEach(payment => {

    paymentTableBody.appendChild(
      createPaymentRow(payment)
    );

  });


  renderPaymentPagination();

}


// =========================================================
// CREATE PAYMENT ROW
// =========================================================

function createPaymentRow(payment) {

  const row =
    document.createElement("tr");


  row.dataset.paymentId =
    payment.id;


  row.innerHTML = `

    <td>

      <div class="payment-transaction-cell">

        <div class="payment-transaction-icon">

          <i class="${getPaymentTypeIcon(payment.type)}"></i>

        </div>

        <div class="payment-transaction-info">

          <strong>
            ${escapeHTML(payment.id)}
          </strong>

          <span>
            ${escapeHTML(payment.relatedReference)}
          </span>

        </div>

      </div>

    </td>


    <td>

      <div class="payment-customer-cell">

        <div class="payment-customer-avatar">
          ${getInitial(payment.customer)}
        </div>

        <div class="payment-customer-info">

          <strong>
            ${escapeHTML(payment.customer)}
          </strong>

          <span>
            ${escapeHTML(payment.customerPhone)}
          </span>

        </div>

      </div>

    </td>


    <td>

      <span
        class="payment-reference"
        title="${escapeHTML(payment.reference)}"
      >
        ${escapeHTML(payment.reference)}
      </span>

    </td>


    <td>

      <span class="payment-type">

        <i class="${getPaymentTypeIcon(payment.type)}"></i>

        ${formatPaymentType(payment.type)}

      </span>

    </td>


    <td>

      <strong class="payment-amount">
        ${formatMoney(payment.amount)}
      </strong>

    </td>


    <td>

      <span class="payment-fee">
        ${formatMoney(payment.fee)}
      </span>

    </td>


    <td>

      <span class="payment-method">

        <i class="${getPaymentMethodIcon(payment.method)}"></i>

        ${formatPaymentMethod(payment.method)}

      </span>

    </td>


    <td>

      ${createPaymentStatusBadge(payment.status)}

    </td>


    <td>

      <span class="admin-table-date">

        ${formatDateTime(payment.created)}

      </span>

    </td>


    <td>

      <div class="payment-action-wrap">

        <button
          class="payment-action-btn"
          type="button"
          data-action="toggle-menu"
          data-payment-id="${escapeHTML(payment.id)}"
          aria-label="Payment actions"
        >
          <i class="ri-more-2-fill"></i>
        </button>


        <div
          class="payment-action-menu"
          data-menu-for="${escapeHTML(payment.id)}"
        >

          <button
            type="button"
            data-action="view"
            data-payment-id="${escapeHTML(payment.id)}"
          >
            <i class="ri-eye-line"></i>
            View Details
          </button>


          <button
            type="button"
            data-action="verify"
            data-payment-id="${escapeHTML(payment.id)}"
          >
            <i class="ri-shield-check-line"></i>
            Verify Payment
          </button>


          ${
            payment.status === "successful"
              ? `
                <button
                  type="button"
                  data-action="refund"
                  data-payment-id="${escapeHTML(payment.id)}"
                  class="danger"
                >
                  <i class="ri-arrow-go-back-line"></i>
                  Refund Payment
                </button>
              `
              : ""
          }

        </div>

      </div>

    </td>

  `;


  return row;

}


// =========================================================
// TABLE ACTIONS
// =========================================================

function handlePaymentTableClick(event) {

  const actionElement =
    event.target.closest("[data-action]");


  if (!actionElement) return;


  const action =
    actionElement.dataset.action;


  const paymentId =
    actionElement.dataset.paymentId;


  if (!paymentId) return;


  switch (action) {

    case "toggle-menu":

      togglePaymentMenu(paymentId);

      break;


    case "view":

      closePaymentMenus();

      openPaymentDetails(paymentId);

      break;


    case "verify":

      closePaymentMenus();

      verifyPayment(paymentId);

      break;


    case "refund":

      closePaymentMenus();

      refundPayment(paymentId);

      break;

  }

}


// =========================================================
// TOGGLE ACTION MENU
// =========================================================

function togglePaymentMenu(paymentId) {

  const menu =
    document.querySelector(
      `[data-menu-for="${CSS.escape(paymentId)}"]`
    );


  if (!menu) return;


  const wasOpen =
    menu.classList.contains("open");


  closePaymentMenus();


  if (!wasOpen) {

    menu.classList.add("open");

  }

}


// =========================================================
// CLOSE ALL ACTION MENUS
// =========================================================

function closePaymentMenus() {

  document
    .querySelectorAll(".payment-action-menu.open")
    .forEach(menu => {

      menu.classList.remove("open");

    });

}


// =========================================================
// DOCUMENT CLICK
// =========================================================

function handleDocumentClick(event) {

  if (
    !event.target.closest(".payment-action-wrap")
  ) {

    closePaymentMenus();

  }

}


// =========================================================
// OPEN PAYMENT DETAILS
// =========================================================

function openPaymentDetails(paymentId) {

  const payment =
    payments.find(
      item => item.id === paymentId
    );


  if (!payment) return;


  selectedPayment = payment;


  populatePaymentDrawer(payment);


  paymentDrawer?.classList.add("open");

  paymentDrawerOverlay?.classList.add("open");


  paymentDrawer?.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.classList.add(
    "admin-drawer-open"
  );

}


// =========================================================
// POPULATE DRAWER
// =========================================================

function populatePaymentDrawer(payment) {

  setText(
    "drawerPaymentId",
    payment.id
  );


  const statusContainer =
    document.getElementById(
      "drawerPaymentStatus"
    );


  if (statusContainer) {

    statusContainer.innerHTML =
      createPaymentStatusBadge(
        payment.status
      );

  }


  setText(
    "drawerAmount",
    formatMoney(payment.amount)
  );


  setText(
    "drawerSubtotal",
    formatMoney(payment.amount)
  );


  setText(
    "drawerFee",
    formatMoney(payment.fee)
  );


  setText(
    "drawerNetAmount",
    formatMoney(payment.netAmount)
  );


  setText(
    "drawerTransactionId",
    payment.id
  );


  setText(
    "drawerReference",
    payment.reference
  );


  setText(
    "drawerGatewayReference",
    payment.gatewayReference
  );


  setText(
    "drawerPaymentType",
    formatPaymentType(payment.type)
  );


  setText(
    "drawerPaymentMethod",
    formatPaymentMethod(payment.method)
  );


  setText(
    "drawerCurrency",
    payment.currency
  );


  setText(
    "drawerCreated",
    formatDateTime(payment.created)
  );


  setText(
    "drawerUpdated",
    formatDateTime(payment.updated)
  );


  // Customer

  setText(
    "drawerCustomerName",
    payment.customer
  );


  setText(
    "drawerCustomerEmail",
    payment.customerEmail
  );


  setText(
    "drawerCustomerPhone",
    payment.customerPhone
  );


  setText(
    "drawerCustomerAvatar",
    getInitial(payment.customer)
  );


  // Related

  setText(
    "drawerRelatedReference",
    payment.relatedReference
  );


  setText(
    "drawerRelatedItem",
    payment.relatedItem
  );


  setText(
    "drawerRelatedSeller",
    payment.seller
  );


  // Refund

  setText(
    "drawerRefundStatus",
    formatRefundStatus(
      payment.refundStatus
    )
  );


  setText(
    "drawerRefundAmount",
    formatMoney(
      payment.refundAmount
    )
  );


  // Gateway

  setText(
    "drawerGateway",
    payment.gateway
  );


  setText(
    "drawerGatewayStatus",
    capitalize(
      payment.gatewayStatus
    )
  );


  setText(
    "drawerChannel",
    formatPaymentMethod(
      payment.channel
    )
  );


  updateDrawerButtons(payment);

}


// =========================================================
// DRAWER BUTTON STATE
// =========================================================

function updateDrawerButtons(payment) {

  if (!verifyPaymentBtn ||
      !refundPaymentBtn) return;


  if (
    payment.status === "successful" ||
    payment.status === "refunded"
  ) {

    verifyPaymentBtn.disabled = true;

    verifyPaymentBtn.innerHTML = `
      <i class="ri-checkbox-circle-line"></i>
      Verified
    `;

  } else {

    verifyPaymentBtn.disabled = false;

    verifyPaymentBtn.innerHTML = `
      <i class="ri-shield-check-line"></i>
      Verify Payment
    `;

  }


  if (
    payment.status !== "successful" ||
    payment.refundStatus === "refunded"
  ) {

    refundPaymentBtn.disabled = true;

    refundPaymentBtn.innerHTML = `
      <i class="ri-arrow-go-back-line"></i>
      ${
        payment.refundStatus === "refunded"
          ? "Refunded"
          : "Refund"
      }
    `;

  } else {

    refundPaymentBtn.disabled = false;

    refundPaymentBtn.innerHTML = `
      <i class="ri-arrow-go-back-line"></i>
      Refund
    `;

  }

}


// =========================================================
// CLOSE DRAWER
// =========================================================

function closePaymentDetails() {

  paymentDrawer?.classList.remove("open");

  paymentDrawerOverlay?.classList.remove("open");


  paymentDrawer?.setAttribute(
    "aria-hidden",
    "true"
  );


  document.body.classList.remove(
    "admin-drawer-open"
  );


  selectedPayment = null;

}


// =========================================================
// VERIFY PAYMENT FROM DRAWER
// =========================================================

function verifySelectedPayment() {

  if (!selectedPayment) return;


  verifyPayment(
    selectedPayment.id
  );

}


// =========================================================
// VERIFY PAYMENT
// =========================================================

function verifyPayment(paymentId) {

  const payment =
    payments.find(
      item => item.id === paymentId
    );


  if (!payment) return;


  if (
    payment.status === "successful" ||
    payment.status === "refunded"
  ) {

    showPaymentMessage(
      "This payment has already been verified."
    );

    return;

  }


  /*
    FRONTEND DEMO ONLY.

    Later this action should call your backend,
    which verifies the Paystack transaction securely.
  */


  payment.status = "successful";

  payment.gatewayStatus = "success";

  payment.updated =
    new Date().toISOString();


  if (
    selectedPayment &&
    selectedPayment.id === payment.id
  ) {

    selectedPayment = payment;

    populatePaymentDrawer(payment);

  }


  applyPaymentFilters();

  showPaymentMessage(
    `${payment.id} has been marked as successful.`
  );

}


// =========================================================
// REFUND FROM DRAWER
// =========================================================

function refundSelectedPayment() {

  if (!selectedPayment) return;


  refundPayment(
    selectedPayment.id
  );

}


// =========================================================
// REFUND PAYMENT
// =========================================================

function refundPayment(paymentId) {

  const payment =
    payments.find(
      item => item.id === paymentId
    );


  if (!payment) return;


  if (payment.status !== "successful") {

    showPaymentMessage(
      "Only successful payments can be refunded."
    );

    return;

  }


  if (payment.refundStatus === "refunded") {

    showPaymentMessage(
      "This payment has already been refunded."
    );

    return;

  }


  const confirmed =
    window.confirm(
      `Refund ${formatMoney(payment.amount)} for ${payment.id}?`
    );


  if (!confirmed) return;


  /*
    FRONTEND DEMO ONLY.

    In production this must go through
    your backend and Paystack refund API.
  */


  payment.status = "refunded";

  payment.refundStatus = "refunded";

  payment.refundAmount =
    payment.amount;

  payment.updated =
    new Date().toISOString();


  if (
    selectedPayment &&
    selectedPayment.id === payment.id
  ) {

    selectedPayment = payment;

    populatePaymentDrawer(payment);

  }


  applyPaymentFilters();

  showPaymentMessage(
    `${payment.id} has been refunded.`
  );

}


// =========================================================
// REFRESH
// =========================================================

function refreshPaymentList() {

  const button =
    refreshPayments;


  if (button) {

    button.disabled = true;

    button.innerHTML = `
      <i class="ri-loader-4-line admin-spin"></i>
      <span>Refreshing...</span>
    `;

  }


  setTimeout(() => {

    applyPaymentFilters();

    if (button) {

      button.disabled = false;

      button.innerHTML = `
        <i class="ri-refresh-line"></i>
        <span>Refresh</span>
      `;

    }

    showPaymentMessage(
      "Payments refreshed."
    );

  }, 500);

}


// =========================================================
// CLEAR FILTERS
// =========================================================

function clearAllPaymentFilters() {

  if (paymentSearch) {
    paymentSearch.value = "";
  }


  if (paymentStatusFilter) {
    paymentStatusFilter.value = "all";
  }


  if (paymentMethodFilter) {
    paymentMethodFilter.value = "all";
  }


  if (paymentTypeFilter) {
    paymentTypeFilter.value = "all";
  }


  if (paymentSort) {
    paymentSort.value = "newest";
  }


  currentPage = 1;

  applyPaymentFilters();

}


// =========================================================
// PAGINATION
// =========================================================

function renderPaymentPagination() {

  if (!paymentPagination) return;


  const totalPages =
    Math.ceil(
      filteredPayments.length /
      PAYMENTS_PER_PAGE
    );


  paymentPagination.innerHTML = "";


  if (totalPages <= 1) return;


  const previousButton =
    document.createElement("button");


  previousButton.type = "button";

  previousButton.className =
    "admin-pagination-btn";

  previousButton.dataset.page =
    String(currentPage - 1);

  previousButton.disabled =
    currentPage === 1;

  previousButton.innerHTML =
    `<i class="ri-arrow-left-s-line"></i>`;


  paymentPagination.appendChild(
    previousButton
  );


  const pages =
    getPaginationPages(
      currentPage,
      totalPages
    );


  pages.forEach(page => {

    if (page === "...") {

      const ellipsis =
        document.createElement("span");

      ellipsis.className =
        "admin-pagination-ellipsis";

      ellipsis.textContent = "...";

      paymentPagination.appendChild(
        ellipsis
      );

      return;

    }


    const button =
      document.createElement("button");


    button.type = "button";

    button.className =
      "admin-pagination-btn";


    if (page === currentPage) {
      button.classList.add("active");
    }


    button.dataset.page =
      String(page);


    button.textContent =
      page;


    paymentPagination.appendChild(
      button
    );

  });


  const nextButton =
    document.createElement("button");


  nextButton.type = "button";

  nextButton.className =
    "admin-pagination-btn";

  nextButton.dataset.page =
    String(currentPage + 1);

  nextButton.disabled =
    currentPage === totalPages;

  nextButton.innerHTML =
    `<i class="ri-arrow-right-s-line"></i>`;


  paymentPagination.appendChild(
    nextButton
  );

}


// =========================================================
// PAGINATION PAGES
// =========================================================

function getPaginationPages(
  current,
  total
) {

  if (total <= 7) {

    return Array.from(
      { length: total },
      (_, index) => index + 1
    );

  }


  const pages = [1];


  if (current > 4) {
    pages.push("...");
  }


  const start =
    Math.max(2, current - 1);


  const end =
    Math.min(total - 1, current + 1);


  for (
    let page = start;
    page <= end;
    page++
  ) {

    pages.push(page);

  }


  if (current < total - 3) {
    pages.push("...");
  }


  pages.push(total);


  return pages;

}


// =========================================================
// HANDLE PAGINATION
// =========================================================

function handlePaginationClick(event) {

  const button =
    event.target.closest(
      "[data-page]"
    );


  if (!button) return;


  if (button.disabled) return;


  const page =
    Number(button.dataset.page);


  if (!Number.isInteger(page)) return;


  const totalPages =
    Math.ceil(
      filteredPayments.length /
      PAYMENTS_PER_PAGE
    );


  if (
    page < 1 ||
    page > totalPages
  ) {
    return;
  }


  currentPage = page;

  renderPayments();

}


// =========================================================
// UPDATE STATS
// =========================================================

function updatePaymentStats() {

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


  const totalAmount =
    payments
      .filter(
        payment =>
          payment.status !== "failed"
      )
      .reduce(
        (sum, payment) =>
          sum + Number(payment.amount || 0),
        0
      );


  const totalFees =
    payments
      .filter(
        payment =>
          payment.status !== "failed"
      )
      .reduce(
        (sum, payment) =>
          sum + Number(payment.fee || 0),
        0
      );


  setText(
    "totalPayments",
    total
  );


  setText(
    "successfulPayments",
    successful
  );


  setText(
    "pendingPayments",
    pending
  );


  setText(
    "failedPayments",
    failed
  );


  setText(
    "totalPaymentAmount",
    formatMoney(totalAmount)
  );


  setText(
    "totalPaymentFees",
    formatMoney(totalFees)
  );

}


// =========================================================
// PAYMENT STATUS BADGE
// =========================================================

function createPaymentStatusBadge(status) {

  const config = {

    successful: {
      className: "payment-status-successful",
      icon: "ri-checkbox-circle-line",
      label: "Successful"
    },

    pending: {
      className: "payment-status-pending",
      icon: "ri-time-line",
      label: "Pending"
    },

    failed: {
      className: "payment-status-failed",
      icon: "ri-close-circle-line",
      label: "Failed"
    },

    refunded: {
      className: "payment-status-refunded",
      icon: "ri-arrow-go-back-line",
      label: "Refunded"
    }

  };


  const item =
    config[status] || {

      className: "",
      icon: "ri-question-line",
      label: capitalize(status)

    };


  return `

    <span class="payment-status-badge ${item.className}">

      <i class="${item.icon}"></i>

      ${item.label}

    </span>

  `;

}


// =========================================================
// TYPE ICON
// =========================================================

function getPaymentTypeIcon(type) {

  switch (type) {

    case "service":
      return "ri-service-line";

    case "order":
      return "ri-shopping-bag-3-line";

    default:
      return "ri-bank-card-line";

  }

}


// =========================================================
// METHOD ICON
// =========================================================

function getPaymentMethodIcon(method) {

  switch (method) {

    case "mobile_money":
      return "ri-smartphone-line";

    case "card":
      return "ri-bank-card-line";

    case "bank":
      return "ri-bank-line";

    default:
      return "ri-wallet-3-line";

  }

}


// =========================================================
// FORMAT PAYMENT TYPE
// =========================================================

function formatPaymentType(type) {

  const types = {

    order: "Order",

    service: "Service",

    other: "Other"

  };


  return types[type] ||
    capitalize(type);

}


// =========================================================
// FORMAT PAYMENT METHOD
// =========================================================

function formatPaymentMethod(method) {

  const methods = {

    mobile_money: "Mobile Money",

    card: "Card",

    bank: "Bank Transfer"

  };


  return methods[method] ||
    capitalize(method);

}


// =========================================================
// FORMAT REFUND STATUS
// =========================================================

function formatRefundStatus(status) {

  const statuses = {

    not_refunded: "Not Refunded",

    refunded: "Refunded",

    pending: "Refund Pending"

  };


  return statuses[status] ||
    capitalize(status);

}


// =========================================================
// FORMAT MONEY
// =========================================================

function formatMoney(value) {

  const amount =
    Number(value) || 0;


  return `GH₵${amount.toLocaleString(
    "en-GH",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  )}`;

}


// =========================================================
// FORMAT DATE
// =========================================================

function formatDateTime(value) {

  if (!value) return "—";


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


// =========================================================
// INITIAL
// =========================================================

function getInitial(name) {

  if (!name) return "?";


  return name
    .trim()
    .charAt(0)
    .toUpperCase();

}


// =========================================================
// CAPITALIZE
// =========================================================

function capitalize(value) {

  if (!value) return "";


  return value
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      letter =>
        letter.toUpperCase()
    );

}


// =========================================================
// SET TEXT
// =========================================================

function setText(
  id,
  value
) {

  const element =
    document.getElementById(id);


  if (!element) return;


  element.textContent =
    value ?? "—";

}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


// =========================================================
// ADMIN MESSAGE
// =========================================================

function showPaymentMessage(message) {

  /*
    If your admin.js already provides a snackbar/toast
    function, use it here automatically.
  */

  if (
    typeof window.showAdminMessage ===
    "function"
  ) {

    window.showAdminMessage(
      message
    );

    return;

  }


  if (
    typeof window.showSnackbar ===
    "function"
  ) {

    window.showSnackbar(
      message
    );

    return;

  }


  console.log(
    `[Payments] ${message}`
  );

}

