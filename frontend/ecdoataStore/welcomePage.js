
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

console.log("🔥 Firebase initialized and Firestore ready for login!");


// 🔹 Display username when logged in
onAuthStateChanged(auth, async (user) => {

  const usernameDisplay = document.getElementById("usernameDisplay");
  const loginBtn = document.getElementById("loginBtn");

  if (!usernameDisplay) return;

  if (user) {
    // change login to signed!
    loginBtn.textContent = `Signed!`;

    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (userDoc.exists()) {
      const userData = userDoc.data();
      usernameDisplay.textContent = `Welcome, ${userData.username}!`;
    } else {
      usernameDisplay.textContent = "Welcome, to EcoShop!";
    }

  } else {
    usernameDisplay.textContent = "Welcome, to EcoShop!";
  }

});


















