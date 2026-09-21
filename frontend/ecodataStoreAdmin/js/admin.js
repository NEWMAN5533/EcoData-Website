// ==========================================
// ECODATA ADMIN — SHARED JAVASCRIPT
// ==========================================


// ==========================================
// ELEMENTS
// ==========================================

const sidebar =
  document.getElementById("adminSidebar");

const sidebarToggle =
  document.getElementById("sidebarToggle");

const sidebarClose =
  document.getElementById("sidebarClose");

const sidebarOverlay =
  document.getElementById("sidebarOverlay");

const profileButton =
  document.getElementById("adminProfileButton");

const profileMenu =
  document.getElementById("adminProfileMenu");

const logoutButton =
  document.getElementById("adminLogoutButton");

const adminSearch =
  document.getElementById("adminSearch");


// ==========================================
// SIDEBAR
// ==========================================

function openSidebar() {

  if (!sidebar) return;

  sidebar.classList.add("open");

  sidebarOverlay?.classList.add("show");

  document.body.style.overflow = "hidden";
}


function closeSidebar() {

  if (!sidebar) return;

  sidebar.classList.remove("open");

  sidebarOverlay?.classList.remove("show");

  document.body.style.overflow = "";
}


sidebarToggle?.addEventListener(
  "click",
  openSidebar
);


sidebarClose?.addEventListener(
  "click",
  closeSidebar
);


sidebarOverlay?.addEventListener(
  "click",
  closeSidebar
);


window.addEventListener("click", (e)=> {
  if(!sidebar.contains(e.target)  &&!sidebarToggle.contains(e.target)){
    closeSidebar();
  }
})

// ==========================================
// CLOSE SIDEBAR WHEN LINK IS CLICKED
// ON MOBILE
// ==========================================

document
  .querySelectorAll(".admin-nav-link")
  .forEach(link => {

    link.addEventListener("click", () => {

      if (
        window.innerWidth <= 900
      ) {

        closeSidebar();

      }

    });

  });


// ==========================================
// PROFILE MENU
// ==========================================

profileButton?.addEventListener(
  "click",
  event => {

    event.stopPropagation();

    profileMenu?.classList.toggle("show");

  }
);


document.addEventListener(
  "click",
  event => {

    if (
      profileMenu &&
      !profileMenu.contains(event.target) &&
      !profileButton?.contains(event.target)
    ) {

      profileMenu.classList.remove("show");

    }

  }
);


// ==========================================
// ESCAPE KEY
// ==========================================

document.addEventListener(
  "keydown",
  event => {

    if (event.key !== "Escape") return;

    closeSidebar();

    profileMenu?.classList.remove("show");

  }
);


// ==========================================
// SEARCH SHORTCUT
// ==========================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "/" &&
      !["INPUT", "TEXTAREA", "SELECT"]
        .includes(document.activeElement?.tagName)
    ) {

      event.preventDefault();

      adminSearch?.focus();

    }

  }
);


// ==========================================
// SEARCH
// ==========================================

adminSearch?.addEventListener(
  "keydown",
  event => {

    if (event.key !== "Enter") return;

    const query =
      adminSearch.value.trim();

    if (!query) return;

    console.log(
      "Admin search:",
      query
    );

    /*
      Later this will become a global
      admin search across:

      Users
      Sellers
      Products
      Orders
      Services
      Payments
    */

  }
);


// ==========================================
// LOGOUT
// ==========================================

logoutButton?.addEventListener(
  "click",
  () => {

    const confirmed =
      confirm(
        "Are you sure you want to sign out?"
      );

    if (!confirmed) return;

    /*
      Firebase logout will be connected here.

      Example later:

      await signOut(auth);

      window.location.href =
        "login.html";
    */

    console.log(
      "Admin logout requested"
    );

  }
);


// ==========================================
// ACTIVE NAVIGATION
// ==========================================

