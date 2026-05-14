// MENU ICON TOGGLE (SIDEBAR)
document.addEventListener("DOMContentLoaded", ()=> {
 const cardToggler = document.getElementById("cardToggler");
 const secondToggler = document.getElementById("menuDarkMode");
const cardCloser = document.getElementById("ecoDataSidebar");

  // toggle menu card
  cardToggler.addEventListener("click", function(e) {
    e.stopPropagation();
    if(cardCloser.classList.contains("active")){
      cardCloser.classList.remove("active");
    } else{
      cardCloser.classList.add("active");
    }
  });

  // secondToggler
  secondToggler.addEventListener("click", function(e) {
    e.stopPropagation();

    if(secondToggler) {
      cardCloser.classList.add("active");
    } else {
      cardCloser.classList.remove("active");
    }
  })

  // when ever clicked outside?
  window.addEventListener("click", function(e) {
    if(!cardCloser.contains(e.target) && !cardToggler.contains(e.target)) {
      cardCloser.classList.remove("active");
    }
  })
})

 // MENU ICON TOGGLE (SIDEBAR) ENDS




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

  const hoverTargets = document.querySelectorAll('a, button, .book-card, .category-card, .scroll-card');
  hoverTargets.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('hovered');
      ring.classList.add('hovered');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('hovered');
      ring.classList.remove('hovered');
    });
  });

  // Drag scroll
  const track = document.getElementById('scrollTrack');
  let isDown = false, startX, scrollLeft;
  track.addEventListener('mousedown', e => {
    isDown = true;
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
  });
  track.addEventListener('mouseleave', () => { isDown = false; });
  track.addEventListener('mouseup', () => { isDown = false; });
  track.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    track.scrollLeft = scrollLeft - (x - startX) * 1.5;
  });

  // Scroll fade-in
  document.querySelectorAll('.book-card, .category-card, .scroll-card').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity 0.6s ease ${i * 0.08}s, transform 0.6s ease ${i * 0.08}s`;
    new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 }).observe(el);
  });

  // CUSTOM CURSOR ENDS
