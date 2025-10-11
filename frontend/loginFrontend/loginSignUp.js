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
      alert(" Please fill all fields!", "info");
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        alert("Account created successfully!", "success");
      })
      // Redirect after a short delay
  

      .catch((error) => {
        alert( error.message, "error");
      });
  });

 
const createAccountBtn = document.getElementById("createAccount");

createAccountBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value.trim();

  if (!name || !email || !password) {
    alert("Please fill in all fields", "error");
    return;
  }

  try {
    // ✅ Create user with Firebase Auth
    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // ✅ Update display name
    await user.updateProfile({ displayName: name });

    alert("Account created for", `${user.displayName}!`, "success");

    // Redirect after short delay
    setTimeout(() => {
      window.location.href = "index.html"; // change this to your page
    }, 2000);

  } catch (error) {
    console.error(" Signup Error:", error.message);
    alert(error.message, "error");
}
});



  // ===========================
  // 🚪 LOGOUT FUNCTION
  // ===========================
  const logoutBtn = document.getElementById("logout-btn");
  logoutBtn.addEventListener("click", () => {
    signOut(auth)
      .then(() => {
        alert(" Logged out successfully!", "success");
      })
      .catch((error) => {
        alert(error.message, "error");
      });
});



// SNACKBAR //
function showSnackbar(message, type = "info") {
  const snackbar = document.getElementById("snackbar");
  snackbar.className = show `snack-${type}`;
  snackbar.textContent = message;

  setTimeout(() => {
    snackbar.className = snackbar.className.replace("show", "");
},4000);
}