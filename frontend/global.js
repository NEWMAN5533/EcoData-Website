/* =========================================================
   ECODATA MAIN PAGE JAVASCRIPT
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =======================================================
     ELEMENT HELPERS
     ======================================================= */

  const $ = (id) => document.getElementById(id);


  /* =======================================================
     1. WHATSAPP CHAT BOX
     ======================================================= */

  const whatsappNumber = "233535565637";

  const chatButton = $("chatButton");
  const chatBox = $("chatBox");
  const sendMsgBtn = $("sendMsgBtn");
  const whatsappMessage = $("whatsppMessage");


  // -------------------------------
  // Open ChatBox
  // -------------------------------

  if (chatButton && chatBox) {

    chatButton.addEventListener("click", (event) => {

      event.stopPropagation();

      chatBox.style.display = "flex";

      // Optional: focus message box
      if (whatsappMessage) {
        setTimeout(() => {
          whatsappMessage.focus();
        }, 100);
      }

    });

  }


  // -------------------------------
  // Send WhatsApp Message
  // -------------------------------

  if (sendMsgBtn && whatsappMessage) {

    sendMsgBtn.addEventListener("click", () => {

      const message = whatsappMessage.value.trim();

      if (!message) {

        showSnackBar(
          "Please type your message before sending.",
          "warning"
        );

        whatsappMessage.focus();

        return;
      }


      const encodedMessage = encodeURIComponent(message);

      const whatsappURL =
        `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;


      window.open(whatsappURL, "_blank");


      // Clear message
      whatsappMessage.value = "";

    });

  }


  // -------------------------------
  // Close ChatBox When Clicking Outside
  // -------------------------------

  if (chatBox && chatButton) {

    document.addEventListener("click", (event) => {

      const clickedInsideChat =
        chatBox.contains(event.target);

      const clickedChatButton =
        chatButton.contains(event.target);


      if (!clickedInsideChat && !clickedChatButton) {

        chatBox.style.display = "none";

      }

    });

  }


  // -------------------------------
  // Prevent ChatBox Clicks From Closing It
  // -------------------------------

  if (chatBox) {

    chatBox.addEventListener("click", (event) => {

      event.stopPropagation();

    });

  }


  /* =======================================================
     2. SHOPPING BUTTON
     ======================================================= */

  const shoppingBtn = $("shoppingBtn");


  if (shoppingBtn) {

    shoppingBtn.addEventListener("click", (event) => {

      event.preventDefault();

      showSnackBar(
        "✅ Coming up soon for sellers and buyers. You can buy data bundles and register AFA. Thank you.",
        "success",
        5000
      );

    });

  }


  /* =======================================================
     3. DASHBOARD / STATISTICS
     ======================================================= */

  const totalCustomersOrders = $("stat-num");


  if (totalCustomersOrders) {

    totalCustomersOrders.textContent = "1.48K+";

  }


  // Safe text updater
  window.setDashboardText = function (id, value) {

    const element = $(id);

    if (element) {

      element.textContent = value;

    }

  };


  /* =======================================================
     4. SYSTEM UPGRADE MODAL
     ======================================================= */

  const systemUpgradeModal = $("upgradeModal");


  if (systemUpgradeModal) {

    systemUpgradeModal.style.display = "none";

  }


  /* =======================================================
     5. BOTTOM NAVIGATION
        Hide when scrolling down
        Show when scrolling up
     ======================================================= */

  const pageBottomNavigationBar = $("navIconDiv");
  const mainContainer = $("scrollContainer");


  if (
    pageBottomNavigationBar &&
    mainContainer
  ) {

    let lastScrollY = mainContainer.scrollTop;

    let scrollTicking = false;

    const SCROLL_THRESHOLD = 8;


    function handleBottomNavScroll() {

      const currentScrollY =
        mainContainer.scrollTop;


      // Always show navigation at the top
      if (currentScrollY <= 10) {

        pageBottomNavigationBar.style.bottom = "0";

        lastScrollY = currentScrollY;

        return;

      }


      const difference =
        currentScrollY - lastScrollY;


      // Ignore tiny movements
      if (
        Math.abs(difference) <
        SCROLL_THRESHOLD
      ) {

        return;

      }


      // Scrolling DOWN
      if (difference > 0) {

        pageBottomNavigationBar.style.bottom =
          "-200px";

      }

      // Scrolling UP
      else {

        pageBottomNavigationBar.style.bottom =
          "0";

      }


      lastScrollY = currentScrollY;

    }


    mainContainer.addEventListener(
      "scroll",
      () => {

        if (scrollTicking) return;


        requestAnimationFrame(() => {

          handleBottomNavScroll();

          scrollTicking = false;

        });


        scrollTicking = true;

      },
      { passive: true }
    );

  }


  /* =======================================================
     6. CUSTOM CURSOR
     ======================================================= */

  const cursor = $("cursor");
  const cursorRing = $("cursorRing");


  if (cursor && cursorRing) {

    let mouseX = 0;
    let mouseY = 0;

    let ringX = 0;
    let ringY = 0;


    document.addEventListener(
      "mousemove",
      (event) => {

        mouseX = event.clientX;
        mouseY = event.clientY;


        cursor.style.left =
          `${mouseX}px`;

        cursor.style.top =
          `${mouseY}px`;

      }
    );


    function animateCursorRing() {

      ringX +=
        (mouseX - ringX) * 0.12;

      ringY +=
        (mouseY - ringY) * 0.12;


      cursorRing.style.left =
        `${ringX}px`;

      cursorRing.style.top =
        `${ringY}px`;


      requestAnimationFrame(
        animateCursorRing
      );

    }


    animateCursorRing();

  }

});



/* =========================================================
   7. SNACKBAR SYSTEM
   ========================================================= */

let snackTimeout = null;


function showSnackBar(
  message,
  type = "info",
  duration = 4000
) {

  let snackbar =
    document.querySelector(".snackbar");


  // ---------------------------------
  // Create Snackbar
  // ---------------------------------

  if (!snackbar) {

    snackbar =
      document.createElement("div");

    snackbar.className =
      "snackbar";


    snackbar.innerHTML = `
      <span class="snackbar-text"></span>
      <div class="snackbar-progress"></div>
    `;


    document.body.appendChild(
      snackbar
    );

  }


  // ---------------------------------
  // Update Message
  // ---------------------------------

  const snackbarText =
    snackbar.querySelector(
      ".snackbar-text"
    );


  if (snackbarText) {

    snackbarText.textContent =
      message;

  }


  // ---------------------------------
  // Snackbar Type
  // ---------------------------------

  switch (type) {

    case "success":

      snackbar.style.background =
        "rgba(7, 29, 26, 0.95)";

      break;


    case "error":

      snackbar.style.background =
        "#88353f";

      break;


    case "warning":

      snackbar.style.background =
        "#413b2a";

      break;


    default:

      snackbar.style.background =
        "rgba(7, 29, 26, 0.95)";

  }


  // ---------------------------------
  // Progress Animation
  // ---------------------------------

  const progress =
    snackbar.querySelector(
      ".snackbar-progress"
    );


  if (progress) {

    progress.style.animation = "none";

    // Force browser reflow
    void progress.offsetWidth;

    progress.style.animation =
      `snackbar-progress ${duration}ms linear forwards`;

  }


  // ---------------------------------
  // Show Snackbar
  // ---------------------------------

  snackbar.classList.add("show");


  // ---------------------------------
  // Clear Previous Timeout
  // ---------------------------------

  if (snackTimeout) {

    clearTimeout(
      snackTimeout
    );

  }


  // ---------------------------------
  // Hide Snackbar
  // ---------------------------------

  snackTimeout =
    setTimeout(() => {

      snackbar.classList.remove(
        "show"
      );

    }, duration);

}
