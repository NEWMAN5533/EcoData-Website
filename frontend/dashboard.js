// === REALTIME DASHBOARD LISTENER ===
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const db = window.FIRESTORE;
    if (!db) {
      console.warn("Firestore not initialized. Make sure firebase-config.js is loaded first.");
      return;
    }

    const { collection, onSnapshot, query, orderBy } = await import(
      "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js"
    );

    const ordersCol = collection(db, "orders");
    const q = query(ordersCol, orderBy("createdAt", "desc"));
    const tableBody = document.getElementById("ordersTableBody");

    // Listen in real time 🔥
    onSnapshot(q, (snapshot) => {
      tableBody.innerHTML = "";

      let totalAmount = 0;
      let totalGB = 0;
      let totalOrders = 0;
      let recentOrder = null;

      snapshot.forEach((doc) => {
        const order = doc.data();
        const createdAt = order.createdAt?.toDate
          ? order.createdAt.toDate().toLocaleString()
          : "—";

        // Build row
        const row = `
          <tr>
            <td>${order.orderId || "—"}</td>
            <td>${order.volume || "—"} GB</td>
            <td>${order.recipient || "—"}</td>
            <td>${order.network || "—"}</td>
            <td class="status-cell ${order.status?.toLowerCase() || "pending"}">
              ${order.status || "Pending"}
            </td>
            <td>₵${Number(order.amount || 0).toFixed(2)}</td>
            <td>${createdAt}</td>
          </tr>
        `;
        tableBody.insertAdjacentHTML("beforeend", row);

        // Update cards
        totalOrders++;
        totalAmount += Number(order.amount || 0);
        totalGB += Number(order.volume || 0);
        if (!recentOrder) recentOrder = order;
      });

      // Update cards
      document.querySelector("#cardTotalSpent p").textContent = `₵${totalAmount.toFixed(2)}`;
      document.querySelector("#cardTotalGB p").textContent = `${totalGB.toFixed(2)} GB`;
      document.querySelector("#cardTotalOrders p").textContent = totalOrders;
      document.querySelector("#cardRecentOrder p").textContent =
        recentOrder ? `${recentOrder.network} (${recentOrder.status})` : "—";
    });
  } catch (err) {
    console.error("❌ Error setting up real-time listener:",err);
}
});