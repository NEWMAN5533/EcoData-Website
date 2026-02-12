// ==========================
// AFA CONFIG
// ==========================
const AFA_PRICE_GHS = 20; // Make sure backend matches this
const PAYSTACK_PUBLIC_KEY = "pk_live_635856447ee14b583349141b7271f64c9b969749";

let selectedRegion = "";

// ==========================
// REGION SELECTOR
// ==========================
const regionBtn = document.getElementById("regionSelector");
const regionSheet = document.querySelector(".regions-sheet");
const regionOptions = document.querySelectorAll(".regionSelect");

regionBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  regionSheet.style.display =
    regionSheet.style.display === "flex" ? "none" : "flex";
});

regionOptions.forEach((option) => {
  option.addEventListener("click", (e) => {
    e.stopPropagation();
    selectedRegion = option.dataset.region;

    regionBtn.innerHTML = `
      ${selectedRegion}
      <img src="./css/icons/more.png.png" alt="">
    `;

    regionSheet.style.display = "none";
  });
});

window.addEventListener("click", (e) => {
  if (
    regionSheet &&
    !regionBtn.contains(e.target) &&
    !regionSheet.contains(e.target)
  ) {
    regionSheet.style.display = "none";
  }
});

// ==========================
// FORM ELEMENTS
// ==========================
const afaForm = document.getElementById("afa-Form");
const afaSubmitBtn = document.getElementById("afaSubmit");

// ==========================
// LOADING STATE
// ==========================
function setAfaLoading(state, text = "Processing...") {
  if (!afaSubmitBtn) return;

  if (state) {
    afaSubmitBtn.disabled = true;
    afaSubmitBtn.dataset.originalText = afaSubmitBtn.textContent;
    afaSubmitBtn.textContent = text;
    afaSubmitBtn.classList.add("loading");
  } else {
    afaSubmitBtn.disabled = false;
    afaSubmitBtn.textContent =
      afaSubmitBtn.dataset.originalText || "Proceed with Registration";
    afaSubmitBtn.classList.remove("loading");
  }
}

// ==========================
// VALIDATION
// ==========================
function isValidFullName(name) {
  return name && name.trim().split(" ").length >= 2;
}

function isValidGhanaPhone(phone) {
  return /^(02|03|05)\d{8}$/.test(phone);
}

function isValidGhanaCard(card) {
  return /^GHA-\d{7,9}-\d$/.test(card.toUpperCase());
}

function isValidDOB(dob) {
  if (!dob) return false;

  const birth = new Date(dob);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

  return age >= 18;
}

// ==========================
// LOADER
// ==========================
function showLoader() {
  document.getElementById("paystackLoader")?.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function hideLoader() {
  document.getElementById("paystackLoader")?.classList.add("hidden");
  document.body.style.overflow = "";
}

// ==========================
// FORM SUBMIT
// ==========================
afaForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const formData = new FormData(afaForm);

  const fullName = formData.get("fullName")?.trim();
  const phone = formData.get("phone")?.trim();
  const ghanaCard = formData.get("ghanaCard")?.trim();
  const occupation = formData.get("occupation")?.trim();
  const location = formData.get("location")?.trim();
  const dob = formData.get("dob");

  if (!selectedRegion) return showSnackBar("Select your region", "warning");
  if (!isValidFullName(fullName))
    return showSnackBar("Enter full name", "warning");
  if (!isValidGhanaPhone(phone))
    return showSnackBar("Invalid Ghana number", "warning");
  if (!isValidGhanaCard(ghanaCard))
    return showSnackBar("Invalid Ghana Card format", "warning");
  if (!occupation) return showSnackBar("Enter occupation", "warning");
  if (!location) return showSnackBar("Enter location", "warning");
  if (!isValidDOB(dob))
    return showSnackBar("Must be 18+ years", "warning");

  const afaData = {
    fullName,
    phone,
    ghanaCard,
    occupation,
    location,
    dob,
    region: selectedRegion,
  };

  setAfaLoading(true, "Initializing Payment...");
  startAfaPayment(afaData);
});

