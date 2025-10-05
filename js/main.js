// 🧠 Utility to create a custom popup for phone input
function showPhonePopup(callback) {
  // Create overlay and popup
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0, 0, 0, 0.5)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "1000";

  const popup = document.createElement("div");
  popup.style.background = "#fff";
  popup.style.padding = "20px";
  popup.style.borderRadius = "12px";
  popup.style.textAlign = "center";
  popup.style.boxShadow = "0 4px 10px rgba(0,0,0,0.2)";
  popup.innerHTML = `
    <h3 style="margin-bottom: 10px;">📱 Enter your phone number</h3>
    <input type="tel" id="phoneInput" placeholder="233241234567" 
          style="padding:10px; width:100%; border:1px solid #ccc; border-radius:6px; font-size:16px;">
    <div style="margin-top:15px; display:flex; gap:10px; justify-content:center;">
      <button id="confirmBtn" style="background:#007bff;color:white;padding:8px 16px;border:none;border-radius:6px;">Confirm</button>
      <button id="cancelBtn" style="background:#ccc;color:black;padding:8px 16px;border:none;border-radius:6px;">Cancel</button>
    </div>
  `;

  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  // Handle buttons
  document.getElementById("confirmBtn").onclick = () => {
    const phone = document.getElementById("phoneInput").value.trim();
    if (!phone) {
      alert("❌ Please enter your phone number");
      return;
    }
    document.body.removeChild(overlay);
    callback(phone);
  };
  document.getElementById("cancelBtn").onclick = () => {
    document.body.removeChild(overlay);
  };
}

// 🟢 Attach event to all buy buttons
document.querySelectorAll(".buy-btn").forEach(button => {
  button.addEventListener("click", () => {
    const network = button.dataset.network;
    const volume = button.dataset.size; // e.g., 2GB, 5GB
    const price = button.dataset.price;

    // Show the custom popup to get phone
    showPhonePopup(phone => {
      // Continue with Paystack
      payWithPaystack(network, phone, volume, price);
    });
  });
});

// 💳 Paystack Payment
function payWithPaystack(network, phone, volume, price) {
  let handler = PaystackPop.setup({
    key: "pk_live_635856447ee14b583349141b7271f64c9b969749", // ✅ Replace with your live key
    email: "customer@email.com",
    amount: price * 100, // Convert to pesewas
    currency: "GHS",
    callback: function(response) {
      // After payment success
      orderBundle(network, phone, volume, response.reference);
    },
    onClose: function() {
      alert("❌ Payment cancelled.");
    }
  });

  handler.openIframe();
}

// 🚀 Send order to your backend
async function orderBundle(network, phone, volume, reference) {
  try {
    const response = await fetch("http://localhost:5000/api/buy-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        network,
        phone,
        volume: parseInt(volume),
        paymentReference: reference
      })
    });

    const result = await response.json();
    if (result.success) {
      alert("✅ Data bundle purchased successfully!");
    } else {
      alert("❌ Failed to purchase data. Please contact support.");
      console.error("❌ API Error:", result);
    }
  } catch (err) {
    console.error("⚠️ Server error:", err);
    alert("⚠️ Server error. Try again later.");
  }
}
