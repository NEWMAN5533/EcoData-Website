
// GIVEAWAY TIMER 
const GIVEAWAY_TIMER_START = new Date("2026-09-01T23:59:59");
const GIVEAWAY_TIMER_ENDS = new Date("2026-09-30T23:59:59");

// CUSTOM CURSOR JS
  document.addEventListener("DOMContentLoaded", () => {

  
const shoppingBtn = document.getElementById("shoppingBtn");

shoppingBtn.addEventListener("click", (e) =>{
  e.stopPropagation();
if(shoppingBtn){
  window.location.href = '#';
  showSnackBar(" ✅ Coming up soon for sellers and buyers. You can Buy Data bundle, and register AFA. Thank You", "success", 5000);
}
});






// GIVE AWAY JS
const giveawayDays = 
document.getElementById("giveawayDays");

const giveawayHours =
document.getElementById("giveawayHours");

const giveawayMinutes = 
document.getElementById("giveawayMinutes");

const giveawaySeconds =
document.getElementById("giveawaySeconds");

const giveawayStatus =
document.getElementById("giveawayStatus");


function updateGiveawayCountdown(){

  const now = new Date();

  const remaining =
 GIVEAWAY_TIMER_ENDS - now;

  if(remaining <= 0){
  
    giveawayDays.textContent = "00";
    giveawayHours.textContent = "00";
    giveawayMinutes.textContent = "00";


    giveawayStatus.textContent = 
    "GIVEAWAY ENDED";

    clearInterval(giveawayTimer);

    return;
  }

  const days = 
  Math.floor(
    remaining / (1000 * 60 * 60 * 24)
  );

  const hours =
  Math.floor(
    (remaining % (1000 * 60 * 60 * 24)
  ) / ( 1000 * 60 * 60)
);

 const minutes =
 Math.floor(
  (remaining % (1000 * 60 * 60)) / (1000 * 60)
 );






 
 giveawayDays.textContent = 
 String(days).padStart(2, "0");

  giveawayHours.textContent = 
 String(hours).padStart(2, "0");

  giveawayMinutes.textContent = 
 String(minutes).padStart(2, "0");


}



updateGiveawayCountdown();

const giveawayTimer =
setInterval(updateGiveawayCountdown, 1000);















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



 // SHARE BTN
 const shareBtn = document.getElementById("shareBtn");

 shareBtn.addEventListener('click', async () =>
{
  const shareData = {
    title: "EcoData",
    text: "Check out Ecodata Website, the smartest, digital and trusted data bundle purchase website y'll love to use.",
    url: window.location.href
  };

  // Native share
  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      console.log("Share Cancelled");
    }
  }
 
  // FallBack (Desktop)
  else {
    navigator.clipboard.writeText(shareData.url).then(() => {
      showSnackBar("Link copied! ");
  });
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


// whatsApp sending message btn
 // === CONFIG ===
  const whatsappNumber = "233535565637";

  // === ELEMENTS ===
  const chatButton = document.getElementById("chatButton");
  const chatBox = document.getElementById("chatBox");
  const sendBtn = document.getElementById("sendMsgBtn");

  // === TOGGLE CHAT BOX ===
  chatButton.addEventListener("click", () => {
    chatBox.classList.toggle("show");
  });

  // === SEND MESSAGE ===
  sendBtn.addEventListener("click", () => {
    const message = document.getElementById("whatsappMessage").value.trim();
    if (!message) {
      showSnackBar("Please type your message before sending.");
      return;
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappURL =` https://wa.me/${233535565637}?text=${encodedMessage}`;
    window.open(whatsappURL, "_blank");
    document.getElementById("whatsappMessage").value = ""; // clear after sending
});

// window click event (chatBox)
window.addEventListener("click", function(e){
  e.stopPropagation();
  if(!chatBox.contains(e.target) && !chatButton.contains(e.target)){
    chatBox.style.display = "none";
  } else{
    chatBox.style.display = "flex";
  }
});






