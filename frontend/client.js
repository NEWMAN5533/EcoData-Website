// ==========================================
// ECODATA ADMIN — SHARED JAVASCRIPT
// ==========================================


// ==========================================
// ELEMENTS
// ==========================================

const sidebar =
  document.getElementById("clientSidebar");

const sidebarToggle =
  document.getElementById("sidebarToggle");

const sidebarClose =
  document.getElementById("sidebarClose");

const sidebarOverlay =
  document.getElementById("sidebarOverlay");

const profileButton =
  document.getElementById("clientProfileButton");





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
  .querySelectorAll(".client-nav-link")
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
// ACTIVE NAVIGATION
// ==========================================

function setActiveAdminNavigation() {

  const currentPage =
    window.location.pathname
      .split("/")
      .pop()
      .toLowerCase();

  document
    .querySelectorAll(".client-nav-link")
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
