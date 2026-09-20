
let withdrawals = [

  {
    id: "WTH-10001",
    seller: "EcoTech Store",
    sellerId: "SELLER-001",
    phone: "024 123 4567",

    method: "mobile_money",
    account: "0241234567",
    accountName: "Kwame Mensah",

    amount: 150,
    status: "pending",

    createdAt: "2026-09-18T09:30:00",
    approvedAt: null,
    paidAt: null,
    rejectedAt: null
  },

  {
    id: "WTH-10002",
    seller: "Digital Hub GH",
    sellerId: "SELLER-002",
    phone: "055 987 6543",

    method: "bank",
    account: "0123456789",
    accountName: "Abdul Rahman",

    amount: 320,
    status: "approved",

    createdAt: "2026-09-17T14:20:00",
    approvedAt: "2026-09-18T08:15:00",
    paidAt: null,
    rejectedAt: null
  },

  {
    id: "WTH-10003",
    seller: "Fashion Point",
    sellerId: "SELLER-003",
    phone: "020 456 7890",

    method: "mobile_money",
    account: "0204567890",
    accountName: "Ama Owusu",

    amount: 85,
    status: "paid",

    createdAt: "2026-09-16T11:10:00",
    approvedAt: "2026-09-16T15:30:00",
    paidAt: "2026-09-17T09:00:00",
    rejectedAt: null
  },

  {
    id: "WTH-10004",
    seller: "Smart Templates",
    sellerId: "SELLER-004",
    phone: "027 222 3344",

    method: "mobile_money",
    account: "0272223344",
    accountName: "Ibrahim Salifu",

    amount: 210,
    status: "paid",

    createdAt: "2026-09-15T08:45:00",
    approvedAt: "2026-09-15T13:10:00",
    paidAt: "2026-09-16T10:20:00",
    rejectedAt: null
  },

  {
    id: "WTH-10005",
    seller: "Creative Prints",
    sellerId: "SELLER-005",
    phone: "050 333 2211",

    method: "bank",
    account: "9876543210",
    accountName: "Yaw Boateng",

    amount: 500,
    status: "pending",

    createdAt: "2026-09-14T16:30:00",
    approvedAt: null,
    paidAt: null,
    rejectedAt: null
  },

  {
    id: "WTH-10006",
    seller: "Study Materials GH",
    sellerId: "SELLER-006",
    phone: "054 555 6677",

    method: "mobile_money",
    account: "0545556677",
    accountName: "Mary Asante",

    amount: 120,
    status: "rejected",

    createdAt: "2026-09-13T12:40:00",
    approvedAt: null,
    paidAt: null,
    rejectedAt: "2026-09-13T15:20:00"
  },

  {
    id: "WTH-10007",
    seller: "Modern Wear",
    sellerId: "SELLER-007",
    phone: "059 888 1122",

    method: "mobile_money",
    account: "0598881122",
    accountName: "Hassan Mohammed",

    amount: 75,
    status: "paid",

    createdAt: "2026-09-12T10:00:00",
    approvedAt: "2026-09-12T12:10:00",
    paidAt: "2026-09-12T16:30:00",
    rejectedAt: null
  },

  {
    id: "WTH-10008",
    seller: "Ebook Corner",
    sellerId: "SELLER-008",
    phone: "026 111 2233",

    method: "bank",
    account: "1122334455",
    accountName: "Fatima Yakubu",

    amount: 275,
    status: "approved",

    createdAt: "2026-09-11T09:15:00",
    approvedAt: "2026-09-12T08:00:00",
    paidAt: null,
    rejectedAt: null
  },

  {
    id: "WTH-10009",
    seller: "Tech Accessories",
    sellerId: "SELLER-009",
    phone: "023 777 8899",

    method: "mobile_money",
    account: "0237778899",
    accountName: "Daniel Kofi",

    amount: 60,
    status: "cancelled",

    createdAt: "2026-09-10T17:00:00",
    approvedAt: null,
    paidAt: null,
    rejectedAt: null
  },

  {
    id: "WTH-10010",
    seller: "Print & Design GH",
    sellerId: "SELLER-010",
    phone: "057 444 5566",

    method: "mobile_money",
    account: "0574445566",
    accountName: "Sarah Adjei",

    amount: 190,
    status: "paid",

    createdAt: "2026-09-09T13:25:00",
    approvedAt: "2026-09-09T15:10:00",
    paidAt: "2026-09-10T09:30:00",
    rejectedAt: null
  }

];


