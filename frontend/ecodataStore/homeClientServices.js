// ==========================================
// ECO DATA STORE
// SERVICES & REQUESTS
// ==========================================

const SERVICES_KEY =
  "ecoStoreServices";


// ==========================================
// SAMPLE DATA
// ==========================================

const sampleServices = [

  {
    id: "SRV-20260910-001",
    title: "Professional Logo Design",
    seller: "DesignCraft",
    amount: 80,
    status: "progress",
    date: "2026-09-10",
    type: "service",
    icon: "ri-palette-line"
  },

  {
    id: "SRV-20260906-002",
    title: "Business Website Setup",
    seller: "WebStudio",
    amount: 450,
    status: "pending",
    date: "2026-09-06",
    type: "service",
    icon: "ri-code-s-slash-line"
  },

  {
    id: "SRV-20260830-003",
    title: "Social Media Page Management",
    seller: "CreatorStudio",
    amount: 180,
    status: "completed",
    date: "2026-08-30",
    type: "service",
    icon: "ri-instagram-line"
  },

  {
    id: "REQ-20260827-004",
    title: "Custom CV Design Request",
    seller: "CreativeHub",
    amount: 60,
    status: "progress",
    date: "2026-08-27",
    type: "request",
    icon: "ri-file-user-line"
  },

  {
    id: "REQ-20260820-005",
    title: "Product Photography Request",
    seller: "MediaWorks",
    amount: 120,
    status: "pending",
    date: "2026-08-20",
    type: "request",
    icon: "ri-camera-line"
  },

  {
    id: "SRV-20260814-006",
    title: "Business Flyer Design",
    seller: "DesignCraft",
    amount: 55,
    status: "completed",
    date: "2026-08-14",
    type: "service",
    icon: "ri-image-edit-line"
  }

];


// ==========================================
// STATE
// ==========================================

let services = loadServices();

let activeTab = "services";

let currentSearch = "";



// ==========================================
// LOAD
// ==========================================

function loadServices() {

  try {

    const saved =
      localStorage.getItem(
        SERVICES_KEY
      );


    if (!saved) {

      localStorage.setItem(
        SERVICES_KEY,
        JSON.stringify(sampleServices)
      );

      return [...sampleServices];

    }


    const parsed =
      JSON.parse(saved);


    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch (error) {

    console.error(
      "Unable to load services:",
      error
    );

    return [];

  }

}



// ==========================================
// SAVE
// ==========================================

function saveServices() {

  localStorage.setItem(
    SERVICES_KEY,
    JSON.stringify(services)
  );

}



// ==========================================
// MONEY
// ==========================================

function money(amount) {

  return new Intl.NumberFormat(
    "en-GH",
    {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 0
    }
  ).format(amount);

}



// ==========================================
// STATUS LABEL
// ==========================================

function statusLabel(status) {

  const labels = {

    pending: "Pending",

    progress: "In Progress",

    completed: "Completed",

    cancelled: "Cancelled"

  };


  return labels[status] ||
    "Unknown";

}



// ==========================================
// UPDATE STATS
// ==========================================

function updateStats() {

  const total =
    services.filter(
      item =>
        item.type === "service"
    ).length;


  const progress =
    services.filter(
      item =>
        item.status === "progress"
    ).length;


  const completed =
    services.filter(
      item =>
        item.status === "completed"
    ).length;


  const requests =
    services.filter(
      item =>
        item.type === "request" &&
        item.status !== "completed" &&
        item.status !== "cancelled"
    ).length;


  document.getElementById(
    "totalServices"
  ).textContent = total;


  document.getElementById(
    "servicesProgress"
  ).textContent = progress;


  document.getElementById(
    "servicesCompleted"
  ).textContent = completed;


  document.getElementById(
    "activeRequests"
  ).textContent = requests;

}



// ==========================================
// GET FILTERED ITEMS
// ==========================================

function getFilteredItems() {

  let result =
    services.filter(
      item =>
        item.type === activeTab.slice(0, -1)
    );


  const status =
    document.getElementById(
      "servicesStatus"
    ).value;


  if (status !== "all") {

    result =
      result.filter(
        item =>
          item.status === status
      );

  }


  if (currentSearch) {

    const search =
      currentSearch.toLowerCase();


    result =
      result.filter(item =>

        item.title
          .toLowerCase()
          .includes(search)

        ||

        item.seller
          .toLowerCase()
          .includes(search)

        ||

        item.id
          .toLowerCase()
          .includes(search)

      );

  }


  return result;

}



// ==========================================
// SORT
// ==========================================

function sortItems(items) {

  const sort =
    document.getElementById(
      "servicesSort"
    ).value;


  switch (sort) {

    case "oldest":

      return items.sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      );


    case "high":

      return items.sort(
        (a, b) =>
          b.amount -
          a.amount
      );


    case "low":

      return items.sort(
        (a, b) =>
          a.amount -
          b.amount
      );


    case "recent":

    default:

      return items.sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      );

  }

}



// ==========================================
// RENDER
// ==========================================