function setActiveAdminNavigation() {

  const currentPage =
    window.location.pathname
      .split("/")
      .pop()
      .toLowerCase();

  document
    .querySelectorAll(".admin-nav-link")
    .forEach(link => {

      const href =
        link
          .getAttribute("href")
          ?.split("/")
          .pop()
          ?.toLowerCase();

      link.classList.toggle(
        "active",
        href === currentPage
      );

    });

}


setActiveAdminNavigation();


// ==========================================
// DARK MODE
// ==========================================

const ADMIN_THEME_KEY =
  "ecoAdminDarkMode";


function applyAdminTheme() {

  const darkMode =
    localStorage.getItem(
      ADMIN_THEME_KEY
    ) === "true";

  document.body.classList.toggle(
    "dark-mode",
    darkMode
  );

}


applyAdminTheme();


// ==========================================
// GLOBAL ADMIN HELPERS
// ==========================================

window.EcoAdmin = {

  setDarkMode(enabled) {

    localStorage.setItem(
      ADMIN_THEME_KEY,
      String(enabled)
    );

    document.body.classList.toggle(
      "dark-mode",
      enabled
    );

  },


  getDarkMode() {

    return (
      localStorage.getItem(
        ADMIN_THEME_KEY
      ) === "true"
    );

  },


  formatMoney(amount) {

    return new Intl.NumberFormat(
      "en-GH",
      {
        style: "currency",
        currency: "GHS",
        maximumFractionDigits: 2
      }
    ).format(
      Number(amount) || 0
    );

  },


  formatNumber(number) {

    return new Intl.NumberFormat(
      "en-GH"
    ).format(
      Number(number) || 0
    );

  },


  showMessage(message) {

    console.log(
      "[EcoData Admin]",
      message
    );

  }

};





//=========================
// UNIVERSAL PAGINATION
//=========================

function renderPagination({
  container,
  itemsPerPage,
  infoElement,
  currentPage,
  totalItems,
  onPageChange
}) {

  // =========================
  // CHECK CONTAINER
  // =========================

  if (!container) {
    console.warn(
      "Pagination container was not found."
    );

    return;
  }


  // =========================
  // CALCULATE TOTAL PAGES
  // =========================

  const totalPages =
    Math.ceil(
      totalItems / itemsPerPage
    );


  // =========================
  // ONLY ONE PAGE / NO RESULTS
  // =========================

  if (totalPages <= 1) {

    if (infoElement) {

      if (totalItems === 0) {

        infoElement.textContent =
          "Showing 0 of 0";

      } else {

        infoElement.textContent =
          `Showing 1–${Math.min(
            itemsPerPage,
            totalItems
          )} of ${totalItems}`;

      }

    }

    container.innerHTML = "";

    return;
  }


  // =========================
  // CALCULATE SHOWING RANGE
  // =========================

  const start =
    (currentPage - 1) *
    itemsPerPage + 1;

  const end =
    Math.min(
      currentPage * itemsPerPage,
      totalItems
    );


  // =========================
  // UPDATE PAGINATION INFO
  // =========================

  if (infoElement) {

    infoElement.textContent =
      `Showing ${start}–${end} of ${totalItems}`;

  }


  // =========================
  // CREATE PAGE LIST
  // =========================

  const pages = [];


  // Always show first page

  pages.push(1);


  // =========================
  // PAGES AROUND CURRENT PAGE
  // =========================

  const startPage =
    Math.max(
      2,
      currentPage - 1
    );


  const endPage =
    Math.min(
      totalPages - 1,
      currentPage + 1
    );


  // =========================
  // ELLIPSIS BEFORE
  // =========================

  if (startPage > 2) {

    pages.push("...");

  }


  // =========================
  // MIDDLE PAGES
  // =========================

  for (
    let page = startPage;
    page <= endPage;
    page++
  ) {

    pages.push(page);

  }


  // =========================
  // ELLIPSIS AFTER
  // =========================

  if (
    endPage <
    totalPages - 1
  ) {

    pages.push("...");

  }


  // =========================
  // ALWAYS SHOW LAST PAGE
  // =========================

  if (totalPages > 1) {

    pages.push(totalPages);

  }


  // =========================
  // BUILD HTML
  // =========================

  let html = "";


  // =========================
  // PREVIOUS BUTTON
  // =========================

  html += `
    <button
      id="previousPage"
      class="pagination-nav"
      aria-label="Previous page"
      data-page="${currentPage - 1}"
      ${currentPage === 1 ? "disabled" : ""}
    >
      <i class="ri-arrow-left-s-line"></i>
    </button>
  `;


  // =========================
  // PAGE NUMBERS
  // =========================

  pages.forEach(page => {

    // Ellipsis

    if (page === "...") {

      html += `
        <span class="pagination-ellipsis">
          ...
        </span>
      `;

      return;
    }


    // Page button

    html += `
      <button
        type="button"
        class="pagination-number ${
          page === currentPage
            ? "active"
            : ""
        }"
        data-page="${page}"
      >
        ${page}
      </button>
    `;

  });


  // =========================
  // NEXT BUTTON
  // =========================

  html += `
    <button
      id="nextPage"
      class="pagination-nav"
      aria-label="Next page"
      data-page="${currentPage + 1}"
      ${
        currentPage === totalPages
          ? "disabled"
          : ""
      }
    >
      <i class="ri-arrow-right-s-line"></i>
    </button>
  `;


  // =========================
  // INSERT HTML
  // =========================

  container.innerHTML =
    html;


  // =========================
  // PAGE BUTTON EVENTS
  // =========================

  container
    .querySelectorAll(
      "[data-page]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const page =
            Number(
              button.dataset.page
            );


          if (
            page < 1 ||
            page > totalPages
          ) {
            return;
          }


          onPageChange(page);

        }
      );

    });

}





