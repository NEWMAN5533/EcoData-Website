// ==========================================
// ECO DATA STORE - WISHLIST
// ==========================================

const WISHLIST_KEY = "ecoStoreWishlist";


// ==========================================
// SAMPLE PRODUCTS
// ==========================================

const sampleWishlist = [

  {
    id: "prod_cv_template",
    title: "Modern Professional CV Template",
    seller: "CreativeHub",
    price: 45,
    rating: 4.9,
    type: "digital",
    category: "Templates",
    icon: "ri-file-text-line",
    addedAt: "2026-09-10"
  },

  {
    id: "prod_social_planner",
    title: "Social Media Content Planner",
    seller: "CreatorStudio",
    price: 35,
    rating: 4.8,
    type: "digital",
    category: "Templates",
    icon: "ri-calendar-check-line",
    addedAt: "2026-09-08"
  },

  {
    id: "prod_backpack",
    title: "Everyday Laptop Backpack",
    seller: "EcoGear Store",
    price: 280,
    rating: 4.7,
    type: "physical",
    category: "Accessories",
    icon: "ri-briefcase-4-line",
    addedAt: "2026-09-05"
  },

  {
    id: "prod_invoice",
    title: "Professional Invoice Template",
    seller: "BusinessTools",
    price: 25,
    rating: 4.6,
    type: "digital",
    category: "Templates",
    icon: "ri-file-list-3-line",
    addedAt: "2026-09-03"
  },

  {
    id: "prod_logo",
    title: "Professional Logo Design",
    seller: "DesignCraft",
    price: 80,
    rating: 4.9,
    type: "service",
    category: "Services",
    icon: "ri-palette-line",
    addedAt: "2026-08-29"
  },

  {
    id: "prod_headphones",
    title: "Wireless Bluetooth Headphones",
    seller: "TechZone",
    price: 650,
    rating: 4.5,
    type: "physical",
    category: "Electronics",
    icon: "ri-headphone-line",
    addedAt: "2026-08-25"
  }

];



// ==========================================
// LOAD WISHLIST
// ==========================================

