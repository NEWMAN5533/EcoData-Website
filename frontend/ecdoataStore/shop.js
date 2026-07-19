



//============ TOGGLE SIDEBAR =====//
document.addEventListener("DOMContentLoaded", ()=> {
const sidebarToggler = document.getElementById("menuIcon");
const mobileSidebar = document.getElementById("mobileSidebar");

// add event listener
sidebarToggler.addEventListener("click", function(e){
  e.stopPropagation();
  if(sidebarToggler){
    mobileSidebar.classList.add("active");
    document.body.classList.add("no-scroll");
  } else{
    mobileSidebar.classList.remove("active");
    document.body.classList.remove("no-scroll");
  }
});

window.addEventListener("click", function(e) {
  if(!mobileSidebar.classList.contains(e.target) && !sidebarToggler.contains(e.target)){
    mobileSidebar.classList.remove("active");
  }
})
});


// HORIZONTAL CARD SWIPER JS 
let swiperHome = new Swiper('.horizontal-card', {
  loop: true,
  spaceBetween: 12,
  grabCursor: true,
  slidesPerView: 'auto',
  centeredSlides: 'auto',
  speed: 5000,

  autoplay: {
    delay: 0,
    disableOnInteraction: false,
    pauseOnMouseEnter: false,
  },
  allowTouchMove: false,
  freeMode: true,
  loopAdditionalSlides: 5,

  breakpoints: {
    640: {
      spaceBetween: 32,
    }
  }
});

// TOP SELL SWIPER 
let topSwiper = new Swiper('.top-sell', {
  loop: true,
  spaceBetween: 32,
  grabCursor: true,
  slidesPerView: 'auto',
  centeredSlides: 'auto',
  speed: 8000,

  autoplay: {
    delay: 0,
    disableOnInteraction: false,
    pauseOnMouseEnter: false,
  },
  allowTouchMove: false,
  freeMode: true,
  loopAdditionalSlides: 3,


   breakpoints: {
    640: {
      spaceBetween: 32,
    }
  }
});

// FEATURED SELLERS
const sellersSwiper = new Swiper('.sellers-swiper', {
  slidesPerView: 1.15,
  spaceBetween: 10,
  grabCursor: true,
  navigation: {
    nextEl: '.seller-next',
    prevEl: '.seller-prev',
  },
  breakpoints: {
    560: {slidesPerView: 2.2, spaceBetween: 20},
    900: {slidesPerView: 3.2, spaceBetween: 24},
    1200: {slidesPerView: 4, spaceBetween: 24},
  },
});


// HERO SWIPER
let heroSwiper = new Swiper('.hero-swiper', {
  slidesPerView: 1,
  spaceBetween: 0,
  loop: true,
  speed: 700,
  effect: 'slide',
  autoplay: {
    delay: 5000,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
  },
  allowTouchMove: false,
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
 navigation: {
  nextEl: "hero-next",
  prevEl: "hero-prev",
 },
});



// TRENDING TABS 
 document.querySelectorAll('.trending-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.trending-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      document.querySelectorAll('.trending-grid').forEach(panel => panel.hidden = true);
      document.getElementById(`panel-${tab.dataset.tab}`).hidden = false;
    });
  });



// DARK THEME

const themeButton = document.getElementById('theme-button')
const darkTheme = 'dark-theme'
const iconTheme = 'ri-sun-line'

const selectedTheme = localStorage.getItem('selected-theme')
const selectedIcon = localStorage.getItem('selected-icon')



const getCurrentTheme = () => document.body.classList.contains(darkTheme) ? 'dark' : 'light'
const getCurrentIcon = () => themeButton.classList.contains(iconTheme) ? 'ri-moon-line' : 'ri-sun-line'


// We validate if the user previously chose a topic
if(selectedTheme){
  // If the validations is fulfilled, we ask the issue was to know if we activated or deactivated
  document.body.classList[selectedTheme === 'dark' ? 'add' : 'remove'](darkTheme)
  themeButton.classList[selectedIcon === 'ri-moon-line' ? 'add' : 'remove'](iconTheme) 
}

// Active / deactivated the theme manually with the button
themeButton.addEventListener("click", ()=> {
  // Add or remove the dark / icon theme
  document.body.classList.toggle(darkTheme)
  themeButton.classList.toggle(iconTheme)
  // We save theme and the current icon the user chose
  localStorage.setItem('selected-theme', getCurrentTheme())
  localStorage.setItem('selected-icon', getCurrentIcon())
})







//==============SEARCH ============//
const searchButton = document.getElementById("search-button");
const searchClose = document.getElementById("search-close");
const searchContent = document.getElementById("search-content");

if(searchButton){
  searchButton.addEventListener("click", ()=> {
    searchContent.classList.add("show-search");
  })
}

if(searchClose){
  searchClose.addEventListener("click", ()=> {
    searchContent.classList.remove("show-search");
  })
}


//============ LOGIN ============//
const loginButton = document.getElementById("login-button");
const loginClose = document.getElementById("login-close");
const loginContent = document.getElementById("login-content");

if(loginButton){
  loginButton.addEventListener("click", ()=> {
    loginContent.classList.add("show-login");
  })
}

if(loginClose){
  loginClose.addEventListener("click", ()=> {
    loginContent.classList.remove("show-login");
  })
}

// ADD SHADOW HEADER
const shadowHeader = ()=>{
  const header = document.getElementById("header")
  // when the scroll is greater than 50 viewport height, add the shadow
  this.scrollY >= 50 ? header.classList.add("shadow-header")
  : header.classList.remove("shadow-header")

}
window.addEventListener("scroll", shadowHeader)


