/* =========================================================
   ECODATA ADMINISTRATOR
   BUNDLE DASHBOARD
========================================================= */


/* =========================================================
   ELEMENTS
========================================================= */

const refreshBundleDashboard =
  document.getElementById("refreshBundleDashboard");

const bundleAdminMessage =
  document.getElementById("bundleAdminMessage");

const bundleOrderSearch =
  document.getElementById("bundleOrderSearch");

const bundleNetworkFilter =
  document.getElementById("bundleNetworkFilter");

const bundleStatusFilter =
  document.getElementById("bundleStatusFilter");

const rowWrapper =
  document.getElementById("rowWrapper");

const emptyBody =
  document.getElementById("empty-body");

const bundleOrderPagination =
  document.getElementById("bundleOrderPagination");


/* =========================================================
   STATE
========================================================= */

let bundleOrders = [];

let bundleCurrentPage = 1;

const BUNDLE_ITEMS_PER_PAGE = 2;

let profitChart = null;

let currentChartMode = "weekly";


/* =========================================================
   MESSAGE
========================================================= */

function showBundleMessage(message) {

  if (!bundleAdminMessage) return;

  bundleAdminMessage.textContent = message;

  bundleAdminMessage.classList.add("show");

  clearTimeout(
    showBundleMessage.timer
  );

  showBundleMessage.timer =
    setTimeout(() => {

      bundleAdminMessage.classList.remove("show");

    }, 2600);
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}




function getFilteredBundleOrders() {

  const search =
    bundleOrderSearch?.value
      ?.trim()
      .toLowerCase() || "";

  const network =
    bundleNetworkFilter?.value || "all";

  const status =
    bundleStatusFilter?.value || "all";


  return bundleOrders.filter(order => {

    const orderId =
      String(
        order.orderId ||
        order.id ||
        order.orderID ||
        ""
      ).toLowerCase();

    const recipient =
      String(
        order.recipient ||
        order.phone ||
        order.phoneNumber ||
        ""
      ).toLowerCase();

    const orderNetwork =
      String(
        order.network ||
        ""
      ).toLowerCase();

    const orderStatus =
      normalizeBundleStatus(
        order.status ||
        order["LD-Status"] ||
        ""
      );


    const matchesSearch =
      !search ||
      orderId.includes(search) ||
      recipient.includes(search) ||
      orderNetwork.includes(search);


    const matchesNetwork =
      network === "all" ||
      orderNetwork === network.toLowerCase();


    const matchesStatus =
      status === "all" ||
      orderStatus === status;


    return (
      matchesSearch &&
      matchesNetwork &&
      matchesStatus
    );

  });

}


/* =========================================================
   RENDER ORDERS
========================================================= */

function renderBundleOrders() {

  const rowWrapper = document.getElementById("rowWrapper");
  const emptyBody = document.getElementById("empty-body");

  if (!rowWrapper){
    console.warn("rowWrapper is no found");
    return;
  } 


  const filteredOrders =
    getFilteredBundleOrders();

    // No orders
    if(!filteredOrders.length){

      rowWrapper.innerHTML = "";

      if(emptyBody){
        emptyBody.style.display = "";
      }

      renderBundlePagination(0);

      return;
    }

    // Hide empty state
  if (emptyBody) {
    emptyBody.style.display = "none";
  }


  // Pagination

  const end = start + BUNDLE_ITEMS_PER_PAGE;

  const start =
    (bundleCurrentPage - 1) *
    BUNDLE_ITEMS_PER_PAGE;


  const pageOrders =
    filteredOrders.slice(
      start,
      end
    );


    // Render row
  rowWrapper.innerHTML =
    pageOrders
      .map(order =>
        createBundleOrderRow(order)
      )
      .join("");


      // update pagination
  renderBundlePagination(
   filteredOrders.length
  );

}


function normalizeBundleStatus(value){
  return String(
    value || ""
  )
  .trim()
  .toLowerCase();
}



//========================
// FORMAT CURRENCY
//========================
function formatBundleCurrency(value){
  const amount = 
  Number(value) || 0;

  return `GHS ${amount.toFixed(2)}`;
}