function loadWishlist() {

  try {

    const saved =
      localStorage.getItem(WISHLIST_KEY);

    if (!saved) {

      localStorage.setItem(
        WISHLIST_KEY,
        JSON.stringify(sampleWishlist)
      );

      return [...sampleWishlist];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch (error) {

    console.error(
      "Unable to load wishlist:",
      error
    );

    return [];

  }

}



// ==========================================
// SAVE WISHLIST
// ==========================================

function saveWishlist() {

  localStorage.setItem(
    WISHLIST_KEY,
    JSON.stringify(wishlist)
  );

}



// ==========================================
// STATE
// ==========================================

let wishlist = loadWishlist();

let currentFilter = "all";

let currentSearch = "";



// ==========================================
// FORMAT MONEY
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
// UPDATE STATS
// ==========================================

function updateStats() {

  const total =
    wishlist.length;

  const available =
    wishlist.filter(
      item => item.available !== false
    ).length;

  const categories =
    new Set(
      wishlist.map(
        item => item.category
      )
    ).size;


  document.getElementById(
    "wishlistTotal"
  ).textContent = total;


  document.getElementById(
    "wishlistAvailable"
  ).textContent = available;


  document.getElementById(
    "wishlistCategories"
  ).textContent = categories;

}



// ==========================================
// FILTER + SEARCH
// ==========================================

function getFilteredWishlist() {

  let result = [...wishlist];


  if (currentFilter !== "all") {

    result =
      result.filter(
        item =>
          item.type === currentFilter
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

        item.category
          .toLowerCase()
          .includes(search)

      );

  }


  return result;

}



// ==========================================
// SORT
// ==========================================

function sortWishlist(items) {

  const sort =
    document.getElementById(
      "wishlistSort"
    ).value;


  switch (sort) {

    case "low":

      return items.sort(
        (a, b) =>
          a.price - b.price
      );


    case "high":

      return items.sort(
        (a, b) =>
          b.price - a.price
      );


    case "rating":

      return items.sort(
        (a, b) =>
          b.rating - a.rating
      );


    case "recent":

    default:

      return items.sort(
        (a, b) =>
          new Date(b.addedAt) -
          new Date(a.addedAt)
      );

  }

}



// ==========================================
// RENDER WISHLIST
// ==========================================

function renderWishlist() {

  const grid =
    document.getElementById(
      "wishlistGrid"
    );

  const empty =
    document.getElementById(
      "wishlistEmpty"
    );


  grid.innerHTML = "";


  let items =
    getFilteredWishlist();

  items =
    sortWishlist(items);


  if (!items.length) {

    grid.hidden = true;
    empty.hidden = false;

    return;

  }


  grid.hidden = false;
  empty.hidden = true;


  items.forEach(item => {

    const card =
      document.createElement("article");

    card.className =
      "wishlist-product";


    card.innerHTML = `

      <div class="wishlist-product-image">

        <i class="${item.icon}"></i>

        <button
          type="button"
          class="wishlist-remove"
          data-id="${item.id}"
          aria-label="Remove from wishlist"
        >
          <i class="ri-heart-fill"></i>
        </button>

      </div>


      <div class="wishlist-product-body">

        <span class="wishlist-product-badge">
          ${item.type}
        </span>


        <h3 class="wishlist-product-title">
          ${item.title}
        </h3>


        <span class="wishlist-product-seller">
          By ${item.seller}
        </span>


        <div class="wishlist-product-bottom">

          <strong class="wishlist-product-price">
            ${money(item.price)}
          </strong>


          <span class="wishlist-product-rating">

            <i class="ri-star-fill"></i>

            ${item.rating}

          </span>

        </div>


        <button
          type="button"
          class="wishlist-add-cart"
          data-cart-id="${item.id}"
        >
          <i class="ri-shopping-cart-line"></i>
          Add to Cart
        </button>

      </div>

    `;


    grid.appendChild(card);

  });

}



// ==========================================
// REMOVE ITEM
// ==========================================

function removeFromWishlist(id) {

  wishlist =
    wishlist.filter(
      item => item.id !== id
    );


  saveWishlist();

  updateStats();

  renderWishlist();

}



// ==========================================
// ADD TO CART
// ==========================================

function addToCart(id) {

  const item =
    wishlist.find(
      product => product.id === id
    );

  if (!item) return;


  const CART_KEY =
    "ecoStoreCart";


  let cart = [];

  try {

    const saved =
      localStorage.getItem(
        CART_KEY
      );

    cart =
      saved
        ? JSON.parse(saved)
        : [];

    if (!Array.isArray(cart)) {
      cart = [];
    }

  } catch {

    cart = [];

  }


  const existing =
    cart.find(
      cartItem =>
        cartItem.id === item.id
    );


  if (existing) {

    existing.quantity =
      (existing.quantity || 1) + 1;

  } else {

    cart.push({

      id: item.id,

      title: item.title,

      seller: item.seller,

      price: item.price,

      type: item.type,

      quantity: 1,

      icon: item.icon

    });

  }


  localStorage.setItem(
    CART_KEY,
    JSON.stringify(cart)
  );


  updateCartCount();

  alert(
    `${item.title} added to your cart.`
  );

}



// ==========================================
// CART COUNT
// ==========================================

function updateCartCount() {

  const countElement =
    document.getElementById(
      "navCartCount"
    );

  if (!countElement) return;


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


    countElement.textContent =
      count;

  } catch {

    countElement.textContent = "0";

  }

}



// ==========================================
// EVENTS
// ==========================================

document.addEventListener(
  "click",
  event => {

    const removeButton =
      event.target.closest(
        ".wishlist-remove"
      );


    if (removeButton) {

      removeFromWishlist(
        removeButton.dataset.id
      );

      return;

    }


    const cartButton =
      event.target.closest(
        ".wishlist-add-cart"
      );


    if (cartButton) {

      addToCart(
        cartButton.dataset.cartId
      );

    }

  }
);



// ==========================================
// SEARCH
// ==========================================

function handleSearch(value) {

  currentSearch =
    value.trim();

  renderWishlist();

}


const topSearch =
  document.getElementById(
    "wishlistSearch"
  );

const inlineSearch =
  document.getElementById(
    "wishlistInlineSearch"
  );


topSearch?.addEventListener(
  "input",
  event => {

    const value =
      event.target.value;

    if (inlineSearch) {
      inlineSearch.value = value;
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
      topSearch.value = value;
    }

    handleSearch(value);

  }
);



// ==========================================
// FILTER
// ==========================================

document
  .getElementById("wishlistFilter")
  ?.addEventListener(
    "change",
    event => {

      currentFilter =
        event.target.value;

      renderWishlist();

    }
  );



// ==========================================
// SORT
// ==========================================

document
  .getElementById("wishlistSort")
  ?.addEventListener(
    "change",
    renderWishlist
  );



// ==========================================
// CLEAR WISHLIST
// ==========================================

document
  .getElementById("clearWishlistBtn")
  ?.addEventListener(
    "click",
    () => {

      if (!wishlist.length) {
        return;
      }


      const confirmed =
        confirm(
          "Clear all saved products from your wishlist?"
        );


      if (!confirmed) return;


      wishlist = [];

      saveWishlist();

      updateStats();

      renderWishlist();

    }
  );



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

renderWishlist();

updateCartCount();