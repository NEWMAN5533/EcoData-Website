/* =========================================
   MY ORDERS
========================================= */

document.addEventListener("DOMContentLoaded", () => {


  /* =========================================
     ELEMENTS
  ========================================== */

  const ordersList =
    document.getElementById("ordersList");

  const ordersEmpty =
    document.getElementById("ordersEmpty");

  const orderSearch =
    document.getElementById("orderSearch");

  const orderFilter =
    document.getElementById("orderFilter");

  const orderSort =
    document.getElementById("orderSort");

  const clearOrderFilters =
    document.getElementById(
      "clearOrderFilters"
    );

  const signOutBtn =
    document.getElementById(
      "signOutBtn"
    );


  /* =========================================
     SAMPLE ORDERS
  ========================================== */

  const orders = [

    {
      id: "ED-20260908-1024",

      product:
        "Everyday Laptop Backpack",

      seller:
        "EcoGear Store",

      date:
        "2026-09-08T14:30:00",

      amount:
        280,

      status:
        "processing",

      payment:
        "Mobile Money",

      icon:
        "ri-briefcase-4-line",

      message:
        "Your order is being prepared for delivery."

    },


    {
      id: "ED-20260905-0918",

      product:
        "Modern Professional CV Template",

      seller:
        "CreativeHub",

      date:
        "2026-09-05T10:15:00",

      amount:
        45,

      status:
        "delivered",

      payment:
        "Mobile Money",

      icon:
        "ri-file-text-line",

      message:
        "Your digital product is ready to download."

    },


    {
      id: "ED-20260830-0734",

      product:
        "Wireless Bluetooth Headphones",

      seller:
        "TechZone",

      date:
        "2026-08-30T16:45:00",

      amount:
        650,

      status:
        "delivered",

      payment:
        "Bank Card",

      icon:
        "ri-headphone-line",

      message:
        "Order delivered successfully."

    },


    {
      id: "ED-20260824-0612",

      product:
        "Professional Logo Design",

      seller:
        "DesignCraft",

      date:
        "2026-08-24T09:20:00",

      amount:
        120,

      status:
        "failed",

      payment:
        "Mobile Money",

      icon:
        "ri-palette-line",

      message:
        "Payment could not be completed."

    },


    {
      id: "ED-20260819-0481",

      product:
        "Social Media Content Planner",

      seller:
        "CreatorStudio",

      date:
        "2026-08-19T11:05:00",

      amount:
        35,

      status:
        "delivered",

      payment:
        "Mobile Money",

      icon:
        "ri-calendar-check-line",

      message:
        "Your digital product is ready to download."

    }

  ];


  /* =========================================
     FORMAT CURRENCY
  ========================================== */

  function formatCurrency(amount) {

    return new Intl.NumberFormat(
      "en-GH",
      {
        style: "currency",
        currency: "GHS",
        minimumFractionDigits: 2
      }
    ).format(amount);

  }


  /* =========================================
     FORMAT DATE
  ========================================== */

  function formatDate(date) {

    return new Intl.DateTimeFormat(
      "en-GH",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    ).format(new Date(date));

  }


  /* =========================================
     STATUS DETAILS
  ========================================== */

  function getStatusDetails(status) {

    const statusMap = {

      processing: {
        label: "Processing",
        icon: "ri-time-line"
      },

      delivered: {
        label: "Delivered",
        icon: "ri-checkbox-circle-line"
      },

      failed: {
        label: "Failed",
        icon: "ri-close-circle-line"
      },

      cancelled: {
        label: "Cancelled",
        icon: "ri-forbid-2-line"
      }

    };


    return (
      statusMap[status] ||
      statusMap.processing
    );

  }


  /* =========================================
     ORDER ACTIONS
  ========================================== */

  function getOrderActions(order) {

    if (order.status === "processing") {

      return `
        <button
          class="order-action primary"
          data-action="track"
          data-id="${order.id}"
        >
          <i class="ri-route-line"></i>
          Track Order
        </button>

        <button
          class="order-action"
          data-action="view"
          data-id="${order.id}"
        >
          <i class="ri-eye-line"></i>
          View
        </button>
      `;

    }


    if (order.status === "delivered") {

      return `
        <button
          class="order-action primary"
          data-action="download"
          data-id="${order.id}"
        >
          <i class="ri-download-2-line"></i>
          Download
        </button>

        <button
          class="order-action"
          data-action="view"
          data-id="${order.id}"
        >
          <i class="ri-eye-line"></i>
          View
        </button>
      `;

    }


    if (order.status === "failed") {

      return `
        <button
          class="order-action primary"
          data-action="retry"
          data-id="${order.id}"
        >
          <i class="ri-refresh-line"></i>
          Retry
        </button>

        <button
          class="order-action"
          data-action="view"
          data-id="${order.id}"
        >
          <i class="ri-eye-line"></i>
          View
        </button>
      `;

    }


    return `
      <button
        class="order-action"
        data-action="view"
        data-id="${order.id}"
      >
        <i class="ri-eye-line"></i>
        View
      </button>
    `;

  }


  /* =========================================
     RENDER ORDERS
  ========================================== */

  function renderOrders(list) {

    ordersList.innerHTML = "";


    if (!list.length) {

      ordersEmpty.hidden = false;

      return;

    }


    ordersEmpty.hidden = true;


    list.forEach(order => {

      const status =
        getStatusDetails(
          order.status
        );


      const article =
        document.createElement("article");


      article.className =
        "order-item";


      article.innerHTML = `

        <div class="order-item-top">

          <div class="order-product">

            <div class="order-product-icon">

              <i class="${order.icon}"></i>

            </div>


            <div class="order-product-info">

              <strong>
                ${order.product}
              </strong>

              <span>
                Seller:
                <span class="seller">
                  ${order.seller}
                </span>
              </span>

            </div>

          </div>


          <span
            class="order-status ${order.status}"
          >

            <i class="${status.icon}"></i>

            ${status.label}

          </span>

        </div>


        <div class="order-details">


          <div class="order-detail">

            <label>
              Order ID
            </label>

            <strong>
              ${order.id}
            </strong>

          </div>


          <div class="order-detail">

            <label>
              Order Date
            </label>

            <strong>
              ${formatDate(order.date)}
            </strong>

          </div>


          <div class="order-detail">

            <label>
              Payment
            </label>

            <strong>
              ${order.payment}
            </strong>

          </div>


          <div class="order-detail">

            <label>
              Total
            </label>

            <strong class="order-total">
              ${formatCurrency(order.amount)}
            </strong>

          </div>


        </div>


        <div class="order-item-footer">

          <div class="order-message">

            <i class="${status.icon}"></i>

            <span>
              ${order.message}
            </span>

          </div>


          <div class="order-actions">

            ${getOrderActions(order)}

          </div>

        </div>

      `;


      ordersList.appendChild(article);

    });

  }


  /* =========================================
     FILTER + SEARCH + SORT
  ========================================== */

  function updateOrders() {

    const search =
      orderSearch.value
        .trim()
        .toLowerCase();


    const filter =
      orderFilter.value;


    const sort =
      orderSort.value;


    let result =
      orders.filter(order => {

        const matchesSearch =

          !search ||

          order.id
            .toLowerCase()
            .includes(search) ||

          order.product
            .toLowerCase()
            .includes(search) ||

          order.seller
            .toLowerCase()
            .includes(search);


        const matchesFilter =

          filter === "all" ||

          order.status === filter;


        return (
          matchesSearch &&
          matchesFilter
        );

      });


    result.sort((a, b) => {

      if (sort === "newest") {

        return (
          new Date(b.date) -
          new Date(a.date)
        );

      }


      if (sort === "oldest") {

        return (
          new Date(a.date) -
          new Date(b.date)
        );

      }


      if (sort === "highest") {

        return b.amount - a.amount;

      }


      if (sort === "lowest") {

        return a.amount - b.amount;

      }


      return 0;

    });


    renderOrders(result);

  }


  /* =========================================
     UPDATE STATS
  ========================================== */

  function updateStats() {

    document.getElementById(
      "totalOrders"
    ).textContent =
      orders.length;


    document.getElementById(
      "processingOrders"
    ).textContent =
      orders.filter(
        order =>
          order.status === "processing"
      ).length;


    document.getElementById(
      "deliveredOrders"
    ).textContent =
      orders.filter(
        order =>
          order.status === "delivered"
      ).length;


    document.getElementById(
      "failedOrders"
    ).textContent =
      orders.filter(
        order =>
          order.status === "failed"
      ).length;

  }


  /* =========================================
     ORDER ACTIONS
  ========================================== */

  ordersList.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          ".order-action"
        );


      if (!button) return;


      const orderId =
        button.dataset.id;

      const action =
        button.dataset.action;


      const order =
        orders.find(
          item =>
            item.id === orderId
        );


      if (!order) return;


      if (action === "view") {

        alert(
          `Order ${order.id}\n\n${order.product}\n${formatCurrency(order.amount)}`
        );

      }


      if (action === "track") {

        alert(
          `Tracking order ${order.id}...`
        );

      }


      if (action === "download") {

        alert(
          `Preparing your download for "${order.product}".`
        );

      }


      if (action === "retry") {

        alert(
          `Retrying payment for order ${order.id}...`
        );

      }

    }
  );


  /* =========================================
     SEARCH
  ========================================== */

  orderSearch.addEventListener(
    "input",
    updateOrders
  );


  /* =========================================
     FILTER
  ========================================== */

  orderFilter.addEventListener(
    "change",
    updateOrders
  );


  /* =========================================
     SORT
  ========================================== */

  orderSort.addEventListener(
    "change",
    updateOrders
  );


  /* =========================================
     CLEAR FILTERS
  ========================================== */

  clearOrderFilters.addEventListener(
    "click",
    () => {

      orderSearch.value = "";

      orderFilter.value = "all";

      orderSort.value = "newest";

      updateOrders();

    }
  );


  /* =========================================
     SIGN OUT
  ========================================== */

  signOutBtn.addEventListener(
    "click",
    () => {

      const confirmed =
        confirm(
          "Are you sure you want to sign out?"
        );


      if (!confirmed) return;


      // Firebase logout will be connected later.

      window.location.href =
        "index.html";

    }
  );


  /* =========================================
     INITIALIZE
  ========================================== */

  updateStats();

  updateOrders();

});