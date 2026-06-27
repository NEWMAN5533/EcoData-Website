// CUSTOM CURSOR JS
  document.addEventListener("DOMContentLoaded", () => {

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


    
  const shoppingBtn = document.getElementById("shoppingBtn");

shoppingBtn.addEventListener("click", (e) =>{
  e.stopPropagation();
if(shoppingBtn){
  showSnackBar("Coming up soon!", "error");
}
});






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







