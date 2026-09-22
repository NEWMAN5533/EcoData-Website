// =========================================================
// ADMIN REPORTS & ANALYTICS
// DEMO DATA
// =========================================================


// =========================================================
// DEMO DATA
// =========================================================

const reportData = {

  7: {
    label: "Last 7 days",

    revenue: [
      4200,
      6800,
      5400,
      9100,
      7600,
      11200,
      12480
    ],

    orders: [
      48,
      62,
      55,
      74,
      69,
      88,
      96
    ],

    users: 128,
    sellers: 18,

    revenueChange: 14.8,
    ordersChange: 9.6,
    usersChange: 6.4,
    sellersChange: 4.2
  },


  30: {
    label: "Last 30 days",

    revenue: [
      5200,
      6800,
      6100,
      8300,
      7600,
      9200,
      10400,
      8900,
      11300,
      12100,
      10800,
      13200,
      11800,
      14500,
      12480,
      15100,
      13800,
      16200,
      14900,
      17400,
      15800,
      18200,
      16900,
      19400,
      18100,
      20700,
      19800,
      22400,
      21600,
      24100
    ],

    orders: [
      58,
      64,
      61,
      72,
      69,
      78,
      81,
      74,
      86,
      91,
      84,
      96,
      89,
      102,
      98,
      108,
      103,
      116,
      111,
      124,
      118,
      129,
      123,
      136,
      131,
      142,
      138,
      151,
      147,
      158
    ],

    users: 486,
    sellers: 42,

    revenueChange: 18.7,
    ordersChange: 12.4,
    usersChange: 8.9,
    sellersChange: 7.1
  },


  90: {
    label: "Last 3 months",

    revenue: [
      8400,
      9100,
      9800,
      11200,
      10800,
      12400,
      13100,
      14500,
      15200,
      16100,
      17400,
      16900,
      18100,
      19400,
      20800,
      21700,
      22900,
      24100,
      25600,
      26800,
      27900,
      29100,
      30400,
      31800,
      33100,
      34500,
      35900,
      37200,
      38600,
      40100
    ],

    orders: [
      76,
      81,
      88,
      92,
      97,
      104,
      109,
      116,
      121,
      128,
      134,
      141,
      146,
      153,
      159,
      166,
      171,
      178,
      184,
      191,
      198,
      204,
      211,
      218,
      224,
      231,
      238,
      245,
      252,
      260
    ],

    users: 1248,
    sellers: 67,

    revenueChange: 24.3,
    ordersChange: 17.8,
    usersChange: 12.6,
    sellersChange: 9.4
  },


  365: {
    label: "This year",

    revenue: [
      18200,
      19400,
      21700,
      23100,
      24800,
      26500,
      29100,
      31800,
      34200,
      36900,
      40100,
      42800
    ],

    orders: [
      182,
      196,
      214,
      229,
      244,
      267,
      291,
      316,
      338,
      364,
      391,
      418
    ],

    users: 4286,
    sellers: 94,

    revenueChange: 31.6,
    ordersChange: 22.9,
    usersChange: 16.8,
    sellersChange: 13.2
  }

};


// =========================================================
// OTHER DEMO DATA
// =========================================================

const demoPerformance = {

  pending: 18,

  processing: 26,

  completed: 4321,

  failed: 27

};


const demoProducts = [

  {
    name: "MTN Data Bundle",
    category: "Data",
    sales: 1284,
    revenue: 38420
  },

  {
    name: "Telecel Data Bundle",
    category: "Data",
    sales: 967,
    revenue: 29140
  },

  {
    name: "BECE Result Checker",
    category: "Education",
    sales: 642,
    revenue: 14124
  },

  {
    name: "AFA Registration",
    category: "Services",
    sales: 418,
    revenue: 8360
  },

  {
    name: "Digital CV Template",
    category: "Digital",
    sales: 286,
    revenue: 5720
  }

];


const demoSellers = [

  {
    name: "EcoData Store",
    sales: 1428,
    revenue: 42180
  },

  {
    name: "Tech Hub Ghana",
    sales: 968,
    revenue: 28640
  },

  {
    name: "Student Resources",
    sales: 724,
    revenue: 16420
  },

  {
    name: "Digital Works",
    sales: 512,
    revenue: 11860
  },

  {
    name: "Smart Services",
    sales: 387,
    revenue: 9340
  }

];


