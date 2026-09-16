document.addEventListener("DOMContentLoaded",()=> {

  //===================
  // PAGE ROUTING
  //===================
  const profilePageRouting = document.getElementById("mobileProfileImage");

  profilePageRouting.addEventListener("click", (e)=> {
    e.stopPropagation();

    window.location.href = "./homeClientProfile.html";
  });

  //===============
  // Desktop sidebar
  //===============
  const sidebarProfileImage = document.getElementById("sidebarProfileImage");

  sidebarProfileImage.addEventListener("click", (e)=> {
    e.stopPropagation();

    window.location.href = "./homeClientProfile.html";
  });

  //=====================================
  // later will authenticate with creator
  //=====================================
  document.querySelectorAll(".creatorContentAuth").forEach(cra => {
    cra.style.display = "none";
  });

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




//===================
// THUMB REVEAL
//===================


//==================
// ?
//==================
});



//======================
// PRODUCT SKELETON UI
//======================

function hideSkeleton(skeleton) {

  skeleton.classList.add("ts-fade-out");

  setTimeout(() => {
    skeleton.remove();
  }, 300);

}


function initProductSkeletons() {

  const images =
    document.querySelectorAll(".product-image");

  images.forEach(img => {

    const skeleton =
      img.parentElement.querySelector(".tsContainer");

    if (!skeleton) return;


    // Already loaded
    if (img.complete) {

      hideSkeleton(skeleton);

      return;
    }


    // Wait for image
    img.addEventListener("load", () => {

      hideSkeleton(skeleton);

    }, { once: true });


    // If image fails
    img.addEventListener("error", () => {

      hideSkeleton(skeleton);

    }, { once: true });

  });

}


//======================
// DOM READY
//======================

if (document.readyState === "loading") {

  document.addEventListener(
    "DOMContentLoaded",
    initProductSkeletons
  );

} else {

  initProductSkeletons();

}



