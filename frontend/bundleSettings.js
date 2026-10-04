/* =========================================
   ECODATA CUSTOMER SETTINGS
========================================= */


// =========================================
// STORAGE KEYS
// =========================================

const SETTINGS_STORAGE_KEY =
  "ecoDataCustomerSettings";


// =========================================
// DEFAULT SETTINGS
// =========================================

const defaultSettings = {

  darkMode: false,

  orderNotifications: true,

  deliveryNotifications: true,

  promotionNotifications: true

};


// =========================================
// LOAD SETTINGS
// =========================================

function loadSettings() {

  try {

    const saved =
      localStorage.getItem(
        SETTINGS_STORAGE_KEY
      );

    if (!saved) {

      return {
        ...defaultSettings
      };

    }


    const parsed =
      JSON.parse(saved);


    return {

      ...defaultSettings,

      ...parsed

    };

  } catch (error) {

    console.error(
      "Failed to load settings:",
      error
    );

    return {
      ...defaultSettings
    };

  }

}


// =========================================
// SETTINGS STATE
// =========================================

let settings =
  loadSettings();


// =========================================
// SAVE SETTINGS
// =========================================

function saveSettings() {

  try {

    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify(settings)
    );

  } catch (error) {

    console.error(
      "Failed to save settings:",
      error
    );

  }

}


// =========================================
// SNACKBAR
// =========================================

let snackbarTimer;


function showMessage(message) {

  const snackbar =
    document.getElementById(
      "settingsSnackbar"
    );

  const text =
    document.getElementById(
      "snackbarText"
    );


  if (!snackbar || !text) return;


  text.textContent =
    message;


  snackbar.classList.add(
    "show"
  );


  clearTimeout(
    snackbarTimer
  );


  snackbarTimer =
    setTimeout(() => {

      snackbar.classList.remove(
        "show"
      );

    }, 2500);

}


// =========================================
// APPLY DARK MODE
// =========================================

function applyDarkMode() {

  document.body.classList.toggle(
    "dark-mode",
    settings.darkMode
  );


  const toggle =
    document.getElementById(
      "darkModeToggle"
    );


  if (toggle) {

    toggle.checked =
      settings.darkMode;

  }

}


// =========================================
// LOAD TOGGLES
// =========================================

function loadToggleStates() {

  document.getElementById(
    "orderNotifications"
  ).checked =
    settings.orderNotifications;


  document.getElementById(
    "deliveryNotifications"
  ).checked =
    settings.deliveryNotifications;


  document.getElementById(
    "promotionNotifications"
  ).checked =
    settings.promotionNotifications;

}


// =========================================
// DARK MODE
// =========================================

function setupDarkMode() {

  const toggle =
    document.getElementById(
      "darkModeToggle"
    );


  if (!toggle) return;


  toggle.addEventListener(
    "change",
    () => {

      settings.darkMode =
        toggle.checked;


      saveSettings();

      applyDarkMode();


      showMessage(
        settings.darkMode
          ? "Dark mode enabled."
          : "Dark mode disabled."
      );

    }
  );

}


// =========================================
// ORDER NOTIFICATIONS
// =========================================

function setupOrderNotifications() {

  const toggle =
    document.getElementById(
      "orderNotifications"
    );


  toggle?.addEventListener(
    "change",
    () => {

      settings.orderNotifications =
        toggle.checked;


      saveSettings();


      showMessage(
        toggle.checked
          ? "Order notifications enabled."
          : "Order notifications disabled."
      );

    }
  );

}


// =========================================
// DELIVERY NOTIFICATIONS
// =========================================

function setupDeliveryNotifications() {

  const toggle =
    document.getElementById(
      "deliveryNotifications"
    );


  toggle?.addEventListener(
    "change",
    () => {

      settings.deliveryNotifications =
        toggle.checked;


      saveSettings();


      showMessage(
        toggle.checked
          ? "Delivery notifications enabled."
          : "Delivery notifications disabled."
      );

    }
  );

}


// =========================================
// PROMOTIONS
// =========================================

function setupPromotionNotifications() {

  const toggle =
    document.getElementById(
      "promotionNotifications"
    );


  toggle?.addEventListener(
    "change",
    () => {

      settings.promotionNotifications =
        toggle.checked;


      saveSettings();


      showMessage(
        toggle.checked
          ? "Promotion notifications enabled."
          : "Promotion notifications disabled."
      );

    }
  );

}


// =========================================
// ACTION BUTTONS
// =========================================

function setupActions() {


  // Back

  document
    .getElementById("backBtn")
    ?.addEventListener(
      "click",
      () => {

        window.history.back();

      }
    );


  // Edit profile

  document
    .getElementById("editProfileBtn")
    ?.addEventListener(
      "click",
      () => {

        console.log(
          "Open edit profile page"
        );

      }
    );


  // Privacy

  document
    .getElementById("privacyBtn")
    ?.addEventListener(
      "click",
      () => {

        console.log(
          "Open privacy and security"
        );

      }
    );


  // Clear local data

  document
    .getElementById("clearDataBtn")
    ?.addEventListener(
      "click",
      clearLocalData
    );

}


// =========================================
// CLEAR LOCAL DATA
// =========================================

function clearLocalData() {

  const confirmed =
    window.confirm(
      "Clear EcoData information stored on this device?"
    );


  if (!confirmed) return;


  /*
   * Only remove customer-side local data.
   *
   * Do NOT touch server data.
   */

  localStorage.removeItem(
    "ecoDataLiveOrders"
  );

  localStorage.removeItem(
    "ecoDataAfaRegistrations"
  );


  /*
   * Keep the customer's settings.
   */

  showMessage(
    "Local EcoData data has been cleared."
  );

}


// =========================================
// INITIALIZE
// =========================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    /*
     * Apply theme immediately.
     */

    applyDarkMode();


    /*
     * Restore switches.
     */

    loadToggleStates();


    /*
     * Setup interactions.
     */

    setupDarkMode();

    setupOrderNotifications();

    setupDeliveryNotifications();

    setupPromotionNotifications();

    setupActions();

  }
);