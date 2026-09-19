// ======================================================
// ECODATA ADMIN — ORDERS MANAGEMENT
// ======================================================


// ======================================================
// DEMO DATA
// ======================================================

let orders = [

  {
    id: "ORD-20260918-001",
    reference: "ECO-9F42K1",

    buyer: "Abdul Rahman",
    buyerId: "USR-10001",
    buyerPhone: "024 123 4567",
    buyerEmail: "abdul@example.com",

    seller: "CreativeHub",
    sellerId: "SEL-10001",

    product: "Modern CV Template Pack",
    productId: "PRD-10002",

    type: "digital",

    quantity: 1,

    subtotal: 35,
    delivery: 0,
    discount: 0,
    total: 35,

    payment: "paid",
    status: "completed",

    date: "2026-09-18T15:30:00"
  },


  {
    id: "ORD-20260918-002",
    reference: "ECO-2LK91P",

    buyer: "Mary Asante",
    buyerId: "USR-10002",
    buyerPhone: "020 443 9812",
    buyerEmail: "mary@example.com",

    seller: "Study Vault",
    sellerId: "SEL-10003",

    product: "BECE Mathematics Notes",
    productId: "PRD-10001",

    type: "digital",

    quantity: 2,

    subtotal: 50,
    delivery: 0,
    discount: 0,
    total: 50,

    payment: "paid",
    status: "processing",

    date: "2026-09-18T13:12:00"
  },


  {
    id: "ORD-20260917-003",
    reference: "ECO-7QPL82",

    buyer: "Samuel Mensah",
    buyerId: "USR-10003",
    buyerPhone: "054 612 3341",
    buyerEmail: "samuel@example.com",

    seller: "Creative Prints",
    sellerId: "SEL-10008",

    product: "A4 Premium Notebook",
    productId: "PRD-10009",

    type: "physical",

    quantity: 2,

    subtotal: 90,
    delivery: 25,
    discount: 0,
    total: 115,

    payment: "paid",
    status: "pending",

    date: "2026-09-17T18:42:00"
  },


  {
    id: "ORD-20260917-004",
    reference: "ECO-1MN73A",

    buyer: "Hawa Osman",
    buyerId: "USR-10004",
    buyerPhone: "027 881 5522",
    buyerEmail: "hawa@example.com",

    seller: "Learn More GH",
    sellerId: "SEL-10005",

    product: "Student Planner 2026",
    productId: "PRD-10005",

    type: "digital",

    quantity: 1,

    subtotal: 20,
    delivery: 0,
    discount: 5,
    total: 15,

    payment: "paid",
    status: "completed",

    date: "2026-09-17T10:05:00"
  },


  {
    id: "ORD-20260916-005",
    reference: "ECO-5TT18Z",

    buyer: "Ibrahim Salifu",
    buyerId: "USR-10005",
    buyerPhone: "050 982 3344",
    buyerEmail: "ibrahim@example.com",

    seller: "Design Corner",
    sellerId: "SEL-10004",

    product: "Business Flyer Design",
    productId: "PRD-10006",

    type: "service",

    quantity: 1,

    subtotal: 75,
    delivery: 0,
    discount: 0,
    total: 75,

    payment: "pending",
    status: "pending",

    date: "2026-09-16T21:15:00"
  },


  {
    id: "ORD-20260915-006",
    reference: "ECO-8KD52M",

    buyer: "Fatima Mohammed",
    buyerId: "USR-10006",
    buyerPhone: "055 321 7788",
    buyerEmail: "fatima@example.com",

    seller: "Tech Resources",
    sellerId: "SEL-10007",

    product: "JavaScript Project Templates",
    productId: "PRD-10007",

    type: "digital",

    quantity: 1,

    subtotal: 50,
    delivery: 0,
    discount: 0,
    total: 50,

    payment: "failed",
    status: "cancelled",

    date: "2026-09-15T14:22:00"
  },


  {
    id: "ORD-20260914-007",
    reference: "ECO-3BX62R",

    buyer: "Mubarak Fuseini",
    buyerId: "USR-10007",
    buyerPhone: "026 778 4321",
    buyerEmail: "mubarak@example.com",

    seller: "CreativeHub",
    sellerId: "SEL-10001",

    product: "Social Media Design Pack",
    productId: "PRD-10008",

    type: "digital",

    quantity: 1,

    subtotal: 60,
    delivery: 0,
    discount: 0,
    total: 60,

    payment: "paid",
    status: "completed",

    date: "2026-09-14T09:45:00"
  },


  {
    id: "ORD-20260913-008",
    reference: "ECO-4PZ81C",

    buyer: "Aisha Yakubu",
    buyerId: "USR-10008",
    buyerPhone: "059 228 7711",
    buyerEmail: "aisha@example.com",

    seller: "Study Vault",
    sellerId: "SEL-10003",

    product: "BECE Mathematics Notes",
    productId: "PRD-10001",

    type: "digital",

    quantity: 1,

    subtotal: 25,
    delivery: 0,
    discount: 0,
    total: 25,

    payment: "refunded",
    status: "refunded",

    date: "2026-09-13T16:08:00"
  }

];


