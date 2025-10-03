// main.js

// Attach event listeners to all "Buy Now" buttons
document.querySelectorAll(".buy-btn").forEach(button => {
  button.addEventListener("click", () => {
    const network = button.dataset.network;
    const packageName = button.dataset.package; // ✅ correct name
    const size = parseInt(button.dataset.size, 10); // ✅ number
    const price = parseFloat(button.dataset.price);

    // Ask user for phone number
    const phone = prompt("📱 Enter your phone number:");

    if (!phone) {
      alert("❌ Phone number is required!");
      return;
    }

    // Call Paystack checkout
    payWithPaystack(network, packageName, size, phone, price);
  });
});

// Paystack payment
function payWithPaystack(network, packageName, size, phone, price) {
  let handler = PaystackPop.setup({
    key: "pk_live_635856447ee14b583349141b7271f64c9b969749", 
    email: "customer@email.com",
    amount: price * 100, // pesewas
    currency: "GHS",
    callback: function(response) {
      // After payment success
      orderBundle(network, packageName, size, phone, response.reference);
    },
    onClose: function() {
      alert("❌ Payment cancelled.");
    }
  });

  handler.openIframe();
}

// Call backend API after successful Paystack payment
async function orderBundle(network, phone, packageName, size, reference) {
  try {
    const response = await fetch("/api/buy-data", {   // ✅ no http://localhost needed
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        network,
        recipient: phone,
        package: packageName,
        size: Number(size),        // ✅ ensure number
        paymentReference: reference
      })
    });

    const result = await response.json();
    if (result.success) {
      alert("✅ Data bundle purchased successfully!");
    } else {
      alert("❌ Failed: " + (result.error || "Please contact support."));
    }
  } catch (err) {
    console.error(err);
    alert("⚠️ Server error. Try again later.");
  }
}
