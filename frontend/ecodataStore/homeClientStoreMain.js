document.addEventListener("DOMContentLoaded",()=> {

//==================
// SIDEBAR TOGGLE
//==================
const mobileSidebar = document.getElementById("mobileSidebar");
const mobileSidebarToggler = document.getElementById("menuIcon");
const secondToggler = document.getElementById("mobileSidebarClose");
const pageNavigationBar = document.getElementById("header");

const pageBottomNavigationBar = document.getElementById("navIconDiv");

function isSidebarOpen(){
  mobileSidebar.style.left = "0";
}

function closeMobileSidebar(){
  mobileSidebar.style.left = "-500px";
}

// Add eventListener
mobileSidebarToggler.addEventListener("click", (e)=> {
  e.stopPropagation();

  isSidebarOpen();
});

// to the second
secondToggler.addEventListener("click", (e)=> {
    e.stopPropagation();
    closeMobileSidebar();
  });


// Window e.target
window.addEventListener("click", (e)=> {
  if(!mobileSidebar.contains(e.target) && !mobileSidebarToggler.contains(e.target)){
    // call close sidebar function
    closeMobileSidebar();
  }
});


//====================
// SEARCH BUTTON OFF
//====================
const searchForm = document.querySelector(".desktop-search");

const searchIcon = document.getElementById("searchIcon");

searchIcon.addEventListener("click", function(e) {
  if(searchIcon){
    searchForm.style.display = "flex";
  }

});

//============================
// Add box-shadow on navbar
// when scrolling downward
//============================

function setNavigationBarShadow(){
  pageNavigationBar.style.boxShadow = "0 2px 6px rgba(0,0,0,0.09)";
}

function unSetNavigationBarShadow(){
  pageNavigationBar.style.boxShadow = "none";
}

unSetNavigationBarShadow();

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

  if(currentScrollY >= 10 ){
    setNavigationBarShadow();
  } else{
    unSetNavigationBarShadow();
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



//======================
// ?
//======================
});


