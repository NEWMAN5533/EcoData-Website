// ==========================================
// PRODUCT DETAIL PAGE
// ==========================================

const CART_KEY = "ecoStoreCart";
const WISHLIST_KEY = "ecoStoreWishlist";


// ==========================================
// DEMO PRODUCT
// ==========================================

const product = {

  id: "cv-template-001",

  title: "Modern Professional CV Template",

  seller: "CreativeHub",

  price: 45,

  oldPrice: 60,

  rating: 4.9,

  reviews: 24,

  sold: 128,

  category: "Templates",

  type: "digital",

  format: "DOCX",

  size: "4.2 MB",

  icon: "ri-file-text-line",

  shortDescription:
    "A clean, modern and professional CV template designed for job applications and career profiles.",

  description:
    "Create a professional first impression with this modern CV template. The layout is clean, easy to edit and suitable for different professional fields."

};


// ==========================================
// STATE
// ==========================================

let quantity = 1;

let isWishlisted = false;


// ==========================================
// FORMAT MONEY
// ==========================================

function money(amount) {

  return new Intl.NumberFormat(
    "en-GH",
    {
      style: "currency",
      currency: "GHS"
    }
  ).format(amount);

}


// ==========================================
// LOAD CART
// ==========================================

function loadCart() {

  try {

    const saved =
      localStorage.getItem(CART_KEY);

    if (!saved) return [];

    const parsed =
      JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch (error) {

    console.error(
      "Unable to load cart:",
      error
    );

    return [];

  }

}


// ==========================================
// SAVE CART
// ==========================================

function saveCart(cart) {

  localStorage.setItem(
    CART_KEY,
    JSON.stringify(cart)
  );

}


// ==========================================
// LOAD WISHLIST
// ==========================================

function loadWishlist() {

  try {

    const saved =
      localStorage.getItem(
        WISHLIST_KEY
      );

    if (!saved) return [];

    const parsed =
      JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch {

    return [];

  }

}


// ==========================================
// SAVE WISHLIST
// ==========================================

function saveWishlist(wishlist) {

  localStorage.setItem(
    WISHLIST_KEY,
    JSON.stringify(wishlist)
  );

}


// ==========================================
// UPDATE CART COUNT
// ==========================================

function updateCartCount() {

  const element =
    document.getElementById(
      "navCartCount"
    );

  if (!element) return;


  const cart =
    loadCart();


  const count =
    cart.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 1),
      0
    );


  element.textContent =
    count;

}


// ==========================================
// RENDER PRODUCT
// ==========================================

function renderProduct() {

  document.title =
    `${product.title} | EcoData Store`;


  document.getElementById(
    "breadcrumbTitle"
  ).textContent =
    product.title;


  document.getElementById(
    "productCategory"
  ).textContent =
    product.category;


  document.getElementById(
    "productTitle"
  ).textContent =
    product.title;


  document.getElementById(
    "productRating"
  ).textContent =
    product.rating;


  document.getElementById(
    "productReviews"
  ).textContent =
    `(${product.reviews} reviews)`;


  document.getElementById(
    "productSeller"
  ).textContent =
    product.seller;


  document.getElementById(
    "productPrice"
  ).textContent =
    money(product.price);


  document.getElementById(
    "productOldPrice"
  ).textContent =
    money(product.oldPrice);


  const discount =
    Math.round(
      ((product.oldPrice - product.price) /
        product.oldPrice) * 100
    );


  document.getElementById(
    "productDiscount"
  ).textContent =
    `${discount}% OFF`;


  document.getElementById(
    "productShortDescription"
  ).textContent =
    product.shortDescription;


  document.getElementById(
    "productDescription"
  ).textContent =
    product.description;


  document.getElementById(
    "productTypeBadge"
  ).textContent =
    capitalize(product.type);


  document.getElementById(
    "infoType"
  ).textContent =
    capitalize(product.type);


  document.getElementById(
    "infoFormat"
  ).textContent =
    product.format;


  document.getElementById(
    "infoSize"
  ).textContent =
    product.size;


  document.getElementById(
    "infoCategory"
  ).textContent =
    product.category;


  const mainIcon =
    document.getElementById(
      "productMainIcon"
    );


  if (mainIcon) {

    mainIcon.className =
      product.icon;

  }

}


// ==========================================
// CAPITALIZE
// ==========================================

