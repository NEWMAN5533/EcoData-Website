
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import { firebaseConfig } from "./firebase.js";

// import exported functions
import { updateClock } from "./clock";
import { hideSignupModal } from "./modal.js";
import { showSignupModal } from "./modal.js";
import { showSnackBar } from "./snackbar.js";
import { logoutUser } from "./logOutUser.js";
import { getUserData } from "./user.js";
import { updateUserUI } from "./ui.js";
import { updateAccess } from "./ui.js";


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);




onAuthStateChanged(auth, async (user) => {

  const usernameDisplay = document.getElementById("usernameDisplay");
  const ifUserName = document.getElementById("ifUserName");
  const helloName = document.getElementById("helloName");
  const helloContent = document.getElementById("helloContent");

  const greeting = updateClock();

if (user) {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      if(!user) return;

      if (!userSnap.exists()) return;

      updateUserUI(userData, greeting);

      updateAccess(userData);

    }
    
    logoutUser(auth);

    showSignupModal();

  });
