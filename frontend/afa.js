

// AFA CONFIG
const AFA_PRICE_GHS = 20;
const PAYSTACK_PUBLIC_KEY = "pk_live_635856447ee14b583349141b7271f64c9b969749"

// ==================== REGION SELECTOR ====================
let selectedRegion = "";

const regionBtn = document.getElementById("regionSelector");
const regionSheet = document.querySelector(".regions-sheet");
const regionOptions = document.querySelectorAll(".regionSelect");

// Toggle sheet
regionBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();

  regionSheet.style.display =
    regionSheet.style.display === "flex" ? "none" : "flex";
});

// Pick region
regionOptions.forEach((option) => {
  option.addEventListener("click", (e) => {
    e.stopPropagation();

    selectedRegion = option.dataset.region;

    // Preserve button icon
    regionBtn.innerHTML = `
      ${selectedRegion}
      <img src="./css/icons/more.png.png" alt="">
    `;

    regionSheet.style.display = "none";
  });
});

// Close when clicking outside
window.addEventListener("click", (e) => {
  if (
    !regionBtn.contains(e.target) &&
    !regionSheet.contains(e.target)
  ) {
    regionSheet.style.display = "none";
  }
});




// ====afa form=================
const afaSubmitBtn = document.getElementById("afaSubmit");
const afaform = document.getElementById("afa-Form");


// LOADING STATE
function setAfaLoading(isLoading, text = "Processing") {
  if (isLoading) {
    afaSubmitBtn.classList.add("loading");
    afaSubmitBtn.dataset.originalText = afaSubmitBtn.textContent;
    afaSubmitBtn.textContent = text;
    afaSubmitBtn.disabled = true;
  } else {
    afaSubmitBtn.classList.remove("loading");
    afaSubmitBtn.textContent = 
    afaSubmitBtn.dataset.originalText || 
    "Proceed with Registration";
    afaSubmitBtn.disabled = false;
  }
}

// SUBMIT AFADATA
afaform.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!selectedRegion){
    showSnackBar("please select your region");
    return;
  }

  setAfaLoading(true, "Initializing Payment")

  const formData = new FormData(afaform);

  if(!isValidFullName(fullName)) {
    showSnackBar("Please enter your full name (first & last name)");
    return;
  }

  if(!isValidGhanaPhone(phone)) {
    showSnackBar("Enter a Valid Ghana Number");
    return;
  }

  if(!isValidGhanaCard(ghanaCard)){
    showSnackBar("Invalid Ghana Card Format (GHA-XXXXXXXX-X");
    return;
  }

  if (!occupation) {
    showSnackBar("Please enter your occupation");
    return;
  }

  if (!location) {
    showSnackBar("Please enter your location");
    return;
  }

  if (!selectedRegion) {
    showSnackBar("Please select your region");
    return;
  }

  if (!isValidDOB(dob)){
    showSnackBar("You must be at least 18 years old");
    return;
  }

  // ===PASSED===
  setAfaLoading(true, "Initializing Payment");

  const afaData = {
    service: "afa",
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    ghanaCard: formData.get("ghanaCard"),
    occupation: formData.get("occupation"),
    location: formData.get("location"),
    dob: formData.get("dob"),
    region: selectedRegion
  };

  startAfaPayment(afaData);
});


// ================= VALIDATION HELPERS =================

// Full name: at least 2 words
function isValidFullName(name) {
  return name && name.trim().split(" ").length >= 2;
}

// Ghana phone: 10 digits, starts with 02 / 05 / 03
function isValidGhanaPhone(phone) {
  return /^(02|03|05)\d{8}$/.test(phone);
}

// Ghana Card: GHA-XXXXXXXXX-X or GHA-XXXXXXXX-X
function isValidGhanaCard(card) {
  return /^GHA-\d{7,9}-\d$/.test(card.toUpperCase());
}

// DOB: must be at least 18 years old
function isValidDOB(dob) {
  if (!dob) return false;

  const birthDate = new Date(dob);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 18;
}

// AFA PAYSTACK HANDLER
function startAfaPayment(afaData) {
  const loader =
  document.getElementById("paystackLoader");
  loader.classList.remove("hidden");

  const handler = PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: `${afaData.phone}@ecodata.africa`,
    amount: AFA_PRICE_GHS * 100,
    currency: "GHS",
    ref: "AFA_" + Date.now(),

    callback: function (response) {
      loader.classList.add("hidden");
      setAfaLoading(true, "Submitting Registration");

      submitAfaRegistration({
        ...afaData,
        paymentReference: response.reference
      });
    },

    onclose: function () {
      loader.classList.add("hidden");
      showSnackBar("Payment cancelled");
    }
  });

  // small delay
  setTimeout(() => {
    handler.openIframe();
  }, 300);
}

// submit to server
async function submitAfaRegistration(payload) {
  try {
    const res = await fetch("/api/afa/register", {
      method: "POST",
      headers: {"content-type": "application/json"},
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!data.success) {
      setAfaLoading(false);
      showSnackBar(data.message || "AFA registration failed");
      return;
    }

    showAfaReceipt({...payload,
      reference: payload.paymentReference
    });

    showSnackBar("AFA Registration Successful");
    afaform.reset();
    selectedRegion = "";

    document.getElementById("regionSelector").textContent = "Select your Region";

    setAfaLoading(false);
  } catch (err) {
    console.error(err);
    setAfaLoading(false);
    showSnackBar("Network error. Please try again.");
  }
}

function showAfaReceipt(data) {
  document.getElementById("rName").textContent = data.fullName;
  document.getElementById("rPhone").textContent = data.phone;
  document.getElementById("rGhanaCard").textContent = data.ghanaCard;
  document.getElementById("rRegion").textContent = data.region;
  document.getElementById("rRef").textContent = data.reference;

  document.getElementById("afaReceipt").classList.remove("hidden");
}

function closeReceipt() {
  document.getElementById("afaReceipt").classList.add("hidden");
}

function downloadReceipt() {
  const receipt = document.querySelector(".receipt-card");

  html2pdf()
  .set({
    margin: 10,
    filename: "AFA-Receipt.pdf",
    image: {tye: "jpeg", quality: 0.98},
    html2canvas: { scale: 2},
    jsPDF: {unit: "mm", format: "a4",
    orientation: "portrait" }
  })
  .from(receipt)
  .save();
}
// ==================== AFA CODE===ends=====




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
  else if (type === "error") snackbar.style.background = "#dc3545";
  else if (type === "warning") snackbar.style.background = "#ffc107";
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
















  // === REAL TIME CLOCK ===
function updateClock() {
  const clock = document.getElementById("clock");
  const now = new Date();
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const dayName = days[now.getDay()];
  let hours = now.getHours();
  let minutes = now.getMinutes();
  let seconds = now.getSeconds();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;
  clock.innerHTML = `${dayName} ${hours}:${minutes}:${seconds} ${ampm}`;
}
setInterval(updateClock, 1000);
updateClock();