/* =========================================================
   CREATE ORDER ROW
========================================================= */
function createBundleOrderRow(order) {

  const orderId =
    order.orderId || "-";

  const network =
    order.network
      ? String(order.network).toUpperCase()
      : "-";

  const size =
    order.volume !== undefined &&
    order.volume !== null
      ? `${order.volume}GB`
      : "-";

  const price =
    Number(order.amount) || 0;

  const recipient =
    order.recipient || "-";

  const paid =
    order.paid === true ||
    order.paid === "true" ||
    order.paid === "paid";

  const status =
    getOrderStatus(order) || "unknown";

  const submitted =
    order.createdAt;

  const updated =
    order.updatedAt;

  return `
    <tr>

      <td>
        <strong class="table-primary-text">
          ${escapeHtml(orderId)}
        </strong>
      </td>

      <td>
        ${escapeHtml(network)}
      </td>

      <td>
        ${escapeHtml(size)}
      </td>

      <td>
        ${formatBundleCurrency(price)}
      </td>

      <td>
        ${escapeHtml(recipient)}
      </td>

      <td>
        <span class="bundle-paid-status">

          <i class="${
            paid
              ? "ri-checkbox-circle-line"
              : "ri-close-circle-line"
          }"></i>

          ${paid ? "Yes" : "No"}

        </span>
      </td>

      <td>
        ${formatBundleDate(submitted)}
      </td>

      <td>

        <span class="bundle-order-status ${normalizeBundleStatus(status)}">

          ${escapeHtml(status)}

        </span>

      </td>

      <td>
        ${formatBundleDate(updated)}
      </td>

      <td>

        <div class="management-action">

          <button
            type="button"
            class="management-action-button"
            aria-label="Order actions"
          >
            <i class="ri-more-2-fill"></i>
          </button>

          <div class="management-action-menu">

            <button
              type="button"
              data-order-action="view"
              data-order-id="${escapeHtml(orderId)}"
            >
              <i class="ri-eye-line"></i>
              View Order
            </button>

            <button
              type="button"
              data-order-action="copy"
              data-order-id="${escapeHtml(orderId)}"
            >
              <i class="ri-file-copy-line"></i>
              Copy Order ID
            </button>

          </div>

        </div>

      </td>

    </tr>
  `;
}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatBundleDate(value) {

  if (!value) {
    return "—";
  }

  let date;

  if(value?.toDate){
    date = value.toDate();
  }

  else if(value instanceof Date){
   date = value;
  }

  else{
    date = new Date(value);
  }

  if(Number.isNaN(date.getTime())){
    return "-";
  }

  return date.toLocaleTimeString(
    undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    }
  );
}


/* =========================================================
   PAGINATION
========================================================= */

function renderBundlePagination(
  totalItems,
  totalPages
) {

  if (!bundleOrderPagination) {
    return;
  }


  if (totalPages <= 1) {

    bundleOrderPagination.innerHTML = "";

    return;

  }


  const start =
    (bundleCurrentPage - 1) *
    BUNDLE_ITEMS_PER_PAGE + 1;


  const end =
    Math.min(
      bundleCurrentPage *
      BUNDLE_ITEMS_PER_PAGE,
      totalItems
    );


  const pages = [];

  pages.push(1);


  const startPage =
    Math.max(
      2,
      bundleCurrentPage - 1
    );


  const endPage =
    Math.min(
      totalPages - 1,
      bundleCurrentPage + 1
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


  let html = "";


  html += `
    <span class="pagination-info">
      Showing ${start}–${end} of ${totalItems}
    </span>
  `;


  html += `
    <button
      type="button"
      class="pagination-nav"
      data-page="${bundleCurrentPage - 1}"
      ${
        bundleCurrentPage === 1
          ? "disabled"
          : ""
      }
      aria-label="Previous page"
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
          ${
            page === bundleCurrentPage
              ? "active"
              : ""
          }
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
      data-page="${bundleCurrentPage + 1}"
      ${
        bundleCurrentPage === totalPages
          ? "disabled"
          : ""
      }
      aria-label="Next page"
    >
      <i class="ri-arrow-right-s-line"></i>
    </button>
  `;


  bundleOrderPagination.innerHTML =
    html;


  bundleOrderPagination
    .querySelectorAll("[data-page]")
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


          bundleCurrentPage =
            page;


          renderBundleOrders();

        }
      );

    });

}


