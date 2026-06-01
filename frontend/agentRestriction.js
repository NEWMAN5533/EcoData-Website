
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


    try {

      // 🚨 2. Check Firestore agent status
      const userDoc = await getDoc(doc(db, "users", user.uid));

    const userData = userDoc.data();

    const hasAccess =
      userData.isAgent === true ||
      userData.isAdmin === true;

    if (!hasAccess) {

      showSnackBar("Access denied");
      window.location.href = "index.html";
      return;

    }

      // ✅ 3. If agent → Show welcome message
      usernameDisplay.textContent = `Welcome Agent, ${userDoc.data().username}!`;

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


