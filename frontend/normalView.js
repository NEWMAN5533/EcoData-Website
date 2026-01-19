/* ==============================
   NORMAL & GRID VIEW UI BINDINGS
   ============================== */

 document.addEventListener("DOMContentLoaded", () => {
// ---------- PLACE ORDER BUTTON ----------
const placeOrderBtn = document.querySelector("#normalView .buy-btn");
const phoneInput = document.querySelector(".normalInput");



let selectedBundle = null;

// ---------- SELECT OPTION / DROPDOWN ----------
const optionBtn = document.getElementById('optionBtn');
const moveDown = document.getElementById('moveDown');

optionBtn.addEventListener('click', () => {
  moveDown.style.display = moveDown.style.display === 'block' ? 'none' : 'block';
});

document.querySelectorAll('.optionSelect').forEach(opt => {
  opt.addEventListener('click', () => {
    selectedBundle = {
      network: opt.dataset.network,
      packageName: opt.dataset.package,
      size: Number(opt.dataset.size),
      price: Number(opt.dataset.price),
    };

    // Update visible button
optionBtn.innerHTML = `
  ${selectedBundle.size}GB  <span class="price-badge">GHS ${selectedBundle.price}</span>
  <span><img src="./css/icons/more.png.png"></span>
`;




    // Update modal placeholders
    document.querySelector(".selectedModal-left-left img").style.display = "flex";

    document.querySelector(".placeHolderGB").textContent = `${selectedBundle.size}GB`;
    document.querySelector(".placeHolderPrice small").textContent = `GHS ${selectedBundle.price}`;
    document.querySelector(".selectedModal-right").textContent = selectedBundle.network.toUpperCase();

    // Close dropdown
    moveDown.style.display = 'none';
  });
});



placeOrderBtn.addEventListener("click", () => {
  if (!selectedBundle) {
    showSnackBar("⚠ Please select a bundle", "warning");
    return;
  }

  const recipient = phoneInput.value.trim();
if (!recipient || !/^\d{9,12}$/.test(recipient)) {
  showSnackBar("⚠ Enter a valid phone number", "warning");
  return;
}

  // Disable button while processing
  placeOrderBtn.disabled = true;
  showSnackBar("⏳ Initializing payment...", "info");


  
  // ✅ Collect user details
  const userEmail =  `${recipient}@ecodata.com`;
  const userName =  "Guest User";
  const userPhone = recipient;

  // ---------- PAYSTACK INTEGRATION ----------
  let handler = PaystackPop.setup({
    key: 'pk_live_635856447ee14b583349141b7271f64c9b969749', // <-- replace with your key
    email: userEmail, // optional, you can collect from input
    amount: selectedBundle.price * 100, // GHS to Kobo
    currency: 'GHS',
    metadata: {
      custom_fields: [
        {
          display_name: "Customer Name",
          variable_name: "customer_name",
          value: userName,
        },
        {
          display_name: "Phone Number",
          variable_name: "phone_number",
          value: userPhone,
        },
        {
          display_name: "Network",
          variable_name: "network",
          value: selectedBundle.network,
        },
        {
          display_name: "Package",
          variable_name: "package_name",
          value: selectedBundle.packageName,
        },
      ],
    },
    ref: 'REF_' + Math.floor(Math.random() * 1000000000),
    callback: function(response) {
      // Payment successful
      showSnackBar("💚 Payment successful! Processing order...", "success");

      // Call Swift / EcoData backend
      orderBundle(
        selectedBundle.network,
        recipient,
        selectedBundle.packageName,
        selectedBundle.size,
        response.reference
      );

      // Re-enable button
      placeOrderBtn.disabled = false;
    },
    onClose: function() {
      showSnackBar("⚠ Payment cancelled", "warning");
      placeOrderBtn.disabled = false;
    }
  });

  handler.openIframe(); // open Paystack popup
});

// ---------- NORMAL & GRID MODE TOGGLE ----------
const normalModeBtn = document.getElementById("normalModeBtn");
const gridModeBtn = document.getElementById("gridModeBtn");
const normalView = document.getElementById("normalView");
const gridView = document.getElementById("gridView");

normalModeBtn.addEventListener("click", () => {
  normalView.style.display = "block";
  gridView.style.display = "none";
});

gridModeBtn.addEventListener("click", () => {
  gridView.style.display = "block";
  normalView.style.display = "none";
});







// SNACKBAR SECTION //
// ===== SNACKBAR FUNCTION ===== //
let snackbarTimeout = null;

function showSnackBar(message, type = "info", duration = 4000) {
  let snackbar = document.querySelector(".snackbar");

  // Create snackbar if it doesn't exist
  if (!snackbar) {
    snackbar = document.createElement("div");
    snackbar.className = "snackbar";

    snackbar.innerHTML = `
      <span class="snackbar-text"></span>
      <div class="snackbar-progress"></div>
    `;

    document.body.appendChild(snackbar);
  }

  // Update text
  snackbar.querySelector(".snackbar-text").textContent = message;

  // Color by type
  if (type === "success") snackbar.style.background = "rgba(7, 29, 26, 0.95)";
  else if (type === "error") snackbar.style.background = "#dc3545";
  else if (type === "warning") snackbar.style.background = "rgba(7, 29, 26, 0.95)";
  else snackbar.style.background = "rgba(7, 29, 26, 0.95)";

  // Reset progress animation
  const progress = snackbar.querySelector(".snackbar-progress");
  progress.style.animation = "none";
  void progress.offsetWidth;
  progress.style.animation = `snackbar-progress ${duration}ms linear forwards`;

  snackbar.classList.add("show");

  // Clear previous timeout
  if (snackbarTimeout) clearTimeout(snackbarTimeout);

  snackbarTimeout = setTimeout(() => {
    snackbar.classList.remove("show");
  }, duration);
}
// snackbar ends
});



// ---------- CLOSE DROPDOWN WHEN CLICKING OUTSIDE ----------
window.addEventListener("click", (e) => {
  const dropdown = moveDown; // your dropdown element
  const button = optionBtn; // the button that opens it

  // If the clicked element is NOT the button or inside the dropdown → close it
  if (!dropdown.contains(e.target) && !button.contains(e.target)) {
    dropdown.style.display = "none";
  }
});