// ======================================================
// STATE
// ======================================================

let filteredOrders = [];

let currentPage = 1;

const ORDERS_PER_PAGE = 6;

let selectedOrder = null;


// ======================================================
// ELEMENTS
// ======================================================

const orderTableBody =
  document.getElementById(
    "orderTableBody"
  );

const orderEmpty =
  document.getElementById(
    "orderEmpty"
  );

const orderPagination =
  document.getElementById(
    "orderPagination"
  );

const orderSearch =
  document.getElementById(
    "orderSearch"
  );

const statusFilter =
  document.getElementById(
    "statusFilter"
  );

const paymentFilter =
  document.getElementById(
    "paymentFilter"
  );

const typeFilter =
  document.getElementById(
    "typeFilter"
  );

const sortFilter =
  document.getElementById(
    "sortFilter"
  );

const orderResultCount =
  document.getElementById(
    "orderResultCount"
  );

const clearOrderFilters =
  document.getElementById(
    "clearOrderFilters"
  );

const refreshOrders =
  document.getElementById(
    "refreshOrders"
  );


// Stats

const totalOrders =
  document.getElementById(
    "totalOrders"
  );

const pendingOrders =
  document.getElementById(
    "pendingOrders"
  );

const completedOrders =
  document.getElementById(
    "completedOrders"
  );

const totalOrderRevenue =
  document.getElementById(
    "totalOrderRevenue"
  );


// Drawer

const orderDrawer =
  document.getElementById(
    "orderDrawer"
  );

const orderDrawerOverlay =
  document.getElementById(
    "orderDrawerOverlay"
  );

const closeOrderDrawer =
  document.getElementById(
    "closeOrderDrawer"
  );

const drawerOrderId =
  document.getElementById(
    "drawerOrderId"
  );

const drawerOrderStatus =
  document.getElementById(
    "drawerOrderStatus"
  );

const drawerPaymentStatus =
  document.getElementById(
    "drawerPaymentStatus"
  );

const drawerId =
  document.getElementById(
    "drawerId"
  );

const drawerType =
  document.getElementById(
    "drawerType"
  );

const drawerDate =
  document.getElementById(
    "drawerDate"
  );

const drawerReference =
  document.getElementById(
    "drawerReference"
  );

const drawerBuyer =
  document.getElementById(
    "drawerBuyer"
  );

const drawerBuyerPhone =
  document.getElementById(
    "drawerBuyerPhone"
  );

const drawerBuyerEmail =
  document.getElementById(
    "drawerBuyerEmail"
  );

const drawerBuyerId =
  document.getElementById(
    "drawerBuyerId"
  );