function renderServices() {

  const list =
    document.getElementById(
      "servicesList"
    );


  const empty =
    document.getElementById(
      "servicesEmpty"
    );


  list.innerHTML = "";


  let items =
    getFilteredItems();


  items =
    sortItems(items);


  if (!items.length) {

    list.hidden = true;

    empty.hidden = false;

    return;

  }


  list.hidden = false;

  empty.hidden = true;


  items.forEach(item => {

    const element =
      document.createElement(
        "article"
      );


    element.className =
      "service-item";


    const requestBadge =
      item.type === "request"
        ? `
          <span class="request-badge">
            Request
          </span>
        `
        : "";


    element.innerHTML = `

      <div class="service-item-icon">

        <i class="${item.icon}"></i>

      </div>


      <div class="service-item-info">

        <h3 class="service-item-title">

          ${requestBadge}

          ${item.title}

        </h3>


        <div class="service-item-meta">

          <span>
            <i class="ri-store-2-line"></i>
            ${item.seller}
          </span>


          <span>
            <i class="ri-hashtag"></i>
            ${item.id}
          </span>


          <span>
            <i class="ri-calendar-line"></i>
            ${formatDate(item.date)}
          </span>

        </div>

      </div>


      <div class="service-item-right">


        <div>

          <span
            class="service-status ${item.status}"
          >
            ${statusLabel(item.status)}
          </span>

        </div>


        <strong class="service-item-price">

          ${money(item.amount)}

        </strong>


        <div class="service-item-actions">

          <button
            type="button"
            class="service-action"
            data-action="view"
            data-id="${item.id}"
            title="View"
          >

            <i class="ri-eye-line"></i>

          </button>


          ${
            item.status === "progress"
            ? `
              <button
                type="button"
                class="service-action"
                data-action="message"
                data-id="${item.id}"
                title="Message seller"
              >
                <i class="ri-chat-3-line"></i>
              </button>
            `
            : ""
          }

        </div>

      </div>

    `;


    list.appendChild(element);

  });

}



// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(date) {

  return new Intl.DateTimeFormat(
    "en-GH",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  ).format(
    new Date(date)
  );

}



// ==========================================
// CHANGE TAB
// ==========================================

function changeTab(tab) {

  activeTab = tab;


  document
    .querySelectorAll(
      ".services-tab"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.tab === tab
      );

    });


  const title =
    document.getElementById(
      "servicesTitle"
    );


  const description =
    document.getElementById(
      "servicesDescription"
    );


  const status =
    document.getElementById(
      "servicesStatus"
    );


  if (tab === "services") {

    title.textContent =
      "My Services";

    description.textContent =
      "Services you've purchased from creators.";

  } else {

    title.textContent =
      "My Requests";

    description.textContent =
      "Custom services and requests you've submitted.";

  }


  currentSearch = "";


  const topSearch =
    document.getElementById(
      "servicesSearch"
    );

  const inlineSearch =
    document.getElementById(
      "servicesInlineSearch"
    );


  if (topSearch)
    topSearch.value = "";


  if (inlineSearch)
    inlineSearch.value = "";


  status.value = "all";


  renderServices();

}



// ==========================================
// TAB EVENTS
// ==========================================

document
  .querySelectorAll(
    ".services-tab"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        changeTab(
          button.dataset.tab
        );

      }
    );

  });



// ==========================================
// SEARCH
// ==========================================

function handleSearch(value) {

  currentSearch =
    value.trim();


  renderServices();

}


const topSearch =
  document.getElementById(
    "servicesSearch"
  );


const inlineSearch =
  document.getElementById(
    "servicesInlineSearch"
  );


topSearch?.addEventListener(
  "input",
  event => {

    const value =
      event.target.value;


    if (inlineSearch) {

      inlineSearch.value =
        value;

    }


    handleSearch(value);

  }
);


inlineSearch?.addEventListener(
  "input",
  event => {

    const value =
      event.target.value;


    if (topSearch) {

      topSearch.value =
        value;

    }


    handleSearch(value);

  }
);



// ==========================================
// FILTER + SORT
// ==========================================

document
  .getElementById("servicesStatus")
  ?.addEventListener(
    "change",
    renderServices
  );


document
  .getElementById("servicesSort")
  ?.addEventListener(
    "change",
    renderServices
  );



// ==========================================
// ACTIONS
// ==========================================

document.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        ".service-action"
      );


    if (!button) return;


    const id =
      button.dataset.id;


    const item =
      services.find(
        service =>
          service.id === id
      );


    if (!item) return;


    const action =
      button.dataset.action;


    if (action === "view") {

      alert(
        `Service: ${item.title}\n\n` +
        `Seller: ${item.seller}\n` +
        `Status: ${statusLabel(item.status)}\n` +
        `Amount: ${money(item.amount)}\n` +
        `Reference: ${item.id}`
      );

    }


    if (action === "message") {

      alert(
        `Messaging for ${item.title} will be connected to the Messages system.`
      );

    }

  }
);



// ==========================================
// REFRESH
// ==========================================

document
  .getElementById(
    "refreshServicesBtn"
  )
  ?.addEventListener(
    "click",
    button => {

      const icon =
        button.currentTarget
          .querySelector("i");


      icon.classList.add(
        "ri-spin"
      );


      setTimeout(() => {

        icon.classList.remove(
          "ri-spin"
        );

        services =
          loadServices();


        updateStats();

        renderServices();

      }, 600);

    }
  );



// ==========================================
// CART COUNT
// ==========================================

function updateCartCount() {

  const element =
    document.getElementById(
      "navCartCount"
    );


  if (!element) return;


  try {

    const saved =
      localStorage.getItem(
        "ecoStoreCart"
      );


    const cart =
      saved
        ? JSON.parse(saved)
        : [];


    const count =
      Array.isArray(cart)
        ? cart.reduce(
            (total, item) =>
              total +
              (item.quantity || 1),
            0
          )
        : 0;


    element.textContent =
      count;

  } catch {

    element.textContent =
      "0";

  }

}



// ==========================================
// SIGN OUT
// ==========================================

document
  .getElementById("signOutBtn")
  ?.addEventListener(
    "click",
    () => {

      const confirmed =
        confirm(
          "Are you sure you want to sign out?"
        );


      if (!confirmed) return;


      localStorage.removeItem(
        "ecoStoreUser"
      );


      window.location.href =
        "index.html";

    }
  );



// ==========================================
// INITIALIZE
// ==========================================

updateStats();

renderServices();

updateCartCount();