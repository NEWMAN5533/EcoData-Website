import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyClNBlfigtQk8AZWdMZcU9sEtVcIrS0D1g",
  authDomain: "ecodata-2bee6.firebaseapp.com",
  projectId: "ecodata-2bee6",
  storageBucket: "ecodata-2bee6.firebasestorage.app",
  messagingSenderId: "544837123249",
  appId: "1:544837123249:web:6c362350a00c6dab10b690"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);



// ======================================================
// GET TWO USERNAME INITIALS
// ======================================================

function getUsernameInitials(username) {

  if (!username) return "GU";

  const nameParts = username
    .trim()
    .split(/\s+/)
    .filter(Boolean);


  // No name
  if (nameParts.length === 0) {
    return "GU";
  }


  // Only one name
  if (nameParts.length === 1) {

    return nameParts[0]
      .charAt(0)
      .toUpperCase();

  }


  // First letter of first name
  const firstLetter =
    nameParts[0]
      .charAt(0)
      .toUpperCase();


  // First letter of last name
  const lastLetter =
    nameParts[nameParts.length - 1]
      .charAt(0)
      .toUpperCase();


  return firstLetter + lastLetter;
}




// ======================================================
// AUTH STATE
// ======================================================

onAuthStateChanged(auth, async (user) => {

  const usernameDisplay =
    document.getElementById("usernameDisplay");

  const ifUserName =
    document.getElementById("ifUserName");

  const helloName =
    document.getElementById("helloName");

  const helloContent =
    document.getElementById("helloContent");

  // NEW: initials element
  const usernameInitials =
    document.getElementById("usernameInitials");


  const greeting = updateClock();


  // ====================================================
  // USER LOGGED IN
  // ====================================================

  if (user) {

    try {

      const userSnap =
        await getDoc(
          doc(db, "users", user.uid)
        );


      if (!userSnap.exists()) {

        console.warn(
          "User document does not exist."
        );

        return;

      }


      const userData =
        userSnap.data();


      const username =
        userData.username || "User";


      // ==================================================
      // USERNAME DISPLAY
      // ==================================================

      usernameDisplay.innerHTML =
        `${greeting}, ${username} <img src="./css/icons/waving.png" alt="">`;


      ifUserName.textContent =
        username;


      helloName.textContent =
        `Please, ${username}`;


      helloContent.textContent =
        'The data bundle will be sent after successful payment. Make sure you click "I Have Completed the payment" for verification.';


      // ==================================================
      // CREATE USERNAME INITIALS
      // ==================================================

      if (usernameInitials) {

        usernameInitials.textContent =
          getUsernameInitials(username);

      }



      // ==================================================
      // ADMIN / AGENT ACCESS
      // ==================================================

      const adminLink1 =
        document.getElementById(
          "adminAccessLink1"
        );

      const adminLink2 =
        document.getElementById(
          "agentAccessLink2"
        );


      const agentLinks =
        adminLink2;


      // ==================================================
      // AGENT ACCESS
      // ==================================================

      if (
        userData.isAgent === true &&
        userData.isAdmin !== true
      ) {

        if (agentLinks) {

          agentLinks.style.display =
            "flex";

        // IF verification === "true" : url with window.location.href = "";
          agentLinks.addEventListener("click", ()=> {
            window.location.href = "./agentPage.html";
          });

        }

      }



      // ==================================================
      // ADMIN ACCESS
      // ==================================================

      const adminLinks = [
        adminLink1,
        adminLink2
      ];


      if (userData.isAdmin === true) {

        adminLinks.forEach(link => {

          if (link) {

            link.style.display =
              "flex";

          }

        });


        // IF verification === "true" : url with window.location.href =""
      adminLink1.addEventListener("click", ()=> {
        window.location.href = "./ecodataStoreAdmin/index.html";
      });

      adminLink2.addEventListener("click", ()=> {
        window.location.href = "./agentPage.html";
      })

      }


    } catch (err) {

      console.error(
        "Error fetching user data:",
        err
      );

    }


  } else {

    // ==================================================
    // USER NOT LOGGED IN
    // ==================================================

    if (usernameDisplay) {

      usernameDisplay.innerHTML =
        `${greeting}, Dear <img src="./css/icons/more.png.png" alt="">`;

    }


    if (usernameInitials) {

      usernameInitials.textContent =
        "";

    }

  }

});




// ======================================================
// LOGOUT BUTTONS
// ======================================================

const lapOutBtn =
  document.getElementById("logOut");

const logOutBtn =
  document.getElementById("lapOut");




// ======================================================
// NORMAL LOGOUT
// ======================================================

if (logOutBtn) {

  logOutBtn.addEventListener(
    "click",
    async () => {

      try {

        await signOut(auth);

        showSnackBar(
          "Logged out successfully!",
          "success"
        );

      } catch (err) {

        console.error(
          "LogOut error:",
          err
        );

        showSnackBar(
          "Error logging out.",
          "warning"
        );

      }

    }
  );

}