const demoPaymentMethods = [

  {
    name: "Paystack",
    transactions: 3824,
    percentage: 68
  },

  {
    name: "Mobile Money",
    transactions: 1196,
    percentage: 21
  },

  {
    name: "Wallet Balance",
    transactions: 438,
    percentage: 8
  },

  {
    name: "Other",
    transactions: 169,
    percentage: 3
  }

];


const demoMarketplace = {

  products: 248,

  published: 214,

  pending: 34,

  sales: 12640

};


const demoActivity = [

  {
    icon: "ri-shopping-bag-3-line",
    title: "New order received",
    description: "MTN 10GB Data Bundle",
    value: "GH₵85.00",
    time: "2 minutes ago"
  },

  {
    icon: "ri-user-add-line",
    title: "New user registered",
    description: "Account registration completed",
    value: "+1 user",
    time: "8 minutes ago"
  },

  {
    icon: "ri-store-2-line",
    title: "New seller joined",
    description: "Seller account approved",
    value: "Seller",
    time: "24 minutes ago"
  },

  {
    icon: "ri-checkbox-circle-line",
    title: "Order delivered",
    description: "Order #ORD-10482",
    value: "GH₵120.00",
    time: "36 minutes ago"
  },

  {
    icon: "ri-upload-2-line",
    title: "Product published",
    description: "Digital CV Template",
    value: "Product",
    time: "1 hour ago"
  },

  {
    icon: "ri-money-dollar-circle-line",
    title: "Payment completed",
    description: "Paystack transaction",
    value: "GH₵240.00",
    time: "2 hours ago"
  }

];


// =========================================================
// STATE
// =========================================================

let currentReportPeriod = 30;


// =========================================================
// DOM READY
// =========================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initializeReports();

  }
);


// =========================================================
// INITIALIZE
// =========================================================

function initializeReports() {

  setupPeriodButtons();

  setupRevenuePeriod();

  setupRefreshButton();

  setupExportButton();

  renderReports();

}


// =========================================================
// PERIOD BUTTONS
// =========================================================

function setupPeriodButtons() {

  const buttons =
    document.querySelectorAll(
      ".report-period-button"
    );

  buttons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const period =
          Number(
            button.dataset.period
          );

        if (!reportData[period]) {
          return;
        }

        currentReportPeriod =
          period;


        buttons.forEach(item => {

          item.classList.remove(
            "active"
          );

        });


        button.classList.add(
          "active"
        );


        renderReports();

      }
    );

  });

}


// =========================================================
// REVENUE CHART PERIOD
// =========================================================

function setupRevenuePeriod() {

  const select =
    document.getElementById(
      "revenueChartPeriod"
    );

  if (!select) return;


  select.addEventListener(
    "change",
    () => {

      const period =
        Number(select.value);

      if (!reportData[period]) {
        return;
      }

      currentReportPeriod =
        period;


      updatePeriodButtons();

      renderReports();

    }
  );

}


// =========================================================
// SYNC PERIOD BUTTONS
// =========================================================

function updatePeriodButtons() {

  document
    .querySelectorAll(
      ".report-period-button"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        Number(button.dataset.period) ===
        currentReportPeriod
      );

    });

}


// =========================================================
// REFRESH
// =========================================================

function setupRefreshButton() {

  const button =
    document.getElementById(
      "refreshReports"
    );

  if (!button) return;


  button.addEventListener(
    "click",
    () => {

      const icon =
        button.querySelector("i");

      if (icon) {

        icon.classList.add(
          "ri-spin"
        );

      }


      setTimeout(() => {

        renderReports();

        if (icon) {

          icon.classList.remove(
            "ri-spin"
          );

        }

        showReportsMessage(
          "Reports refreshed successfully.",
          "success"
        );

      }, 500);

    }
  );

}


// =========================================================
// EXPORT
// =========================================================

function setupExportButton() {

  const button =
    document.getElementById(
      "exportReports"
    );

  if (!button) return;


  button.addEventListener(
    "click",
    exportReport
  );

}


// =========================================================
// RENDER EVERYTHING
// =========================================================

