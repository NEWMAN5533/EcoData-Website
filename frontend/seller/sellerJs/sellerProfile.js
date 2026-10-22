
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




/* ======================================
   EDIT SELLER PROFILE MODAL
====================================== */

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("editSellerProfileModal");
  const openBtn = document.getElementById("editSellerProfileBtn");
  const closeBtn = document.getElementById("closeEditSellerProfileModal");

  const logoInput = document.getElementById("editSellerLogo");
  const logoPreview = document.getElementById("editSellerLogoPreview");
  const removeLogoBtn = document.getElementById("removeEditSellerLogo");

  const aboutInput = document.getElementById("editSellerAbout");
  const aboutCount = document.getElementById("editSellerAboutCount");

  if (!modal || !openBtn) {
    console.warn("Edit seller profile modal elements were not found.");
    return;
  }

  function openModal() {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("seller-modal-open");
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("seller-modal-open");
  }

  openBtn.addEventListener("click", openModal);

  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }

  modal.querySelectorAll("[data-close-seller-modal]").forEach(button => {
    button.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });

  // Store logo preview
  if (logoInput && logoPreview) {
    logoInput.addEventListener("change", () => {
      const file = logoInput.files?.[0];

      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showSnackBar("Please select an image file.", "error");
        logoInput.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showSnackBar("Logo must be 5 MB or smaller.", "error");
        logoInput.value = "";
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        logoPreview.innerHTML = "";

        const image = document.createElement("img");
        image.src = reader.result;
        image.alt = "Store logo preview";

        logoPreview.appendChild(image);

        if (removeLogoBtn) {
          removeLogoBtn.hidden = false;
        }
      };

      reader.readAsDataURL(file);
    });
  }

  // Remove selected logo
  if (removeLogoBtn && logoInput && logoPreview) {
    removeLogoBtn.addEventListener("click", () => {
      logoInput.value = "";
      logoPreview.innerHTML = '<i class="ri-store-2-line"></i>';
      removeLogoBtn.hidden = true;
    });
  }

  // About character counter
  if (aboutInput && aboutCount) {
    const updateAboutCount = () => {
      aboutCount.textContent = aboutInput.value.length;
    };

    aboutInput.addEventListener("input", updateAboutCount);
    updateAboutCount();
  }




/* ======================================
   SAVE SELLER PROFILE
====================================== */

const editSellerProfileForm = document.getElementById(
  "editSellerProfileForm"
);

if (editSellerProfileForm) {
  editSellerProfileForm.addEventListener("submit", async event => {
    event.preventDefault();

    const saveButton = document.getElementById("saveSellerProfileBtn");

    const storeName = document
      .getElementById("editSellerStoreName")
      ?.value.trim();

    const about = document
      .getElementById("editSellerAbout")
      ?.value.trim();

    if (!storeName) {
      showSnackBar("Please enter your store name.", "error");
      return;
    }

    const payload = {
      storeName,
      about,
      facebook: document.getElementById("editSellerFacebook")?.value.trim() || "",
      instagram: document.getElementById("editSellerInstagram")?.value.trim() || "",
      youtube: document.getElementById("editSellerYoutube")?.value.trim() || "",
      website: document.getElementById("editSellerWebsite")?.value.trim() || ""
    };

    const originalButtonHTML = saveButton?.innerHTML;

    try {
      if (saveButton) {
        saveButton.disabled = true;
        saveButton.innerHTML = "Saving...";
      }

      const clerk = window.Clerk;

      if (!clerk) {
        throw new Error("Clerk has not loaded. Please refresh.");
      }

      if (typeof clerk.load === "function") {
        await clerk.load();
      }

      const session = clerk.session;

      if (!session) {
        throw new Error("Please sign in to update your profile.");
      }

      const token = await session.getToken();

      const response = await fetch(
        "https://ecodata-app.onrender.com/api/seller/profile",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save seller profile.");
      }

      // Update the visible profile
      const seller = result.seller;

      setText("sellerProfileName", seller.storeName || "My Store");
      setText("sellerProfileBio", seller.about || "No store description added yet.");

      // Update the modal with the saved values
      document.getElementById("editSellerStoreName").value =
        seller.storeName || "";

      document.getElementById("editSellerAbout").value =
        seller.about || "";

      document.getElementById("editSellerFacebook").value =
        seller.facebook || "";

      document.getElementById("editSellerInstagram").value =
        seller.instagram || "";

      document.getElementById("editSellerYoutube").value =
        seller.youtube || "";

      document.getElementById("editSellerWebsite").value =
        seller.website || "";

      const aboutCount = document.getElementById("editSellerAboutCount");

      if (aboutCount) {
        aboutCount.textContent = (seller.about || "").length;
      }

      showSnackBar("Seller profile saved successfully.", "success");

      const modal = document.getElementById("editSellerProfileModal");

      if (modal) {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("seller-modal-open");
      }

    } catch (error) {
      console.error("Failed to save seller profile:", error);

      showSnackBar(
        error.message || "Unable to save seller profile.",
        "error"
      );

    } finally {
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.innerHTML = originalButtonHTML || "Save changes";
      }
    }
  });
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

