 import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
  import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
  import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

  const firebaseConfig = {
    apiKey: "AIzaSyClNBlfigtQk8AZWdMZcU9sEtVcIrS0D1g",
    authDomain: "ecodata-2bee6.firebaseapp.com",
    projectId: "ecodata-2bee6",
    storageBucket: "ecodata-2bee6.firebasestorage.app",
    messagingSenderId: "544837123249",
    appId: "1:544837123249:web:6c362350a00c6dab10b690"
  };

  const app = initializeApp(firebaseConfig);
  // export instances to global window so main.js can use them without module imports
  window._FIREBASE_APP_ = app;
  window._FIRESTORE_ = getFirestore(app);
  window._FIREBASE_AUTH_ = getAuth(app);