/* =========================================================
   STATE
========================================================= */

const WITHDRAWALS_PER_PAGE = 5;

let currentWithdrawalPage = 1;

let filteredWithdrawals = [...withdrawals];

let selectedWithdrawal = null;


/* =========================================================
   DOM
========================================================= */

const withdrawalTableBody =
  document.getElementById("withdrawalTableBody");

const withdrawalEmptyState =
  document.getElementById("withdrawalEmptyState");

const withdrawalResultCount =
  document.getElementById("withdrawalResultCount");

const withdrawalPagination =
  document.getElementById("withdrawalPagination");

const withdrawalSearch =
  document.getElementById("withdrawalSearch");

const withdrawalStatusFilter =
  document.getElementById("withdrawalStatusFilter");

const withdrawalMethodFilter =
  document.getElementById("withdrawalMethodFilter");

const withdrawalSort =
  document.getElementById("withdrawalSort");

const clearWithdrawalFilters =
  document.getElementById("clearWithdrawalFilters");


/* =========================================================
   STATISTICS
========================================================= */

function renderWithdrawalStats(){

  const total =
    withdrawals.length;

  const pending =
    withdrawals.filter(
      item => item.status === "pending"
    ).length;

  const approved =
    withdrawals.filter(
      item => item.status === "approved"
    ).length;

  const paid =
    withdrawals.filter(
      item => item.status === "paid"
    ).length;

  const volume =
    withdrawals.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

  document.getElementById("totalWithdrawals")
    .textContent = total;

  document.getElementById("pendingWithdrawals")
    .textContent = pending;

  document.getElementById("approvedWithdrawals")
    .textContent = approved;

  document.getElementById("paidWithdrawals")
    .textContent = paid;

  document.getElementById("withdrawalVolume")
    .textContent = formatCurrency(volume);
}


/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(amount){

  return `GHS ${Number(amount || 0).toLocaleString(
    "en-GH",
    {
      minimumFractionDigits:2,
      maximumFractionDigits:2
    }
  )}`;

}


/* =========================================================
   STATUS LABEL
========================================================= */

function getStatusLabel(status){

  const labels = {

    pending: "Pending",

    approved: "Approved",

    paid: "Paid",

    rejected: "Rejected",

    cancelled: "Cancelled"

  };

  return labels[status] || status;

}


/* =========================================================
   METHOD LABEL
========================================================= */

function getMethodLabel(method){

  if(method === "mobile_money"){
    return "Mobile Money";
  }

  if(method === "bank"){
    return "Bank Transfer";
  }

  return method || "—";

}


/* =========================================================
   METHOD ICON
========================================================= */

function getMethodIcon(method){

  if(method === "mobile_money"){
    return "ri-smartphone-line";
  }

  if(method === "bank"){
    return "ri-bank-line";
  }

  return "ri-wallet-line";

}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(date){

  if(!date) return "—";

  const parsed =
    new Date(date);

  if(Number.isNaN(parsed.getTime())){
    return "—";
  }

  return parsed.toLocaleDateString(
    "en-GH",
    {
      day:"2-digit",
      month:"short",
      year:"numeric"
    }
  );

}


