// --- Import Firebase & Firestore ---
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// --- Initialize Firebase ---
const db = getFirestore(window.FIREBASE_APP);
const auth = getAuth(window.FIREBASE_APP);

// --- Load Dashboard Data (for specific user) ---
async function loadDashboardData() {
  const user = window.FIREBASE_AUTH?.currentUser;

  if (!user) {
    console.warn("⚠ No user logged in — loading guest data instead.");
    loadGuestDashboard();
    return;
  }

  const userEmail = user.email;

  // ✅ Query orders for logged-in user
  const q = query(collection(db, "orders"), where("createdBy", "==", userEmail));

  try {
    const snapshot = await getDocs(q);
    const allOrders = [];
    let totalSpent = 0;
    let totalOrders = 0;
    let totalGB = 0;
    let recentOrder = "--";

    snapshot.forEach(doc => {
      const data = doc.data();
      allOrders.push(data);
      totalOrders++;
      totalSpent += data.amount || 0;
      totalGB += data.volume || 0;
      if (!recentOrder && data.reference) recentOrder = data.reference;
    });

    updateDashboardCards(totalSpent, totalOrders, totalGB, recentOrder);
    updateOrdersTable(allOrders);
  } catch (err) {
    console.error("❌ Error loading dashboard data:", err);
  }
}

// --- Load LocalStorage Guest Orders ---
function loadGuestDashboard() {
  const stored = localStorage.getItem("guestOrders");
  const guestOrders = stored ? JSON.parse(stored) : [];

  if (guestOrders.length === 0) {
    document.querySelector(".dashboard-hero-container h2").textContent = "Guest Dashboard";
    document.getElementById("ordersTableBody").innerHTML = `
      <tr><td colspan="7">No local orders found. Please sign in or make a purchase.</td></tr>`;
    return;
  }

  let totalSpent = 0;
  let totalOrders = guestOrders.length;
  let totalGB = 0;
  let recentOrder = guestOrders[guestOrders.length - 1]?.reference || "--";

  guestOrders.forEach(order => {
    totalSpent += order.amount || 0;
    totalGB += order.volume || 0;
  });

  document.querySelector(".dashboard-hero-container h2").textContent = "Guest Dashboard";
  updateDashboardCards(totalSpent, totalOrders, totalGB, recentOrder);
  updateOrdersTable(guestOrders);
}

// --- Helper: Update Dashboard Summary Cards ---
function updateDashboardCards(totalSpent, totalOrders, totalGB, recentOrder) {
  document.getElementById("cardTotalSpent").textContent = `GH₵ ${totalSpent.toFixed(2)}`;
  document.getElementById("cardTotalOrder").textContent = totalOrders;
  document.getElementById("cardTotalGB").textContent = `${totalGB} GB`;
  document.getElementById("cardRecentOrder").textContent = recentOrder;
}

// --- Helper: Update Orders Table ---
function updateOrdersTable(allOrders) {
  const tbody = document.getElementById("ordersTableBody");
  tbody.innerHTML = allOrders
    .map(order => `
      <tr>
        <td>${order.orderId || order.reference || "--"}</td>
        <td>${order.volume || 0}MB</td>
        <td>${order.recipient || "--"}</td>
        <td>${order.network || "--"}</td>
        <td>${order.status || "pending"}</td>
        <td>GH₵ ${order.amount || 0}</td>
        <td>${order.createdAt ? new Date(order.createdAt).toLocaleString() : "--"}</td>
      </tr>`)
    .join("");
}

// --- Auth State Listener ---
onAuthStateChanged(auth, user => {
  if (user) {
    console.log("👤 Logged in user:", user.email);
    loadDashboardData();
  } else {
    loadGuestDashboard();
  }
});

// ✅ Run on page load safely
window.addEventListener("DOMContentLoaded", () => loadDashboardData());