const pageBottomNavigationBar = document.getElementById("navIconDiv");


//=====================================
// Hide bottom NavigationBar on scroll
//=====================================

let lastScrollY = window.scrollY;
let scrollTicking = false;

const SCROLL_THRESHOLD = 8;

function handleBottomNavScroll(){
  const currentScrollY = window.scrollY;

  // Always show at the top of the page
  if(currentScrollY <= 10 ){
    pageBottomNavigationBar.classList.remove("nav-hidden");
    lastScrollY = currentScrollY;
    return;
  }




  const difference = currentScrollY - lastScrollY;

  // Ignore very small movement
  if(Math.abs(difference) < SCROLL_THRESHOLD) {
    return;
  }

  // Scrolling Down
  if(difference > 0){
    pageBottomNavigationBar.classList.add("nav-hidden");
  } else {
    // Scroll up
    pageBottomNavigationBar.classList.remove("nav-hidden");
  }

  lastScrollY = currentScrollY;
}

window.addEventListener("scroll", ()=> {
  if(!scrollTicking){
    window.requestAnimationFrame(()=> {
      handleBottomNavScroll();
      scrollTicking = false;
    });

    scrollTicking = true;
  }
}, { passive: true}
);







// =========================================================
// UNIVERSAL MANAGEMENT ACTION MENUS
// =========================================================

document.addEventListener("click", (event) => {

  const actionButton =
    event.target.closest(
      ".management-action-button"
    );


  // -----------------------------------------
  // OPEN / CLOSE MENU
  // -----------------------------------------

  if (actionButton) {

    event.stopPropagation();

    const wrapper =
      actionButton.closest(
        ".management-action"
      );

    if (!wrapper) return;


    // Close every other menu
    document
      .querySelectorAll(
        ".management-action-menu.show"
      )
      .forEach(menu => {

        if (
          !wrapper.contains(menu)
        ) {
          menu.classList.remove("show");
        }

      });


    const menu =
      wrapper.querySelector(
        ".management-action-menu"
      );

    if (menu) {

      menu.classList.toggle(
        "show"
      );

    }

    return;
  }


  // -----------------------------------------
  // CLOSE WHEN CLICKING OUTSIDE
  // -----------------------------------------

  if (
    !event.target.closest(
      ".management-action"
    )
  ) {

    document
      .querySelectorAll(
        ".management-action-menu.show"
      )
      .forEach(menu => {

        menu.classList.remove(
          "show"
        );

      });

  }

});