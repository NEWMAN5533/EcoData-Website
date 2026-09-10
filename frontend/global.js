
// GIVEAWAY TIMER 
const GIVEAWAY_TIMER_START = new Date("2026-09-01T23:59:59");
const GIVEAWAY_TIMER_ENDS = new Date("2026-09-30T23:59:59");


// CUSTOM CURSOR JS
  document.addEventListener("DOMContentLoaded", () => {

  //======================
  // ORDER STATUS CHECKER
  //=======================


  const panelSwitch = document.getElementById("panelSwitch");
  const panelContainer = document.getElementById("sidePanel");
  const statusCheckerBtn = document.getElementById("checkOrderStat");

function openPanel(){
  panelContainer.style.right = ".5rem";
  
  panelSwitch.style.right = "-200px";
}

function closePanel(){
  panelContainer.style.right = "-200px";

  panelSwitch.style.right = "-3.8rem";
}

// Switch
panelSwitch.addEventListener("click", (event) => {
  event.stopPropagation();

  if(panelContainer.style.right === ".5rem"){
    closePanel();
  } else{
    openPanel();
  }
});


// keep clicks inside the panel from closing
panelContainer.addEventListener("click", (event)=> {
  event.stopPropagation();
});

// window clicking outside check
window.addEventListener("click", (event) => {
  // ignore clicks on the switch
  if(panelSwitch.contains(event.target)){
    return;
  }

  // ignore clicks on panelContainer
  if(panelContainer.contains(event.target)){
    return;
  }


  closePanel();
})


//===========================
// CHECK MODAL
//===========================
const statusCheckModal = document.getElementById("statusCheckModal");
const closeStatusCheckModal = document.getElementById("closeStatusCheckModal");

const webMenuIcon = document.getElementById("sidebarViewer");





// isOpen function
function isStatusModalOpen(){

 
  webMenuIcon.style.display = "none";
 
}

// add close function
function statusModalClose(){
 statusCheckModal.style.top = "-200%";
 webMenuIcon.style.display = "flex";

}



// add eventlistener
closeStatusCheckModal.addEventListener("click", ()=> {
 statusModalClose();
})



//===========================
// CHECK MODAL ENDS
//===========================

function openCheckModal() {
  statusCheckModal.style.top = "3.4rem";
}


function checkMe(){
    statusCheckerBtn.addEventListener("click", (e)=> {
      e.stopPropagation();

      if(statusCheckModal.style.display === "flex"){
        statusModalClose();
      } else{
        openCheckModal();
      }

      isStatusModalOpen();
  })
  
}

checkMe();


  //===========================
  // ORDER STATUS CHECKER ENDS
  //===========================



    // total orders
    const totalCustomersOrders = document.getElementById("stat-num");
    if(totalCustomersOrders){
      totalCustomersOrders.textContent = 
      "1.41K+";
    }

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


 //===================================
  // STATE MANAGEMENT (PAGE ROUTING)
  //==================================



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