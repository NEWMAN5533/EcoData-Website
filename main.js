// main.js

// Attach event listeners to all "Buy Now" buttons
document.querySelectorAll(".buy-btn").forEach(button => {
  button.addEventListener("click", () => {
    const packageName = button.dataset.package;   // ✅ was bundlecode
    const network = button.dataset.network;
    const size = button.dataset.size;             // ✅ Swift requires size
    const price = button.dataset.price;

    // Ask user for phone number
    const recipient = prompt("📱 Enter your phone number:");

    if (!recipient) {
      alert("❌ Phone number is required!");
      return;
    }

    // Call Paystack checkout
    payWithPaystack(network, recipient, packageName, size, price);
  });
});

// Paystack payment
function payWithPaystack(network, recipient, packageName, size, price) {
  let handler = PaystackPop.setup({
    key: "pk_live_635856447ee14b583349141b7271f64c9b969749", // your Paystack public key
    email: "customer@email.com", // test email
    amount: price * 100, // convert to pesewas
    currency: "GHS",
    callback: function(response) {
      // After payment success
      orderBundle(network, recipient, packageName, size, response.reference);
    },
    onClose: function() {
      alert("❌ Payment cancelled.");
    }
  });

  handler.openIframe();
}

// Call backend API after successful Paystack payment
async function orderBundle(network, recipient, packageName, size, reference) {
  try {
    const response = await fetch("http://localhost:5000/api/buy-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        network,
        recipient,       // ✅ renamed
        package: packageName, // ✅ renamed
        size: parseInt(size), // ✅ must be a number
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


// REAL TIME //

 function updateClock() {
      const clock = document.getElementById("clock");
      const now = new Date();

      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayName = days[now.getDay()];

      let hours = now.getHours();
      let minutes = now.getMinutes();
      let seconds = now.getSeconds();
      const ampm = hours >= 12 ? "PM" : "AM";

      hours = hours % 12;
      hours = hours ? hours : 12; // 12-hour format
      minutes = minutes < 10 ? "0" + minutes : minutes;
      seconds = seconds < 10 ? "0" + seconds : seconds;

      clock.innerHTML = `${dayName} ${hours}:${minutes}:${seconds} ${ampm}`;
    }

    // update every second
    setInterval(updateClock, 1000);
    updateClock(); // run once on load

    // SIDEBAR //
    const toggler = document.getElementById("sidebarToggler");
    const sidebar = document.querySelector(".sidebar");

    // function // 
    toggler.addEventListener("click", function() {
      if (sidebar.style.left === "-500px"){
        sidebar.style.left = "0px";
      } else {
        sidebar.style.left = "-500px";
      }
    })