function formatTime(date){

  if(!date) return "—";

  const parsed =
    new Date(date);

  if(Number.isNaN(parsed.getTime())){
    return "—";
  }

  return parsed.toLocaleTimeString(
    "en-GH",
    {
      hour:"2-digit",
      minute:"2-digit"
    }
  );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value){

  return String(value ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");

}


/* =========================================================
   FILTER + SORT
========================================================= */

function applyWithdrawalFilters(){

  const search =
    withdrawalSearch.value
      .trim()
      .toLowerCase();

  const status =
    withdrawalStatusFilter.value;

  const method =
    withdrawalMethodFilter.value;

  const sort =
    withdrawalSort.value;


  filteredWithdrawals =
    withdrawals.filter(item => {

      const matchesSearch =
        !search ||
        item.id.toLowerCase().includes(search) ||
        item.seller.toLowerCase().includes(search) ||
        item.sellerId.toLowerCase().includes(search) ||
        item.phone.toLowerCase().includes(search) ||
        item.account.toLowerCase().includes(search);

      const matchesStatus =
        status === "all" ||
        item.status === status;

      const matchesMethod =
        method === "all" ||
        item.method === method;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesMethod
      );

    });


  filteredWithdrawals.sort((a,b) => {

    if(sort === "oldest"){
      return new Date(a.createdAt) -
             new Date(b.createdAt);
    }

    if(sort === "highest"){
      return Number(b.amount) -
             Number(a.amount);
    }

    if(sort === "lowest"){
      return Number(a.amount) -
             Number(b.amount);
    }

    return new Date(b.createdAt) -
           new Date(a.createdAt);

  });


  currentWithdrawalPage = 1;

  renderWithdrawals();

}


/* =========================================================
   RENDER TABLE
========================================================= */

function renderWithdrawals(){

  const total =
    filteredWithdrawals.length;

  withdrawalResultCount.textContent =
    `${total} withdrawal${total === 1 ? "" : "s"}`;


  if(total === 0){

    withdrawalTableBody.innerHTML = "";

    withdrawalEmptyState.hidden = false;

    withdrawalPagination.innerHTML = "";

    return;

  }


  withdrawalEmptyState.hidden = true;


  const start =
    (currentWithdrawalPage - 1) *
    WITHDRAWALS_PER_PAGE;

  const end =
    start + WITHDRAWALS_PER_PAGE;

  const pageItems =
    filteredWithdrawals.slice(
      start,
      end
    );


  withdrawalTableBody.innerHTML =
    pageItems.map(item => {

      return `

        <tr>

          <td>

            <div class="withdrawal-cell">

              <div class="withdrawal-icon">

                <i class="${getMethodIcon(item.method)}"></i>

              </div>

              <div class="withdrawal-info">

                <span class="withdrawal-reference">
                  ${escapeHtml(item.id)}
                </span>

                <span class="withdrawal-subtext">
                  ${escapeHtml(item.accountName)}
                </span>

              </div>

            </div>

          </td>


          <td>

            <div class="withdrawal-seller">

              <span class="withdrawal-seller-name">
                ${escapeHtml(item.seller)}
              </span>

              <span class="withdrawal-seller-id">
                ${escapeHtml(item.sellerId)}
              </span>

            </div>

          </td>


          <td>

            <span class="withdrawal-method">

              <i class="${getMethodIcon(item.method)}"></i>

              ${escapeHtml(
                getMethodLabel(item.method)
              )}

            </span>

          </td>


          <td>

            <span class="withdrawal-amount">
              ${formatCurrency(item.amount)}
            </span>

          </td>


          <td>

            <span
              class="withdrawal-status ${escapeHtml(item.status)}"
            >
              ${escapeHtml(
                getStatusLabel(item.status)
              )}
            </span>

          </td>


          <td>

            <div class="withdrawal-date">

              <span class="withdrawal-date-main">
                ${formatDate(item.createdAt)}
              </span>

              <span class="withdrawal-date-time">
                ${formatTime(item.createdAt)}
              </span>

            </div>

          </td>


          <td>

            <div class="management-action">

              <button
                type="button"
                class="management-action-button"
                aria-label="Withdrawal actions"
              >
                <i class="ri-more-2-fill"></i>
              </button>


              <div class="management-action-menu">

                <button
                  type="button"
                  data-action="view"
                  data-id="${escapeHtml(item.id)}"
                >
                  <i class="ri-eye-line"></i>
                  View Details
                </button>


                ${
                  item.status === "pending"
                  ? `
                    <button
                      type="button"
                      data-action="approve"
                      data-id="${escapeHtml(item.id)}"
                    >
                      <i class="ri-check-line"></i>
                      Approve
                    </button>

                    <button
                      type="button"
                      class="danger"
                      data-action="reject"
                      data-id="${escapeHtml(item.id)}"
                    >
                      <i class="ri-close-line"></i>
                      Reject
                    </button>
                  `
                  : ""
                }


                ${
                  item.status === "approved"
                  ? `
                    <button
                      type="button"
                      data-action="paid"
                      data-id="${escapeHtml(item.id)}"
                    >
                      <i class="ri-money-dollar-circle-line"></i>
                      Mark as Paid
                    </button>
                  `
                  : ""
                }


                <button
                  type="button"
                  data-action="copy"
                  data-id="${escapeHtml(item.id)}"
                >
                  <i class="ri-file-copy-line"></i>
                  Copy Reference
                </button>

              </div>

            </div>

          </td>

        </tr>

      `;

    }).join("");


  renderWithdrawalPagination();

}


