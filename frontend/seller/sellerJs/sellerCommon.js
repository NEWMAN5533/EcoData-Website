//====================================
// CREATOR CONFIG
//====================================

 const SELLER_ID = "TES_SELLER";

// Later:
// export const SELLER_ID = auth.currentUser.uid;

 const API_BASE =
  "https://ecodata-app.onrender.com";

 const CREATOR_PRODUCTS_API =
  `${API_BASE}/api/creator/products`;


sellerSidebar();


//=======================
// SIDEBAR TOGGLE
//=======================

 function sellerSidebar(){

const sidebarMenu = document.querySelector(".sidebarPhone");
const sidebarToggler = document.getElementById("menu");

// Add event listener
sidebarToggler.addEventListener("click", function(e) {
  e.stopPropagation();

  if(sidebarToggler){
    sidebarMenu.style.left = "0";
  }

});

// Window click
window.addEventListener("click", function(e){
  if(!sidebarMenu.contains(e.target) && !sidebarToggler.contains(e.target)){
    sidebarMenu.style.left = "-500px";
  }
});


}



  // SNACKBAR SECTION //
   // ===== SNACKBAR FUNCTION ===== //
  let snackTimeout = null;

  function showSnackBar(message, type = "info", duration = 4000) {
  let snackbar = document.querySelector(".snackbar");

  // Create snackbar if it doesn't exist
  if (!snackbar) {
    snackbar = document.createElement("div");
    snackbar.className = "snackbar";

    snackbar.innerHTML = `
      <span class="snackbar-text"></span>
      <div class="snackbar-progress"></div>
    `;

    document.body.appendChild(snackbar);
  }

  // Update text
  snackbar.querySelector(".snackbar-text").textContent = message;

  // Color by type
  if (type === "success") snackbar.style.background = "rgba(7, 29, 26, 0.95)";
  else if (type === "error") snackbar.style.background = "#88353f";
  else if (type === "warning") snackbar.style.background = "#413b2a";
  else snackbar.style.background = "rgba(7, 29, 26, 0.95)";

  // Reset progress animation
  const progress = snackbar.querySelector(".snackbar-progress");
  progress.style.animation = "none";
  void progress.offsetWidth;
  progress.style.animation = `snackbar-progress ${duration}ms linear forwards`;

  snackbar.classList.add("show");

  // Clear previous timeout
  if (snackTimeout) clearTimeout(snackTimeout);

  snackTimeout = setTimeout(() => {
    snackbar.classList.remove("show");
  }, duration);
}
// snackbar ends
