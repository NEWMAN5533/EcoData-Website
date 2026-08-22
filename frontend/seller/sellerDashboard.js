//======================
// SELLER CONFIG
//======================
const SELLER_ID = "TES_SELLER";

const API_BASE = "https://ecodata-app.onrender.com"
const CREATOR_PRODUCTS_API =
`${API_BASE}/api/creator/products`;

let creatorProducts = [];

document.addEventListener("DOMContentLoaded",()=>{
  loadCreatorProducts(SELLER_ID); //later user.uid
})

//==================================
// PRODUCT TYPE + CATEGORY SELECTOR
//==================================
const typeButton =
document.getElementById("productTypeButton");
const typeSheet =
document.getElementById("productTypeSheet");
const typeInput =
document.getElementById("productType");

const categoryButton = 
document.getElementById("productCategoryButton");
const categorySheet =
document.getElementById("productCategorySheet");
const categoryInput = 
document.getElementById("productCategory");

//==========================
// PRODUCT TYPE TOGGLE
//==========================
if(typeButton && typeSheet){
  typeButton.addEventListener("click", ()=> {
    const isOpen = typeSheet.style.display === "flex";

    // close category 
    if(categorySheet){
      categorySheet.style.display = "none";
    }

    // Toggle type
    typeSheet.style.display = isOpen ? "none" : "flex";
  });
}

// Outside click closes sheet
window.addEventListener("click", function(e) {

  if (
    typeButton &&
    typeSheet &&
    !typeButton.contains(e.target) &&
    !typeSheet.contains(e.target)
  ) {
    typeSheet.style.display = "none";
  }

});


//=========================
// PRODUCT TYPE SELECTION
//=========================
document.querySelectorAll(".cateSelect2").forEach(item => {
  item.addEventListener("click",()=> {
    const value = item.dataset.type;
    const text = item.textContent.trim();

    if(!value) return;

    // save actual backend value
    typeInput.value = value;
    updateProductField(value);

    //show selected text
    typeButton.textContent = text;

    // close sheet 
    typeSheet.style.display = "none";
    console.log("Selected product type:", value);
  });
});

//=======================
// CATEGORY TOGGLE
//=======================
if(categoryButton && categorySheet ){
  categoryButton.addEventListener("click", ()=> {
    const isOpen = 
    categorySheet.style.display === "flex";

    // close type
    if(typeSheet){
      typeSheet.style.display = "none";
    }

    // Toggle category
    categorySheet.style.display =
    isOpen ? "none" : "flex";
  });
}

// Outside click closes the sheet
window.addEventListener("click", function(e) {

  if (
    categoryButton &&
    categorySheet &&
    !categoryButton.contains(e.target) &&
    !categorySheet.contains(e.target)
  ) {
    categorySheet.style.display = "none";
  }

});

//======================
// CATEGORY SELECTION
//======================
document.querySelectorAll(".cateSelect").forEach(item => {
  item.addEventListener("click", () => {
    const value =
    item.dataset.category;

    const text =
    item.textContent.trim();

    if(!value) return;

    //save actual backend value
    categoryInput.value = value;

    //Show selected text
    categoryButton.textContent = text;

    //close sheet
    categorySheet.style.display = "none";
    console.log("Selected category:", value);
  });
});


//============================
// PRODUCT FILE FIELD CONTROL
//============================
const productFileGroup =
document.getElementById("productFileGroup");
const youtubeGroup = 
document.getElementById("youtubeGroup");
const affiliateGroup =
document.getElementById("affiliateGroup");
const productFile =
document.getElementById("productFile");

const youtubeUrl =
document.getElementById("youtubeUrl");
const affiliateUrl =
document.getElementById("affiliateUrl");

//====================
// FUNCTION TO UPDATE
//====================
function updateProductField(type){
  // Hide everything initially
  if(productFileGroup){
    productFileGroup.style.display = "none";
  }

  if(youtubeGroup){
    youtubeGroup.style.display = "none";
  }

  if(affiliateGroup){
    affiliateGroup.style.display = "none";
  }

  // Reset required states
  if(productFile){
    productFile.required = false;
  }

  if(youtubeUrl){
    youtubeUrl.required = false;
  }

  if(affiliateUrl){
    affiliateUrl.required = false;
  }

  //===================================
  // PDF / NOTES / TEMPLATE / ZIP
  //===================================
  if(
    type === "ebook" ||
    type === "notes" ||
    type === "template" ||
    type === "zip"
  ) {
    if(productFileGroup){
      productFileGroup.style.display = "flex";
    }

    if(productFile){
      productFile.required = true;
    }
  }

  //=========================
  // VIDEO
  //=========================
  if(type === "video"){
    if(youtubeGroup){
      youtubeGroup.style.display = "flex";
    }

    if(youtubeUrl){
      youtubeUrl.required = true;
    }
  }

  //====================
  // AFFILIATE
  //====================
  if(type === "affiliate"){
    if(affiliateGroup){
      affiliateGroup.style.display = "flex";
    }

    if(affiliateUrl){
      affiliateUrl.required = true;
    }
  }
}

//==========================
// WATCH TYPE SELECTION
//==========================
if(typeInput){
  const observer =
  new MutationObserver(()=> {

    updateProductField(
      typeInput.value
    );
  });

  observer.observe(typeInput, {
    attributes: true,
    attributeFilter: ["value"]
  });
}

//===================
// Also update immediately if a type
// has already been selected.==
updateProductField(typeInput?.value || "ebook");

//=======================
// CREATOR PRODUCT UPLOAD
//=======================
const uploadForm = 
document.querySelector(".ebook-submit");

