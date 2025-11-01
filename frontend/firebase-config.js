
  // firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// --- Your Firebase configuration (replace with yours) ---
const firebaseConfig = {
  apiKey: "AIzaSyClNBlfigtQk8AZWdMZcU9sEtVcIrS0D1g",
    authDomain: "ecodata-2bee6.firebaseapp.com",
    projectId: "ecodata-2bee6",
    storageBucket: "ecodata-2bee6.firebasestorage.app",
    messagingSenderId: "544837123249",
    appId: "1:544837123249:web:6c362350a00c6dab10b690"
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Expose globally so main.js can use it ---
window.FIREBASE_APP = app;
window.FIRESTORE = db;
window.FIREBASE_AUTH=auth;