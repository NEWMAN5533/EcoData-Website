
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
    showSnackBar("Please login first")
  }
})



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