if(uploadForm){
  uploadForm.addEventListener("submit", async(event) => {
    event.preventDefault();

    //======================
    // GET VALUE
    //======================
    const title =
    document.getElementById("productTitle")?.value.trim();

    const description =
    document.getElementById("productDescription")?.value.trim();

    const category =
    document.getElementById("productCategory")?.value;

    const type =
    document.getElementById("productType")?.value;

    const price = 
    document.getElementById("productPrice")?.value;

    const cover =
    document.getElementById("coverImage")?.files[0];

    const file = 
    document.getElementById("productFile")?.files[0];

    const youtube =
    document.getElementById("youtubeUrl")?.value.trim();

    const affiliate =
    document.getElementById("affiliateUrl")?.value.trim();


    //=======================
    // BASIC VALIDATION
    //=======================
    if(!title){
      showSnackBar("Enter a product title.");
      return;
    }

    if(!description){
      showSnackBar("Enter product description.");
      return;
    }

    if(!type){
      showSnackBar("Select a product type.");
      return;
    }

    if(!category){
      showSnackBar("Select a product category.");
      return;
    }

    if(!price || Number(price) < 0){
      showSnackBar("Enter a valid price.");
      return;
    }

    if(!cover){
      showSnackBar("Please select a cover image.");
      return;
    }

    //========================
    // BUILD FORMDATA
    //========================
    const formData = 
    new FormData();

    formData.append(
      "title",
      title
    );

    formData.append(
      "description",
      description
    );

    formData.append(
      "category",
      category
    );

    formData.append(
      "type",
      type
    );

    formData.append(
      "price",
      price
    );

    formData.append(
      "cover",
      cover
    );

    //===================
    // PRODUCT FILE
    //===================
    if(file){
      formData.append(
        "file",
        file
      );
    }

    //=============
    // YOUTUBE
    //=============
    if(youtube){
      formData.append(
        "youtubeUrl",
        youtube
      );
    }

    //==========
    // Affiliate
    //==========
    if(affiliate){
      formData.append(
        "affiliateUrl",
        affiliate
      );
    }

    //=====================
    // TEMPORARY SELLER ID
    //=====================
    formData.append(
      "sellerId",
      SELLER_ID
    );

    //==================
    // SEND
    //==================
   try {

  const response = await fetch(
    CREATOR_PRODUCTS_API,
    {
      method: "POST",
      body: formData
    }
  );

  const result = await response.json();

  console.log("Upload response:", result);

  if (!response.ok || !result.success) {
    throw new Error(
      result.message ||
      "Product upload failed."
    );
  }

  showSnackBar(
    "Product submitted for approval.",
    "success"
  );

  uploadForm.reset();

  // reset selectors
  document.getElementById("productType").value = "";
  document.getElementById("productCategory").value = "";

  document.getElementById(
    "productTypeButton"
  ).textContent = "Product Type";

  document.getElementById(
    "productCategoryButton"
  ).textContent = "Product Category";

  // Refresh
  loadCreatorProducts(SELLER_ID);

} catch (error) {

  console.error("Upload error:", error);

  showSnackBar(
    error.message ||
    "Unable to upload product.",
    "error"
  );

}
  } 
);
}



// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHtml(value = "") {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


// ==========================================
// FORMAT PRODUCT TYPE
// ==========================================

function formatProductType(type) {

  const types = {
    ebook: "E-Book",
    notes: "Notes",
    video: "Video",
    template: "Template",
    zip: "ZIP",
    affiliate: "Affiliate"
  };

  return types[type] || type || "-";

}


// ==========================================
// FORMAT STATUS
// ==========================================

function formatStatus(status) {

  const value =
    String(status || "pending").toLowerCase();

  const statuses = {
    pending: "Pending",
    published: "Published",
    rejected: "Rejected",
    suspended: "Suspended",
    draft: "Draft"
  };

  return statuses[value] || value;

}



// ==========================================
// CREATOR SALES CHART
// ==========================================

let creatorSalesChart = null;

let creatorSalesChartData = [];

let creatorSalesMetric = "revenue";

let creatorSalesPeriod = 7;


// ==========================================
// FORMAT CURRENCY
// ==========================================

function formatSalesCurrency(value) {

  const amount =
    Number(value || 0);

  return `GHS ${amount.toLocaleString(
    "en-GH",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  )}`;

}


// ==========================================
// FILTER CHART DATA
// ==========================================

function getFilteredSalesChartData() {

  if (
    creatorSalesPeriod === "all"
  ) {

    return [
      ...creatorSalesChartData
    ];

  }


  const days =
    Number(creatorSalesPeriod);


  const cutoff =
    new Date();

  cutoff.setHours(
    0,
    0,
    0,
    0
  );

  cutoff.setDate(
    cutoff.getDate() - (days - 1)
  );


  return creatorSalesChartData
    .filter(item => {

      const date =
        new Date(
          `${item.date}T00:00:00`
        );

      return date >= cutoff;

    });

}


// ==========================================
// CREATE / UPDATE CHART
// ==========================================