function renderReports() {

  const data =
    reportData[currentReportPeriod];

  if (!data) return;


  updatePeriodLabel(
    data.label
  );


  updateStats(data);

  buildRevenueChart(
    data.revenue
  );

  buildOrdersChart(
    data.orders
  );

  updatePerformance();

  renderTopProducts();

  renderTopSellers();

  renderPaymentMethods();

  renderMarketplace();

  renderRecentActivity();

}


// =========================================================
// PERIOD LABEL
// =========================================================

function updatePeriodLabel(label) {

  const element =
    document.getElementById(
      "reportPeriodLabel"
    );

  if (element) {

    element.textContent =
      label;

  }

}


// =========================================================
// UPDATE KPI STATS
// =========================================================

function updateStats(data) {

  const totalRevenue =
    data.revenue.reduce(
      (sum, value) =>
        sum + value,
      0
    );


  const totalOrders =
    data.orders.reduce(
      (sum, value) =>
        sum + value,
      0
    );


  const averageOrder =
    totalOrders > 0
      ? totalRevenue / totalOrders
      : 0;


  setText(
    "reportRevenue",
    formatMoney(totalRevenue)
  );


  setText(
    "reportOrders",
    totalOrders.toLocaleString()
  );


  setText(
    "reportUsers",
    data.users.toLocaleString()
  );


  setText(
    "reportSellers",
    data.sellers.toLocaleString()
  );


  setText(
    "reportAverageOrder",
    formatMoney(averageOrder)
  );


  setChange(
    "reportRevenueChange",
    data.revenueChange
  );


  setChange(
    "reportOrdersChange",
    data.ordersChange
  );


  setChange(
    "reportUsersChange",
    data.usersChange
  );


  setChange(
    "reportSellersChange",
    data.sellersChange
  );

}


// =========================================================
// CHANGE TEXT
// =========================================================

function setChange(
  id,
  percentage
) {

  const element =
    document.getElementById(id);

  if (!element) return;


  const value =
    Number(percentage);


  if (!Number.isFinite(value)) {

    element.textContent =
      "—";

    return;

  }


  const prefix =
    value >= 0
      ? "+"
      : "";


  element.textContent =
    `${prefix}${value.toFixed(1)}% vs previous period`;

}


// =========================================================
// REVENUE CHART
// =========================================================

function buildRevenueChart(
  values
) {

  const line =
    document.getElementById(
      "reportRevenueLine"
    );

  const area =
    document.getElementById(
      "reportRevenueArea"
    );

  if (!line || !area) {
    return;
  }


  if (!Array.isArray(values) ||
      values.length === 0) {

    return;

  }


  const width = 700;

  const height = 240;

  const paddingTop = 15;

  const paddingBottom = 20;


  const maxValue =
    Math.max(
      ...values,
      0
    );


  const chartMax =
    getNiceMax(
      maxValue
    );


  const points =
    values.map(
      (value, index) => {

        const x =
          values.length === 1
            ? 0
            : (
                index /
                (values.length - 1)
              ) * width;


        const ratio =
          value / chartMax;


        const y =
          height -
          paddingBottom -
          (
            ratio *
            (
              height -
              paddingTop -
              paddingBottom
            )
          );


        return {
          x,
          y,
          value
        };

      }
    );


  const path =
    createSmoothPath(
      points
    );


  line.setAttribute(
    "d",
    path
  );


  area.setAttribute(
    "d",
    `${path} L${width},${height} L0,${height} Z`
  );


  updateRevenueAxis(
    chartMax
  );


  updateRevenueLabels(
    values
  );


  updateRevenueTooltip(
    values[values.length - 1]
  );

}


// =========================================================
// NICE CHART MAX
// =========================================================

function getNiceMax(value) {

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {

    return 1000;

  }


  const magnitude =
    Math.pow(
      10,
      Math.floor(
        Math.log10(value)
      )
    );


  const normalized =
    value / magnitude;


  let niceNumber;


  if (normalized <= 1) {

    niceNumber = 1;

  } else if (normalized <= 2) {

    niceNumber = 2;

  } else if (normalized <= 5) {

    niceNumber = 5;

  } else {

    niceNumber = 10;

  }


  return niceNumber * magnitude;

}