const drawerSeller =
  document.getElementById(
    "drawerSeller"
  );

const drawerSellerId =
  document.getElementById(
    "drawerSellerId"
  );

const drawerProduct =
  document.getElementById(
    "drawerProduct"
  );

const drawerProductId =
  document.getElementById(
    "drawerProductId"
  );

const drawerQuantity =
  document.getElementById(
    "drawerQuantity"
  );

const drawerSubtotal =
  document.getElementById(
    "drawerSubtotal"
  );

const drawerDelivery =
  document.getElementById(
    "drawerDelivery"
  );

const drawerDiscount =
  document.getElementById(
    "drawerDiscount"
  );

const drawerTotal =
  document.getElementById(
    "drawerTotal"
  );

const orderPrimaryAction =
  document.getElementById(
    "orderPrimaryAction"
  );


// ======================================================
// INITIALIZE
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    updateStats();

    applyOrderFilters();

  }
);


// ======================================================
// FILTERING
// ======================================================

function applyOrderFilters() {

  const search =
    orderSearch.value
      .trim()
      .toLowerCase();


  const status =
    statusFilter.value;


  const payment =
    paymentFilter.value;


  const type =
    typeFilter.value;


  const sort =
    sortFilter.value;


  filteredOrders =
    orders.filter(order => {

      const matchesSearch =
        !search ||

        order.id
          .toLowerCase()
          .includes(search) ||

        order.reference
          .toLowerCase()
          .includes(search) ||

        order.buyer
          .toLowerCase()
          .includes(search) ||

        order.seller
          .toLowerCase()
          .includes(search) ||

        order.product
          .toLowerCase()
          .includes(search);


      const matchesStatus =
        status === "all" ||
        order.status === status;


      const matchesPayment =
        payment === "all" ||
        order.payment === payment;


      const matchesType =
        type === "all" ||
        order.type === type;


      return (
        matchesSearch &&
        matchesStatus &&
        matchesPayment &&
        matchesType
      );

    });


  sortOrders(sort);

  currentPage = 1;

  renderOrders();

}


// ======================================================
// SORT
// ======================================================

function sortOrders(sort) {

  filteredOrders.sort(
    (a, b) => {

      switch (sort) {

        case "oldest":

          return new Date(a.date)
            - new Date(b.date);


        case "highest":

          return b.total - a.total;


        case "lowest":

          return a.total - b.total;


        case "newest":
        default:

          return new Date(b.date)
            - new Date(a.date);

      }

    }
  );

}


// ======================================================
// RENDER ORDERS
// ======================================================

function renderOrders() {

  orderTableBody.innerHTML =
    "";


  const total =
    filteredOrders.length;


  orderResultCount.textContent =
    `${total} order${total === 1 ? "" : "s"}`;


  if (!total) {

    orderEmpty.hidden =
      false;

    orderPagination.innerHTML =
      "";

    return;

  }


  orderEmpty.hidden =
    true;


  const start =
    (currentPage - 1) *
    ORDERS_PER_PAGE;


  const end =
    start +
    ORDERS_PER_PAGE;


  const pageOrders =
    filteredOrders.slice(
      start,
      end
    );


  pageOrders.forEach(order => {

    orderTableBody.appendChild(
      createOrderRow(order)
    );

  });


  renderPagination();

}


// ======================================================
// CREATE ORDER ROW
// ======================================================

