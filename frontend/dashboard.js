async function loadOrdersDashboard() {
  const db = window._FIRESTORE_;
  if (!db) {
    console.warn("Firestore not initialized.");
    return;
  }
  const { collection, getDocs, query, orderBy } = await import(
    "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js"
  );

  const ordersCol = collection(db, "orders");
  // fetch recent 200 orders
  const q = query(ordersCol, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  let totalAmount = 0;
  let totalOrders = 0;
  let totalGB = 0;
  let recentOrder = null;

  const tbody = document.getElementById("ordersTableBody");
  tbody.innerHTML = "";

  snap.forEach(doc => {
    const o = doc.data();
    totalOrders++;
    totalAmount += Number(o.amount || 0);
    totalGB += Number(o.volume || 0);

    if (!recentOrder) recentOrder = o;

    // Append to table
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${o.orderId || o.reference || doc.id}</td>
      <td>${o.volume ?? "-"}</td>
      <td>${o.recipient ?? "-"}</td>
      <td>${o.network ?? "-"}</td>
      <td><span class="status-badge ${getStatusClass(o.status)}">${o.status}</span></td>
      <td>GHS ${Number(o.amount || 0).toFixed(2)}</td>
      <td>${o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString() : "-"}</td>
    `;
    tbody.appendChild(tr);
  });

  // update cards
  document.getElementById("totalAmount").textContent = `GHS ${totalAmount.toFixed(2)}`;
  document.getElementById("totalOrders").textContent = totalOrders;
  document.getElementById("totalGB").textContent = `${totalGB} GB`;
  document.getElementById("recentOrder").textContent = recentOrder?.orderId || recentOrder?.reference||"--";
}