// PROMO SCRIPT 

  document.addEventListener("DOMContentLoaded", () => {
  let promoWasInactive = true;

  function isPromoTime() {
    const day = new Date().getDay();



    return (day === 4 || day === 5);
    
  }

  function getPromoEndTime() {
    const now = new Date();
    const day = now.getDay();
    let end = new Date(now);

    if(day === 4 ) {
      end.setDate(now.getDate() + 1);
      end.setHours(23, 59, 59, 999);

    } else if (day === 5) {
      end.setHours(23, 59, 59, 999);
    } else {
      return null;
    }
    return end.getTime();
  }

 


  function updateTimer() {
    const bar = document.getElementById("promoBar");
    const badge = document.getElementById("liveBadge");
    const timerEl = document.getElementById("timer");
    const labelEl = document.getElementById("label");
    const ctaBtn = document.getElementById("ctaBtn");
    const promoThumbnail = document.getElementById("promThumbnail");


    // const of promoDiv toggle
  const promoActiveDiv = document.getElementById("promoActive");
  const promoEndedDiv = document.getElementById("topOpt");
  const untargetExpressDiv = document.getElementById("bottomOpt");
  const mashupDiv = document.getElementById("mash");
  const gridMashup = document.getElementById("mashGridDiv");

  const gridPromoActiveDiv = document.getElementById("gridPromoActive");
  const gridNormalSection = document.getElementById("gridNormalDiv");
  const gridExpressSection = document.getElementById("gridExpressDiv");

 

    if(!isPromoTime()) {
      timerEl.innerHTML = "00:00:00";
      labelEl.innerHTML = `Promo timer. <img src="./css/icons/timer.png" >`;

      ctaBtn.innerHTML = "promo ended!"
      promoActiveDiv.style.display = "none";
      gridPromoActiveDiv.style.display = "none";
      promoThumbnail.style.display = "none";
      bar.style.display = "none";
     
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
      promoThumbnail.style.display = "flex";
     
      promoEndedDiv.style.display = "none";
      untargetExpressDiv.style.display = "none";
      mashupDiv.style.display = "none";

      // grid section mtn toggle off
      gridNormalSection.style.display = "none";
      gridExpressSection.style.display = "none";
      gridMashup.style.display = "none";
    }



   
    // First time appearing anytime
    if(promoWasInactive) {
      setTimeout(() => bar.classList.add("show"), 200 );
      badge.classList.add("show");
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

    timerEl.innerHTML = `${hours}:${minutes}:${seconds}`;
    labelEl.innerHTML = `Promo Ends In <img src="./css/icons/timer.png" >`;

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