/* =========================================================
   PAGINATION
========================================================= */

function renderWithdrawalPagination(){

  if(typeof renderPagination !== "function"){

    console.warn(
      "renderPagination() was not found."
    );

    return;

  }


  renderPagination({

    container:
      withdrawalPagination,

    itemsPerPage:
      WITHDRAWALS_PER_PAGE,

    infoElement:
      withdrawalResultCount,

    currentPage:
      currentWithdrawalPage,

    totalItems:
      filteredWithdrawals.length,

    onPageChange(page){

      currentWithdrawalPage =
        page;

      renderWithdrawals();

      window.scrollTo({
        top:0,
        behavior:"smooth"
      });

    }

  });

}


/* =========================================================
   DRAWER
========================================================= */

const withdrawalDrawer =
  document.getElementById(
    "withdrawalDrawer"
  );

const withdrawalDrawerOverlay =
  document.getElementById(
    "withdrawalDrawerOverlay"
  );

const closeWithdrawalDrawer =
  document.getElementById(
    "closeWithdrawalDrawer"
  );


function openWithdrawalDrawer(id){

  const item =
    withdrawals.find(
      withdrawal =>
        withdrawal.id === id
    );

  if(!item) return;

  selectedWithdrawal = item;


  document.getElementById(
    "withdrawalDrawerTitle"
  ).textContent = item.id;


  document.getElementById(
    "withdrawalDrawerStatus"
  ).textContent =
    getStatusLabel(item.status);


  document.getElementById(
    "drawerWithdrawalAmount"
  ).textContent =
    formatCurrency(item.amount);


  document.getElementById(
    "drawerSeller"
  ).textContent =
    item.seller;


  document.getElementById(
    "drawerSellerId"
  ).textContent =
    item.sellerId;


  document.getElementById(
    "drawerPhone"
  ).textContent =
    item.phone;


  document.getElementById(
    "drawerMethod"
  ).textContent =
    getMethodLabel(item.method);


  document.getElementById(
    "drawerAccount"
  ).textContent =
    item.account;


  document.getElementById(
    "drawerAccountName"
  ).textContent =
    item.accountName;


  document.getElementById(
    "drawerReference"
  ).textContent =
    item.id;


  renderWithdrawalTimeline(item);


  updateDrawerButtons(item);


  withdrawalDrawer.classList.add("open");

  withdrawalDrawerOverlay.classList.add("open");

  withdrawalDrawer.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.style.overflow =
    "hidden";

}


function closeWithdrawalDetails(){

  withdrawalDrawer.classList.remove(
    "open"
  );

  withdrawalDrawerOverlay.classList.remove(
    "open"
  );

  withdrawalDrawer.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.style.overflow = "";

  selectedWithdrawal = null;

}


/* =========================================================
   DRAWER TIMELINE
========================================================= */

function renderWithdrawalTimeline(item){

  const timeline =
    document.getElementById(
      "withdrawalTimeline"
    );


  const events = [];


  if(item.createdAt){

    events.push({
      title:"Withdrawal requested",
      date:item.createdAt
    });

  }


  if(item.approvedAt){

    events.push({
      title:"Withdrawal approved",
      date:item.approvedAt
    });

  }


  if(item.paidAt){

    events.push({
      title:"Payment completed",
      date:item.paidAt
    });

  }


  if(item.rejectedAt){

    events.push({
      title:"Withdrawal rejected",
      date:item.rejectedAt
    });

  }


  timeline.innerHTML =
    events.map(event => {

      return `

        <div class="withdrawal-timeline-item">

          <span class="withdrawal-timeline-dot"></span>

          <strong>
            ${escapeHtml(event.title)}
          </strong>

          <span>
            ${formatDate(event.date)}
            ·
            ${formatTime(event.date)}
          </span>

        </div>

      `;

    }).join("");

}


