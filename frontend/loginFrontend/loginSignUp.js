  // Import Firebase SDKs
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
  import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut 
  } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

  // Your Firebase config
  const firebaseConfig = {
  apiKey: "AIzaSyClNBlfigtQk8AZWdMZcU9sEtVcIrS0D1g",
  authDomain: "ecodata-2bee6.firebaseapp.com",
  projectId: "ecodata-2bee6",
  storageBucket: "ecodata-2bee6.firebasestorage.app",
  messagingSenderId: "544837123249",
  appId: "1:544837123249:web:6c362350a00c6dab10b690"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  // ===========================
  // 🔐 SIGN UP FUNCTION
  // ===========================
  const createAccount = document.getElementById("createAccount");
  createAccount.addEventListener("click", (e) => {
    e.preventDefault();
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    if (!email || !password) {
      showSnackbar(" Please fill all fields!", "info");
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        showSnackbar("Account created successfully!", "success");
      })
      // Redirect after a short delay
  

      .catch((error) => {
        showSnackbar( error.message, "error");
      });
  });

 
const createAccountBtn = document.getElementById("createAccount");

createAccountBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value.trim();

  if (!name || !email || !password) {
    showSnackbar("Please fill in all fields", "error");
    return;
  }

  try {
    // ✅ Create user with Firebase Auth
    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // ✅ Update display name
    await user.updateProfile({ displayName: name });

    showSnackBar("Account created for", `${user.displayName}!`, "success");

    // Redirect after short delay
    setTimeout(() => {
      window.location.href = "index.html"; // change this to your page
    }, 2000);

  } catch (error) {
    console.error(" Signup Error:", error.message);
    showSnackBar(error.message, "error");
}
});



  // ===========================
  // 🚪 LOGOUT FUNCTION
  // ===========================
  const logoutBtn = document.getElementById("logout-btn");
  logoutBtn.addEventListener("click", () => {
    signOut(auth)
      .then(() => {
        showSnackbar(" Logged out successfully!", "success");
      })
      .catch((error) => {
        showSnackbar(error.message, "error");
      });
});



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