// ==========================
// PAYSTACK V2
// ==========================
function startAfaPayment(afaData) {
  showLoader();

  const paystack = new PaystackPop();

  paystack.newTransaction({
    key: PAYSTACK_PUBLIC_KEY,
    email: `${afaData.phone}@ecodata.afa-program.com`,
    amount: AFA_PRICE_GHS * 100,
    currency: "GHS",
    ref: "AFA_" + Date.now(),

    metadata: {
      custom_fields: [
        { display_name: "Full Name", value: afaData.fullName },
        { display_name: "Phone", value: afaData.phone },
        { display_name: "GhanaCard", value: afaData.ghanaCard },
        { display_name: "Occupation", value: afaData.occupation },
        { display_name: "Location", value: afaData.location },
        { display_name: "dateOfBirth", value: afaData.dob },
        { display_name: "Region", value: afaData.region },
      ],
    },

    onSuccess: (response) => {
      hideLoader();
      setAfaLoading(true, "Verifying Payment...");

      submitAfaRegistration({
        ...afaData,
        paymentReference: response.reference,
      });
    },

    onCancel: () => {
      hideLoader();
      setAfaLoading(false);
      showSnackBar("Payment cancelled", "error");
    },
  });
}

// ==========================
// SERVER SUBMIT
// ==========================
async function submitAfaRegistration(payload) {
  try {
    const apiPayload = {
      name: payload.fullName,
      phoneNumber: payload.phone,
      idNumber: payload.ghanaCard,
      occupation: payload.occupation,
      location: payload.location,
      region: payload.region,
      dateOfBirth: payload.dob,
      paymentReference: payload.paymentReference,
    };

    const res = await fetch("/api/afa/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apiPayload),
    });

    const data = await res.json();

    if (!data.success) {
      setAfaLoading(false);
      return showSnackBar(data.message || "Registration failed", "error");
    }

    showAfaReceipt(apiPayload, data);

    showSnackBar("AFA Registration Successful", "success");

    afaForm.reset();
    selectedRegion = "";
    regionBtn.textContent = "Select your Region";

    setAfaLoading(false);
  } catch (err) {
    console.error(err);
    setAfaLoading(false);
    showSnackBar("Network error. Try again.", "error");
  }
}

// ==========================
// RECEIPT
// ==========================
function showAfaReceipt(payload, serverData) {
  document.getElementById("rName").textContent = serverData.name;
  document.getElementById("rPhone").textContent = serverData.phoneNumber;
  document.getElementById("rGhanaCard").textContent = serverData.idNumber;
  document.getElementById("rRegion").textContent = serverData.region;
  document.getElementById("rRef").textContent = payload.paymentReference;
  document.getElementById("rRegId").textContent =
    serverData.registrationId || "-";
  document.getElementById("rStatus").textContent =
    serverData.status || "Approved";
  document.getElementById("rPrice").textContent =
    "GHS " + (serverData.registrationPrice || AFA_PRICE_GHS);
  document.getElementById("rDate").textContent = new Date(
    serverData.submittedAt || Date.now()
  ).toLocaleString();

  document.getElementById("afaReceipt").classList.remove("hidden");
}

// ==========================
// SNACKBAR
// ==========================
let snackbarTimeout;

function showSnackBar(message, type = "info", duration = 4000) {
  let snackbar = document.querySelector(".snackbar");

  if (!snackbar) {
    snackbar = document.createElement("div");
    snackbar.className = "snackbar";
    snackbar.innerHTML = `
      <span class="snackbar-text"></span>
      <div class="snackbar-progress"></div>
    `;
    document.body.appendChild(snackbar);
  }

  snackbar.querySelector(".snackbar-text").textContent = message;

  const colors = {
    success: "#071d1a",
    error: "#071d1a",
    warning: "#071d1a",
    info: "#071d1a",
  };

  snackbar.style.background = colors[type] || colors.info;
  snackbar.classList.add("show");

  clearTimeout(snackbarTimeout);
  snackbarTimeout = setTimeout(() => {
    snackbar.classList.remove("show");
  }, duration);
}





// ==================== REAL TIME CLOCK ====================
function updateClock() {
  const clock = document.getElementById("clock");
  if (!clock) return;

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