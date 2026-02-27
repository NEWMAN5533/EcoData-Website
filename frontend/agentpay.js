import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// =============================
// FIREBASE CONFIG
// =============================
const firebaseConfig = {
  apiKey: "AIzaSyClNBlfigtQk8AZWdMZcU9sEtVcIrS0D1g",
  authDomain: "ecodata-2bee6.firebaseapp.com",
  projectId: "ecodata-2bee6",
  storageBucket: "ecodata-2bee6.firebasestorage.app",
  messagingSenderId: "544837123249",
  appId: "1:544837123249:web:6c362350a00c6dab10b690"
};

// =============================
// INITIALIZE FIREBASE
// =============================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

let currentUser = null;

// =============================
// CHECK LOGIN STATE
// =============================
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    console.log("Logged in:", user.email);
  } else {
    currentUser = null;
    console.log("User not logged in");
  }
});

// =============================
// PAYSTACK PAYMENT FUNCTION
// =============================
function payWithPaystack(user) {

    // 1️⃣ Show YOUR loader first
  showLoader();

  // 2️⃣ Let browser paint it
  setTimeout(() => {
  const paystack = new PaystackPop();

  paystack.newTransaction({
    key: "pk_live_635856447ee14b583349141b7271f64c9b969749", // ⚠️ Use TEST key while testing
    email: user.email,
    amount: 90 * 100, // GHS 100 (kobo)
    currency: "GHS",
    metadata: {
      uid: user.uid
    },

    onSuccess: function (transaction) {
      hideLoader();

      console.log("Transaction reference:", transaction.reference);

      fetch("/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reference: transaction.reference,
          uid: user.uid
        })
      })
      .then(res => res.json())
      .then(data => {

        if (data.success) {
          showSnackBar("Payment verified. You are now an Agent!");
          window.location.href = "agentPage.html";
        } else {
          showSnackBar("Payment verification failed.");
        }

      })
      .catch(error => {
        console.error("Verification error:", error);
        showSnackBar("Server error during verification.");
      });
    },

    onCancel: function () {
      hideLoader();
      showSnackBar("Payment cancelled.");
    }

  });
  }, 4120); // sweet spot (80–150ms)
}

// =============================
// BUTTON LISTENER
// =============================
window.addEventListener("DOMContentLoaded", () => {

  const payBtn = document.getElementById("payBtn");

  if (!payBtn) {
    console.error("payBtn not found in HTML");
    return;
  }

  payBtn.addEventListener("click", () => {

    if (!currentUser) {
      showSnackBar("Please login first.");
      return;
    }

    payWithPaystack(currentUser);

  });

});



// ===================
// LOADER SPINNER IFRAME
//=====================
const loader = document.getElementById("paystackLoader");

function showLoader() {
  loader.style.display = "flex";
  document.body.classList.add("no-scroll");
}

function hideLoader() {
  loader.style.display = "none";
  document.body.classList.remove("no-scroll");
}

// ===================
// LOADER SPINNER IFRAME
//=====================

















//  <!----SNACKBAR-SECTION--->
 
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


