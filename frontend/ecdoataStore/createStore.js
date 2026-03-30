
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import {
  getFirestore
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

// =============
// FORCE TO LOGIN
// =============
onAuthStateChanged(auth, (user) => {
  if(!user) {
    showSnackBar("Please login first");
  }
});



// ==========================
// FORM HANDLER
// ==========================
const form = document.getElementById("storeForm");
const storeLinkInput = document.getElementById("storeLink");

form.style.display = "block";

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  if(!user) {
  } else {
    currentUser = user;
    form.style.display = "block";
  }
});



// FORM SUBMIT
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if(!currentUser) {
    showSnackBar("User not authenticated");
    return;
  }

  const formData = new FormData(form);

  // 🔥 SEND JSON (NOT FormData)
  const payload = {
    businessName: formData.get("businessName"),
    whatsapp: formData.get("whatsapp"),
    location: formData.get("location"),
    storeType: formData.get("storeType"),
    userId: currentUser.uid 
  };

  try {
    const res = await fetch("/api/store/create-store", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.success) {
      // ✅ show link first
      const resultBox = document.getElementById("resultBox");

      resultBox.style.display = "block";
      storeLinkInput.value = data.storeLink

      // 🔥 then redirect
      setTimeout(() => {
        window.location.href = `/ecodataStore/subscriptionPage.html?store=${data.storeId}`;
      }, 2000);
    }

  } catch (err) {
    console.error(err);
    showSnackBar("Server error");
  }
});

// ==========================
// COPY LINK
// ==========================
window.copyLink = function () {
  storeLinkInput.select();
  document.execCommand("copy");
  showSnackBar("Link copied!");
};

// ==========================
// SUBSCRIBE FUNCTION
// ==========================
window.subscribe = async function(plan) {

  const storeId = new URLSearchParams(window.location.search).get("store");

  if (!storeId) {
    showSnackBar("Store not found");
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

    // ✅ FREE PLAN
    if (data.free) {
      window.location.href = `/dashboard.html?store=${storeId}`;
      return;
    }

    // 💰 PAID PLAN
    if (data.paymentUrl) {
      window.location.href = data.paymentUrl;
    }

  } catch (err) {
    console.error(err);
    showSnackBar("Something went wrong");
  }
};






/* ============================= */
/*        SNACKBAR SYSTEM        */
/* ============================= */

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

/* ============================= */
/*        SNACKBAR SYSTEM ENDS   */
/* ============================= */
