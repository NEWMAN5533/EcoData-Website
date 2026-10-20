
 //==========================
 // DASHBOARD INITIALIZATION
 //==========================

const API_BASE = "https://ecodata-app.onrender.com";

const CREATOR_PRODUCTS_API =
`${API_BASE}/api/seller/products`;

let creatorProducts = [];

document.addEventListener("DOMContentLoaded",()=>{
  loadSellerProducts(); //later user.uid
  loadSellerStoreName();
})

 
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



async function loadSellerStoreName() {
  const desktopName = document.getElementById("sellerProfileUsername");
  const mobileName = document.getElementById("sellerProfileUsernameMobile");

  try {
    const response = await fetch(
      `${API_BASE}/api/seller/profile`,
      {
        credentials: "include",
        headers: {
          Accept: "application/json"
        }
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Unable to load store profile.");
    }

    const storeName = data.seller?.storeName || data.seller?.store_name;

    if (!storeName) {
      throw new Error("Store name was not returned by the API.");
    }

    if (desktopName) desktopName.textContent = storeName;
    if (mobileName) mobileName.textContent = storeName;

  } catch (error) {
    console.error("Load seller store name error:", error);

    if (desktopName) desktopName.textContent = "My Store";
    if (mobileName) mobileName.textContent = "My Store";
  }
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
// LOAD CREATOR PRODUCTS
// ==========================================
async function loadSellerProducts() {
  const productsBody =
    document.getElementById("creatorProductsBody");

  const emptyBody =
    document.getElementById("empty-body");

  if (!productsBody) return;

  try {
    productsBody.innerHTML = `
      <div class="loading-products">
        <div class="loading-spinner"></div>
        <span>Loading products...</span>
      </div>
    `;

    if (emptyBody) {
      emptyBody.hidden = true;
    }

    const response = await fetch(
      SELLER_PRODUCTS_API,
      {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json"
        }
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Unable to load products."
      );
    }

    creatorProducts = Array.isArray(data.products)
      ? data.products
      : [];

    updateSellerAnalytics(creatorProducts);

    if (creatorProducts.length === 0) {
      productsBody.innerHTML = "";

      if (emptyBody) {
        emptyBody.hidden = false;
        emptyBody.textContent =
          "No products submitted yet.";
      }

      return;
    }

    productsBody.innerHTML = "";

    creatorProducts.forEach(product => {
      const row = document.createElement("div");
      row.className = "live-body-rowT product-row";

      // Product image
      const cover = document.createElement("small");
      const imageUrl =
        product.coverUrl || product.imageUrl || "";

      if (imageUrl) {
        const img = document.createElement("img");
        img.src = imageUrl;
        img.alt = product.title || "Product";
        img.className = "product-cover";
        img.loading = "lazy";
        img.onerror = () => {
          img.replaceWith(
            Object.assign(document.createElement("span"), {
              className: "no-cover",
              textContent: "No image"
            })
          );
        };
        cover.appendChild(img);
      } else {
        cover.innerHTML = `
          <div class="no-cover">
            <i class="ri-image-line"></i>
          </div>
        `;
      }

      // Product title
      const title = document.createElement("small");
      const titleWrapper = document.createElement("div");
      titleWrapper.className = "product-title-wrapper";

      const shortTitle = document.createElement("span");
      shortTitle.className = "product-title-short";

      const fullTitle = document.createElement("div");
      fullTitle.className = "product-title-tooltip";

      const productTitle = product.title || "Untitled";
      const words = productTitle.trim().split(/\s+/);

      shortTitle.textContent =
        words.length > 2
          ? `${words.slice(0, 2).join(" ")}...`
          : productTitle;

      fullTitle.textContent = productTitle;

      titleWrapper.append(shortTitle, fullTitle);
      title.appendChild(titleWrapper);

      // Product type
      const type = document.createElement("small");

      const productType =
        product.digitalType ||
        product.productFormat ||
        product.type ||
        product.productType ||
        product.product_type ||
        "-";

      type.textContent = formatProductType(productType);

      // Price
      const price = document.createElement("small");
      price.textContent =
        `GHS ${Number(product.price || 0).toFixed(2)}`;

      // Status
      const status = document.createElement("small");
      const statusValue =
        String(product.status || "pending").toLowerCase();

      status.textContent = formatStatus(statusValue);
      status.className = `status-${statusValue}`;

      // Sales
      const sales = document.createElement("small");
      sales.textContent = Number(product.sales || 0).toLocaleString();

      // Updated date
      const updatedAt = document.createElement("small");
      updatedAt.textContent = formatDate(product.updatedAt);

      // Created date
      const createdAt = document.createElement("small");
      createdAt.textContent = formatDate(product.createdAt);

      // Action menu
      const action = document.createElement("small");
      action.className = "product-action-cell";

      const actionWrapper = document.createElement("div");
      actionWrapper.className = "product-action-wrapper";

      const button = document.createElement("button");
      button.className = "product-action-btn";
      button.type = "button";
      button.dataset.productId = String(product.id);
      button.innerHTML = `<i class="ri-more-2-fill"></i>`;

      const menu = document.createElement("div");
      menu.className = "product-action-menu";

      const actions = [
        ["edit", "ri-edit-line", "Edit Product"],
        ["view", "ri-eye-line", "View Product"],
        ["sales", "ri-bar-chart-line", "View Sales"],
        ["duplicate", "ri-file-copy-line", "Duplicate"],
        ["delete", "ri-delete-bin-line", "Delete Product"]
      ];

      actions.forEach(([actionName, iconName, label]) => {
        const menuButton = document.createElement("button");
        menuButton.type = "button";
        menuButton.className =
          `product-menu-item${actionName === "delete" ? " delete-action" : ""}`;

        menuButton.dataset.action = actionName;
        menuButton.innerHTML =
          `<i class="${iconName}"></i><span>${label}</span>`;

        menu.appendChild(menuButton);
      });

      actionWrapper.append(button, menu);
      action.appendChild(actionWrapper);

      row.append(
        cover,
        title,
        type,
        price,
        status,
        sales,
        updatedAt,
        createdAt,
        action
      );

      productsBody.appendChild(row);
    });

    setupProductActions();

  } catch (error) {
    console.error("Load seller products error:", error);

    productsBody.innerHTML = "";

    if (emptyBody) {
      emptyBody.hidden = false;
      emptyBody.textContent =
        error.message || "Unable to load products.";
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
              await loadSellerProducts(
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
          await loadSellerProducts(
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







