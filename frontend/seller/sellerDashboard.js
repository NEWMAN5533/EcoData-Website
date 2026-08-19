//======================
// SELLER CONFIG
//======================
const SELLER_ID = "TES_SELLER";

const API_BASE = "https://ecodata-app.onrender.com"
const CREATOR_PRODUCTS_API =
`${API_BASE}/api/creator/products`;

document.addEventListener("DOMContentLoaded",()=>{
  loadCreatorProducts(sellerId); //later user.uid
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
      <div class="live-body-rowT loading-row">
        <small>Loading products...</small>
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

      const title =
        document.createElement("small");

      title.textContent =
        product.title || "Untitled";


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
      // ACTION
      // ===================================

      const action =
        document.createElement("small");

      const button =
        document.createElement("button");

      button.className =
        "product-action-btn";

      button.dataset.productId =
        product.id || product.productId || "";

      button.innerHTML =
        `<i class="ri-more-2-fill"></i>`;

      action.appendChild(button);


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

  if (!timestamp) {
    return "-";
  }

  let date;

  // Firestore Timestamp
  if (
    typeof timestamp === "object" &&
    typeof timestamp.seconds === "number"
  ) {

    date = new Date(
      timestamp.seconds * 1000
    );

  } else {

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
//===================
// SETUP ACTION BTN
//===================

function setupProductActions() {

  document
    .querySelectorAll(".product-action-btn")
    .forEach(button => {

      button.addEventListener("click", () => {

        const productId =
          button.dataset.productId;

        if (!productId) return;

        console.log(
          "Selected product:",
          productId
        );

        // We'll add:
        // View product
        // Edit product
        // Delete product
        // View sales
        // etc.

      });

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

//=============================
// INITIALIZE SELLER DASHBOARD
//=============================
document.addEventListener("DOMContentLoaded", ()=> {
  
});




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

