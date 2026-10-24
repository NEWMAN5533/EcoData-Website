/* =========================================
   ECODATASTORE — SELLER SETTINGS
   Notifications + Store Preferences
========================================= */

const API_BASE = "https://ecodata-app.onrender.com";
const SETTINGS_ENDPOINT = `${API_BASE}/api/seller-settings`;

document.addEventListener("DOMContentLoaded", () => {
  // ==============================
  // DOM ELEMENTS
  // ==============================

  const notifySales = document.getElementById("notifySales");
  const notifyWithdrawals = document.getElementById("notifyWithdrawals");
  const notifyProducts = document.getElementById("notifyProducts");

  const storeVisibility = document.getElementById("storeVisibility");
  const storeCurrency = document.getElementById("storeCurrency");

  const preferenceControls = [
    notifySales,
    notifyWithdrawals,
    notifyProducts,
    storeVisibility,
    storeCurrency
  ].filter(Boolean);

  if (preferenceControls.length === 0) {
    console.warn("Seller settings controls were not found.");
    return;
  }

  // ==============================
  // STATUS MESSAGE
  // ==============================

  const status = document.createElement("p");

  status.id = "sellerSettingsStatus";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  status.style.marginTop = "12px";
  status.style.fontSize = "13px";

  // Place the message near the first preference control.
  const statusParent =
    storeVisibility?.parentElement ||
    notifySales?.parentElement ||
    preferenceControls[0].parentElement;

  statusParent?.appendChild(status);

  function showStatus(message, type = "info") {
    status.textContent = message;

    status.style.color =
      type === "error"
        ? "#dc2626"
        : type === "success"
          ? "#15803d"
          : "inherit";
  }

  // ==============================
  // CLERK AUTHENTICATION
  // ==============================

  async function getClerkToken() {
    // Wait briefly for Clerk to initialize.
    const timeoutAt = Date.now() + 10000;

    while (
      (!window.Clerk || !window.Clerk.session) &&
      Date.now() < timeoutAt
    ) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (!window.Clerk?.session) {
      throw new Error(
        "Clerk is not ready. Refresh the page and try again."
      );
    }

    const token = await window.Clerk.session.getToken();

    if (!token) {
      throw new Error("Please sign in to access seller settings.");
    }

    return token;
  }

  // ==============================
  // API REQUEST HELPER
  // ==============================

  async function settingsRequest(method, body) {
    const token = await getClerkToken();

    const options = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    };

    if (body !== undefined) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }

    const response = await fetch(SETTINGS_ENDPOINT, options);

    let result;

    try {
      result = await response.json();
    } catch {
      throw new Error("The server returned an invalid response.");
    }

    if (!response.ok) {
      throw new Error(
        result.message ||
        result.error ||
        `Settings request failed (${response.status}).`
      );
    }

    return result;
  }

  // ==============================
  // READ SETTINGS FROM API
  // ==============================

  function setControlsDisabled(disabled) {
    preferenceControls.forEach(control => {
      control.disabled = disabled;
    });
  }

  function applySettings(settings) {
    if (notifySales && typeof settings.notifySales === "boolean") {
      notifySales.checked = settings.notifySales;
    }

    if (
      notifyWithdrawals &&
      typeof settings.notifyWithdrawals === "boolean"
    ) {
      notifyWithdrawals.checked = settings.notifyWithdrawals;
    }

    if (
      notifyProducts &&
      typeof settings.notifyProducts === "boolean"
    ) {
      notifyProducts.checked = settings.notifyProducts;
    }

    if (
      storeVisibility &&
      ["public", "private"].includes(settings.storeVisibility)
    ) {
      storeVisibility.value = settings.storeVisibility;
    }

    if (
      storeCurrency &&
      settings.storeCurrency === "GHS"
    ) {
      storeCurrency.value = "GHS";
    }
  }

  async function loadSettings() {
    setControlsDisabled(true);
    showStatus("Loading your settings...");

    try {
      const result = await settingsRequest("GET");

      // Supports either { settings: {...} } or direct settings.
      const settings = result.settings || result;

      applySettings(settings);

      showStatus("Settings loaded.", "success");
    } catch (error) {
      console.error("Failed to load seller settings:", error);

      showStatus(
        error.message || "Could not load your settings.",
        "error"
      );
    } finally {
      setControlsDisabled(false);
    }
  }

  // ==============================
  // COLLECT CURRENT PREFERENCES
  // ==============================

  function collectSettings() {
    return {
      notifySales: notifySales
        ? notifySales.checked
        : true,

      notifyWithdrawals: notifyWithdrawals
        ? notifyWithdrawals.checked
        : true,

      notifyProducts: notifyProducts
        ? notifyProducts.checked
        : true,

      storeVisibility: storeVisibility
        ? storeVisibility.value
        : "public",

      storeCurrency: storeCurrency
        ? storeCurrency.value
        : "GHS"
    };
  }

  // ==============================
  // SAVE SETTINGS TO API
  // ==============================

  let saveQueue = Promise.resolve();
  let changeVersion = 0;

  function saveSettings() {
    const version = ++changeVersion;
    const settings = collectSettings();

    // Serialize requests so rapid changes don't overwrite
    // a newer selection with an older request.
    saveQueue = saveQueue
      .catch(() => {})
      .then(async () => {
        if (version !== changeVersion) {
          return;
        }

        showStatus("Saving your settings...");

        try {
          await settingsRequest("PUT", settings);

          if (version === changeVersion) {
            showStatus("Settings saved successfully.", "success");
          }
        } catch (error) {
          console.error("Failed to save seller settings:", error);

          if (version === changeVersion) {
            showStatus(
              error.message || "Could not save your settings.",
              "error"
            );
          }
        }
      });

    return saveQueue;
  }

  // ==============================
  // AUTO-SAVE ON CHANGE
  // ==============================

  preferenceControls.forEach(control => {
    control.addEventListener("change", () => {
      saveSettings();
    });
  });

  // ==============================
  // INITIALIZE
  // ==============================

  loadSettings();










