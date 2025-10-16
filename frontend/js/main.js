  
// 🚨 Check if user is logged in
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // ❌ Not logged in → redirect to login page
    window.location.href = "login.html";
  } else {
    console.log("✅ User logged in:", user.email);
}
});



// === LOAD STATUS ===
async function loadStatus() {
  try {
    const res = await fetch("https://ecodata-app.onrender.com/api/v1/orders/status");
    const data = await res.json();
    if (data.success && data.data) {
      document.getElementById("pendingCount").innerText = data.data.pending;
      document.getElementById("processingCount").innerText = data.data.processing;
      document.getElementById("completedCount").innerText = data.data.complete;
      document.getElementById("failedCount").innerText = data.data.failed;
    }
  } catch (err) {
    console.error("Error fetching status:", err);
  }
}
loadStatus();
setInterval(loadStatus,3000);