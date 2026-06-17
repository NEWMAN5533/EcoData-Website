// PROMO SCRIPT

document.addEventListener("DOMContentLoaded", () => {

  let promoWasInactive = true;

  // ==========================
  // PROMO CONFIG
  // ==========================
  const PROMO_END =
    new Date("2026-06-24T23:59:59").getTime();

  function isPromoTime() {
    return Date.now() < PROMO_END;
  }

  function getPromoEndTime() {
    return PROMO_END;
  }

  // ==========================
  // UPDATE TIMER
  // ==========================
  function updateTimer() {

    const bar = document.getElementById("promoBar");
    const badge = document.getElementById("liveBadge");
    const timerEl = document.getElementById("timer");
    const labelEl = document.getElementById("label");
    const ctaBtn = document.getElementById("ctaBtn");
    const promoThumbnail =
      document.getElementById("promThumbnail");

    const promoActiveDiv =
      document.getElementById("promoActive");

    const promoEndedDiv =
      document.getElementById("topOpt");

    const untargetExpressDiv =
      document.getElementById("bottomOpt");

    const mashupDiv =
      document.getElementById("mash");

    const gridMashup =
      document.getElementById("mashGridDiv");

    const gridPromoActiveDiv =
      document.getElementById("gridPromoActive");

    const gridNormalSection =
      document.getElementById("gridNormalDiv");

    const gridExpressSection =
      document.getElementById("gridExpressDiv");

    // ==========================
    // PROMO ENDED
    // ==========================
    if (!isPromoTime()) {

      timerEl.innerHTML = "00:00:00";

      labelEl.innerHTML =
        `Promo timer. <img src="./css/icons/timer.png">`;

      ctaBtn.innerHTML = "Promo Ended!";

      promoActiveDiv.style.display = "none";
      gridPromoActiveDiv.style.display = "none";
      promoThumbnail.style.display = "none";

      bar.style.display = "none";

      promoWasInactive = true;

      return;
    }

    // ==========================
    // PROMO ACTIVE
    // ==========================
    promoActiveDiv.style.display = "block";
    gridPromoActiveDiv.style.display = "block";
    promoThumbnail.style.display = "flex";

    promoEndedDiv.style.display = "none";
    untargetExpressDiv.style.display = "none";
    mashupDiv.style.display = "none";

    gridNormalSection.style.display = "none";
    gridExpressSection.style.display = "none";
    gridMashup.style.display = "none";

    // First appearance
    if (promoWasInactive) {

      setTimeout(() => {
        bar.classList.add("show");
      }, 200);

      badge.classList.add("show");

      promoWasInactive = false;
    }

    // ==========================
    // COUNTDOWN
    // ==========================
    const endTime = getPromoEndTime();
    const now = Date.now();

    const remaining = endTime - now;

    let days = Math.floor(
      remaining / (1000 * 60 * 60 * 24)
    );

    let hours = Math.floor(
      (remaining % (1000 * 60 * 60 * 24))
      /
      (1000 * 60 * 60)
    );

    let minutes = Math.floor(
      (remaining % (1000 * 60 * 60))
      /
      (1000 * 60)
    );

    let seconds = Math.floor(
      (remaining % (1000 * 60))
      / 1000
    );

    

    hours =
      hours < 10 ? "0" + hours : hours;

    minutes =
      minutes < 10 ? "0" + minutes : minutes;

    seconds =
      seconds < 10 ? "0" + seconds : seconds;


    

    timerEl.innerHTML =
      `${days}D ${hours}:${minutes}:${seconds}`;

      const promoEndDate = new Date(PROMO_END);



    labelEl.innerHTML =
      `Promo Ends ${promoEndDate.toLocaleString("en-US",
        {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        }).toUpperCase()
      }`;

    // ==========================
    // WARNING MODE
    // ==========================
    if (remaining < 6 * 60 * 60 * 1000) {

      ctaBtn.innerHTML =
        "Ending Soon!";

      timerEl.classList.add("warning");

    } else {

      ctaBtn.innerHTML =
        "Buy Data Now!";

      timerEl.classList.remove("warning");
    }
  }

  setInterval(updateTimer, 1000);
  updateTimer();

});

// PROMO SCRIPT ENDS