function capitalize(value) {

  if (!value) return "";

  return value
    .charAt(0)
    .toUpperCase() +
    value.slice(1);

}


// ==========================================
// QUANTITY
// ==========================================

function updateQuantity() {

  const element =
    document.getElementById(
      "productQuantity"
    );

  if (element) {

    element.textContent =
      quantity;

  }

}


function increaseQuantity() {

  if (quantity >= 99) return;

  quantity++;

  updateQuantity();

}


function decreaseQuantity() {

  if (quantity <= 1) return;

  quantity--;

  updateQuantity();

}


// ==========================================
// ADD TO CART
// ==========================================

function addToCart() {

  let cart =
    loadCart();


  const existing =
    cart.find(
      item =>
        item.id === product.id
    );


  if (existing) {

    existing.quantity =
      Number(existing.quantity || 1) +
      quantity;

  } else {

    cart.push({

      id: product.id,

      title: product.title,

      seller: product.seller,

      price: product.price,

      type: product.type,

      quantity: quantity,

      icon: product.icon

    });

  }


  saveCart(cart);

  updateCartCount();


  showProductMessage(
    `${product.title} added to your cart.`
  );

}


// ==========================================
// BUY NOW
// ==========================================

function buyNow() {

  let cart =
    loadCart();


  const existing =
    cart.find(
      item =>
        item.id === product.id
    );


  if (existing) {

    existing.quantity =
      Number(existing.quantity || 1) +
      quantity;

  } else {

    cart.push({

      id: product.id,

      title: product.title,

      seller: product.seller,

      price: product.price,

      type: product.type,

      quantity: quantity,

      icon: product.icon

    });

  }


  saveCart(cart);

  updateCartCount();


  window.location.href =
    "cart.html";

}


// ==========================================
// WISHLIST
// ==========================================

function checkWishlistState() {

  const wishlist =
    loadWishlist();


  isWishlisted =
    wishlist.some(
      item =>
        item.id === product.id
    );


  updateWishlistUI();

}


function updateWishlistUI() {

  const button =
    document.getElementById(
      "wishlistBtn"
    );


  if (!button) return;


  const icon =
    button.querySelector("i");


  if (isWishlisted) {

    button.classList.add("active");

    button.setAttribute(
      "aria-label",
      "Remove from wishlist"
    );

    icon.className =
      "ri-heart-fill";

  } else {

    button.classList.remove("active");

    button.setAttribute(
      "aria-label",
      "Add to wishlist"
    );

    icon.className =
      "ri-heart-line";

  }

}


function toggleWishlist() {

  let wishlist =
    loadWishlist();


  const index =
    wishlist.findIndex(
      item =>
        item.id === product.id
    );


  if (index !== -1) {

    wishlist.splice(index, 1);

    isWishlisted = false;

    showProductMessage(
      "Removed from wishlist."
    );

  } else {

    wishlist.push({

      id: product.id,

      title: product.title,

      seller: product.seller,

      price: product.price,

      type: product.type,

      icon: product.icon,

      addedAt:
        new Date().toISOString()

    });


    isWishlisted = true;

    showProductMessage(
      "Added to wishlist."
    );

  }


  saveWishlist(wishlist);

  updateWishlistUI();

}


// ==========================================
// PRODUCT TABS
// ==========================================

function setupProductTabs() {

  const tabs =
    document.querySelectorAll(
      ".product-tab"
    );


  const contents = {

    description:
      document.getElementById(
        "descriptionTab"
      ),

    information:
      document.getElementById(
        "informationTab"
      ),

    reviews:
      document.getElementById(
        "reviewsTab"
      )

  };


  tabs.forEach(tab => {

    tab.addEventListener(
      "click",
      () => {

        const selected =
          tab.dataset.tab;


        tabs.forEach(item =>
          item.classList.remove(
            "active"
          )
        );


        tab.classList.add(
          "active"
        );


        Object.values(contents)
          .forEach(content => {

            content?.classList.remove(
              "active"
            );

          });


        contents[selected]
          ?.classList.add(
            "active"
          );

      }
    );

  });

}


// ==========================================
// RELATED PRODUCTS
// ==========================================

