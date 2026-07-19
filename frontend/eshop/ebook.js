
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



// SWIPER JS 
let swiperHome = new Swiper('.home-swiper', {
  loop: true,
  spaceBetween: -24,
  grabCursor: true,
  slidesPerView: 'auto',
  centeredSlides: 'auto',

  autoplay: {
    delay: 3000,
    disableOnInteraction: false,
  },

  breakpoints: {
    1220: {
      spaceBetween: -32,
    }
  }
});



// FEATURED SWIPER
let swiperFeatured = new Swiper('.featured-swiper', {
  loop: true,
  spaceBetween: 16,
  grabCursor: true,
  slidesPerView: 'auto',
  centeredSlides: 'auto',

  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },


  breakpoints: {
    1150: {
      slidesPerView: 3,
      centeredSlides: false,
    }
  }
});


// NEW BOOKS
let swiperNewBook = new Swiper('.new-swiper', {
  loop: true,
  spaceBetween: 16,
  slidesPerView: 'auto',

  breakpoints: {
    1150: {
      slidesPerView: 3,
    }
  }
});


// TESTIMONIAL
let swiperTestimonial = new Swiper('.testimonial-swiper', {
  loop: true,
  spaceBetween: 16,
  grabCursor: true,
  slidesPerView: 'auto',
  centeredSlides: 'auto',

  breakpoints: {
    1150: {
      slidesPerView: 3,
      centeredSlides: false,
    }
  }
});





// SHOW SCROLL UP
const scrollUp = ()=>{
  const scrollUp = document.getElementById("scrollUp")
  // When the scroll is higher than 350 viewport height, add the showup
  this.scrollY >= 350 ? scrollUp.classList.add("show-scroll")
  : scrollUp.classList.remove("show-scroll")
}

window.addEventListener("scroll", scrollUp)

// SCROLL ACTION ACTIVE LINK ========/
const sections = document.querySelectorAll('section[id]')

const scrollActive = () =>{
  const scrollDown = window.scrollY

  sections.forEach(current => {
    const sectionHeight = current.offsetHeight,
    sectionTop = current.offsetTop - 58,
    sectionId = current.getAttribute('id'),

    sectionsClass = document.querySelector(' .nav-menu a[href*=' + sectionId + ']')

    if(scrollDown > sectionTop && scrollDown <= sectionTop + sectionHeight){
      sectionsClass.classList.add("active-link")
    } else{
      sectionsClass.classList.remove('active-link')
    }
  })
}
window.addEventListener('scroll', scrollActive)





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



// SIDEBAR (MOBILE)
const mobileSidebar = document.getElementById("mobileSidebar");
const sidebarOpenButton = document.getElementById("sidebarOpenButton");

sidebarOpenButton.addEventListener("click", function(e) {
  e.stopPropagation();

  if(sidebarOpenButton){
    mobileSidebar.classList.add("active");
    document.body.classList.add("no-scroll");
  } else{
    mobileSidebar.classList.remove("active");
  }
});

// when click outside (menu && sidebar)?
window.addEventListener("click", function(e) {
  if(!mobileSidebar.contains(e.target) && !sidebarOpenButton.contains(e.target)){
    mobileSidebar.classList.remove("active");
  }
})


//=========== SCROLL REVEAL =================//


const sr = scrollReveal({
  origin: "top",
  distance: "60px",
  duration: 2500,
  delay: 400,
 // reset: true, // Animation repeat
})

sr.reveal(`.home-data, .featured-container, .new-container, .join-data, .testimonial-container, .footer`)
sr.reveal(`.home-images`, {delay: 600})
sr.reveal(`.services-card`, {interval: 100})
sr.reveal(`.discount-data`, {origin: "right"})
sr.reveal(`.discount-images`, {origin: "right"})








