/* =========================================
   ECO DATA STORE CART
========================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {


    /* =======================================
       STORAGE
    ======================================== */

    const CART_KEY =
      "ecoStoreCart";


    /* =======================================
       ELEMENTS
    ======================================== */

    const cartItems =
      document.getElementById(
        "cartItems"
      );

    const cartEmpty =
      document.getElementById(
        "cartEmpty"
      );

    const cartItemLabel =
      document.getElementById(
        "cartItemLabel"
      );

    const navCartCount =
      document.getElementById(
        "navCartCount"
      );

    const cartSubtotal =
      document.getElementById(
        "cartSubtotal"
      );

    const cartDelivery =
      document.getElementById(
        "cartDelivery"
      );

    const cartDiscount =
      document.getElementById(
        "cartDiscount"
      );

    const discountRow =
      document.getElementById(
        "discountRow"
      );

    const cartTotal =
      document.getElementById(
        "cartTotal"
      );

    const clearCartBtn =
      document.getElementById(
        "clearCartBtn"
      );

    const checkoutBtn =
      document.getElementById(
        "checkoutBtn"
      );

    const promoCode =
      document.getElementById(
        "promoCode"
      );

    const applyPromoBtn =
      document.getElementById(
        "applyPromoBtn"
      );

    const promoMessage =
      document.getElementById(
        "promoMessage"
      );


    /* =======================================
       SAMPLE CART
    ======================================== */

    const sampleCart = [

      {
        id: "prod-cv-template",

        name:
          "Modern Professional CV Template",

        seller:
          "CreativeHub",

        price:
          45,

        quantity:
          1,

        type:
          "Digital",

        icon:
          "ri-file-text-line",

        image:
          ""

      },


      {
        id: "prod-backpack",

        name:
          "Everyday Laptop Backpack",

        seller:
          "EcoGear Store",

        price:
          280,

        quantity:
          1,

        type:
          "Physical",

        icon:
          "ri-briefcase-4-line",

        image:
          ""

      },


      {
        id: "prod-planner",

        name:
          "Social Media Content Planner",

        seller:
          "CreatorStudio",

        price:
          35,

        quantity:
          2,

        type:
          "Digital",

        icon:
          "ri-calendar-check-line",

        image:
          ""

      }

    ];


    /* =======================================
       LOAD CART
    ======================================== */

    function loadCart() {

      try {

        const saved =
          localStorage.getItem(
            CART_KEY
          );


        if (saved) {

          const parsed =
            JSON.parse(saved);


          if (
            Array.isArray(parsed)
          ) {

            return parsed;

          }

        }

      } catch (error) {

        console.warn(
          "Unable to load cart.",
          error
        );

      }


      /*
       * First visit:
       * use sample products.
       *
       * Once the user changes the cart,
       * the updated cart is saved.
       */

      localStorage.setItem(
        CART_KEY,
        JSON.stringify(sampleCart)
      );


      return [...sampleCart];

    }


    let cart =
      loadCart();


    let activeDiscount =
      0;


    /* =======================================
       SAVE CART
    ======================================== */

    function saveCart() {

      localStorage.setItem(
        CART_KEY,
        JSON.stringify(cart)
      );

    }


    /* =======================================
       CURRENCY
    ======================================== */

    function money(value) {

      return new Intl.NumberFormat(
        "en-GH",
        {
          style: "currency",
          currency: "GHS",
          minimumFractionDigits: 2
        }
      ).format(value);

    }


    /* =======================================
       TOTAL ITEM COUNT
    ======================================== */

    function getItemCount() {

      return cart.reduce(
        (total, item) =>
          total + item.quantity,
        0
      );

    }


    /* =======================================
       SUBTOTAL
    ======================================== */

    function getSubtotal() {

      return cart.reduce(
        (total, item) => {

          return total +
            (item.price *
             item.quantity);

        },
        0
      );

    }


    /* =======================================
       DELIVERY
    ======================================== */

    function getDeliveryFee() {

      if (!cart.length) {
        return 0;
      }


      /*
       * Digital-only orders:
       * no delivery fee.
       */

      const hasPhysicalProduct =
        cart.some(
          item =>
            item.type === "Physical"
        );


      return hasPhysicalProduct
        ? 25
        : 0;

    }


    /* =======================================
       UPDATE SUMMARY
    ======================================== */

    function updateSummary() {

      const itemCount =
        getItemCount();


      const subtotal =
        getSubtotal();


      const delivery =
        getDeliveryFee();


      const discount =
        Math.min(
          activeDiscount,
          subtotal
        );


      const total =
        subtotal +
        delivery -
        discount;


      cartItemLabel.textContent =
        `${itemCount} ${
          itemCount === 1
            ? "item"
            : "items"
        }`;


      navCartCount.textContent =
        itemCount;


      cartSubtotal.textContent =
        money(subtotal);


      cartDelivery.textContent =
        delivery === 0
          ? "Free"
          : money(delivery);


      cartDiscount.textContent =
        `-${money(discount)}`;


      cartTotal.textContent =
        money(total);


      discountRow.hidden =
        discount <= 0;


      checkoutBtn.disabled =
        cart.length === 0;

    }


    /* =======================================
       RENDER CART
    ======================================== */

    function renderCart() {

      cartItems.innerHTML = "";


      if (!cart.length) {

        cartItems.hidden =
          true;

        cartEmpty.hidden =
          false;

        clearCartBtn.hidden =
          true;

        updateSummary();

        return;

      }


      cartItems.hidden =
        false;

      cartEmpty.hidden =
        true;

      clearCartBtn.hidden =
        false;


      cart.forEach(item => {

        const row =
          document.createElement(
            "div"
          );


        row.className =
          "cart-item";


        const imageHTML =
          item.image

            ? `
              <img
                src="${item.image}"
                alt="${item.name}"
              >
            `

            : `
              <i class="${item.icon}"></i>
            `;


        row.innerHTML = `

          <div class="cart-item-image">
            ${imageHTML}
          </div>


          <div class="cart-item-info">

            <h3>
              ${item.name}
            </h3>


            <span class="cart-item-seller">

              Seller:
              ${item.seller}

            </span>


            <span class="cart-item-type">

              ${item.type}

            </span>


            <strong class="cart-item-price">

              ${money(item.price)}

            </strong>


            <button
              type="button"
              class="cart-save-later"
              data-action="save"
              data-id="${item.id}"
            >

              Save for later

            </button>

          </div>


          <div class="cart-item-actions">


            <div class="cart-quantity">

              <button
                type="button"
                data-action="decrease"
                data-id="${item.id}"
                aria-label="Decrease quantity"
              >

                <i class="ri-subtract-line"></i>

              </button>


              <span>
                ${item.quantity}
              </span>


              <button
                type="button"
                data-action="increase"
                data-id="${item.id}"
                aria-label="Increase quantity"
              >

                <i class="ri-add-line"></i>

              </button>

            </div>


            <strong class="cart-item-total">

              ${money(
                item.price *
                item.quantity
              )}

            </strong>


            <button
              type="button"
              class="cart-remove"
              data-action="remove"
              data-id="${item.id}"
              aria-label="Remove item"
            >

              <i class="ri-delete-bin-line"></i>

            </button>

          </div>

        `;


        cartItems.appendChild(row);

      });


      updateSummary();

    }


    /* =======================================
       CART ACTIONS
    ======================================== */

    cartItems.addEventListener(
      "click",
      event => {

        const button =
          event.target.closest(
            "[data-action]"
          );


        if (!button) return;


        const action =
          button.dataset.action;


        const id =
          button.dataset.id;


        const item =
          cart.find(
            product =>
              product.id === id
          );


        if (!item) return;


        /* INCREASE */

        if (
          action === "increase"
        ) {

          item.quantity++;

        }


        /* DECREASE */

        if (
          action === "decrease"
        ) {

          item.quantity--;


          if (
            item.quantity <= 0
          ) {

            cart =
              cart.filter(
                product =>
                  product.id !== id
              );

          }

        }


        /* REMOVE */

        if (
          action === "remove"
        ) {

          cart =
            cart.filter(
              product =>
                product.id !== id
            );

        }


        /* SAVE FOR LATER */

        if (
          action === "save"
        ) {

          alert(
            `"${item.name}" saved for later.`
          );

          return;

        }


        saveCart();

        renderCart();

      }
    );


    /* =======================================
       CLEAR CART
    ======================================== */

    clearCartBtn.addEventListener(
      "click",
      () => {

        if (!cart.length) {
          return;
        }


        const confirmed =
          confirm(
            "Are you sure you want to clear your cart?"
          );


        if (!confirmed) {
          return;
        }


        cart = [];

        activeDiscount = 0;

        saveCart();

        renderCart();

      }
    );


    /* =======================================
       PROMO CODE
    ======================================== */

    applyPromoBtn.addEventListener(
      "click",
      () => {

        const code =
          promoCode.value
            .trim()
            .toUpperCase();


        promoMessage.className = "";


        if (!code) {

          promoMessage.textContent =
            "Enter a promo code.";

          promoMessage.classList.add(
            "error"
          );

          return;

        }


        /*
         * Demo promo code.
         *
         * Backend validation will be
         * added later.
         */

        if (
          code === "WELCOME10"
        ) {

          const subtotal =
            getSubtotal();


          activeDiscount =
            subtotal * 0.10;


          promoMessage.textContent =
            "Promo code applied — 10% off.";

          promoMessage.classList.add(
            "success"
          );


          updateSummary();

          return;

        }


        activeDiscount = 0;


        promoMessage.textContent =
          "Invalid or expired promo code.";

        promoMessage.classList.add(
          "error"
        );


        updateSummary();

      }
    );


    /* =======================================
       CHECKOUT
    ======================================== */

    checkoutBtn.addEventListener(
      "click",
      async () => {

        if (!cart.length) {
          return;
        }


        checkoutBtn.disabled =
          true;


        checkoutBtn.innerHTML = `
          <i class="ri-loader-4-line ri-spin"></i>
          Preparing Checkout...
        `;


        await new Promise(
          resolve =>
            setTimeout(resolve, 700)
        );


        /*
         * Later:
         *
         * 1. Send cart to backend.
         * 2. Validate product prices.
         * 3. Create order.
         * 4. Initialize payment.
         * 5. Redirect/open payment.
         */


        alert(
          "Checkout is ready for connection to the payment system."
        );


        checkoutBtn.disabled =
          false;


        checkoutBtn.innerHTML = `
          <i class="ri-lock-2-line"></i>
          Proceed to Checkout
        `;

      }
    );


    /* =======================================
       INITIALIZE
    ======================================== */

    renderCart();

  }
);