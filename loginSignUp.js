// === IMPORT FIREBASE MODULES ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// === FIREBASE CONFIG ===
const firebaseConfig = {
  apiKey: "AIzaSyClNBlfigtQk8AZWdMZcU9sEtVcIrS0D1g",
  authDomain: "ecodata-2bee6.firebaseapp.com",
  projectId: "ecodata-2bee6",
  storageBucket: "ecodata-2bee6.firebasestorage.app",
  messagingSenderId: "544837123249",
  appId: "1:544837123249:web:6c362350a00c6dab10b690"
};

// === INITIALIZE FIREBASE ===
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ============================
// 🔐 SIGN UP FUNCTION
// ============================
const createAccountBtn = document.getElementById("createAccount");
createAccountBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value.trim();

  if (!name || !email || !password) {
    showSnackBar("⚠ Please fill in all fields", "warning");
    return;
  }

  try {
    // ✅ Create user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // ✅ Update Firebase Auth profile
    await updateProfile(user, { displayName: name });

    // ✅ Save user info to Firestore
    await setDoc(doc(db, "users", user.uid), {
      username: name,
      email: email,
      createdAt: new Date()
    });

    showSnackBar(`✅ Welcome, ${name}! Redirecting...`, "success");

    // ✅ Redirect to homepage after short delay
    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);

  } catch (error) {
    console.error("Signup Error:", error.message);
    showSnackBar(error.message, "error");
  }
});

// ============================
// 🚪 LOGOUT FUNCTION
// ============================
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      showSnackBar("👋 Logged out successfully!", "success");

      // Optional: redirect to login page
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    } catch (error) {
      showSnackBar(error.message, "error");
    }
  });
}

// ============================
// ✅ SNACKBAR FUNCTION
// ============================
function showSnackBar(message, type = "info") {
  const existing = document.querySelector(".snackbar");
  if (existing) existing.remove();

  const snackbar = document.createElement("div");
  snackbar.className = "snackbar";
  snackbar.textContent = message;

  snackbar.style = `
    position: fixed;
    top: 1rem;
    right: 50%;
    transform: translateX(50%);
    background: #333;
    color: white;
    padding: 14px 20px;
    border-radius: 10px;
    font-weight: 500;
    z-index: 9999;
    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    transition: opacity 0.5s ease;
  `;

  if (type === "success") snackbar.style.background = "#28a745";
  else if (type === "error") snackbar.style.background = "#dc3545";
  else if (type === "warning") snackbar.style.background = "#ffc107";
  else snackbar.style.background = "#007bff";

  document.body.appendChild(snackbar);

  setTimeout(() => {
    snackbar.style.opacity = "0";
    setTimeout(() => snackbar.remove(), 500);
},3000);
}