/* =========================================
   SAVE BASIC ACCOUNT INFORMATION
========================================= */

const displayNameInput = document.getElementById("settingsDisplayName");
const phoneInput = document.getElementById("settingsPhone");
const saveAccountBtn = document.getElementById("saveAccountSettingsBtn");

if (saveAccountBtn && displayNameInput && phoneInput) {
  saveAccountBtn.addEventListener("click", async (event) => {
    event.preventDefault();

    const displayName = displayNameInput.value.trim();
    const phone = phoneInput.value.trim();

    if (displayName.length < 2) {
      alert("Please enter a valid display name.");
      displayNameInput.focus();
      return;
    }

    saveAccountBtn.disabled = true;

    const originalText = saveAccountBtn.textContent;
    saveAccountBtn.textContent = "Saving...";

    try {
      const token = await getClerkToken();

      const response = await fetch(
        `${API_BASE}/api/seller-settings/account`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            displayName,
            phone
          })
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to save account information."
        );
      }

      displayNameInput.value = result.account.displayName;
      phoneInput.value = result.account.phone;

      alert("Account information saved successfully!");
    } catch (error) {
      console.error("Save account information error:", error);
      alert(error.message || "Something went wrong while saving.");
    } finally {
      saveAccountBtn.disabled = false;
      saveAccountBtn.textContent = originalText;
    }
  });
}







async function loadAccountInformation() {
  const displayNameInput =
    document.getElementById("settingsDisplayName");

  const usernameInput =
    document.getElementById("settingsUsername");

  const emailInput =
    document.getElementById("settingsEmail");

  const phoneInput =
    document.getElementById("settingsPhone");

  try {
    const token = await getClerkToken();

    const response = await fetch(
      `${API_BASE}/api/seller-settings/account`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Unable to load account information."
      );
    }

    const account = result.account;

    if (displayNameInput) {
      displayNameInput.value = account.displayName;
    }

    if (usernameInput) {
      usernameInput.value = account.username || "";
    }

    if (emailInput) {
      emailInput.value = account.email || "";
    }

    if (phoneInput) {
      phoneInput.value = account.phone || "";
    }

    console.log(
      "Account information loaded:",
      account.isSeller ? "Seller account" : "Regular user account"
    );

  } catch (error) {
    console.error("Load account information error:", error);
  }
}




loadAccountInformation();
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