/* =========================================================
   SEARCH / FILTER EVENTS
========================================================= */

[
  bundleOrderSearch,
  bundleNetworkFilter,
  bundleStatusFilter
]
  .forEach(element => {

    if (!element) return;


    element.addEventListener(
      "input",
      () => {

        bundleCurrentPage = 1;

        renderBundleOrders();

      }
    );


    element.addEventListener(
      "change",
      () => {

        bundleCurrentPage = 1;

        renderBundleOrders();

      }
    );

  });


/* =========================================================
   ACTION MENU
========================================================= */

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


      if (!wrapper) return;


      document
        .querySelectorAll(
          ".management-action-menu.show"
        )
        .forEach(menu => {

          if (
            !wrapper.contains(menu)
          ) {

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
        menu.classList.toggle("show");
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


/* =========================================================
   ORDER ACTIONS
========================================================= */

document.addEventListener(
  "click",
  async event => {

    const action =
      event.target.closest(
        "[data-order-action]"
      );


    if (!action) return;


    const actionType =
      action.dataset.orderAction;


    const orderId =
      action.dataset.orderId;


    if (
      actionType === "copy"
    ) {

      try {

        await navigator.clipboard.writeText(
          orderId
        );

        showBundleMessage(
          "Order ID copied."
        );

      } catch (error) {

        console.error(error);

      }

    }


    if (
      actionType === "view"
    ) {

      showBundleMessage(
        `Opening ${orderId}...`
      );

      /*
       * Connect your existing order
       * details drawer here.
       */

    }

  }
);


/* =========================================================
   REFRESH
========================================================= */

if (refreshBundleDashboard) {

  refreshBundleDashboard
    .addEventListener(
      "click",
      async () => {

        refreshBundleDashboard.disabled =
          true;


        const icon =
          refreshBundleDashboard
            .querySelector("i");


        if (icon) {
          icon.classList.add(
            "ri-spin"
          );
        }


        try {

          /*
           * IMPORTANT:
           *
           * Put your existing Firebase/API
           * analytics loading function here.
           *
           * Example:
           *
           * await loadBundleDashboard();
           *
           */


          await new Promise(
            resolve =>
              setTimeout(
                resolve,
                500
              )
          );


          showBundleMessage(
            "Bundle dashboard refreshed."
          );


        } catch (error) {

          console.error(
            "Bundle dashboard refresh failed:",
            error
          );


          showBundleMessage(
            "Unable to refresh dashboard."
          );


        } finally {

          refreshBundleDashboard.disabled =
            false;


          if (icon) {
            icon.classList.remove(
              "ri-spin"
            );
          }

        }

      }
    );

}


/* =========================================================
   CHART MODE
========================================================= */

function setChartMode(
  mode,
  button
) {

  currentChartMode =
    mode;


  document
    .querySelectorAll(
      ".chart-toggle button"
    )
    .forEach(btn => {

      btn.classList.remove(
        "active"
      );

    });


  if (button) {
    button.classList.add(
      "active"
    );
  }


  renderProfitChart();

}


/* =========================================================
   DEMO CHART DATA
   Replace with your existing analytics
   data source.
========================================================= */

const bundleChartData = {

  daily: {

    labels: [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun"
    ],

    values: [
      180,
      240,
      210,
      290,
      320,
      270,
      360
    ]

  },


  weekly: {

    labels: [
      "Week 1",
      "Week 2",
      "Week 3",
      "Week 4"
    ],

    values: [
      1250,
      1680,
      1490,
      1980
    ]

  },


  monthly: {

    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep"
    ],

    values: [
      4200,
      5100,
      4700,
      6200,
      5900,
      7100,
      6800,
      7900,
      8600
    ]

  }

};


/* =========================================================
   CHART
========================================================= */

function renderProfitChart() {

  const canvas =
    document.getElementById(
      "profitChart"
    );


  if (!canvas) return;


  if (
    typeof Chart ===
    "undefined"
  ) {

    console.warn(
      "Chart.js is not loaded."
    );

    return;

  }


  if (profitChart) {

    profitChart.destroy();

    profitChart = null;

  }


  const data =
    bundleChartData[
      currentChartMode
    ];


  const styles =
    getComputedStyle(
      document.documentElement
    );


  const textColor =
    styles.getPropertyValue(
      "--admin-text-muted"
    ).trim() ||
    "#888";


  const borderColor =
    styles.getPropertyValue(
      "--admin-border"
    ).trim() ||
    "#ddd";


  profitChart =
    new Chart(
      canvas,
      {

        type: "line",

        data: {

          labels:
            data.labels,

          datasets: [

            {

              label:
                "Profit",

              data:
                data.values,

              borderColor:
                textColor,

              backgroundColor:
                "rgba(100,100,100,.08)",

              borderWidth: 2,

              fill: true,

              tension: .35,

              pointRadius: 3,

              pointHoverRadius: 5

            }

          ]

        },


        options: {

          responsive: true,

          maintainAspectRatio:
            false,

          interaction: {

            intersect: false,

            mode: "index"

          },


          plugins: {

            legend: {

              display: false

            },


            tooltip: {

              callbacks: {

                label:
                  context =>
                    ` Profit: ${formatBundleCurrency(
                      context.parsed.y
                    )}`

              }

            }

          },


          scales: {

            x: {

              grid: {

                color:
                  borderColor

              },

              ticks: {

                color:
                  textColor,

                font: {
                  size: 9
                }

              }

            },


            y: {

              beginAtZero: true,

              grid: {

                color:
                  borderColor

              },

              ticks: {

                color:
                  textColor,

                font: {
                  size: 9
                },

                callback:
                  value =>
                    `₵${value}`

              }

            }

          }

        }

      }
    );

}


/* =========================================================
   INITIAL DEMO DATA
   Remove this section when connecting
   your existing Firestore/API loader.
========================================================= */

function loadDemoBundleOrders() {

  bundleOrders = [

    {
      orderId: "ORD-20481",
      network: "MTN",
      size: "10GB",
      price: 50,
      recipient: "0240000000",
      paid: true,
      submittedAt:
        "2026-09-20T08:20:00",
      status: "delivered",
      updatedAt:
        "2026-09-20T08:52:00"
    },

    {
      orderId: "ORD-20482",
      network: "MTN",
      size: "5GB",
      price: 28,
      recipient: "0550000000",
      paid: true,
      submittedAt:
        "2026-09-20T09:10:00",
      status: "processing",
      updatedAt:
        "2026-09-20T09:15:00"
    },

    {
      orderId: "ORD-20483",
      network: "Telecel",
      size: "3GB",
      price: 18,
      recipient: "0200000000",
      paid: true,
      submittedAt:
        "2026-09-20T09:40:00",
      status: "pending",
      updatedAt:
        "2026-09-20T09:40:00"
    },

    {
      orderId: "ORD-20484",
      network: "MTN",
      size: "20GB",
      price: 85,
      recipient: "0590000000",
      paid: true,
      submittedAt:
        "2026-09-20T10:05:00",
      status: "delivered",
      updatedAt:
        "2026-09-20T10:47:00"
    },

    {
      orderId: "ORD-20485",
      network: "AirtelTigo",
      size: "2GB",
      price: 14,
      recipient: "0270000000",
      paid: false,
      submittedAt:
        "2026-09-20T10:30:00",
      status: "failed",
      updatedAt:
        "2026-09-20T10:32:00"
    }

  ];


  renderBundleOrders();

}


/* =========================================================
   INITIALIZE
========================================================= */

function initializeBundleDashboard() {

  console.log("Bundle dashboard initialized");
  renderProfitChart();

}


/* =========================================================
   START
========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeBundleDashboard
  );

} else {

  initializeBundleDashboard();

}