function createOrderRow(order) {

  const tr =
    document.createElement(
      "tr"
    );


  tr.innerHTML = `

    <td>

      <div class="management-order">

        <div class="management-order-icon">

          <i class="${getOrderIcon(
            order.type
          )}"></i>

        </div>


        <div class="management-order-info">

          <strong>
            ${escapeHTML(order.id)}
          </strong>

          <span>
            ${escapeHTML(order.product)}
          </span>

        </div>

      </div>

    </td>


    <td>
      ${escapeHTML(order.buyer)}
    </td>


    <td>
      ${escapeHTML(order.seller)}
    </td>


    <td>
      ${formatMoney(order.total)}
    </td>


    <td>
      ${createPaymentBadge(
        order.payment
      )}
    </td>


    <td>
      ${createStatusBadge(
        order.status
      )}
    </td>


    <td>
      ${formatDateTime(
        order.date
      )}
    </td>


    <td>

      <div class="management-action">

        <button
          type="button"
          class="management-action-button"
          data-action="open"
          data-id="${order.id}"
          title="Manage order"
        >
          <i class="ri-more-2-fill"></i>
        </button>


        <div class="management-action-menu">

          <button
            type="button"
            data-action="view"
            data-id="${order.id}"
          >
            <i class="ri-eye-line"></i>
            View details
          </button>


          ${
            order.status === "pending"
            ? `
              <button
                type="button"
                data-action="process"
                data-id="${order.id}"
              >
                <i class="ri-loader-4-line"></i>
                Mark processing
              </button>
            `
            : ""
          }


          ${
            order.status === "processing"
            ? `
              <button
                type="button"
                data-action="complete"
                data-id="${order.id}"
              >
                <i class="ri-checkbox-circle-line"></i>
                Mark completed
              </button>
            `
            : ""
          }


          ${
            order.status === "pending" ||
            order.status === "processing"
            ? `
              <button
                type="button"
                data-action="cancel"
                data-id="${order.id}"
              >
                <i class="ri-close-circle-line"></i>
                Cancel order
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
// TABLE ACTIONS
// ======================================================

orderTableBody.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        "[data-action]"
      );


    if (!button)
      return;


    const action =
      button.dataset.action;


    const orderId =
      button.dataset.id;


    const order =
      orders.find(
        item =>
          item.id === orderId
      );


    if (!order)
      return;


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

          if (
            menu !== container
          ) {

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

      openOrderDrawer(order);

      return;

    }


    if (action === "process") {

      updateOrderStatus(
        order,
        "processing"
      );

      return;

    }


    if (action === "complete") {

      updateOrderStatus(
        order,
        "completed"
      );

      return;

    }


    if (action === "cancel") {

      cancelOrder(order);

    }

  }
);


// ======================================================
// UPDATE ORDER STATUS
// ======================================================

function updateOrderStatus(
  order,
  status
) {

  order.status =
    status;


  updateStats();

  applyOrderFilters();


  if (
    selectedOrder?.id ===
    order.id
  ) {

    openOrderDrawer(order);

  }

}


// ======================================================
// CANCEL ORDER
// ======================================================

function cancelOrder(order) {

  const confirmed =
    confirm(
      `Cancel order ${order.id}?`
    );


  if (!confirmed)
    return;


  order.status =
    "cancelled";


  updateStats();

  applyOrderFilters();


  if (
    selectedOrder?.id ===
    order.id
  ) {

    openOrderDrawer(order);

  }

}


// ======================================================
// OPEN DRAWER
// ======================================================