function renderCreatorSalesChart() {

  const chartElement =
    document.querySelector(
      "#creatorSalesChart"
    );

  const emptyElement =
    document.querySelector(
      "#salesChartEmpty"
    );


  if (
    !chartElement ||
    !emptyElement
  ) {
    return;
  }


  const filteredData =
    getFilteredSalesChartData();


  // ========================================
  // EMPTY STATE
  // ========================================

  if (!filteredData.length) {

    chartElement.style.display =
      "none";

    emptyElement.style.display =
      "flex";


    if (creatorSalesChart) {

      creatorSalesChart.destroy();

      creatorSalesChart = null;

    }

    return;

  }


  chartElement.style.display =
    "block";

  emptyElement.style.display =
    "none";


  // ========================================
  // CHART DATA
  // ========================================

  const categories =
    filteredData.map(
      item => {

        const date =
          new Date(
            `${item.date}T00:00:00`
          );

        return date.toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric"
          }
        );

      }
    );


  const values =
    filteredData.map(
      item =>
        Number(
          item[creatorSalesMetric] || 0
        )
    );


  // ========================================
  // METRIC SETTINGS
  // ========================================

  let chartTitle =
    "Revenue";

  let chartSubtitle =
    "Daily revenue";

  let tooltipFormatter =
    value => formatSalesCurrency(value);


  if (
    creatorSalesMetric === "sales"
  ) {

    chartTitle =
      "Sales";

    chartSubtitle =
      "Daily completed sales";

    tooltipFormatter =
      value =>
        `${Number(value).toLocaleString()} sales`;

  }


  if (
    creatorSalesMetric === "earnings"
  ) {

    chartTitle =
      "Creator Earnings";

    chartSubtitle =
      "Daily creator earnings";

    tooltipFormatter =
      value =>
        formatSalesCurrency(value);

  }


  const titleElement =
    document.querySelector(
      "#salesChartTitle"
    );

  const subtitleElement =
    document.querySelector(
      "#salesChartSubtitle"
    );


  if (titleElement) {

    titleElement.textContent =
      chartTitle;

  }


  if (subtitleElement) {

    subtitleElement.textContent =
      chartSubtitle;

  }


  // ========================================
  // APEX OPTIONS
  // ========================================

  const options = {

    chart: {

      type: "bar",

      height: 320,

      toolbar: {
        show: false
      },

      animations: {

        enabled: true,

        easing: "easeinout",

        speed: 500

      },

      fontFamily:
        "inherit"

    },


    series: [

      {

        name:
          chartTitle,

        data:
          values

      }

    ],


    xaxis: {

      categories,

      axisBorder: {
        show: false
      },

      axisTicks: {
        show: false
      },

      labels: {

        style: {

          fontSize:
            "11px"

        }

      }

    },


    yaxis: {

      labels: {

        formatter: value => {

          if (
            creatorSalesMetric ===
            "sales"
          ) {

            return Math.round(
              value
            );

          }

          return `GHS ${Number(
            value
          ).toLocaleString(
            "en-GH",
            {
              maximumFractionDigits: 0
            }
          )}`;

        }

      }

    },


    plotOptions: {

      bar: {

        borderRadius: 7,

        borderRadiusApplication:
          "end",

        columnWidth:
          "42%",

        distributed:
          false

      }

    },


    dataLabels: {

      enabled: false

    },


    grid: {

      borderColor:
        "rgba(128,128,128,0.12)",

      strokeDashArray:
        4,

      xaxis: {

        lines: {
          show: false
        }

      },

      yaxis: {

        lines: {
          show: true
        }

      }

    },


    tooltip: {

      theme:
        document.documentElement
          .classList
          .contains("dark")
          ? "dark"
          : "light",

      y: {

        formatter:
          tooltipFormatter

      }

    },


    states: {

      hover: {

        filter: {

          type:
            "lighten",

          value:
            0.08

        }

      }

    },


    legend: {

      show: false

    },


    responsive: [

      {

        breakpoint: 600,

        options: {

          chart: {

            height: 280

          },

          plotOptions: {

            bar: {

              columnWidth:
                "52%"

            }

          }

        }

      }

    ]

  };


  // ========================================
  // DESTROY OLD CHART
  // ========================================

  if (creatorSalesChart) {

    creatorSalesChart.destroy();

  }


  // ========================================
  // CREATE CHART
  // ========================================

  creatorSalesChart =
    new ApexCharts(
      chartElement,
      options
    );


  creatorSalesChart.render();

}


// ==========================================
// SET DASHBOARD SALES DATA
// ==========================================

function setCreatorSalesChartData(
  chartData
) {

  creatorSalesChartData =
    Array.isArray(chartData)
      ? chartData
      : [];


  renderCreatorSalesChart();

}


// ==========================================
// PERIOD BUTTONS
// ==========================================

document.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        ".salesPeriodBtn"
      );


    if (!button) return;


    document
      .querySelectorAll(
        ".salesPeriodBtn"
      )
      .forEach(btn =>
        btn.classList.remove(
          "active"
        )
      );


    button.classList.add(
      "active"
    );


    const period =
      button.dataset.period;


    creatorSalesPeriod =
      period === "all"
        ? "all"
        : Number(period);


    renderCreatorSalesChart();

  }
);


// ==========================================
// METRIC BUTTONS
// ==========================================

document.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        ".salesMetricBtn"
      );


    if (!button) return;


    document
      .querySelectorAll(
        ".salesMetricBtn"
      )
      .forEach(btn =>
        btn.classList.remove(
          "active"
        )
      );


    button.classList.add(
      "active"
    );


    creatorSalesMetric =
      button.dataset.metric;


    renderCreatorSalesChart();

  }
);







// ==========================================
// LOAD CREATOR PRODUCTS
// ==========================================

