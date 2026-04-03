
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";


// 🔹 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyClNBlfigtQk8AZWdMZcU9sEtVcIrS0D1g",
  authDomain: "ecodata-2bee6.firebaseapp.com",
  projectId: "ecodata-2bee6",
  storageBucket: "ecodata-2bee6.firebasestorage.app",
  messagingSenderId: "544837123249",
  appId: "1:544837123249:web:6c362350a00c6dab10b690"
};


// 🔹 Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);



// 🔹 Display username when logged in
onAuthStateChanged(auth, async (user) => {

  const usernameDisplay = document.getElementById("usernameDisplay");
  const loginBtn = document.getElementById("loginBtn");

  if (!usernameDisplay) return;

  if (user) {

    // hide login Btn when logged in already
    loginBtn.textContent = `Signed!`

    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (userDoc.exists()) {
      const userData = userDoc.data();
      usernameDisplay.textContent = `Welcome, ${userData.username}!`;
    } else {
      usernameDisplay.textContent = "Welcome!";
    }

  } else {
    usernameDisplay.textContent = "Welcome, to EcoShop!";
  }

});


// ==========================
// ELEMENTS (SAFE)
// ==========================
const form = document.getElementById("storeForm");
const resultBox = document.getElementById("resultBox");
const storeLinkInput = document.getElementById("storeLink");
const submitBtn = form?.querySelector(".submitter button");
const storeTypeInput = document.getElementById("storeTypeInput");

const selectorCard = document.getElementById("inputSelect");
const selectorToggle = document.getElementById("typeSelectBtn");

// Safety check
if (!form || !submitBtn) {
  console.error("Form elements missing");
}

// ==========================
// AUTH
// ==========================
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    showSnackBar("Login first");
   // window.location.href = "ecoLogin.html";
  } else {
    currentUser = user;
    form.style.display = "block";
  }
});

// ==========================
// STORE TYPE SELECT (UX UPGRADE)
// ==========================
selectorToggle?.addEventListener("click", (e) => {
  e.stopPropagation();
  selectorCard.style.display =
    selectorCard.style.display === "flex" ? "none" : "flex";
});

document.querySelectorAll(".storeTypeSelect").forEach(item => {
  item.addEventListener("click", () => {
    storeTypeInput.value = item.innerText;

    // 🔥 Show selected value in button
    selectorToggle.querySelector("button").innerText = item.innerText;

    selectorCard.style.display = "none";
  });
});

window.addEventListener("click", (e) => {
  if (!selectorCard.contains(e.target) && !selectorToggle.contains(e.target)) {
    selectorCard.style.display = "none";
  }
});

// ==========================
// STORE INFO INPUT
// ==========================
// ==========================
// STORE TYPE SELECT SYSTEM
// ==========================
// ==========================
// STORE TYPE SELECT SYSTEM
// ==========================
const wrapper = document.getElementById("typeSelectBtn");
const dropdown = document.getElementById("inputSelect");
const button = document.getElementById("storeTypeButton");
const hiddenInput = document.getElementById("storeTypeInput");

// Toggle dropdown
button.addEventListener("click", (e) => {
  e.stopPropagation();

  dropdown.style.display =
    dropdown.style.display === "flex" ? "none" : "flex";
});

// Select option
document.querySelectorAll(".storeTypeSelect").forEach(option => {
  option.addEventListener("click", () => {

    const selected = option.innerText;

    // ✅ Save value for backend
    hiddenInput.value = selected;

    // ✅ Show selected value on button
    button.innerText = selected;

    // ✅ Highlight selected option
    document.querySelectorAll(".storeTypeSelect")
      .forEach(el => el.classList.remove("active"));

    option.classList.add("active");

    // ✅ Close dropdown
    dropdown.style.display = "none";
  });
});

// Close when clicking outside
window.addEventListener("click", (e) => {
  if (!wrapper.contains(e.target)) {
    dropdown.style.display = "none";
  }
});

// ==========================
// STORE INFO INPUT ENDS
// ==========================







// ==========================
// FORM SUBMIT
// ==========================
form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentUser) {
    showSnackBar("User not authenticated", "error");
    return;
  }

  if (!storeTypeInput.value) {
    showSnackBar("Please select store type", "warning");
    return;
  }

  try {
    submitBtn.innerHTML = `<span class="spinner"></span> Creating...`;
    submitBtn.disabled = true;

    const formData = new FormData(form);
    formData.append("userId", currentUser.uid);

    const res = await fetch("/api/store/create-store", {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error("Server error");

    const data = await res.json();

    if (data.success) {
      resultBox.style.display = "block";
      storeLinkInput.value = data.storeLink;

      showSnackBar("Store created successfully", "success");

      setTimeout(() => {
        window.location.href =
          `/ecodataStore/subscriptionPage.html?store=${data.storeId}`;
      }, 2000);
    } else {
      showSnackBar(data.message || "Failed", "error");
    }

  } catch (err) {
    console.error(err);
    showSnackBar("Server error", "error");
  } finally {
    submitBtn.innerHTML = "Create Store";
    submitBtn.disabled = false;
  }
});

// ==========================
// COPY LINK (FINAL CLEAN)
// ==========================
window.copyLink = function () {
  if (!storeLinkInput.value) {
    showSnackBar("No link to copy", "warning");
    return;
  }

  navigator.clipboard.writeText(storeLinkInput.value);
  showSnackBar("Link copied!", "success");
};

// ==========================
// SUBSCRIBE FUNCTION
// ==========================
window.subscribe = async function(plan) {

  const storeId = new URLSearchParams(window.location.search).get("store");

  if (!storeId) {
    showSnackBar("Store not found", "error");
    return;
  }

  const user = auth.currentUser;
  const userEmail = user?.email || `${storeId}@ecodata.com`;

  try {
    const res = await fetch("/api/subscription/initiate-subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: userEmail,
        storeId,
        plan
      })
    });

    const data = await res.json();

    if (data.free) {
      window.location.href = `/dashboard.html?store=${storeId}`;
      return;
    }

    if (data.paymentUrl) {
      window.location.href = data.paymentUrl;
    }

  } catch (err) {
    console.error(err);
    showSnackBar("Something went wrong", "error");
  }
};

// ==========================
// SNACKBAR SYSTEM (UNCHANGED)
// ==========================
let snackbarTimeout = null;

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

  if (type === "success") snackbar.style.background = "rgba(7,29,26,0.95)";
  else if (type === "error") snackbar.style.background = "#dc3545";
  else if (type === "warning") snackbar.style.background = "#ffc107";
  else snackbar.style.background = "rgba(7,29,26,0.95)";

  const progress = snackbar.querySelector(".snackbar-progress");

  progress.style.animation = "none";
  void progress.offsetWidth;

  progress.style.animation = `snackbar-progress ${duration}ms linear forwards`;

  snackbar.classList.add("show");

  if (snackbarTimeout) clearTimeout(snackbarTimeout);

  snackbarTimeout = setTimeout(() => {
    snackbar.classList.remove("show");
  }, duration);
}