/* =========================================================
   DRAWER BUTTONS
========================================================= */

const approveWithdrawalBtn =
  document.getElementById(
    "approveWithdrawalBtn"
  );

const rejectWithdrawalBtn =
  document.getElementById(
    "rejectWithdrawalBtn"
  );


function updateDrawerButtons(item){

  if(item.status === "pending"){

    approveWithdrawalBtn.style.display =
      "inline-flex";

    rejectWithdrawalBtn.style.display =
      "inline-flex";

    approveWithdrawalBtn.innerHTML =
      `
        <i class="ri-check-line"></i>
        Approve
      `;

    rejectWithdrawalBtn.innerHTML =
      `
        <i class="ri-close-circle-line"></i>
        Reject
      `;

    return;

  }


  if(item.status === "approved"){

    approveWithdrawalBtn.style.display =
      "inline-flex";

    rejectWithdrawalBtn.style.display =
      "none";

    approveWithdrawalBtn.innerHTML =
      `
        <i class="ri-money-dollar-circle-line"></i>
        Mark as Paid
      `;

    return;

  }


  approveWithdrawalBtn.style.display =
    "none";

  rejectWithdrawalBtn.style.display =
    "none";

}


/* =========================================================
   UPDATE STATUS
========================================================= */

function updateWithdrawalStatus(
  id,
  newStatus
){

  const item =
    withdrawals.find(
      withdrawal =>
        withdrawal.id === id
    );

  if(!item) return;


  const now =
    new Date().toISOString();


  item.status =
    newStatus;


  if(newStatus === "approved"){

    item.approvedAt =
      now;

  }


  if(newStatus === "paid"){

    if(!item.approvedAt){
      item.approvedAt =
        now;
    }

    item.paidAt =
      now;

  }


  if(newStatus === "rejected"){

    item.rejectedAt =
      now;

  }


  renderWithdrawalStats();

  applyWithdrawalFilters();


  if(selectedWithdrawal &&
     selectedWithdrawal.id === id){

    const updated =
      withdrawals.find(
        withdrawal =>
          withdrawal.id === id
      );

    if(updated){

      selectedWithdrawal =
        updated;

      openWithdrawalDrawer(id);

    }

  }

}


/* =========================================================
   COPY REFERENCE
========================================================= */

async function copyWithdrawalReference(id){

  try{

    await navigator.clipboard.writeText(
      id
    );

    showWithdrawalMessage(
      "Withdrawal reference copied."
    );

  }catch(error){

    console.error(error);

  }

}


/* =========================================================
   SIMPLE MESSAGE
========================================================= */

function showWithdrawalMessage(message){

  let snackbar =
    document.getElementById(
      "withdrawalMessage"
    );


  if(!snackbar){

    snackbar =
      document.createElement("div");

    snackbar.id =
      "withdrawalMessage";

    snackbar.style.position =
      "fixed";

    snackbar.style.left =
      "50%";

    snackbar.style.bottom =
      "24px";

    snackbar.style.transform =
      "translateX(-50%)";

    snackbar.style.zIndex =
      "2000";

    snackbar.style.padding =
      "10px 15px";

    snackbar.style.border =
      "1px solid var(--admin-border)";

    snackbar.style.borderRadius =
      "9px";

    snackbar.style.background =
      "var(--admin-text)";

    snackbar.style.color =
      "var(--admin-background)";

    snackbar.style.fontSize =
      "11px";

    snackbar.style.fontWeight =
      "650";

    snackbar.style.boxShadow =
      "var(--admin-shadow-lg)";

    document.body.appendChild(
      snackbar
    );

  }


  snackbar.textContent =
    message;


  clearTimeout(
    snackbar._timeout
  );


  snackbar._timeout =
    setTimeout(() => {

      snackbar.remove();

    },2500);

}