async function loadCreatorProducts(sellerId) {

  const productsBody =
    document.getElementById("creatorProductsBody");

  const emptyBody =
    document.getElementById("empty-body");

  if (!productsBody) return;


  try {

    // =====================================
    // LOADING STATE
    // =====================================

        productsBody.innerHTML = `
      <div class="loading-products">
        <div class="loading-spinner"></div>
        <span>Loading products...</span>
      </div>
    `;

    if (emptyBody) {
      emptyBody.hidden = true;
    }


    // =====================================
    // VALIDATE SELLER ID
    // =====================================

    if (!sellerId) {

      throw new Error(
        "Seller account could not be identified."
      );

    }


    // =====================================
    // FETCH PRODUCTS
    // =====================================

    const response = await fetch(
      `${API_BASE}/api/creator/products?sellerId=${encodeURIComponent(sellerId)}`
    );

    const data =
      await response.json();


    if (!response.ok || !data.success) {

      throw new Error(
        data.message ||
        "Unable to load products."
      );

    }


    const products =
      data.products || [];

    creatorProducts = products;

    // call
    updateSellerAnalytics(products);


    // =====================================
    // NO PRODUCTS
    // =====================================

    if (products.length === 0) {

      productsBody.innerHTML = "";

      if (emptyBody) {

        emptyBody.hidden = false;

        emptyBody.textContent =
          "No products submitted yet.";

      }

      return;

    }


    // =====================================
    // RENDER PRODUCTS
    // =====================================

    productsBody.innerHTML = "";


    products.forEach(product => {

      const row =
        document.createElement("div");

      row.className =
        "live-body-rowT product-row";


      // ===================================
      // COVER
      // ===================================

      const cover =
        document.createElement("small");

      if (product.coverUrl) {

        const img =
          document.createElement("img");

        img.src =
          product.coverUrl;

        img.alt =
          product.title || "Product";

        img.className =
          "product-cover";

        img.loading =
          "lazy";

        cover.appendChild(img);

      } else {

        cover.innerHTML = `
          <div class="no-cover">
            <i class="ri-image-line"></i>
          </div>
        `;

      }


      // ===================================
      // TITLE
      // ===================================
      function collapseTitle(title,
        maxWords = 2){

          if(!title) return "Untitled";

          const words = String(title).trim().split(/\s+/);

          if(words.length <= maxWords){
            return words.join(" ");
          }
          return words.slice(0, maxWords).join(" ") + "...";
        }
      
       const title =
  document.createElement("small");

const titleWrapper =
  document.createElement("div");

titleWrapper.className =
  "product-title-wrapper";

const shortTitle =
  document.createElement("span");

shortTitle.className =
  "product-title-short";

shortTitle.textContent =
  collapseTitle(
    product.title || "Untitled"
  );

const fullTitle =
  document.createElement("div");

fullTitle.className =
  "product-title-tooltip";

fullTitle.textContent =
  product.title || "Untitled";

titleWrapper.appendChild(shortTitle);
titleWrapper.appendChild(fullTitle);

title.appendChild(titleWrapper);


      // ===================================
      // TYPE
      // ===================================

      const type =
        document.createElement("small");

      type.textContent =
        formatProductType(
          product.type ||
          product.productType ||
          product.product_type);

          console.log("PRODUCT TYPE:",{
            id: product.id,
            type: product.type,
            productTyp: product.productType
          });


      // ===================================
      // PRICE
      // ===================================

      const price =
        document.createElement("small");

      price.textContent =
        `GHS ${Number(product.price || 0).toFixed(2)}`;


      // ===================================
      // STATUS
      // ===================================

      const status =
        document.createElement("small");

      const statusValue =
        String(
          product.status || "pending"
        ).toLowerCase();

      status.textContent =
        formatStatus(statusValue);

      status.className =
        `status-${statusValue}`;


      // ===================================
      // SALES
      // ===================================

      const sales =
        document.createElement("small");

      sales.textContent =
        Number(product.sales || 0);


      // ===================================
      // UPDATED AT
      // ===================================

      const updatedAt =
        document.createElement("small");

      updatedAt.textContent =
        formatDate(product.updatedAt);


      // ===================================
      // DATE SUBMITTED
      // ===================================

      const createdAt =
        document.createElement("small");

      createdAt.textContent =
        formatDate(product.createdAt);


  // ===================================
// ACTION MENU
// ===================================

const action =
  document.createElement("small");

action.className =
  "product-action-cell";

const actionWrapper =
  document.createElement("div");

actionWrapper.className =
  "product-action-wrapper";


// ================================
// THREE-DOT BUTTON
// ================================

const button =
  document.createElement("button");

button.className =
  "product-action-btn";

button.type =
  "button";

button.dataset.productId =
  product.id || product.productId || "";

button.innerHTML =
  `<i class="ri-more-2-fill"></i>`;


// ================================
// ACTION MENU
// ================================

const menu =
  document.createElement("div");

menu.className =
  "product-action-menu";


// Edit
const editButton =
  document.createElement("button");

editButton.className =
  "product-menu-item";

editButton.dataset.action =
  "edit";

editButton.innerHTML = `
  <i class="ri-edit-line"></i>
  <span>Edit Product</span>
`;


// View
const viewButton =
  document.createElement("button");

viewButton.className =
  "product-menu-item";

viewButton.dataset.action =
  "view";

viewButton.innerHTML = `
  <i class="ri-eye-line"></i>
  <span>View Product</span>
`;


// Sales
const salesButton =
  document.createElement("button");

salesButton.className =
  "product-menu-item";

salesButton.dataset.action =
  "sales";

salesButton.innerHTML = `
  <i class="ri-bar-chart-line"></i>
  <span>View Sales</span>
`;


// Duplicate
const duplicateButton =
  document.createElement("button");

duplicateButton.className =
  "product-menu-item";

duplicateButton.dataset.action =
  "duplicate";

duplicateButton.innerHTML = `
  <i class="ri-file-copy-line"></i>
  <span>Duplicate</span>
`;


// Divider
const divider =
  document.createElement("div");

divider.className =
  "product-menu-divider";


// Delete
const deleteButton =
  document.createElement("button");

deleteButton.className =
  "product-menu-item delete-action";

deleteButton.dataset.action =
  "delete";

deleteButton.innerHTML = `
  <i class="ri-delete-bin-line"></i>
  <span>Delete Product</span>
`;


// ================================
// BUILD MENU
// ================================

menu.appendChild(editButton);
menu.appendChild(viewButton);
menu.appendChild(salesButton);
menu.appendChild(duplicateButton);
menu.appendChild(divider);
menu.appendChild(deleteButton);

actionWrapper.appendChild(button);
actionWrapper.appendChild(menu);

action.appendChild(actionWrapper);

      // ===================================
      // ADD CELLS
      // ===================================

      row.appendChild(cover);
      row.appendChild(title);
      row.appendChild(type);
      row.appendChild(price);
      row.appendChild(status);
      row.appendChild(sales);
      row.appendChild(updatedAt);
      row.appendChild(createdAt);
      row.appendChild(action);


      productsBody.appendChild(row);

    });


    // =====================================
    // PRODUCT ACTIONS
    // =====================================

    setupProductActions();


  } catch (error) {

    console.error(
      "Load creator products error:",
      error
    );

    productsBody.innerHTML = "";

    if (emptyBody) {

      emptyBody.hidden = false;

      emptyBody.textContent =
        error.message ||
        "Unable to load products.";

    }

  }

}


