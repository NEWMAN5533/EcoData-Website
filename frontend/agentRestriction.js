
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
  import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
  import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
  import { signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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

  onAuthStateChanged(auth, async (user) => {

    const usernameDisplay = document.getElementById("usernameDisplay");
      const ifUserName = document.getElementById("ifUserName");
      const helloName = document.getElementById("helloName");
      const helloContent = document.getElementById("helloContent");
    
          const greeting = updateClock();
    
          if (user) {
          const userSnap = await getDoc(doc(db, "users", user.uid));
          usernameDisplay.textContent = `${greeting}, ${userSnap.data().username}!`;
          ifUserName.textContent = `${userSnap.data().username}`;
          helloName.textContent = `Please, ${userSnap.data().username}`;
          helloContent.textContent = 'The data bundle will be  sent after successful payment, .Make sure you click "I Have Completed the payment" for verification.';
        } else {
          usernameDisplay.textContent = `${greeting}, ${userDoc.data().username}!`;
        }
    





    try {
       if(!user) return;
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
      
          if (!userSnap.exists()) return;
      
          const userData = userSnap.data();


    } catch (error) {
      console.error("Error checking agent status:", error);
      window.location.href = "index.html";
    }

  });

const lapOutBtn = document.getElementById("logOut");
const logOutBtn = document.getElementById("lapOut");

if(logOutBtn){
  logOutBtn.addEventListener("click", async() => {
    try {
      await signOut(auth);
      showSnackBar("Logged out successfully!")
    } catch(err){
      console.error("LogOut error;", err);
      showSnackBar("Error logging out.", "warning");
    }
  })
}


// laptop logout
if(lapOutBtn) {
 
  lapOutBtn.addEventListener("click", async() => {

    try {
      await signOut(auth);
      showSnackBar("Logged out successfully!");
      window.location.href = "index.html";
    } catch (error) {
      console.error("LogOut error:", error);
      showSnackBar("Error logging out.");
    }
  });
}



  
  // === REAL TIME CLOCK ===
function updateClock() {
  const clock = document.getElementById("clock");
  const now = new Date();

  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const dayName = days[now.getDay()];

  let hours = now.getHours();
  let minutes = now.getMinutes();
  let seconds = now.getSeconds();

  // Greeting logic
  let greeting = "";
  if (hours < 12) greeting = "Good Morning";
  else if (hours < 18) greeting = "Good Afternoon";
  else greeting = "Good Evening";

  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;

  clock.innerHTML = `${dayName} ${hours}:${minutes}:${seconds} ${ampm}`;

  return greeting; // 🔥 important
}

setInterval(updateClock, 1000);
updateClock();




// ===== SNACKBAR FUNCTION ===== //
let snackbarTimeout = null;

function showSnackBar(message, type = "info", duration = 4000) {
  let snackbar = document.querySelector(".snackbar");

  // Create snackbar if it doesn't exist
  if (!snackbar) {
    snackbar = document.createElement("div");
    snackbar.className = "snackbar";

    snackbar.innerHTML = `
      <span class="snackbar-text"></span>
      <div class="snackbar-progress"></div>
    `;

    document.body.appendChild(snackbar);
  }

  // Update text
  snackbar.querySelector(".snackbar-text").textContent = message;


  // Color by type
  if (type === "success") snackbar.style.background = "rgba(7, 29, 26, 0.95)";
  else if (type === "error") snackbar.style.background = "#88353f";
  else if (type === "warning") snackbar.style.background = "#413b2a";
  else snackbar.style.background = "rgba(7, 29, 26, 0.95)";

  // Reset progress animation
  const progress = snackbar.querySelector(".snackbar-progress");
  progress.style.animation = "none";
  void progress.offsetWidth;
  progress.style.animation = `snackbar-progress ${duration}ms linear forwards`;

  snackbar.classList.add("show");

  // Clear previous timeout
  if (snackbarTimeout) clearTimeout(snackbarTimeout);

  snackbarTimeout = setTimeout(() => {
    snackbar.classList.remove("show");
  }, duration);
}
// snackbar ends


