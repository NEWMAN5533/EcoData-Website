



// CUSTOM CURSOR JS
  document.addEventListener("DOMContentLoaded", () => {


  //===================================
  // STATE MANAGEMENT (PAGE ROUTING)
  //===================================
const shoppingBtn = document.getElementById("shoppingBtn");

shoppingBtn.addEventListener("click", (e) =>{
  e.stopPropagation();
if(shoppingBtn){
  window.location.href = './ecodataStore/homeClient.html';

 // showSnackBar(" ✅ Coming up soon for sellers and buyers. You can Buy Data bundle, and register AFA. Thank You", "success", 5000);
  
}
});


    // total orders
    const totalCustomersOrders = document.getElementById("stat-num");
    if(totalCustomersOrders){
      totalCustomersOrders.textContent = 
      "1.45K+";
    }



 //===================================
  // STATE MANAGEMENT (PAGE ROUTING)
  //==================================













    // Custom cursor
  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('cursorRing');
  let cx = 0, cy = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    cx = e.clientX; cy = e.clientY;
    cursor.style.left = cx + 'px';
    cursor.style.top = cy + 'px';
  });

  function animateRing() {
    rx += (cx - rx) * 0.12;
    ry += (cy - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();





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









 
 });
// CUSTOM CURSOR JS ENDS




// SIDEBAR TOGGLE

// sidebar toggle script
document.addEventListener("DOMContentLoaded", ()=> {
 const cardToggler = document.getElementById("sidebarViewer");
const cardCloser = document.getElementById("ecoDataSidebar");


  // toggle menu card
  cardToggler.addEventListener("click", function(e) {
    e.stopPropagation();
    if(cardToggler){
      cardCloser.classList.add("active" );
      document.body.classList.add("no-scroll");
    } else{
      cardCloser.classList.remove("active");
    }
  });

 

  // when ever clicked outside?
  window.addEventListener("click", function(e) {
    if(!cardCloser.contains(e.target) && !cardToggler.contains(e.target)) {
      cardCloser.classList.remove("active");
    }
  })

  
})











document.addEventListener('DOMContentLoaded', ()=> {

const pageBottomNavigationBar = document.getElementById("navIconDiv");
const mainContainer = document.getElementById("scrollContainer");

const onlyShowBtomNavSection = document.getElementById("onlyShowBtomNavSection");



//=========================
// SECTION OVERRIDE
//=========================





//=====================================
// Hide bottom NavigationBar on scroll
//=====================================

let lastScrollY = mainContainer.scrollTop;
let scrollTicking = false;

const SCROLL_THRESHOLD = 8;

function handleBottomNavScroll(){
  const currentScrollY = mainContainer.scrollTop;

  // Always show at the top of the page
  if(currentScrollY <= 10 ){

    pageBottomNavigationBar.style.transform = "translateY(0)";
    pageBottomNavigationBar.style.opacity = "1";
    lastScrollY = currentScrollY;
    return;
  }

  // Section currently controls the nav


  const difference = currentScrollY - lastScrollY;

  // Ignore very small movement
  if(Math.abs(difference) < SCROLL_THRESHOLD) {
    return;
  }

  // Scrolling Down
  if(difference > 0){
    pageBottomNavigationBar.style.transform = "translateY(110%)";
    pageBottomNavigationBar.style.opacity = "0";
  } else {
    // Scroll up
    pageBottomNavigationBar.style.transform = "translateY(0)";
    pageBottomNavigationBar.style.opacity = "1";
  }

  lastScrollY = currentScrollY;
}

mainContainer.addEventListener("scroll", ()=> {
  if(!scrollTicking){

    requestAnimationFrame(()=> {
      handleBottomNavScroll();
      scrollTicking = false;
    });

    scrollTicking = true;
  }
}, { passive: true}
);






  })