//=======================
// FUNCTION DATE FORMATTER
//=======================
function formatDate(timestamp) {

  if (!timestamp) return "-";

  let date;

  // Firestore Timestamp
  if (typeof timestamp.seconds === "number") {

    date = new Date(
      timestamp.seconds * 1000
    );

  }

  // Firestore Timestamp serialized by Firebase Admin
  else if (typeof timestamp._seconds === "number") {

    date = new Date(
      timestamp._seconds * 1000
    );

  }

  // JavaScript Date / ISO string
  else {

    date = new Date(timestamp);

  }

  // Invalid date
  if (isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}


//========================
// SETUP ACTION BUTTON
//========================
function setupProductActions() {

  // ================================
  // ACTION BUTTON
  // ================================

  document
    .querySelectorAll(".product-action-btn")
    .forEach(button => {

      button.addEventListener("click", event => {

        event.stopPropagation();

        const wrapper =
          button.closest(
            ".product-action-wrapper"
          );

        if (!wrapper) return;


        // Close other menus
        document
          .querySelectorAll(
            ".product-action-wrapper.menu-open"
          )
          .forEach(other => {

            if (other !== wrapper) {

              other.classList.remove(
                "menu-open"
              );

            }

          });


        // Toggle current menu
        wrapper.classList.toggle(
          "menu-open"
        );

      });

    });


  // ================================
  // MENU ACTIONS
  // ================================

  document
    .querySelectorAll(".product-menu-item")
    .forEach(item => {

      item.addEventListener("click", async () => {
          const action =
            item.dataset.action;


          const wrapper =
            item.closest(
              ".product-action-wrapper"
            );


          const button =
            wrapper?.querySelector(
              ".product-action-btn"
            );


          const productId =
            button?.dataset.productId;


          if (!productId) return;


          // Close menu
          wrapper.classList.remove(
            "menu-open"
          );


          // =========================
          // EDIT
          // =========================

          if (action === "edit") {

            openEditProductModal(
              productId
            );

            return;
          }


          // =========================
          // VIEW
          // =========================

          if (action === "view") {

            console.log(
              "View product:",
              productId
            );

            return;
          }


          // =========================
          // SALES
          // =========================

          if (action === "sales") {

            console.log(
              "View sales:",
              productId
            );

            return;
          }


          // =========================
          // DUPLICATE
          // =========================

          if (action === "duplicate") {

            console.log(
              "Duplicate product:",
              productId
            );

            return;
          }


          // =========================
          // DELETE
          // =========================

          if (action === "delete") {

          const confirmed = 
            await showDeleteConfirmation(
              productId
            );

            if(!confirmed){
              return;
            }


            try {

              item.disabled = true;


              const response =
                await fetch(
                  `${API_BASE}/api/creator/products/${encodeURIComponent(productId)}?sellerId=${encodeURIComponent(SELLER_ID)}`,
                  {
                    method: "DELETE"
                  }
                );


              const result =
                await response.json();


              if (
                !response.ok ||
                !result.success
              ) {

                throw new Error(
                  result.message ||
                  "Unable to delete product."
                );

              }


              showSnackBar(
                "Product deleted successfully.",
                "success",
                4000
              );


              // Reload products
              await loadCreatorProducts(
                SELLER_ID
              );


            } catch (error) {

              console.error(
                "Delete product error:",
                error
              );


              showSnackBar(
                error.message ||
                "Unable to delete product.",
                "error",
                3000
              );


              item.disabled = false;

            }

          }

        }
      );

    });


  // ================================
  // CLOSE WHEN CLICKING OUTSIDE
  // ================================

  document.addEventListener(
    "click",
    () => {

      document
        .querySelectorAll(
          ".product-action-wrapper.menu-open"
        )
        .forEach(wrapper => {

          wrapper.classList.remove(
            "menu-open"
          );

        });

    }
  );

}

//====================================
// OPEN EDIT PRODUCT MODAL
//====================================
function openEditProductModal(productId) {

  const product =
    creatorProducts.find(
      item =>
        item.id === productId ||
        item.productId === productId
    );

  if (!product) {

    showSnackBar(
      "Product information could not be found.",
      "error"
    );

    return;
  }

  // Remove existing modal
  document
    .querySelector(".edit-product-overlay")
    ?.remove();


  //================================
  // CREATE OVERLAY
  //================================

  const overlay =
    document.createElement("div");

  overlay.className =
    "edit-product-overlay";


  //================================
  // MODAL
  //================================

  const modal =
    document.createElement("div");

  modal.className =
    "edit-product-modal";


  modal.innerHTML = `

    <div class="edit-product-header">

      <div>
        <h3>Edit Product</h3>

        <p>
          Update your product information
        </p>
      </div>

      <button
        type="button"
        class="edit-product-close"
      >
        <i class="ri-close-line"></i>
      </button>

    </div>


    <form
      class="edit-product-form"
      id="editProductForm"
    >

      <div class="edit-product-field">

        <label>
          Product Title
        </label>

        <input
          type="text"
          id="editProductTitle"
          value="${escapeHtml(product.title || "")}"
          required
        >

      </div>


      <div class="edit-product-field">

        <label>
          Description
        </label>

        <textarea
          id="editProductDescription"
          required
        >${escapeHtml(product.description || "")}</textarea>

      </div>


      <div class="edit-product-grid">

        <div class="edit-product-field">

          <label>
            Category
          </label>

          <input
            type="text"
            id="editProductCategory"
            value="${escapeHtml(product.category || "")}"
          >

        </div>


        <div class="edit-product-field">

          <label>
            Price (GHS)
          </label>

          <input
            type="number"
            id="editProductPrice"
            min="0"
            step="0.01"
            value="${Number(product.price || 0).toFixed(2)}"
            required
          >

        </div>

      </div>


      <div class="edit-product-field">

        <label>
          Product Type
        </label>

        <select
          id="editProductType"
        >

          <option value="ebook">
            E-Book
          </option>

          <option value="notes">
            Notes
          </option>

          <option value="video">
            Video
          </option>

          <option value="template">
            Template
          </option>

          <option value="zip">
            ZIP
          </option>

          <option value="affiliate">
            Affiliate
          </option>

        </select>

      </div>


      <div
        class="edit-product-field"
        id="editYoutubeField"
      >

        <label>
          YouTube URL
        </label>

        <input
          type="url"
          id="editYoutubeUrl"
          placeholder="https://youtube.com/..."
        >

      </div>


      <div
        class="edit-product-field"
        id="editAffiliateField"
      >

        <label>
          Affiliate URL
        </label>

        <input
          type="url"
          id="editAffiliateUrl"
          placeholder="https://..."
        >

      </div>


      <div class="edit-product-actions">

        <button
          type="button"
          class="edit-cancel-btn"
        >
          Cancel
        </button>

        <button
          type="submit"
          class="edit-save-btn"
        >
          <i class="ri-save-line"></i>
          Save Changes
        </button>

      </div>

    </form>
  `;


  // Set current values that need JS assignment
  modal.querySelector("#editProductType").value =
    product.type || "ebook";

  modal.querySelector("#editYoutubeUrl").value =
    product.youtubeUrl || "";

  modal.querySelector("#editAffiliateUrl").value =
    product.affiliateUrl || "";


  overlay.appendChild(modal);

  document.body.appendChild(overlay);


  //================================
  // TYPE FIELD VISIBILITY
  //================================

  const typeSelect =
    modal.querySelector("#editProductType");

  const youtubeField =
    modal.querySelector("#editYoutubeField");

  const affiliateField =
    modal.querySelector("#editAffiliateField");


  function updateEditTypeFields() {

    const type =
      typeSelect.value;

    youtubeField.style.display =
      type === "video"
        ? "flex"
        : "none";

    affiliateField.style.display =
      type === "affiliate"
        ? "flex"
        : "none";
  }


  typeSelect.addEventListener(
    "change",
    updateEditTypeFields
  );

  updateEditTypeFields();


  //================================
  // CLOSE MODAL
  //================================

  function closeModal() {

    overlay.classList.remove(
      "show"
    );

    setTimeout(() => {
      overlay.remove();
    }, 180);

  }


  modal
    .querySelector(".edit-product-close")
    .addEventListener(
      "click",
      closeModal
    );


  modal
    .querySelector(".edit-cancel-btn")
    .addEventListener(
      "click",
      closeModal
    );


  overlay.addEventListener(
    "click",
    event => {

      if(event.target === overlay) {
        closeModal();
      }

    }
  );


  //================================
  // SUBMIT EDIT
  //================================

  modal
    .querySelector("#editProductForm")
    .addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const title =
          modal
            .querySelector("#editProductTitle")
            .value
            .trim();


        const description =
          modal
            .querySelector("#editProductDescription")
            .value
            .trim();


        const category =
          modal
            .querySelector("#editProductCategory")
            .value
            .trim();


        const price =
          modal
            .querySelector("#editProductPrice")
            .value;


        const type =
          modal
            .querySelector("#editProductType")
            .value;


        const youtubeUrl =
          modal
            .querySelector("#editYoutubeUrl")
            .value
            .trim();


        const affiliateUrl =
          modal
            .querySelector("#editAffiliateUrl")
            .value
            .trim();


        //========================
        // VALIDATION
        //========================

        if(!title) {

          showSnackBar(
            "Product title is required.",
            "warning"
          );

          return;
        }


        if(!description) {

          showSnackBar(
            "Product description is required.",
            "warning"
          );

          return;
        }


        if(!Number.isFinite(Number(price))
          || Number(price) < 0) {

          showSnackBar(
            "Enter a valid price.",
            "warning"
          );

          return;
        }


        //========================
        // SAVE BUTTON
        //========================

        const saveButton =
          modal.querySelector(
            ".edit-save-btn"
          );

        saveButton.disabled =
          true;

        saveButton.innerHTML = `
          <i class="ri-loader-4-line"></i>
          Saving...
        `;


        try {

          const response =
            await fetch(
              `${API_BASE}/api/creator/products/${encodeURIComponent(productId)}`,
              {
                method: "PUT",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body: JSON.stringify({

                  sellerId:
                    SELLER_ID,

                  title,
                  description,
                  category,
                  price,
                  type,
                  youtubeUrl,
                  affiliateUrl

                })
              }
            );


          const result =
            await response.json();


          if(
            !response.ok ||
            !result.success
          ) {

            throw new Error(
              result.message ||
              "Unable to update product."
            );

          }


          showSnackBar(
            "Product updated successfully.",
            "success"
          );


          closeModal();


          // Refresh products
          await loadCreatorProducts(
            SELLER_ID
          );

        } catch(error) {

          console.error(
            "Update product error:",
            error
          );

          showSnackBar(
            error.message ||
            "Unable to update product.",
            "error"
          );


          saveButton.disabled =
            false;

          saveButton.innerHTML = `
            <i class="ri-save-line"></i>
            Save Changes
          `;

        }

      }
    );


  // Small delay for opening animation
  requestAnimationFrame(() => {

    overlay.classList.add(
      "show"
    );

  });

}