// =========================================================
// SMOOTH SVG PATH
// =========================================================

function createSmoothPath(
  points
) {

  if (!points.length) {
    return "";
  }


  if (points.length === 1) {

    return `
      M${points[0].x},${points[0].y}
    `;

  }


  let path =
    `M${points[0].x},${points[0].y}`;


  for (
    let i = 1;
    i < points.length;
    i++
  ) {

    const previous =
      points[i - 1];

    const current =
      points[i];


    const middleX =
      (
        previous.x +
        current.x
      ) / 2;


    path +=
      ` C${middleX},${previous.y}
        ${middleX},${current.y}
        ${current.x},${current.y}`;

  }


  return path;

}


// =========================================================
// REVENUE AXIS
// =========================================================

function updateRevenueAxis(
  max
) {

  const labels =
    document.querySelectorAll(
      ".reports-page .revenue-card .admin-chart-y span"
    );

  if (!labels.length) {
    return;
  }


  const values = [

    max,

    max * .75,

    max * .5,

    max * .25,

    0

  ];


  labels.forEach(
    (label, index) => {

      label.textContent =
        formatAxisValue(
          values[index]
        );

    }
  );

}


// =========================================================
// AXIS FORMAT
// =========================================================

function formatAxisValue(
  value
) {

  if (value >= 1000000) {

    return (
      value / 1000000
    ).toFixed(
      value % 1000000 === 0
        ? 0
        : 1
    ) + "m";

  }


  if (value >= 1000) {

    return (
      value / 1000
    ).toFixed(
      value % 1000 === 0
        ? 0
        : 1
    ) + "k";

  }


  return Math.round(
    value
  ).toLocaleString();

}


// =========================================================
// REVENUE LABELS
// =========================================================

function updateRevenueLabels(
  values
) {

  const container =
    document.getElementById(
      "reportRevenueLabels"
    );

  if (!container) return;


  const labels =
    container.querySelectorAll(
      "span"
    );


  if (!labels.length) {
    return;
  }


  const total =
    values.length;


  labels.forEach(
    (label, index) => {

      const position =
        total === 1
          ? 0
          : Math.round(
              (
                index /
                (labels.length - 1)
              ) *
              (total - 1)
            );


      const dayNumber =
        position + 1;


      if (
        currentReportPeriod ===
        365
      ) {

        const month =
          new Date(
            2026,
            position,
            1
          );


        label.textContent =
          month.toLocaleDateString(
            "en-US",
            {
              month: "short"
            }
          );

      } else {

        label.textContent =
          `Day ${dayNumber}`;

      }

    }
  );

}


// =========================================================
// REVENUE TOOLTIP
// =========================================================

function updateRevenueTooltip(
  value
) {

  const tooltip =
    document.getElementById(
      "reportChartTooltip"
    );

  if (!tooltip) return;


  const strong =
    tooltip.querySelector(
      "strong"
    );

  const span =
    tooltip.querySelector(
      "span"
    );


  if (strong) {

    strong.textContent =
      formatMoney(value);

  }


  if (span) {

    span.textContent =
      getTooltipLabel();

  }

}


// =========================================================
// TOOLTIP LABEL
// =========================================================

function getTooltipLabel() {

  if (
    currentReportPeriod ===
    365
  ) {

    return "December";

  }


  return "Current period";

}


// =========================================================
// ORDERS CHART
// =========================================================

function buildOrdersChart(
  values
) {

  const line =
    document.getElementById(
      "ordersLine"
    );

  const area =
    document.getElementById(
      "ordersArea"
    );


  if (!line || !area) {
    return;
  }


  if (!Array.isArray(values) ||
      !values.length) {

    return;

  }


  const width = 500;

  const height = 250;

  const paddingTop = 15;

  const paddingBottom = 20;


  const maxValue =
    Math.max(
      ...values,
      0
    );


  const chartMax =
    getNiceMax(
      maxValue
    );


  const points =
    values.map(
      (value, index) => {

        const x =
          values.length === 1
            ? 0
            : (
                index /
                (values.length - 1)
              ) * width;


        const ratio =
          value / chartMax;


        const y =
          height -
          paddingBottom -
          (
            ratio *
            (
              height -
              paddingTop -
              paddingBottom
            )
          );


        return {
          x,
          y,
          value
        };

      }
    );


  const path =
    createSmoothPath(
      points
    );


  line.setAttribute(
    "d",
    path
  );


  area.setAttribute(
    "d",
    `${path} L${width},${height} L0,${height} Z`
  );


  updateOrdersLabels(
    values
  );

}


