
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";


// firebaseConfig 
import { firebaseConfig } from "./all_js/firebase.js";

// import firebase config
import { showSignupModal } from "./all_js/modal.js";
import { hideSignupModal } from "./all_js/modal.js";
import { showGuestUI } from "./all_js/ui.js";
import { updateUserUI } from "./all_js/ui.js";
import { updateAccess } from "./all_js/ui.js";
import { updateClock } from "./all_js/clock.js";
import { getUserData } from "./all_js/user.js";



onAuthStateChanged(auth, async (user) => {

  const greeting = updateClock();

  if(!user) {
    showGuestUI(greeting);
    showSignupModal();
    return;
  }


  const userData = await 
  getUserData(user.uid);

  if(!userData) return;

  updateUserUI(userData, greeting);

  updateAccess(userData);
  

  hideSignupModal();
  showSignupModal();
});
