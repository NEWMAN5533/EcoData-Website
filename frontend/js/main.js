  
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



// Create phone input modal dynamically
function createPhoneModal(callback) {
  // Remove existing modal if any
  const existing = document.getElementById("phoneModal");
  if (existing) existing.remove();

  // Modal container
  const modal = document.createElement("div");
  modal.id = "phoneModal";
  modal.style = `
    position: fixed;
    top: 0; 
    width: 100%; 
    height: 100%;
    display: flex; 
    align-items: center; 
    justify-content: center;
    max-width: 480px;
    justify-self: center;
    z-index: 9999;
  `;

  // Modal content
  const box = document.createElement("div");
  box.style = `
    background: #fff;
    padding: 25px;
    border-radius: 15px;
    width: 90%;
    height: 24rem;
    justify-content: center;
    display: flex;
    flex-direction: column;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 8px 25px rgba(0,0,0,0.4);
    animation: popUp 0.3s ease;
    z-index: 9999;
    position: relative;
  `;
  box.innerHTML = `
    <h3 style="margin-bottom: 15px; color: #000000ff;">Enter your phone number to receive the Bundle package</h3>
    <input type="tel" id="recipientInput" placeholder="e.g. 233241234567"
      style="width: 100%;
      padding: 12px; 
      border-radius: 10px; 
      border: 1px solid #222; 
      font-size: 24px; 
      text-align: center; 
      margin-bottom: 15px;
      color: white" 
      box-shadow: 0 2px 6px #ccc8c8ff;/>
    <div style="display: flex;
      gap: 40px; 
    justify-content: center;">
      <button id="cancelBtn" style="background:#999; color: white; padding:10px 18px; border:none; border-radius:10px;
      width: 50%; cursor:pointer;">Cancel</button>
      <button id="confirmBtn" style="background:#2196F3; color:white; width: 50%; padding:10px 18px; border:none; border-radius:10px; cursor:pointer;">Continue</button>
    </div>
  `;

  modal.appendChild(box);
  document.body.appendChild(modal);

  document.getElementById("cancelBtn").addEventListener("click", () => {
    modal.remove();
  });

  document.getElementById("confirmBtn").addEventListener("click", () => {
    const recipient = document.getElementById("recipientInput").value.trim();
    if (!recipient) {
      showSnackBar(" Please enter your phone number");
      return;
    }
    modal.style.display = "none";
    setTimeout(() => {
      modal.remove();
      callback(recipient);
    } , 200);
  });
}