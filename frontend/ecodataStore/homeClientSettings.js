/* =========================================
   SETTINGS PAGE
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  const STORAGE_KEY =
    "ecoStoreSettings";


  /* =========================================
     ELEMENTS
  ========================================== */

  const darkModeToggle =
    document.getElementById(
      "darkModeToggle"
    );

  const reduceMotionToggle =
    document.getElementById(
      "reduceMotionToggle"
    );

  const orderNotifications =
    document.getElementById(
      "orderNotifications"
    );

  const promotionNotifications =
    document.getElementById(
      "promotionNotifications"
    );

  const wishlistNotifications =
    document.getElementById(
      "wishlistNotifications"
    );

  const orderEmails =
    document.getElementById(
      "orderEmails"
    );

  const storeEmails =
    document.getElementById(
      "storeEmails"
    );

  const currency =
    document.getElementById(
      "currency"
    );

  const language =
    document.getElementById(
      "language"
    );

  const deliveryLocation =
    document.getElementById(
      "deliveryLocation"
    );

  const defaultPayment =
    document.getElementById(
      "defaultPayment"
    );

  const saveSettingsBtn =
    document.getElementById(
      "saveSettingsBtn"
    );

  const saveStatus =
    document.getElementById(
      "saveStatus"
    );

  const signOutBtn =
    document.getElementById(
      "signOutBtn"
    );


  /* =========================================
     DEFAULT SETTINGS
  ========================================== */

  const defaultSettings = {

    darkMode: false,

    reduceMotion: false,

    orderNotifications: true,

    promotionNotifications: true,

    wishlistNotifications: true,

    orderEmails: true,

    storeEmails: true,

    currency: "GHS",

    language: "English",

    deliveryLocation: "Ghana",

    defaultPayment: "Mobile Money"

  };


  /* =========================================
     GET SAVED SETTINGS
  ========================================== */

  function getSettings() {

    try {

      const saved =
        JSON.parse(
          localStorage.getItem(
            STORAGE_KEY
          )
        );

      return {
        ...defaultSettings,
        ...(saved || {})
      };

    } catch (error) {

      console.warn(
        "Unable to load settings.",
        error
      );

      return {
        ...defaultSettings
      };

    }

  }


  /* =========================================
     SAVE SETTINGS
  ========================================== */

  function saveSettings(settings) {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(settings)
    );

  }


  /* =========================================
     APPLY APPEARANCE
  ========================================== */

  function applyAppearance(settings) {

    document.body.classList.toggle(
      "dark-mode",
      settings.darkMode
    );


    document.body.classList.toggle(
      "reduce-motion",
      settings.reduceMotion
    );

  }


  /* =========================================
     LOAD SETTINGS INTO UI
  ========================================== */

  function loadSettings() {

    const settings =
      getSettings();


    darkModeToggle.checked =
      settings.darkMode;

    reduceMotionToggle.checked =
      settings.reduceMotion;


    orderNotifications.checked =
      settings.orderNotifications;

    promotionNotifications.checked =
      settings.promotionNotifications;

    wishlistNotifications.checked =
      settings.wishlistNotifications;


    orderEmails.checked =
      settings.orderEmails;

    storeEmails.checked =
      settings.storeEmails;


    currency.value =
      settings.currency;

    language.value =
      settings.language;

    deliveryLocation.value =
      settings.deliveryLocation;

    defaultPayment.value =
      settings.defaultPayment;


    applyAppearance(settings);

  }


  /* =========================================
     READ UI
  ========================================== */

  function getSettingsFromUI() {

    return {

      darkMode:
        darkModeToggle.checked,

      reduceMotion:
        reduceMotionToggle.checked,

      orderNotifications:
        orderNotifications.checked,

      promotionNotifications:
        promotionNotifications.checked,

      wishlistNotifications:
        wishlistNotifications.checked,

      orderEmails:
        orderEmails.checked,

      storeEmails:
        storeEmails.checked,

      currency:
        currency.value,

      language:
        language.value,

      deliveryLocation:
        deliveryLocation.value,

      defaultPayment:
        defaultPayment.value

    };

  }


  /* =========================================
     SAVE STATUS
  ========================================== */

  function showSavedStatus() {

    saveStatus.innerHTML = `
      <i class="ri-check-line"></i>
      Your preferences have been saved.
    `;

    setTimeout(() => {

      saveStatus.innerHTML = `
        <i class="ri-check-line"></i>
        Your preferences are saved automatically.
      `;

    }, 2000);

  }


  /* =========================================
     AUTO SAVE APPEARANCE
  ========================================== */

  darkModeToggle.addEventListener(
    "change",
    () => {

      const settings =
        getSettings();

      settings.darkMode =
        darkModeToggle.checked;

      applyAppearance(settings);

      saveSettings(settings);

    }
  );


  reduceMotionToggle.addEventListener(
    "change",
    () => {

      const settings =
        getSettings();

      settings.reduceMotion =
        reduceMotionToggle.checked;

      applyAppearance(settings);

      saveSettings(settings);

    }
  );


  /* =========================================
     SAVE ALL SETTINGS
  ========================================== */

  saveSettingsBtn.addEventListener(
    "click",
    async () => {

      const settings =
        getSettingsFromUI();


      saveSettings(settings);

      applyAppearance(settings);


      saveSettingsBtn.disabled =
        true;


      saveSettingsBtn.innerHTML = `
        <i class="ri-loader-4-line ri-spin"></i>
        Saving...
      `;


      await new Promise(resolve =>
        setTimeout(resolve, 600)
      );


      saveSettingsBtn.innerHTML = `
        <i class="ri-check-line"></i>
        Saved
      `;


      showSavedStatus();


      setTimeout(() => {

        saveSettingsBtn.innerHTML = `
          <i class="ri-save-3-line"></i>
          Save Changes
        `;

        saveSettingsBtn.disabled =
          false;

      }, 1200);

    }
  );


  /* =========================================
     SIGN OUT
  ========================================== */

  signOutBtn.addEventListener(
    "click",
    () => {

      const confirmed =
        confirm(
          "Are you sure you want to sign out?"
        );


      if (!confirmed) return;


      // Firebase logout will be added later.

      window.location.href =
        "index.html";

    }
  );


  /* =========================================
     INITIALIZE
  ========================================== */

  loadSettings();

});