/* =========================================================
   TABLE ACTIONS
========================================================= */

withdrawalTableBody.addEventListener(
  "click",
  event => {

    const actionButton =
      event.target.closest(
        "[data-action]"
      );

    if(!actionButton) return;


    const action =
      actionButton.dataset.action;

    const id =
      actionButton.dataset.id;


    if(action === "view"){

      openWithdrawalDrawer(id);

    }


    if(action === "approve"){

      updateWithdrawalStatus(
        id,
        "approved"
      );

      showWithdrawalMessage(
        `${id} approved.`
      );

    }


    if(action === "reject"){

      updateWithdrawalStatus(
        id,
        "rejected"
      );

      showWithdrawalMessage(
        `${id} rejected.`
      );

    }


    if(action === "paid"){

      updateWithdrawalStatus(
        id,
        "paid"
      );

      showWithdrawalMessage(
        `${id} marked as paid.`
      );

    }


    if(action === "copy"){

      copyWithdrawalReference(id);

    }


    const menu =
      actionButton.closest(
        ".management-action-menu"
      );

    if(menu){

      menu.classList.remove(
        "show"
      );

    }

  }
);


/* =========================================================
   DRAWER ACTIONS
========================================================= */

approveWithdrawalBtn.addEventListener(
  "click",
  () => {

    if(!selectedWithdrawal)
      return;


    const status =
      selectedWithdrawal.status ===
      "approved"
        ? "paid"
        : "approved";


    updateWithdrawalStatus(
      selectedWithdrawal.id,
      status
    );


    showWithdrawalMessage(
      status === "paid"
        ? "Withdrawal marked as paid."
        : "Withdrawal approved."
    );

  }
);


rejectWithdrawalBtn.addEventListener(
  "click",
  () => {

    if(!selectedWithdrawal)
      return;


    updateWithdrawalStatus(
      selectedWithdrawal.id,
      "rejected"
    );


    showWithdrawalMessage(
      "Withdrawal rejected."
    );

  }
);


/* =========================================================
   DRAWER CLOSE
========================================================= */

closeWithdrawalDrawer.addEventListener(
  "click",
  closeWithdrawalDetails
);


withdrawalDrawerOverlay.addEventListener(
  "click",
  closeWithdrawalDetails
);


document.addEventListener(
  "keydown",
  event => {

    if(
      event.key === "Escape" &&
      withdrawalDrawer.classList.contains(
        "open"
      )
    ){

      closeWithdrawalDetails();

    }

  }
);


/* =========================================================
   FILTER EVENTS
========================================================= */

withdrawalSearch.addEventListener(
  "input",
  applyWithdrawalFilters
);

withdrawalStatusFilter.addEventListener(
  "change",
  applyWithdrawalFilters
);

withdrawalMethodFilter.addEventListener(
  "change",
  applyWithdrawalFilters
);

withdrawalSort.addEventListener(
  "change",
  applyWithdrawalFilters
);


clearWithdrawalFilters.addEventListener(
  "click",
  () => {

    withdrawalSearch.value = "";

    withdrawalStatusFilter.value =
      "all";

    withdrawalMethodFilter.value =
      "all";

    withdrawalSort.value =
      "newest";

    applyWithdrawalFilters();

  }
);


/* =========================================================
   UNIVERSAL ACTION MENU
========================================================= */

document.addEventListener(
  "click",
  event => {

    const actionButton =
      event.target.closest(
        ".management-action-button"
      );


    if(actionButton){

      event.stopPropagation();


      const wrapper =
        actionButton.closest(
          ".management-action"
        );


      if(!wrapper) return;


      document
        .querySelectorAll(
          ".management-action-menu.show"
        )
        .forEach(menu => {

          if(!wrapper.contains(menu)){

            menu.classList.remove(
              "show"
            );

          }

        });


      const menu =
        wrapper.querySelector(
          ".management-action-menu"
        );


      if(menu){

        menu.classList.toggle(
          "show"
        );

      }

      return;

    }


    if(
      !event.target.closest(
        ".management-action"
      )
    ){

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
