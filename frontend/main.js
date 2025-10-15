// === MAIN.JS ===

// =======================
// 🔥 FIREBASE CONFIG
// =======================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import { 
  getFirestore, 
  doc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// 🔑 Your Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyClNBlfigtQk8AZWdMZcU9sEtVcIrS0D1g",
  authDomain: "ecodata-2bee6.firebaseapp.com",
  projectId: "ecodata-2bee6",
  storageBucket: "ecodata-2bee6.firebasestorage.app",
  messagingSenderId: "544837123249",
  appId: "1:544837123249:web:6c362350a00c6dab10b690"
};

// ✅ Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// check if user is logged in//
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // if user not logged in, redirect to login page//
    window.location.href = "login.html";
  } else {
    console.log ("User Login in:", user.email)}
  }
);




// === BUY BUTTON EVENT LISTENERS ===
document.querySelectorAll(".buy-btn").forEach(button => {
  button.addEventListener("click", () => {
    const packageName = button.dataset.package;
    const network = button.dataset.network;
    const size = button.dataset.size;
    const price = button.dataset.price;

    // Show phone input modal first
    createPhoneModal(recipient => {
      payWithPaystack(network, recipient, packageName, size, price);
    });
  });
});


// Create phone input modal dynamically
function createPhoneModal(callback) {
  // Remove existing modal if any
  const existing = document.getElementById("phoneModal");
  if (existing) existing.remove();

  // Modal container
  const modal = document.createElement("div");
  modal.id = "phoneModal";
  modal.style = `
    position: fixed;
    top: 0; 
    width: 100%; 
    height: 100%;
    display: flex; 
    align-items: center; 
    justify-content: center;
    max-width: 480px;
    justify-self: center;
    background: rgba(0,0,0,0.4);
    z-index: 9999;
  `;

  // Modal content
  const box = document.createElement("div");
  box.style = `
    background: #fff;
    padding: 25px;
    border-radius: 15px;
    width: 90%;
    height: 24rem;
    justify-content: center;
    display: flex;
    flex-direction: column;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 8px 25px rgba(0,0,0,0.4);
    animation: popUp 0.3s ease;
    z-index: 9999;
    position: relative;
  `;
  box.innerHTML = `
    <h3 style="margin-bottom: 15px; color: #000000ff;">Enter your phone number to receive the Bundle package</h3>
    <input type="tel" id="recipientInput" placeholder="e.g. 233241234567"
      style="width: 100%;
      padding: 12px; 
      border-radius: 10px; 
      border: 1px solid #222; 
      font-size: 24px; 
      text-align: center; 
      margin-bottom: 15px;
      color: white" 
      box-shadow: 0 2px 6px #ccc8c8ff;/>
    <div style="display: flex;
      gap: 40px; 
    justify-content: center;">
      <button id="cancelBtn" style="background:#999; color: white; padding:10px 18px; border:none; border-radius:10px;
      width: 50%; cursor:pointer;">Cancel</button>
      <button id="confirmBtn" style="background:#2196F3; color:white; width: 50%; padding:10px 18px; border:none; border-radius:10px; cursor:pointer;">Continue</button>
    </div>
  `;

  modal.appendChild(box);
  document.body.appendChild(modal);

  document.getElementById("cancelBtn").addEventListener("click", () => {
    modal.remove();
  });

  document.getElementById("confirmBtn").addEventListener("click", () => {
    const recipient = document.getElementById("recipientInput").value.trim();
    if (!recipient) {
      showSnackBar(" Please enter your phone number");
      return;
    }
    modal.style.display = "none";
    setTimeout(() => {
      modal.remove();
      callback(recipient);
    } , 200);
  });
}



// === PAYSTACK PAYMENT ===
async function payWithPaystack(network, recipient, packageName, size, price) {
  const user = auth.currentUser; 
  let userEmail =  "customer@gmail.com";

  if(user){
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    if(docSnap.exists()) userEmail = docSnap.data().email;
  }

  let handler = PaystackPop.setup({
    key: "pk_live_635856447ee14b583349141b7271f64c9b969749",
    email: UserEmail,
    amount: price * 100,
    currency: "GHS",
    callback: function(response) {
      orderBundle(network, recipient, packageName, size, response.reference);
    },
    onClose: function() {
      showSnackBar(" Payment cancelled.");
    }
  });
  handler.openIframe();
}

// === SEND ORDER TO BACKEND ===
async function orderBundle(network, recipient, packageName, size, reference) {
  try {
    const API_BASE = window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://ecodata-app.onrender.com/";

    const response = await fetch(`${API_BASE}api/buy-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ network, recipient, package: packageName, size: parseInt(size), paymentReference: reference })
    });

    const result = await response.json();
    if (result.success) {
      showSnackBar("✅ Data bundle purchased successfully!");
      console.log("📦 Order details:", result.order || result.swift);
    } else {
      showSnackBar(`Failed to purchase data: ${result.message || "Unknown error"}`);
    }
  } catch (err) {
    console.error("⚠ Server error:", err);
    showSnackBar("⚠ Server error. Please try again later.");
  }
}

// === LOAD STATUS ===
async function loadStatus() {
  try {
    const res = await fetch("https://ecodata-app.onrender.com/api/v1/orders/status");
    const data = await res.json();
    if (data.success && data.data) {
      document.getElementById("pendingCount").innerText = data.data.pending;
      document.getElementById("processingCount").innerText = data.data.processing;
      document.getElementById("completedCount").innerText = data.data.complete;
      document.getElementById("failedCount").innerText = data.data.failed;
    }
  } catch (err) {
    console.error("Error fetching status:", err);
  }
}
loadStatus();
setInterval(loadStatus,3000);



// SNACKBAR SECTION //
// ===== SNACKBAR FUNCTION ===== //
function showSnackBar(message, type = "info") {
  // Remove existing snackbar if visible
  const existing = document.querySelector(".snackbar");
  if (existing) existing.remove();

  // Create snackbar element
  const snackbar = document.createElement("div");
  snackbar.className = "snackbar";

  // Color scheme based on type
  if (type === "success") snackbar.style.background = "#28a745";   // green
  else if (type === "error") snackbar.style.background = "#dc3545"; // red
  else if (type === "warning") snackbar.style.background = "#ffc107"; // yellow
  else snackbar.style.background = "#aaf1c6ff"; // default dark

  snackbar.textContent = message;

  // Add snackbar to the body
  document.body.appendChild(snackbar);

  // Force reflow (to trigger CSS animation)
  void snackbar.offsetWidth;

  // Show snackbar
  snackbar.classList.add("show");

  // Hide snackbar after 3 seconds
  setTimeout(() => {
    snackbar.classList.remove("show");
    setTimeout(() => snackbar.remove(), 500);
},3000);
}