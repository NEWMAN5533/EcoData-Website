



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