// =========================================================
// ORDERS LABELS
// =========================================================

function updateOrdersLabels(
  values
) {

  const container =
    document.getElementById(
      "ordersChartLabels"
    );

  if (!container) return;


  const labels =
    container.querySelectorAll(
      "span"
    );


  labels.forEach(
    (label, index) => {

      const position =
        values.length === 1
          ? 0
          : Math.round(
              (
                index /
                (labels.length - 1)
              ) *
              (values.length - 1)
            );


      label.textContent =
        `Day ${position + 1}`;

    }
  );

}


// =========================================================
// ORDER PERFORMANCE
// =========================================================

function updatePerformance() {

  const values =
    demoPerformance;


  const total =
    values.pending +
    values.processing +
    values.completed +
    values.failed;


  updatePerformanceItem(
    "pendingPerformance",
    "pendingPerformanceBar",
    values.pending,
    total
  );


  updatePerformanceItem(
    "processingPerformance",
    "processingPerformanceBar",
    values.processing,
    total
  );


  updatePerformanceItem(
    "completedPerformance",
    "completedPerformanceBar",
    values.completed,
    total
  );


  updatePerformanceItem(
    "failedPerformance",
    "failedPerformanceBar",
    values.failed,
    total
  );

}


// =========================================================
// PERFORMANCE ITEM
// =========================================================

function updatePerformanceItem(
  valueId,
  barId,
  value,
  total
) {

  setText(
    valueId,
    value.toLocaleString()
  );


  const bar =
    document.getElementById(
      barId
    );


  if (!bar) return;


  const percentage =
    total > 0
      ? (
          value /
          total
        ) * 100
      : 0;


  bar.style.width =
    `${percentage}%`;

}


// =========================================================
// TOP PRODUCTS
// =========================================================

function renderTopProducts() {

  const container =
    document.getElementById(
      "topProductsList"
    );

  if (!container) return;


  container.innerHTML =
    demoProducts
      .map(
        (product, index) => `

          <div
            class="report-ranking-item"
          >

            <div
              class="report-ranking-rank"
            >
              ${index + 1}
            </div>


            <div
              class="report-ranking-info"
            >

              <strong>
                ${escapeHTML(
                  product.name
                )}
              </strong>

              <span>
                ${product.sales.toLocaleString()}
                sales ·
                ${escapeHTML(
                  product.category
                )}
              </span>

            </div>


            <div
              class="report-ranking-value"
            >
              ${formatMoney(
                product.revenue
              )}
            </div>

          </div>

        `
      )
      .join("");

}


// =========================================================
// TOP SELLERS
// =========================================================

function renderTopSellers() {

  const container =
    document.getElementById(
      "topSellersList"
    );

  if (!container) return;


  container.innerHTML =
    demoSellers
      .map(
        (seller, index) => `

          <div
            class="report-ranking-item"
          >

            <div
              class="report-ranking-rank"
            >
              ${index + 1}
            </div>


            <div
              class="report-ranking-info"
            >

              <strong>
                ${escapeHTML(
                  seller.name
                )}
              </strong>

              <span>
                ${seller.sales.toLocaleString()}
                sales
              </span>

            </div>


            <div
              class="report-ranking-value"
            >
              ${formatMoney(
                seller.revenue
              )}
            </div>

          </div>

        `
      )
      .join("");

}


// =========================================================
// PAYMENT METHODS
// =========================================================

function renderPaymentMethods() {

  const container =
    document.getElementById(
      "paymentMethodsList"
    );

  if (!container) return;


  container.innerHTML =
    demoPaymentMethods
      .map(
        method => `

          <div
            class="payment-method-item"
          >

            <div
              class="payment-method-top"
            >

              <span
                class="payment-method-name"
              >
                ${escapeHTML(
                  method.name
                )}
              </span>

              <span
                class="payment-method-value"
              >
                ${method.percentage}%
                ·
                ${method.transactions.toLocaleString()}
              </span>

            </div>


            <div
              class="payment-method-bar"
            >

              <span
                style="
                  width:${method.percentage}%;
                "
              ></span>

            </div>

          </div>

        `
      )
      .join("");

}