//====================================
// UPDATE THE SELLER ANALYTICS CARDS
//====================================
function updateSellerAnalytics(products){
  const totalEbooks =
  products.length;

  const published = 
  products.filter(product =>
    String(product.status || "").toLowerCase() ===
    "published"
  ).length;

  const pending =
  products.filter(product => 
    String(product.status || "").toLowerCase() === 
    "pending"
  ).length;

  const totalSales =
  products.reduce(
    (total, product) =>
      total + Number(product.sales || 0 ),
    0
  );
  /** Current earning will be calculated from* successful sales later.
   * *
   * For now, use sales * price * 70%.
   */
  const totalEarnings  = 
  products.reduce(
    (total, product) => {

      const sales = 
      Number(product.sales || 0);

      const price =
      Number(product.price || 0);

      const creatorShare = 
      Number(
        product.creatorSharePercent ?? 70
      );

      return total +
      (sales * 
       price * 
        (creatorShare / 100 ))
    },
    0
  );

  /*
  * Available balance will eventually come
  * from the seller wallet/earnings collection.
  **
  For now, use total earnings.
   */
  const availableBalance =
  totalEarnings;

  //=========================
  // UPDATE HTML
  //=========================
  setText(
    "totalEbooks",
    totalEbooks
  );

  setText(
    "pendingEbooks",
    pending
  );

  setText(
    "totalSales",
    totalSales
  );

  setMoney(
    "totalEarnings",
    totalEarnings
  );

  setMoney(
    "availableBalance",
    availableBalance
  );
  console.log(
    "Seller analytics:",
    {
      totalEbooks,
      published,
      pending,
      totalSales,
      totalEarnings,
      availableBalance
    }
  );
}

