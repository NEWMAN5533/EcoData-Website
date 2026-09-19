// ==========================================
// ECODATA ADMIN — DASHBOARD
// ==========================================


// ==========================================
// DEMO DATA
// ==========================================

const recentOrders = [

  {
    id: "ED-20260919-1042",
    customer: "Abdul Rahman",
    email: "abdul@example.com",
    product: "Modern Professional CV",
    amount: 45,
    status: "delivered",
    date: "2 min ago"
  },

  {
    id: "ED-20260919-1041",
    customer: "Fatima Mohammed",
    email: "fatima@example.com",
    product: "Everyday Laptop Backpack",
    amount: 280,
    status: "processing",
    date: "8 min ago"
  },

  {
    id: "ED-20260919-1040",
    customer: "Samuel Mensah",
    email: "samuel@example.com",
    product: "Professional Logo Design",
    amount: 120,
    status: "pending",
    date: "15 min ago"
  },

  {
    id: "ED-20260919-1039",
    customer: "Michael Owusu",
    email: "michael@example.com",
    product: "Social Media Content Planner",
    amount: 35,
    status: "delivered",
    date: "21 min ago"
  },

  {
    id: "ED-20260919-1038",
    customer: "Aisha Ibrahim",
    email: "aisha@example.com",
    product: "Wireless Bluetooth Headphones",
    amount: 650,
    status: "failed",
    date: "34 min ago"
  }

];


const recentActivities = [

  {
    icon: "ri-user-add-line",
    title: "New user registered",
    description: "A new account was created.",
    time: "3 minutes ago"
  },

  {
    icon: "ri-shopping-bag-line",
    title: "New order received",
    description: "Order ED-20260919-1041 was placed.",
    time: "8 minutes ago"
  },

  {
    icon: "ri-store-line",
    title: "Seller application submitted",
    description: "A new seller is waiting for review.",
    time: "18 minutes ago"
  },

  {
    icon: "ri-wallet-3-line",
    title: "Withdrawal requested",
    description: "A seller requested GH₵450.00.",
    time: "26 minutes ago"
  },

  {
    icon: "ri-product-hunt-line",
    title: "Product submitted",
    description: "A new product is awaiting approval.",
    time: "42 minutes ago"
  },

  {
    icon: "ri-settings-3-line",
    title: "Platform settings updated",
    description: "An administrator changed store settings.",
    time: "1 hour ago"
  }

];


// ==========================================
// ELEMENTS
// ==========================================

const recentOrdersBody =
  document.getElementById(
    "recentOrdersBody"
  );

const recentActivityList =
  document.getElementById(
    "recentActivityList"
  );

const refreshDashboard =
  document.getElementById(
    "refreshDashboard"
  );


// ==========================================
// STATUS LABEL
// ==========================================

function getStatusLabel(status) {

  const labels = {

    pending: "Pending",

    processing: "Processing",

    delivered: "Delivered",

    failed: "Failed",

    cancelled: "Cancelled"

  };

  return labels[status] || status;

}


// ==========================================
// CUSTOMER INITIAL
// ==========================================

function getInitial(name) {

  if (!name) return "?";

  return name
    .trim()
    .charAt(0)
    .toUpperCase();

}


// ==========================================
// RENDER RECENT ORDERS
// ==========================================

function renderRecentOrders() {

  if (!recentOrdersBody) return;

  recentOrdersBody.innerHTML =
    recentOrders
      .map(order => {

        return `

          <tr>

            <td>

              <span class="admin-order-id">
                ${order.id}
              </span>

            </td>


            <td>

              <div class="admin-customer">

                <span class="admin-customer-avatar">
                  ${getInitial(order.customer)}
                </span>

                <span class="admin-customer-name">

                  <strong>
                    ${order.customer}
                  </strong>

                  <span>
                    ${order.email}
                  </span>

                </span>

              </div>

            </td>


            <td>

              <span class="admin-product-name">
                ${order.product}
              </span>

            </td>


            <td>

              <strong class="admin-order-amount">
                GH₵${order.amount.toLocaleString()}
              </strong>

            </td>


            <td>

              <span class="
                admin-status
                ${order.status}
              ">
                ${getStatusLabel(order.status)}
              </span>

            </td>


            <td>

              <span>
                ${order.date}
              </span>

            </td>

          </tr>

        `;

      })
      .join("");

}


// ==========================================
// RENDER ACTIVITY
// ==========================================

function renderRecentActivity() {

  if (!recentActivityList) return;

  recentActivityList.innerHTML =
    recentActivities
      .map(activity => {

        return `

          <div class="admin-activity-item">

            <span class="admin-activity-icon">

              <i class="${activity.icon}"></i>

            </span>


            <div class="admin-activity-content">

              <strong>
                ${activity.title}
              </strong>

              <span>
                ${activity.description}
              </span>

              <small class="admin-activity-time">
                ${activity.time}
              </small>

            </div>

          </div>

        `;

      })
      .join("");

}


// ==========================================
// REFRESH DASHBOARD
// ==========================================

refreshDashboard?.addEventListener(
  "click",
  event => {

    const button =
      event.currentTarget;

    const icon =
      button.querySelector("i");

    const text =
      button.querySelector("span");


    if (icon) {
      icon.classList.add("ri-spin");
    }

    if (text) {
      text.textContent =
        "Refreshing...";
    }

    button.disabled = true;


    setTimeout(() => {

      if (icon) {
        icon.classList.remove("ri-spin");
      }

      if (text) {
        text.textContent =
          "Refresh";
      }

      button.disabled = false;

      renderRecentOrders();
      renderRecentActivity();

    }, 700);

  }
);


// ==========================================
// REVENUE PERIOD
// ==========================================

const revenuePeriod =
  document.getElementById(
    "revenuePeriod"
  );


revenuePeriod?.addEventListener(
  "change",
  () => {

    console.log(
      "Revenue period:",
      revenuePeriod.value
    );

    /*
      Later:

      Fetch the corresponding
      Firestore/backend analytics.
    */

  }
);


// ==========================================
// INITIALIZE
// ==========================================

renderRecentOrders();

renderRecentActivity();