// =========================================================
// MARKETPLACE
// =========================================================

function renderMarketplace() {

  setText(
    "marketplaceProducts",
    demoMarketplace.products.toLocaleString()
  );


  setText(
    "marketplacePublished",
    demoMarketplace.published.toLocaleString()
  );


  setText(
    "marketplacePending",
    demoMarketplace.pending.toLocaleString()
  );


  setText(
    "marketplaceSales",
    formatMoney(
      demoMarketplace.sales
    )
  );

}


// =========================================================
// RECENT ACTIVITY
// =========================================================

function renderRecentActivity() {

  const container =
    document.getElementById(
      "recentActivityList"
    );

  if (!container) return;


  if (!demoActivity.length) {

    container.innerHTML = `
      <div class="report-empty">
        No recent activity.
      </div>
    `;

    return;

  }


  container.innerHTML =
    demoActivity
      .map(
        activity => `

          <div
            class="report-activity-item"
          >

            <div
              class="report-activity-icon"
            >

              <i
                class="${escapeHTML(
                  activity.icon
                )}"
              ></i>

            </div>


            <div
              class="report-activity-info"
            >

              <strong>
                ${escapeHTML(
                  activity.title
                )}
              </strong>

              <span>
                ${escapeHTML(
                  activity.description
                )}
                ·
                ${escapeHTML(
                  activity.time
                )}
              </span>

            </div>


            <div
              class="report-activity-value"
            >
              ${escapeHTML(
                activity.value
              )}
            </div>

          </div>

        `
      )
      .join("");

}


// =========================================================
// EXPORT REPORT
// =========================================================

function exportReport() {

  const data =
    reportData[currentReportPeriod];


  if (!data) return;


  const exportData = {

    report: "EcoData Admin Reports & Analytics",

    period:
      data.label,

    generatedAt:
      new Date().toISOString(),

    summary: {

      revenue:
        data.revenue.reduce(
          (sum, value) =>
            sum + value,
          0
        ),

      orders:
        data.orders.reduce(
          (sum, value) =>
            sum + value,
          0
        ),

      users:
        data.users,

      sellers:
        data.sellers

    },

    orderPerformance:
      demoPerformance,

    topProducts:
      demoProducts,

    topSellers:
      demoSellers,

    paymentMethods:
      demoPaymentMethods,

    marketplace:
      demoMarketplace,

    recentActivity:
      demoActivity

  };


  const blob =
    new Blob(
      [
        JSON.stringify(
          exportData,
          null,
          2
        )
      ],
      {
        type:
          "application/json"
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


  link.href = url;

  link.download =
    `ecodata-report-${currentReportPeriod}-days.json`;


  document.body.appendChild(
    link
  );


  link.click();

  link.remove();


  URL.revokeObjectURL(
    url
  );


  showReportsMessage(
    "Demo report exported successfully.",
    "success"
  );

}


// =========================================================
// FORMAT MONEY
// =========================================================

function formatMoney(
  amount
) {

  const value =
    Number(amount) || 0;


  return (
    "GH₵" +
    value.toLocaleString(
      "en-GH",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    )
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

  if (element) {

    element.textContent =
      value;

  }

}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(
  value
) {

  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


// =========================================================
// SNACKBAR
// =========================================================

function showReportsMessage(
  message,
  type = "success"
) {

  const snackbar =
    document.getElementById(
      "reportsMessage"
    );

  if (!snackbar) return;


  const text =
    snackbar.querySelector(
      "span"
    );

  const icon =
    snackbar.querySelector(
      "i"
    );


  if (text) {

    text.textContent =
      message;

  }


  if (icon) {

    icon.className =
      type === "error"
        ? "ri-error-warning-line"
        : "ri-check-line";

  }


  snackbar.classList.add(
    "show"
  );


  clearTimeout(
    window.reportsSnackbarTimer
  );


  window.reportsSnackbarTimer =
    setTimeout(
      () => {

        snackbar.classList.remove(
          "show"
        );

      },
      3000
    );

}