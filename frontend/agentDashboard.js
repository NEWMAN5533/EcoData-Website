import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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

let currentUser = null;
let storeId = null;

// ===== Check login and get store info =====
onAuthStateChanged(auth, async (user) => {
  //if (!user) return window.location.href = "login.html";

  currentUser = user;
  const userDoc = await getDoc(doc(db, "users", user.uid));
  const userData = userDoc.data();

  // Agent Info
  document.getElementById("agentName").textContent = userData.username || "Agent";
  storeId = userData.storeId;

  // Display balance
  const storeDoc = await getDoc(doc(db, "stores", storeId));
  document.getElementById("agentBalance").textContent = storeDoc.data().balance || 0;

  loadWithdrawalHistory();
});

// ===== Request Withdrawal =====
document.getElementById("withdrawForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const amount = parseFloat(document.getElementById("withdrawAmount").value);
  const momo = document.getElementById("momoNumber").value.trim();

  if (!amount || amount <= 0) return showSnackBar("Enter a valid amount", "error");

  try {
    await addDoc(collection(db, "withdrawRequests"), {
      storeId,
      amount,
      momoNumber: momo,
      name: currentUser.displayName || "Agent",
      status: "pending",
      requestedAt: serverTimestamp(),
      approvedAt: null,
      approvedBy: null
    });
    showSnackBar("Withdrawal request sent ✅", "success");
    document.getElementById("withdrawForm").reset();
    loadWithdrawalHistory();
  } catch (err) {
    console.error(err);
    showSnackBar("Error sending request", "error");
  }
});

// ===== Load Withdrawal History =====
async function loadWithdrawalHistory() {
  const tbody = document.querySelector("#withdrawHistory tbody");
  tbody.innerHTML = "";

  const q = query(
    collection(db, "withdrawRequests"),
    where("storeId", "==", storeId),
    orderBy("requestedAt", "desc")
  );

  const snapshot = await getDocs(q);
  snapshot.forEach(docSnap => {
    const r = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>GHS ${r.amount}</td>
      <td>${r.momoNumber}</td>
      <td class="status-${r.status}">${r.status}</td>
      <td>${r.requestedAt?.toDate().toLocaleString() || "-"}</td>
      <td>${r.approvedAt?.toDate().toLocaleString() || "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ===== SnackBar =====
let snackbarTimeout = null;
function showSnackBar(msg, type="info", duration=4000) {
  let snackbar = document.querySelector(".snackbar");
  if(!snackbar){
    snackbar = document.createElement("div");
    snackbar.className = "snackbar";
    snackbar.innerHTML = `<span class="snackbar-text"></span><div class="snackbar-progress"></div>`;
    document.body.appendChild(snackbar);
  }
  snackbar.querySelector(".snackbar-text").textContent = msg;
  snackbar.style.background = type==="success" ? "#074d23" : type==="error" ? "#dc3545" : "#ffc107";
  const progress = snackbar.querySelector(".snackbar-progress");
  progress.style.animation="none"; void progress.offsetWidth;
  progress.style.animation = `snackbar-progress ${duration}ms linear forwards`;
  snackbar.classList.add("show");
  if(snackbarTimeout) clearTimeout(snackbarTimeout);
  snackbarTimeout = setTimeout(()=> snackbar.classList.remove("show"), duration);
}