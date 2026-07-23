


// PROMO SCRIPT 

  document.addEventListener("DOMContentLoaded", () => {
  let promoWasInactive = true;

  function isPromoTime() {
    const day = new Date().getDay();



    return (day === 4 );
    
  }

  function getPromoEndTime() {
    const now = new Date();
    const day = now.getDay();
    let end = new Date(now);

    if(day === 4 ) {
      end.setDate(now.getDate());
      end.setHours(23, 59, 59, 999);

    } else {
      return null;
    }
    return end.getTime();
  }

 
  function getBarDate() {
  const bar = document.getElementById("promoBar");
  const ctaBtn = document.getElementById("ctaBtn");
  const labelEl = document.getElementById("label");

    const showNow = new Date();
    const showDay = showNow.getDay();
    let showEnd = new Date(showNow);

    if(showDay === 3){
      showEnd.setDate(showNow.getDate());
      showEnd.setHours(23, 50, 59, 999);

      bar.style.display = 'flex';
      ctaBtn.innerHTML = 'Coming Up!'
      labelEl.innerHTML = `OFFER TIMING. <img src="./css/icons/timer.png" >`



      ctaBtn.addEventListener("click", function(){
        if(ctaBtn){
          ctaBtn.scrollIntoView({behavior: 'smooth', block: 'center'});
          showSnackBar("Promo will be Activating Exactly 12AM THURSDAY!", "success",4000);

        }
      })
    } else{
      bar.style.display = 'none';
    }

    return showEnd.getTime();
  }

  getBarDate();

  function updateTimer() {
    const bar = document.getElementById("promoBar");
    const badge = document.getElementById("liveBadge");
    const timerEl = document.getElementById("timer");
    const labelEl = document.getElementById("label");
    const ctaBtn = document.getElementById("ctaBtn");
    const promoThumbnail = document.getElementById("promThumbnail");

  const dataSection = document.getElementById("normalView");


    // const of promoDiv toggle
  const promoActiveDiv = document.getElementById("promoActive");
  const promoEndedDiv = document.getElementById("topOpt");
  const untargetExpressDiv = document.getElementById("bottomOpt");
  const mashupDiv = document.getElementById("mash");
  const gridMashup = document.getElementById("mashGridDiv");

  const gridPromoActiveDiv = document.getElementById("gridPromoActive");
  const gridNormalSection = document.getElementById("gridNormalDiv");
  const gridExpressSection = document.getElementById("gridExpressDiv");

  // TIMER SPAN DIVS
  const hrs = document.getElementById("hrs");
  const mts = document.getElementById("mts");
  const sec = document.getElementById("sec");

  // TERIF MODAL DIVS
  const gp3Time1 = document.getElementById("hrs-gp3");
  const gp3Time2 = document.getElementById("mins-gp3");
  const gp3Time3 = document.getElementById("secs-gp3");

  // TERIF GET BUTTON 
  const terifModal = document.getElementById("terifModal");
  const getBundleBtn = document.getElementById("getBundle");

 

    if(!isPromoTime()) {

      //timerEl.innerHTML = "00:00:00";

    hrs.innerHTML = "00";
    mts.innerHTML = "00";
    sec.innerHTML = "00";

     
      promoActiveDiv.style.display = "none";
      gridPromoActiveDiv.style.display = "none";
      promoThumbnail.style.display = "none";
     
     

    
     
      promoWasInactive = true;
      return;
    } else{
      // While promo is active 
      promoActiveDiv.style.display = "block";
      gridPromoActiveDiv.style.display = "block";
      promoThumbnail.style.display = "flex";
    }

  

    // IsPromoTime() function
    if(isPromoTime()){
      promoActiveDiv.style.display = "block";
      bar.style.display = 'flex';
      promoThumbnail.style.display = "none";
      promoEndedDiv.style.display = "none";
      untargetExpressDiv.style.display = "none";
      mashupDiv.style.display = "none";

      // grid section mtn toggle off
      gridNormalSection.style.display = "none";
      gridExpressSection.style.display = "none";
      gridMashup.style.display = "none";

      terifModal.classList.add('show');


    // ADD SCROLL AND CLICK EVEN TO GET BUNDLE
     getBundleBtn.addEventListener("click", function() {
      if(getBundleBtn){
        terifModal.style.display = 'none';

        dataSection.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
     })


    // ADD SCROLL INTO VIEW WHEN ITS PROMO
    ctaBtn.addEventListener("click", function(){
      if(ctaBtn) {
        dataSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }
    });



    } else{
      terifModal.style.display = 'none';
    }



   
    // First time appearing anytime
    if(promoWasInactive) {
      setTimeout(() => bar.classList.add("show"), 200 );
      badge.classList.remove("show");
      promoWasInactive = false;
    }

    const endTime = getPromoEndTime();
    const now = new Date().getTime();
    const remaining = endTime - now;


    

    let hours = Math.floor(remaining / (1000 * 60 * 60));
    let minutes = Math.floor((remaining %  (1000 * 60 * 60 )) / (1000 * 60));
    let seconds = Math.floor((remaining % (1000 * 60 )) / 1000);

    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    // timerEl.innerHTML = `${hours}:${minutes}:${seconds}`;

    hrs.innerHTML = `${hours}`
    mts.innerHTML = `${minutes}`
    sec.innerHTML = `${seconds}`
    gp3Time1.innerHTML = `${hours}`
    gp3Time2.innerHTML = `${minutes}`
    gp3Time3.innerHTML = `${seconds}`
    labelEl.innerHTML =  `Offer End In <img src='./css/icons/timer.png'.>`;

    if(remaining < 6 * 60 * 60 * 1000) {
      ctaBtn.innerHTML = "Ending soon!";
      timerEl.classList.add("warning");
    } else {
      ctaBtn.innerHTML = "Buy Data Now!"
      timerEl.classList.remove("warning");
    }
  }

  setInterval(updateTimer, 1000);
  updateTimer();

  });
  // PROMO SCRIPT ENDS




  
// SNACKBAR SECTION //
// ===== SNACKBAR FUNCTION ===== //
let snackbarTimeout = null;

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
  if (snackbarTimeout) clearTimeout(snackbarTimeout);

  snackbarTimeout = setTimeout(() => {
    snackbar.classList.remove("show");
  }, duration);
}
// snackbar ends






