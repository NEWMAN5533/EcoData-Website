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