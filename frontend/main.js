// main.js

// Attach event listeners to all "Buy Now" buttons
document.querySelectorAll(".buy-btn").forEach(button => {
  button.addEventListener("click", () => {
    const packageName = button.dataset.package;   // bundle name or code
    const network = button.dataset.network;
    const size = button.dataset.size;             // data volume (e.g. 2GB)
    const price = button.dataset.price;

    const recipient = prompt("📱 Enter your phone number (e.g. 233241234567):");

    if (!recipient) {
      alert("❌ Phone number is required!");
      return;
    }

    // ✅ Call Paystack checkout
    payWithPaystack(network, recipient, packageName, size, price);
  });
});

// ✅ Paystack payment
function payWithPaystack(network, recipient, packageName, size, price) {
  let handler = PaystackPop.setup({
    key: "pk_live_635856447ee14b583349141b7271f64c9b969749", // 🔑 Your Paystack public key
    email: "customer@email.com", // Replace with real customer email
    amount: price * 100, // Paystack uses kobo/pesewas
    currency: "GHS",
    callback: function(response) {
      // ✅ After payment success, place order
      orderBundle(network, recipient, packageName, size, response.reference);
    },
    onClose: function() {
      alert("❌ Payment cancelled.");
    }
  });

  handler.openIframe();
}

// ✅ Send order to backend API after Paystack payment verification
async function orderBundle(network, recipient, packageName, size, reference) {
  try {
    const API_BASE = window.location.hostname ===
    "localhost"?
      "http://localhost:3000" :
      "https://eco-data.onrender.com"; // Replace with your production URL
    const response = await fetch("http://localhost:3000/api/buy-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        network,
        recipient,
        package: packageName,
        size: parseInt(size),
        paymentReference: reference
      })
    });

    const result = await response.json();

    if (result.success) {
      alert("✅ Data bundle purchased successfully!");
      console.log("📦 Order details:", result.order || result.swift);
    } else {
      alert(`❌ Failed to purchase data: ${result.message || "Unknown error"}`);
      console.error("❌ API Error:", result);
    }
  } catch (err) {
    console.error("⚠ Server error:", err);
    alert("⚠ Server error. Please try again later.");
  }
}

// ✅ REAL TIME CLOCK
function updateClock() {
  const clock = document.getElementById("clock");
  const now = new Date();

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = days[now.getDay()];

  let hours = now.getHours();
  let minutes = now.getMinutes();
  let seconds = now.getSeconds();
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12; // convert to 12-hour format
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;

  clock.innerHTML = `${dayName} ${hours}:${minutes}:${seconds} ${ampm}`;
}

setInterval(updateClock, 1000);
updateClock();