//==========================
// SET TEXT
//==========================
function setText(id, value){

  const element =
  document.getElementById(id);

  if(element){
    element.textContent = value;
  }
}

//=========================
// SET MONEY
//=========================
function setMoney(id, value){
  const element =
  document.getElementById(id);

  if(element){
    element.textContent =
    `GHS ${Number(value || 0).toFixed(2)}`;
  }
}





//=============================
// RENDER SALES
//=============================
function renderSales(sales){
  const wrapper =
  document.getElementById("withRowWrapper");

  const emptyBody = 
  document.getElementById("withEmpty-body");

  if(!wrapper) return;

  wrapper.innerHTML = "";

  if(!sales || sales.length === 0){
    emptyBody.hidden = false;
    return;
  }

    emptyBody.hidden = true;

    sales.forEach(sale => {
      const amount = Number(sale.amount || 0);
      const platformFee = 
      Number(sale.platformFee || 0);
      const creatorShare = 
      Number(sale.creatorShare ?? amount - platformFee);

      const row =
      document.createElement("div");

      row.className = "live-body-rowS";

      row.innerHTML = `
      <small>
      ${sale.productId || "-"}
      </small>

      <small>
        ${sale.productName || "-"}
      </small>

      <small>
      ${sale.buyer || "-"}
      </small>

      <small>
      GHS ${amount.toFixed(2)}
      </small>

      <small>
      GHS ${platformFee.toFixed(2)}
      </small>

      <small>
      GHS ${creatorShare.toFixed(2)}
      </small>

      <small>
      ${formatDate(sale.createdAt)}
      </small>
      `;

      wrapper.appendChild(row);
    });
}


//=======================
// WITHDRAWAL FUNCTION
//=======================
function renderWithdrawals(withdrawals){
  const wrapper = 
  document.getElementById("wd-RowWrapper");

  if(!wrapper) return;

  wrapper.innerHTML = "";

  const emptyBody = wrapper.closest(".wd-content")
  ?.querySelector("#empty-body");

  if(!withdrawals || withdrawals.length === 0){
    if(emptyBody){
      emptyBody.hidden = false;
    }
    return;
  }

  if(emptyBody){
    emptyBody.hidden = true;
  }

  withdrawals.forEach(withdrawal => {
    const row =
    document.createElement("div");

    row.className = "live-body-rowW";

    row.innerHTML = `
    <small>
    GHS ${Number(withdrawal.amount || 0).toFixed(2)}
    </small>

    <small>
    ${formatDate(withdrawal.requestedAt)}
    </small>

    <small>
    ${withdrawal.approved === true ? "Yes" : "No"}
    </small>

    <small>
    ${withdrawal.paid === true? "Yes" : "No"}
    </small>

    <small>
    ${withdrawal.reference || "pending"}
    </small>
    `;

    wrapper.appendChild(row);
  });
}

//================================
// LOAD THE SELLER DASHBOARD
//================================


//==========================================
// INITIALIZE SELLER DASHBOARD
//==========================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    try {

      // ======================================
      // SELLER ID
      // ======================================

      const sellerId =
        "TES_SELLER";


      // ======================================
      // LOAD DASHBOARD
      // ======================================

      await loadCreatorDashboard(
        sellerId
      );


    } catch (error) {

      console.error(
        "Seller dashboard initialization error:",
        error
      );

    }

  }
);



