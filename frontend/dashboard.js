// --- Import Firebase & Firestore ---
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy
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
  if (!user) return;
  const userEmail = user.email; // ✅ string value

  const q = query(collection(db, "orders"), where("createdBy", "==",userEmail));

    try {
      const snapshot = await getDocs(q);

      let totalSpent = 0;
      let totalOrders = 0;
      let totalGB = 0;
      let recentOrder = "--";

      const allOrders = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        allOrders.push(data);

        totalOrders++;
        totalSpent += data.amount || 0;
        totalGB += data.volume || 0;

        if (!recentOrder && data.reference) {
          recentOrder = data.reference;
        }
      });

      // Update cards
      document.getElementById("cardTotalSpent").textContent = `GH₵ ${totalSpent.toFixed(2)}`;
      document.getElementById("cardTotalOrder").textContent = totalOrders;
      document.getElementById("cardTotalGB").textContent = `${totalGB} GB`;
      document.getElementById("cardRecentOrder").textContent = recentOrder;

      // Update table
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
            <td>${order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : "--"}</td>
          </tr>
        `)
        .join("");
    } catch (err) {
      console.error("❌ Error loading dashboard data:", err);
    }
  }

// --- Auth State Listener ---
onAuthStateChanged(auth, user => {
  if (user) {
    console.log("👤 Logged in user:", user.email);
    loadDashboardData(user.uid);
  } else {
    console.warn("⚠ No user logged in. Showing guest message.");
    document.querySelector(".dashboard-hero-container h2").textContent = "Guest Dashboard";
    document.getElementById("ordersTableBody").innerHTML = `
      <tr><td colspan="7">Please sign in to view your orders.</td></tr>`;
}
});

// Run it on page load
window.addEventListener("DOMContentLoaded", loadDashboardData);