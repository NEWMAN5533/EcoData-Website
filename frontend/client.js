document.addEventListener("DOMContentLoaded", ()=> {
  // ==========================================
// ECODATA ADMIN — SHARED JAVASCRIPT
// ==========================================


// ==========================================
// ELEMENTS
// ==========================================

const sidebar =
  document.getElementById("appSidebar");

const sidebarToggle =
  document.getElementById("appSidebarToggle");

const sidebarClose =
  document.getElementById("sidebarClose");

const sidebarOverlay =
  document.getElementById("sidebarOverlay");







// ==========================================
// SIDEBAR
// ==========================================

function openSidebar() {

  if (!sidebar) return;

  sidebar.style.left = "0";

  sidebarOverlay?.classList.add("show");

  document.body.style.overflow = "hidden";
}


function closeSidebar() {

  if (!sidebar) return;

  sidebar.style.left = "-500px";

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





});