const relatedProducts = [

  {
    id: "social-planner",
    title: "Social Media Content Planner",
    price: 35,
    icon: "ri-calendar-check-line"
  },

  {
    id: "invoice-template",
    title: "Professional Invoice Template",
    price: 25,
    icon: "ri-file-list-3-line"
  },

  {
    id: "business-guide",
    title: "Small Business Starter Guide",
    price: 40,
    icon: "ri-book-open-line"
  },

  {
    id: "proposal-template",
    title: "Business Proposal Template",
    price: 30,
    icon: "ri-file-text-line"
  }

];


function renderRelatedProducts() {

  const container =
    document.getElementById(
      "relatedProducts"
    );


  if (!container) return;


  container.innerHTML =
    relatedProducts.map(item => `

      <article
        class="related-product"
        data-product-id="${item.id}"
      >

        <div class="related-product-image">

          <i class="${item.icon}"></i>

        </div>


        <div class="related-product-info">

          <h3 title="${item.title}">
            ${item.title}
          </h3>

          <span>
            Digital Product
          </span>

          <strong class="related-product-price">
            ${money(item.price)}
          </strong>

        </div>

      </article>

    `).join("");

}


// ==========================================
// IMAGE MODAL
// ==========================================

function openImageModal() {

  const modal =
    document.getElementById(
      "imageModal"
    );


  if (!modal) return;


  modal.hidden = false;

}


function closeImageModal() {

  const modal =
    document.getElementById(
      "imageModal"
    );


  if (!modal) return;


  modal.hidden = true;

}


// ==========================================
// THUMBNAILS
// ==========================================

function setupThumbnails() {

  const thumbnails =
    document.querySelectorAll(
      ".product-thumb"
    );


  thumbnails.forEach(thumb => {

    thumb.addEventListener(
      "click",
      () => {

        thumbnails.forEach(item =>
          item.classList.remove(
            "active"
          )
        );


        thumb.classList.add(
          "active"
        );

      }
    );

  });

}


// ==========================================
// MESSAGE
// ==========================================

function showProductMessage(message) {

  let snackbar =
    document.getElementById(
      "productSnackbar"
    );


  if (!snackbar) {

    snackbar =
      document.createElement(
        "div"
      );


    snackbar.id =
      "productSnackbar";


    snackbar.style.cssText = `
      position: fixed;
      left: 50%;
      bottom: 24px;
      z-index: 9999;

      transform: translate(-50%, 20px);
      opacity: 0;

      padding: 11px 15px;

      border-radius: 9px;

      background: #222;
      color: #fff;

      font-size: 11px;
      font-weight: 500;

      box-shadow:
        0 8px 25px rgba(0,0,0,.15);

      transition:
        opacity .2s ease,
        transform .2s ease;
    `;


    document.body.appendChild(
      snackbar
    );

  }


  snackbar.textContent =
    message;


  requestAnimationFrame(() => {

    snackbar.style.opacity =
      "1";

    snackbar.style.transform =
      "translate(-50%, 0)";

  });


  clearTimeout(
    snackbar._timer
  );


  snackbar._timer =
    setTimeout(() => {

      snackbar.style.opacity =
        "0";

      snackbar.style.transform =
        "translate(-50%, 20px)";

    }, 2500);

}


// ==========================================
// INITIALIZE
// ==========================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    renderProduct();

    updateCartCount();

    checkWishlistState();

    renderRelatedProducts();

    setupProductTabs();

    setupThumbnails();


    // Quantity
    document
      .getElementById("increaseQty")
      ?.addEventListener(
        "click",
        increaseQuantity
      );


    document
      .getElementById("decreaseQty")
      ?.addEventListener(
        "click",
        decreaseQuantity
      );


    // Cart
    document
      .getElementById("addToCartBtn")
      ?.addEventListener(
        "click",
        addToCart
      );


    // Buy now
    document
      .getElementById("buyNowBtn")
      ?.addEventListener(
        "click",
        buyNow
      );


    // Wishlist
    document
      .getElementById("wishlistBtn")
      ?.addEventListener(
        "click",
        toggleWishlist
      );


    // Image modal
    document
      .getElementById("expandImageBtn")
      ?.addEventListener(
        "click",
        openImageModal
      );


    document
      .getElementById("closeImageModal")
      ?.addEventListener(
        "click",
        closeImageModal
      );


    document
      .getElementById("imageModal")
      ?.addEventListener(
        "click",
        event => {

          if (
            event.target.id ===
            "imageModal"
          ) {

            closeImageModal();

          }

        }
      );

  }
);