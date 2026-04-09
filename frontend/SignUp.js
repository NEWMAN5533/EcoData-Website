
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
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


// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


console.log("🔥 Firebase initialized and Firestore ready for signUp!");


const signupForm = document.getElementById("signup-form");
const sinBtn = document.getElementById("signBtn");

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  sinBtn.classList.add("loading");
  sinBtn.disabled = true;

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();


  const confirmPassword = document.getElementById("confirmPassword")?.value.trim();

  // ✅ Validation


  if ( !username || !email || !password ) {
    showSnackBar("Please fill all fields", "warning");
    resetBtn();
    return;
  }


    if( password !== confirmPassword ){
    showSnackBar("Password do not match", "error");
    resetBtn();
    return;
  }

  if ( password.length < 6 ) {
    showSnackBar("Password must be at least 6 characters", "warning");
    resetBtn();
    return;
  }

  try {

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // ✅ Save to Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      username,
      email,
      role: "user",
      balance: 0,
      createdAt: serverTimestamp()
    });

    showSnackBar("Signup successful!", "success");

    // ✅ Delay redirect (better UX)
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1200);

  } catch (error) {

    let message = "Signup failed";

    if (error.code === "auth/email-already-in-use") {
      message = "Email already registered";
    } else if (error.code === "auth/invalid-email") {
      message = "Invalid email address";
    } else if (error.code === "auth/weak-password") {
      message = "Password too weak";
    }

    showSnackBar(message, "error");

  } finally {
    resetBtn();
  }

});

// 🔹 Reset button safely
function resetBtn() {
  sinBtn.classList.remove("loading");
  sinBtn.disabled = false;
}


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

  // color types
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



















