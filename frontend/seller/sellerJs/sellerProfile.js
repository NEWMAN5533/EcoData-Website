
function setText(id, value) {
  const element = document.getElementById(id);

  if (!element) {
    console.warn(`Seller profile element not found: #${id}`);
    return;
  }

  element.textContent = String(value ?? "");
}

async function loadSellerProfile() {
  const API_URL =
    "https://ecodata-app.onrender.com/api/seller/profile";

  try {
    const clerk = window.Clerk;

    if (!clerk) {
      throw new Error("Clerk has not loaded yet.");
    }

    if (typeof clerk.load === "function") {
      await clerk.load();
    }

    const session = clerk.session;

    if (!session) {
      throw new Error("Please sign in to view your seller profile.");
    }

    const token = await session.getToken();

    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    });

    const result = await response.json();

    if (!response.ok || !result.success || !result.seller) {
      throw new Error(
        result.message || "Unable to load seller profile."
      );
    }

    const seller = result.seller;

    // Store name
    setText("sellerProfileName", seller.storeName || "My Store");

    // Personal name / username
    setText(
      "sellerProfileUsername",
      seller.fullName || "@seller"
    );

    // Contact information
    setText("sellerProfileEmail", seller.email || "—");
    setText("sellerProfilePhone", seller.phoneNumber || "—");
    setText("sellerProfileLocation", seller.location || "Ghana");

    // Verification badge
    const verifiedBadge = document.querySelector(
      ".sellerProfileHero .sellerVerified"
    );

    if (verifiedBadge) {
      verifiedBadge.style.display =
        seller.sellerVerified ? "inline-flex" : "none";
    }

    // Account status
    const role = document.querySelector(
      ".sellerProfileHero .sellerRole"
    );

    if (role) {
      role.setAttribute(
        "title",
        `Account status: ${seller.status || "pending"}`
      );
    }

    console.log("Seller profile loaded:", seller);

  } catch (error) {
    console.error("Failed to load seller profile:", error);

    showSnackBar(
      error.message || "Unable to load seller profile.",
      "error"
    );
  }
}










document.addEventListener("DOMContentLoaded", async () => {
  try {
    const clerk = window.Clerk;

    if (!clerk) {
      throw new Error("Clerk has not loaded. Please refresh.");
    }

    if (typeof clerk.load === "function") {
      await clerk.load();
    }

    await loadSellerProfile();

  } catch (error) {
    console.error("Seller profile initialization failed:", error);

    showSnackBar(
      error.message || "Unable to initialize seller profile.",
      "error"
    );
  }
});














//=======================
// SIDEBAR TOGGLE
//=======================

const sidebarMenu = document.querySelector(".sidebarPhone");
const sidebarToggler = document.getElementById("menu");

// Add event listener
sidebarToggler.addEventListener("click", function(e) {
  e.stopPropagation();

  if(sidebarToggler){
    sidebarMenu.style.left = "0";
  }

});

// Window click
window.addEventListener("click", function(e){
  if(!sidebarMenu.contains(e.target) && !sidebarToggler.contains(e.target)){
    sidebarMenu.style.left = "-500px";
  }
});



// SNACKBAR SECTION //
// ===== SNACKBAR FUNCTION ===== //
let snackTimeout = null;

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
  else if (type === "error") snackbar.style.background = "#88353f";
  else if (type === "warning") snackbar.style.background = "#413b2a";
  else snackbar.style.background = "rgba(7, 29, 26, 0.95)";

  // Reset progress animation
  const progress = snackbar.querySelector(".snackbar-progress");
  progress.style.animation = "none";
  void progress.offsetWidth;
  progress.style.animation = `snackbar-progress ${duration}ms linear forwards`;

  snackbar.classList.add("show");

  // Clear previous timeout
  if (snackTimeout) clearTimeout(snackTimeout);

  snackTimeout = setTimeout(() => {
    snackbar.classList.remove("show");
  }, duration);
}
// snackbar ends