// ======================================================
// LAPTOP LOGOUT
// ======================================================

if (lapOutBtn) {

  lapOutBtn.addEventListener(
    "click",
    async () => {

      try {

        await signOut(auth);

        showSnackBar(
          "Logged out successfully!",
          "success"
        );

      } catch (error) {

        console.error(
          "LogOut error:",
          error
        );

        showSnackBar(
          "Error logging out.",
          "warning"
        );

      }

    }
  );

}




// ======================================================
// SIGNUP / LOGIN POPUP
// ======================================================

onAuthStateChanged(auth, (user) => {

  const seen =
    localStorage.getItem(
      "signupPromptSeen"
    );


  if (!user && !seen) {

    setTimeout(() => {

      showSignupModal();

    }, 2000);

  }

});



const signupModal =
  document.getElementById("signupModal");

const closeSignup =
  document.getElementById("closeSignup");



function showSignupModal() {

  if (!signupModal) return;

  signupModal.classList.add(
    "active"
  );

}



function hideSignupModal() {

  if (!signupModal) return;

  signupModal.classList.remove(
    "active"
  );

}



if (closeSignup) {

  closeSignup.addEventListener(
    "click",
    () => {

      hideSignupModal();

      localStorage.setItem(
        "signupPromptSeen",
        "yes"
      );

    }
  );

}




// ======================================================
// CREATE ACCOUNT
// ======================================================

const createAccountBtn =
  document.getElementById(
    "createAccountBtn"
  );


if (createAccountBtn) {

  createAccountBtn.onclick = () => {

    window.location.href =
      "./signUp.html";

  };

}




// ======================================================
// LOGIN
// ======================================================

const loginBtn =
  document.getElementById(
    "loginBtn"
  );


if (loginBtn) {

  loginBtn.onclick = () => {

    window.location.href =
      "./login.html";

  };

}




// ======================================================
// REAL TIME CLOCK
// ======================================================

function updateClock() {

  const clock =
    document.getElementById("clock");


  const now =
    new Date();


  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];


  const dayName =
    days[now.getDay()];


  let hours =
    now.getHours();

  let minutes =
    now.getMinutes();

  let seconds =
    now.getSeconds();


  // ====================================================
  // GREETING
  // ====================================================

  let greeting = "";


  if (hours < 12) {

    greeting =
      "Good Morning";

  } else if (hours < 18) {

    greeting =
      "Good Afternoon";

  } else {

    greeting =
      "Good Evening";

  }


  // ====================================================
  // TIME
  // ====================================================

  const ampm =
    hours >= 12
      ? "PM"
      : "AM";


  hours =
    hours % 12 || 12;


  minutes =
    minutes < 10
      ? "0" + minutes
      : minutes;


  seconds =
    seconds < 10
      ? "0" + seconds
      : seconds;


  if (clock) {

    clock.innerHTML =
      `${dayName} ${hours}:${minutes}:${seconds} ${ampm}`;

  }


  return greeting;

}



setInterval(
  updateClock,
  1000
);


updateClock();




// ======================================================
// SNACKBAR
// ======================================================

let snackbarTimeout = null;



function showSnackBar(
  message,
  type = "info",
  duration = 4000
) {

  let snackbar =
    document.querySelector(
      ".snackbar"
    );


  // ====================================================
  // CREATE SNACKBAR
  // ====================================================

  if (!snackbar) {

    snackbar =
      document.createElement(
        "div"
      );

    snackbar.className =
      "snackbar";


    snackbar.innerHTML = `
      <span class="snackbar-text"></span>
      <div class="snackbar-progress"></div>
    `;


    document.body.appendChild(
      snackbar
    );

  }


  // ====================================================
  // UPDATE MESSAGE
  // ====================================================

  snackbar
    .querySelector(
      ".snackbar-text"
    )
    .textContent =
      message;



  // ====================================================
  // BACKGROUND
  // ====================================================

  if (type === "success") {

    snackbar.style.background =
      "rgba(7, 29, 26, 0.95)";

  } else if (type === "error") {

    snackbar.style.background =
      "#88353f";

  } else if (type === "warning") {

    snackbar.style.background =
      "#413b2a";

  } else {

    snackbar.style.background =
      "rgba(7, 29, 26, 0.95)";

  }



  // ====================================================
  // PROGRESS ANIMATION
  // ====================================================

  const progress =
    snackbar.querySelector(
      ".snackbar-progress"
    );


  if (progress) {

    progress.style.animation =
      "none";


    void progress.offsetWidth;


    progress.style.animation =
      `snackbar-progress ${duration}ms linear forwards`;

  }



  snackbar.classList.add(
    "show"
  );


  // ====================================================
  // CLEAR PREVIOUS TIMER
  // ====================================================

  if (snackbarTimeout) {

    clearTimeout(
      snackbarTimeout
    );

  }


  snackbarTimeout =
    setTimeout(() => {

      snackbar.classList.remove(
        "show"
      );

    }, duration);

}