document.addEventListener("DOMContentLoaded", async () => {
  const logo1 = document.getElementById("sellerProfileAvatarLap");
  const logo2 = document.getElementById("sellerProfileAvatarMobile");

  const sellerName1 = document.getElementById("sellerProfileUsernameLap");
  const sellerName2 = document.getElementById("sellerProfileUsernameMobile");

  // No sidebar profile elements on this page.
  if (!logo1 && !logo2 && !sellerName1 && !sellerName2) return;

  const DEFAULT_LOGO = "../css/images/dg-watch.png";
  const API_URL = "https://ecodata-app.onrender.com/api/seller/profile";

  // Set safe defaults first.
  if (logo1) logo1.src = DEFAULT_LOGO;
  if (logo2) logo2.src = DEFAULT_LOGO;

  if (sellerName1) sellerName1.textContent = "My Store";
  if (sellerName2) sellerName2.textContent = "My Store";

  // Image fallback handlers.
  if (logo1) {
    logo1.onerror = () => {
      logo1.onerror = null;
      logo1.src = DEFAULT_LOGO;
    };
  }

  if (logo2) {
    logo2.onerror = () => {
      logo2.onerror = null;
      logo2.src = DEFAULT_LOGO;
    };
  }

  try {
    const clerk = window.Clerk;

    if (!clerk) {
      throw new Error("Clerk has not loaded.");
    }

    if (typeof clerk.load === "function") {
      await clerk.load();
    }

    const session = clerk.session;

    if (!session) return;

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
    const logoUrl = seller.storeLogoUrl || DEFAULT_LOGO;
    const storeName = seller.storeName?.trim() || "My Store";

    // Update desktop and mobile logos.
    if (logo1) logo1.src = logoUrl;
    if (logo2) logo2.src = logoUrl;

    // Update desktop and mobile seller names.
    if (sellerName1) sellerName1.textContent = storeName;
    if (sellerName2) sellerName2.textContent = storeName;

    console.log("Seller sidebar profile loaded:", {
      storeName,
      hasLogo: Boolean(seller.storeLogoUrl)
    });

  } catch (error) {
    console.error("Seller sidebar profile loading failed:", error);
  }
});



function sellerSidebar() {
  const sidebarMenu = document.querySelector(".sidebarPhone");
  const sidebarToggler = document.getElementById("menu");

  if (!sidebarMenu || !sidebarToggler) return;

  sidebarToggler.addEventListener("click", event => {
    event.stopPropagation();
    sidebarMenu.style.left = "0";
  });

  window.addEventListener("click", event => {
    if (
      !sidebarMenu.contains(event.target) &&
      !sidebarToggler.contains(event.target)
    ) {
      sidebarMenu.style.left = "-500px";
    }
  });
}

sellerSidebar();



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
