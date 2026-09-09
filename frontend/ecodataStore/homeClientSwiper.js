document.addEventListener("DOMContentLoaded", ()=> {
  


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
  allowTouchMove: true,
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
 
});




// TRENDING SWIPER

let swiperHome = new Swiper('.trending-swiper', {
  loop: true,
  spaceBetween: 12,
  grabCursor: true,
  slidesPerView: 4,
  centeredSlides: 'auto',
  speed: 5000,

  autoplay: {
    delay: 0,
    disableOnInteraction: false,
    pauseOnMouseEnter: false,
  },
  allowTouchMove: false,
  breakpoints: {
    320:{
      slidesPerView: 1,
      spaceBetween: 12,
    },
    360:{
      slidesPerView: 2,
      spaceBetween: 12,
    },
    375:{
      slidesPerView: 2,
      spaceBetween: 12,
    },
    640: {
      spaceBetween: 32,
    },
    768: {
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
    320: {
      slidesPerView: 1,
      spaceBetween: 12,
    },
    360: {
      slidesPerView: 2,
      spaceBetween: 12,
    },
    375: {
      slidesPerView: 2,
      spaceBetween: 12,
    },
    560: {
      slidesPerView: 2.2,
      spaceBetween: 20
    },
    900: {
      slidesPerView: 3.2, 
      spaceBetween: 24
    },
    1200: {
      slidesPerView: 4, 
      spaceBetween: 24
    },
  },
});

})