function openOrderDrawer(order) {

  selectedOrder =
    order;


  drawerOrderId.textContent =
    order.id;


  drawerOrderStatus.innerHTML =
    createStatusBadge(
      order.status
    );


  drawerPaymentStatus.innerHTML =
    createPaymentBadge(
      order.payment
    );


  drawerId.textContent =
    order.id;


  drawerType.textContent =
    capitalize(
      order.type
    );


  drawerDate.textContent =
    formatDateTime(
      order.date
    );


  drawerReference.textContent =
    order.reference;


  drawerBuyer.textContent =
    order.buyer;


  drawerBuyerPhone.textContent =
    order.buyerPhone;


  drawerBuyerEmail.textContent =
    order.buyerEmail;


  drawerBuyerId.textContent =
    order.buyerId;


  drawerSeller.textContent =
    order.seller;


  drawerSellerId.textContent =
    order.sellerId;


  drawerProduct.textContent =
    order.product;


  drawerProductId.textContent =
    order.productId;


  drawerQuantity.textContent =
    order.quantity;


  drawerSubtotal.textContent =
    formatMoney(
      order.subtotal
    );


  drawerDelivery.textContent =
    formatMoney(
      order.delivery
    );


  drawerDiscount.textContent =
    `-${formatMoney(
      order.discount
    )}`;


  drawerTotal.textContent =
    formatMoney(
      order.total
    );


  updateDrawerAction();


  orderDrawerOverlay.hidden =
    false;


  requestAnimationFrame(
    () => {

      orderDrawerOverlay.classList.add(
        "is-visible"
      );

      orderDrawer.classList.add(
        "is-open"
      );

      orderDrawer.setAttribute(
        "aria-hidden",
        "false"
      );

    }
  );

}


// ======================================================
// CLOSE DRAWER
// ======================================================

function closeOrderDetails() {

  orderDrawer.classList.remove(
    "is-open"
  );


  orderDrawerOverlay.classList.remove(
    "is-visible"
  );


  orderDrawer.setAttribute(
    "aria-hidden",
    "true"
  );


  setTimeout(
    () => {

      orderDrawerOverlay.hidden =
        true;

    },
    250
  );


  selectedOrder =
    null;

}


closeOrderDrawer.addEventListener(
  "click",
  closeOrderDetails
);


orderDrawerOverlay.addEventListener(
  "click",
  closeOrderDetails
);


// ======================================================
// DRAWER ACTION
// ======================================================

function updateDrawerAction() {

  if (!selectedOrder)
    return;


  orderPrimaryAction.className =
    "admin-secondary-button";


  if (
    selectedOrder.status ===
    "pending"
  ) {

    orderPrimaryAction.innerHTML = `
      <i class="ri-loader-4-line"></i>
      <span>Mark Processing</span>
    `;

    return;

  }


  if (
    selectedOrder.status ===
    "processing"
  ) {

    orderPrimaryAction.innerHTML = `
      <i class="ri-checkbox-circle-line"></i>
      <span>Mark Completed</span>
    `;

    return;

  }


  orderPrimaryAction.innerHTML = `
    <i class="ri-check-line"></i>
    <span>No Action Required</span>
  `;

}


orderPrimaryAction.addEventListener(
  "click",
  () => {

    if (!selectedOrder)
      return;


    if (
      selectedOrder.status ===
      "pending"
    ) {

      updateOrderStatus(
        selectedOrder,
        "processing"
      );

      return;

    }


    if (
      selectedOrder.status ===
      "processing"
    ) {

      updateOrderStatus(
        selectedOrder,
        "completed"
      );

    }

  }
);


// ======================================================
// PAGINATION
// ======================================================

function renderPagination() {

  const totalPages =
    Math.ceil(
      filteredOrders.length /
      ORDERS_PER_PAGE
    );


  orderPagination.innerHTML =
    "";


  if (totalPages <= 1)
    return;


  const previous =
    document.createElement(
      "button"
    );


  previous.type =
    "button";

  previous.className =
    "management-page-button";

  previous.innerHTML =
    `<i class="ri-arrow-left-s-line"></i>`;

  previous.disabled =
    currentPage === 1;


  previous.addEventListener(
    "click",
    () => {

      if (
        currentPage <= 1
      )
        return;


      currentPage--;

      renderOrders();

    }
  );


  orderPagination.appendChild(
    previous
  );


  for (
    let page = 1;
    page <= totalPages;
    page++
  ) {

    const button =
      document.createElement(
        "button"
      );


    button.type =
      "button";

    button.className =
      "management-page-button";


    if (
      page === currentPage
    ) {

      button.classList.add(
        "active"
      );

    }


    button.textContent =
      page;


    button.addEventListener(
      "click",
      () => {

        currentPage =
          page;

        renderOrders();

      }
    );


    orderPagination.appendChild(
      button
    );

  }


  const next =
    document.createElement(
      "button"
    );


  next.type =
    "button";

  next.className =
    "management-page-button";

  next.innerHTML =
    `<i class="ri-arrow-right-s-line"></i>`;

  next.disabled =
    currentPage ===
    totalPages;


  next.addEventListener(
    "click",
    () => {

      if (
        currentPage >=
        totalPages
      )
        return;


      currentPage++;

      renderOrders();

    }
  );


  orderPagination.appendChild(
    next
  );

}


