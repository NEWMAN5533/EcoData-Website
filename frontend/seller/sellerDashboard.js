//======================
// SELLER CONFIG
//======================
const SELLER_ID = "TES_SELLER";
const CREATOR_PRODUCTS_API = "https://ecodata-app.onrender.com/api/creator/products";

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
window.addEventListener("click", function(e){
  if(!typeButton.contains(e.target) && !typeSheet.contains(e.target)){
    typeSheet.style.display = "none";
  }
})


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
window.addEventListener("click", function(e){
  if(!categoryButton.contains(e.target) && !categorySheet.contains(e.target)){
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
        youtubeUrl
      );
    }

    //==========
    // Affiliate
    //==========
    if(affiliate){
      formData.append(
        "affiliateUrl",
        affiliateUrl
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
    try{
      const response = await fetch(CREATOR_PRODUCTS_API, {
        method: "POST",
        body: formData
      }
    );

    const result =
    await response.json();

    console.log("Upload response:", result);

    if(!response.ok){
      throw new Error(
        result.message ||
        "product upload failed."
      );
    }
    showSnackBar("Product submitted for approval.");
    uploadForm.reset();


    //====================
    // RESTORE DEFAULT VALUE
    //====================
    document.getElementById("productType").value = "";

    document.getElementById("productCategory").value = "";

    document.getElementById("productTypeButton").textContent = "Product Type";

    document.getElementById("productCategoryButton").textContent = "Product Category";

    // Refresh dashboard
    loadCreatorProducts();

    } catch(error){
    console.error("Upload error", error);
    showSnackBar(error.message || "Unable to upload product.");
    }
  } 
);
}

//===============================
// LOAD CREATOR PRODUCTS
//===============================
async function loadCreatorProducts(){
  try{
    const url = `${CREATOR_PRODUCTS_API}?sellerId=${encodeURIComponent(SELLER_ID)}`;

    console.log("Loading creator products...");

    const response = await fetch(url);

    const result = await response.json();

    console.log("Creator products response:", result);
    if(!response.ok || !result.success){
      throw new Error(
        result.message || "Unable to load products."
      );
    }

    const products = result.products || [];

    // Save globally
    updateSellerAnalytics(products);
    // Render products table
    renderCreatorProducts(products);

  } catch(error){
    console.error("Creator products loading error", error);
  }
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

//=========================
// RENDER CREATOR PRODUCTS
//=========================
function renderCreatorProducts(products){
  const tableBody =
  document.getElementById("creatorProductsBody");

  if(!tableBody){
    console.warn("Creator tsBody not found.");
    return;
  }

  tableBody.innerHTML = "";

  if(!products.length){

    tableBody.innerHTML = `
    <div class="myEmpty-body">
    No products uploaded yet.
    </div>
    `;
    return;
  }

  products.forEach(product => {

    const row =
    document.createElement("div");

    const status =
    String(product.status || "pending").toLowerCase();

    const price = 
    Number(product.price || 0).toFixed(2);

    const sales = 
    Number(product.sales || 0);

    row.className =
    "creator-product-row";

    row.innerHTML = `
    <span class="product-cover-cell">

    <img src=${escapeHTML(
      product.coverUrl || ""
    )}"
    alt="${escapeHTML(product.title || "product")}"
    class="product-cover">

    </span>

    <span class="product-title-cell">
    ${escapeHTML(
      product.title || "Untitled"
    )}
    </span>

    <span>
    GHS ${price}
    </span>

    <span class="product-status status-${escapeHTML(status)}">
    ${escapeHTML(status)}
    </span>

    <span>
    ${sales}
    </span>


    <button type="button" class="product-action"
    data-product-id="${escapeHTML(product.productId)}"
    >
    View
    </button>
    `;
    tableBody.appendChild(row);
  });
}

//=======================
// ESCAPE HTML
//=======================
function escapeHTML(value){

  return String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");
}


//=============================
// INITIALIZE SELLER DASHBOARD
//=============================
document.addEventListener("DOMContentLoaded", ()=> {
  loadCreatorProducts();
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

