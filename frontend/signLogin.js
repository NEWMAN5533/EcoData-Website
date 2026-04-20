
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
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

console.log("🔥 Firebase initialized and Firestore ready for login!");
console.log ({email, password});


// 🔹 Display username when logged in
onAuthStateChanged(auth, async (user) => {

  const usernameDisplay = document.getElementById("usernameDisplay");
  if (!usernameDisplay) return;

  if (user) {

    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (userDoc.exists()) {
      const userData = userDoc.data();
      usernameDisplay.textContent = `Welcome, ${userData.username}!`;
    } else {
      usernameDisplay.textContent = "Welcome!";
    }

  } else {
    usernameDisplay.textContent = "Welcome, Guest!";
  }

});


// 🔹 Login
const loginForm = document.getElementById("login-form");
const logBtn = document.getElementById("logBtn");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();



  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if(!email || !password) {
    showSnackBar("Please fill in all fields", "warning");
    loginBtn.classList.remove("loading");
    logBtn.disabled = false;

  } else {
    logBtn.classList.add("loading");
    logBtn.disabled = true;
  }


   try {

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      showSnackBar("User profile not found.", "error");
      logBtn.classList.remove("loading");
      return;
    }

    const userData = userDoc.data();

    // Save locally
    localStorage.setItem("username", userData.username || "User");
    localStorage.setItem("role", userData.role || "user");

    showSnackBar("Login successful!", "success");

    // 🔥 Redirect based on role
    setTimeout(() => {

      if (userData.role === "agent") {
        window.location.href = "agentPage.html";
      } else {
        window.location.href = "index.html";
      }

    }, 3500);

  } catch (error) {



    // ✅ Clean error messages
    let message = "Login failed";

    if (error.code === "auth/invalid-credential") {
      message = "Invalid email or password";
      showSnackBar("Invalid email or password");

    } else if (error.code === "auth/user-not-found") {
      message = "Account not found";
      showSnackBar("Account not found");

    } else if (error.code === "auth/wrong-password") {
      message = "Incorrect password";
      showSnackBar("Incorrect password");

    } else if (error.code === "auth/too-many-requests") {
      message = "Too many attempts. Try again later";
      showSnackBar("Too many attempts. Tru again later");
    }


  } finally {
    logBtn.classList.remove("loading");
    logBtn.disabled = false;
  }
});





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