// ======================================================
// EVENTS
// ======================================================

orderSearch.addEventListener(
  "input",
  applyOrderFilters
);


statusFilter.addEventListener(
  "change",
  applyOrderFilters
);


paymentFilter.addEventListener(
  "change",
  applyOrderFilters
);


typeFilter.addEventListener(
  "change",
  applyOrderFilters
);


sortFilter.addEventListener(
  "change",
  applyOrderFilters
);


clearOrderFilters.addEventListener(
  "click",
  () => {

    orderSearch.value =
      "";

    statusFilter.value =
      "all";

    paymentFilter.value =
      "all";

    typeFilter.value =
      "all";

    sortFilter.value =
      "newest";


    applyOrderFilters();

  }
);


// ======================================================
// REFRESH
// ======================================================

refreshOrders.addEventListener(
  "click",
  () => {

    refreshOrders.disabled =
      true;


    const icon =
      refreshOrders.querySelector(
        "i"
      );


    const text =
      refreshOrders.querySelector(
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

        applyOrderFilters();


        icon.classList.remove(
          "admin-spin"
        );


        if (text) {

          text.textContent =
            "Refresh";

        }


        refreshOrders.disabled =
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
    orders.length;


  const pending =
    orders.filter(
      order =>
        order.status ===
          "pending" ||
        order.status ===
          "processing"
    ).length;


  const completed =
    orders.filter(
      order =>
        order.status ===
        "completed"
    ).length;


  const revenue =
    orders
      .filter(
        order =>
          order.payment ===
          "paid"
      )
      .reduce(
        (sum, order) =>
          sum +
          Number(
            order.total || 0
          ),
        0
      );


  totalOrders.textContent =
    total;


  pendingOrders.textContent =
    pending;


  completedOrders.textContent =
    completed;


  totalOrderRevenue.textContent =
    formatMoney(
      revenue
    );

}


// ======================================================
// ORDER ICON
// ======================================================

function getOrderIcon(type) {

  switch (type) {

    case "digital":

      return "ri-file-download-line";


    case "physical":

      return "ri-shopping-bag-3-line";


    case "service":

      return "ri-customer-service-2-line";


    default:

      return "ri-file-list-3-line";

  }

}


// ======================================================
// STATUS BADGE
// ======================================================

function createStatusBadge(
  status
) {

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
// PAYMENT BADGE
// ======================================================

function createPaymentBadge(
  payment
) {

  const icons = {

    paid:
      "ri-checkbox-circle-line",

    pending:
      "ri-time-line",

    failed:
      "ri-close-circle-line",

    refunded:
      "ri-arrow-go-back-line"

  };


  return `
    <span class="management-payment">

      <i class="${
        icons[payment] ||
        "ri-bank-card-line"
      }"></i>

      ${capitalize(payment)}

    </span>
  `;

}


// ======================================================
// MONEY
// ======================================================

function formatMoney(
  amount
) {

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

function formatDateTime(
  date
) {

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

function capitalize(
  value
) {

  return value
    .charAt(0)
    .toUpperCase() +
    value.slice(1);

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(
  value
) {

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


// ======================================================
// CLOSE ACTION MENUS
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

    if (
      event.key ===
      "Escape"
    ) {

      closeOrderDetails();

    }

  }
);