//==========================================
// LOAD CREATOR DASHBOARD
//==========================================

async function loadCreatorDashboard(
  sellerId
) {

  try {

    console.log(
      "Loading creator dashboard:",
      sellerId
    );


    // ======================================
    // API REQUEST
    // ======================================

    const response =
      await fetch(
        `https://ecodata-app.onrender.com/api/creator/products/dashboard?sellerId=${encodeURIComponent(
          sellerId
        )}`
      );


    // ======================================
    // CHECK RESPONSE
    // ======================================

    if (!response.ok) {

      throw new Error(
        `Dashboard request failed: ${response.status}`
      );

    }


    // ======================================
    // PARSE JSON
    // ======================================

    const data =
      await response.json();


    console.log(
      "Creator dashboard response:",
      data
    );


    // ======================================
    // CHECK API SUCCESS
    // ======================================

    if (!data.success) {

      throw new Error(
        data.message ||
        "Unable to load creator dashboard."
      );

    }


    // ======================================
    // UPDATE DASHBOARD STATISTICS
    // ======================================

    updateCreatorDashboardStats(
      data.dashboard
    );


    // ======================================
    // LOAD SALES CHART
    // ======================================

    setCreatorSalesChartData(
      data.chart?.data || []
    );


    return data;


  } catch (error) {

    console.error(
      "Load creator dashboard error:",
      error
    );

    throw error;

  }

}




//==========================================
// UPDATE CREATOR DASHBOARD STATISTICS
//==========================================

function updateCreatorDashboardStats(
  dashboard
) {

  if (!dashboard) {
    return;
  }


  // ======================================
  // TOTAL SALES
  // ======================================

  const totalSalesElement =
    document.querySelector(
      "#salesOverviewTotalSales"
    );


  if (totalSalesElement) {

    totalSalesElement.textContent =
      Number(
        dashboard.totalSales || 0
      ).toLocaleString();

  }


  // ======================================
  // TOTAL REVENUE
  // ======================================

  const revenueElement =
    document.querySelector(
      "#salesOverviewRevenue"
    );


  if (revenueElement) {

    revenueElement.textContent =
      formatSalesCurrency(
        dashboard.totalRevenue
      );

  }


  // ======================================
  // CREATOR EARNINGS
  // ======================================

  const earningsElement =
    document.querySelector(
      "#salesOverviewEarnings"
    );


  if (earningsElement) {

    earningsElement.textContent =
      formatSalesCurrency(
        dashboard.totalEarnings
      );

  }


  // ======================================
  // AVAILABLE BALANCE
  // ======================================

  const balanceElement =
    document.querySelector(
      "#salesOverviewBalance"
    );


  if (balanceElement) {

    balanceElement.textContent =
      formatSalesCurrency(
        dashboard.availableBalance
      );

  }

}




 










//====================================
// DELETE CONFIRMATION
//====================================
function showDeleteConfirmation(productId) {

  return new Promise(resolve => {

    // Remove existing confirmation
    document
      .querySelector(".delete-confirmation")
      ?.remove();


    const confirmation =
      document.createElement("div");

    confirmation.className =
      "delete-confirmation";


    confirmation.innerHTML = `
      <div class="delete-confirmation-content">

        <div class="delete-confirmation-icon">
          <i class="ri-delete-bin-line"></i>
        </div>

        <div class="delete-confirmation-text">

          <strong>Delete product?</strong>

          <span>
            This action cannot be undone.
          </span>

        </div>

        <div class="delete-confirmation-actions">

          <button
            type="button"
            class="delete-cancel-btn"
          >
            Cancel
          </button>

          <button
            type="button"
            class="delete-confirm-btn"
          >
            Delete
          </button>

        </div>

      </div>
    `;


    document.body.appendChild(
      confirmation
    );


    // Show
    requestAnimationFrame(() => {

      confirmation.classList.add(
        "show"
      );

    });


    const close = value => {

      confirmation.classList.remove(
        "show"
      );


      setTimeout(() => {

        confirmation.remove();

        resolve(value);

      }, 200);

    };


    confirmation
      .querySelector(
        ".delete-cancel-btn"
      )
      .addEventListener(
        "click",
        () => close(false)
      );


    confirmation
      .querySelector(
        ".delete-confirm-btn"
      )
      .addEventListener(
        "click",
        () => close(true)
      );

  });

}









// SNACKBAR SECTION //
// ===== SNACKBAR FUNCTION ===== //
let snackTimeout = null;

function showSnackBar(message, type = "info", duration = 4000) {
  let snackbar = document.querySelector(".snackbar");

  // Create snackbar if it doesn't exist
  if (!snackbar) {
    snackbar = document.createElement("div");
    snackbar.className = "snackbar";

    snackbar.innerHTML = `
      <span class="snackbar-text"></span>
      <div class="snackbar-progress"></div>
    `;

    document.body.appendChild(snackbar);
  }

  // Update text
  snackbar.querySelector(".snackbar-text").textContent = message;

  // Color by type
  if (type === "success") snackbar.style.background = "rgba(7, 29, 26, 0.95)";
  else if (type === "error") snackbar.style.background = "#88353f";
  else if (type === "warning") snackbar.style.background = "#413b2a";
  else snackbar.style.background = "rgba(7, 29, 26, 0.95)";

  // Reset progress animation
  const progress = snackbar.querySelector(".snackbar-progress");
  progress.style.animation = "none";
  void progress.offsetWidth;
  progress.style.animation = `snackbar-progress ${duration}ms linear forwards`;

  snackbar.classList.add("show");

  // Clear previous timeout
  if (snackTimeout) clearTimeout(snackTimeout);

  snackTimeout = setTimeout(() => {
    snackbar.classList.remove("show");
  }, duration);
}
// snackbar ends

