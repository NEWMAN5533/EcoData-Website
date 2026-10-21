const SELLER_API_BASE = "https://ecodata-app.onrender.com";
const SELLER_PROFILE_API = `${SELLER_API_BASE}/api/seller/profile`;

const uploadForm1 = document.getElementById("uploadProductForm");
const uploadButton = document.getElementById("uploadProduct");
const approvalNotice = document.getElementById("sellerApprovalNotice");
const approvalTitle = document.getElementById("sellerApprovalTitle");
const approvalMessage = document.getElementById("sellerApprovalMessage");

let sellerCanPublish = false;

async function checkSellerPublishingPermission() {
  try {
    const clerk = window.Clerk;

    if (!clerk) {
      throw new Error(
        "Authentication is still loading. Please refresh the page and try again."
      );
    }

    if (typeof clerk.load === "function") {
      await clerk.load();
    }

    if (!clerk.session) {
      throw new Error("Please sign in to access product uploads.");
    }

    const token = await clerk.session.getToken();

    if (!token) {
      throw new Error("Unable to verify your sign-in session.");
    }

    const response = await fetch(SELLER_PROFILE_API, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      },
      credentials: "include"
    });

    const result = await response.json();

    if (!response.ok || !result.success || !result.seller) {
      if (result.code === "SELLER_PROFILE_NOT_FOUND") {
        throw new Error(
          "Please complete your seller registration before uploading products."
        );
      }

      throw new Error(
        result.message || "Unable to verify your seller profile."
      );
    }

    const seller = result.seller;

    // Submission access is separate from publishing permission.
    const sellerCanSubmit =
      seller.status !== "suspended";

    // Publishing permission is still tracked separately.
    sellerCanPublish =
      seller.status === "approved" &&
      seller.canPublish === true;

    if (approvalNotice) {
      approvalNotice.hidden = sellerCanSubmit && sellerCanPublish;
    }

    if (approvalTitle && !sellerCanPublish) {
      approvalTitle.textContent =
        seller.status === "suspended"
          ? "Seller account suspended"
          : "Publishing access pending";
    }

    if (approvalMessage && !sellerCanPublish) {
      approvalMessage.textContent =
        seller.status === "suspended"
          ? "Your seller account is suspended. Contact support for assistance."
          : "You can submit products for review while your seller account is pending. Your products will not be published until the required approval is granted.";
    }

    if (uploadForm1) {
      uploadForm1.classList.toggle(
        "is-access-blocked",
        !sellerCanSubmit
      );

      uploadForm1.querySelectorAll(
        "input, textarea, select, button"
      ).forEach(control => {
        control.disabled = !sellerCanSubmit;
      });
    }

    return sellerCanSubmit;

  } catch (error) {
    sellerCanPublish = false;

    if (approvalNotice) {
      approvalNotice.hidden = false;
    }

    if (approvalTitle) {
      approvalTitle.textContent =
        "Unable to verify seller access";
    }

    if (approvalMessage) {
      approvalMessage.textContent =
        error.message ||
        "Please sign in again and reload this page.";
    }

    if (uploadForm1) {
      uploadForm1.classList.add("is-access-blocked");

      uploadForm1.querySelectorAll(
        "input, textarea, select, button"
      ).forEach(control => {
        control.disabled = true;
      });
    }

    console.error(
      "Seller submission permission check failed:",
      error
    );

    return false;
  }
}

checkSellerPublishingPermission();
























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
document.querySelectorAll(".productTypeCard").forEach(item => {
  item.addEventListener("click", () => {
    const value = item.dataset.type;

    if (!value || !typeInput) return;

    // Save the selected backend product type.
    typeInput.value = value;

    // Show the correct product fields.
    updateProductField(value);

    // Highlight the selected card.
    document.querySelectorAll(".productTypeCard").forEach(card => {
      card.classList.toggle("active", card === item);
    });

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
    const categoryText = document.getElementById("productCategoryText");

    if(categoryText){
      categoryText.textContent = text;
    }

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
    type === "templates" ||
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


//====================
// PHYSICAL / SERVICE
//====================
if (type === "service") {
  if (productFile) {
    productFile.required = false;
    productFile.value = "";
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
updateProductField(typeInput?.value || "");

//=======================
// CREATOR PRODUCT UPLOAD
//=======================
const uploadForm = 
document.getElementById("uploadProductForm");

if(uploadForm){
  uploadForm.addEventListener("submit", async(event) => {
    event.preventDefault();

    if (!sellerCanPublish) {
  showSnackBar(
    "Your seller account is not approved to publish products.",
    "error"
  );
  return;
}

if (uploadButton) {
  uploadButton.disabled = true;
}

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

   
        // Map selected category slug to Neon category ID.
    const categoryIdMap = {
      education: "1",
      technology: "2",
      programming: "3",
      engineering: "4",
      services: "5",
      other: "6"
    };

    const categoryId = categoryIdMap[
      String(category).trim().toLowerCase()
    ];

    if (!categoryId) {
      showSnackBar("Invalid product category.");
      return;
    }

    formData.append("categoryId", categoryId);

    formData.append(
      "productType",
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



    //==================
    // SEND
    //==================
   try {

 const clerk = window.Clerk;

if (!clerk || !clerk.session) {
  throw new Error("Please sign in before uploading a product.");
}

const token = await clerk.session.getToken();

if (!token) {
  throw new Error("Unable to verify your sign-in session. Please sign in again.");
}

const response = await fetch(
  `${SELLER_API_BASE}/api/seller/products`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
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



  const productCategoryInput = document.getElementById("productCategory");

  if(productCategoryInput){
    productCategoryInput.value = "";
  }

// Reset product type selection.
const productTypeInput = document.getElementById("productType");

if (productTypeInput) {
  productTypeInput.value = "";
}

document.querySelectorAll(".productTypeCard").forEach(card => {
  card.classList.remove("active");
});

updateProductField("");

 
  const categoryText  = document.getElementById("productCategoryText");

  if(categoryText){
    categoryText.textContent = "Product Category";
  }

 

} catch (error) {

  console.error("Upload error:", error);

  showSnackBar(
    error.message ||
    "Unable to upload product.",
    "error"
  );

} finally{
  if (uploadButton) {
    uploadButton.disabled = false;
  }
}
  } 
);
}



