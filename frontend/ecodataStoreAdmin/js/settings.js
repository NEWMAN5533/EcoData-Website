// =========================================================
// ADMINISTRATOR SETTINGS
// =========================================================


// =========================================================
// ELEMENTS
// =========================================================

const settingsNavItems =
  document.querySelectorAll(
    ".admin-settings-nav-item"
  );

const settingsPanels =
  document.querySelectorAll(
    ".admin-settings-panel"
  );

const settingsMessage =
  document.getElementById(
    "adminSettingsMessage"
  );


// =========================================================
// SETTINGS STORAGE
// =========================================================

const ADMIN_SETTINGS_KEY =
  "ecoDataAdminSettings";


function getDefaultSettings() {

  return {

    profile: {
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      phone: ""
    },

    security: {
      twoFactor: false,
      loginAlerts: true
    },

    notifications: {
      orders: true,
      payments: true,
      administrators: true,
      system: true
    },

    preferences: {
      defaultPage: "dashboard",
      collapsedSidebar: false,
      autoRefresh: true,
      timeFormat: false
    }

  };

}


function loadSettings() {

  try {

    const saved =
      localStorage.getItem(
        ADMIN_SETTINGS_KEY
      );

    if (!saved) {
      return getDefaultSettings();
    }

    const parsed =
      JSON.parse(saved);

    return {
      ...getDefaultSettings(),
      ...parsed,
      profile: {
        ...getDefaultSettings().profile,
        ...(parsed.profile || {})
      },
      security: {
        ...getDefaultSettings().security,
        ...(parsed.security || {})
      },
      notifications: {
        ...getDefaultSettings().notifications,
        ...(parsed.notifications || {})
      },
      preferences: {
        ...getDefaultSettings().preferences,
        ...(parsed.preferences || {})
      }
    };

  } catch (error) {

    console.error(
      "Failed to load administrator settings:",
      error
    );

    return getDefaultSettings();

  }

}


let adminSettings =
  loadSettings();


function saveSettings() {

  localStorage.setItem(
    ADMIN_SETTINGS_KEY,
    JSON.stringify(adminSettings)
  );

}


// =========================================================
// MESSAGE
// =========================================================

let messageTimer;


function showSettingsMessage(
  message,
  icon = "ri-check-line"
) {

  if (!settingsMessage) return;

  const iconElement =
    settingsMessage.querySelector("i");

  const textElement =
    settingsMessage.querySelector("span");

  if (iconElement) {
    iconElement.className = icon;
  }

  if (textElement) {
    textElement.textContent = message;
  }

  settingsMessage.classList.add("show");

  clearTimeout(messageTimer);

  messageTimer =
    setTimeout(() => {

      settingsMessage.classList.remove(
        "show"
      );

    }, 2600);

}


// =========================================================
// SETTINGS TABS
// =========================================================

settingsNavItems.forEach(button => {

  button.addEventListener(
    "click",
    () => {

      const target =
        button.dataset.settingsTab;

      if (!target) return;


      settingsNavItems.forEach(item => {

        item.classList.toggle(
          "active",
          item === button
        );

      });


      settingsPanels.forEach(panel => {

        panel.classList.toggle(
          "active",
          panel.dataset.settingsPanel === target
        );

      });

    }
  );

});


// =========================================================
// LOAD PROFILE
// =========================================================

function loadProfileIntoForm() {

  const profile =
    adminSettings.profile;

  const firstName =
    document.getElementById(
      "adminFirstName"
    );

  const lastName =
    document.getElementById(
      "adminLastName"
    );

  const email =
    document.getElementById(
      "adminEmail"
    );

  const phone =
    document.getElementById(
      "adminPhone"
    );


  if (firstName) {
    firstName.value =
      profile.firstName || "";
  }

  if (lastName) {
    lastName.value =
      profile.lastName || "";
  }

  if (email) {
    email.value =
      profile.email || "";
  }

  if (phone) {
    phone.value =
      profile.phone || "";
  }


  updateProfileSummary();

}


function updateProfileSummary() {

  const firstName =
    adminSettings.profile.firstName || "";

  const lastName =
    adminSettings.profile.lastName || "";

  const fullName =
    `${firstName} ${lastName}`.trim();


  const email =
    adminSettings.profile.email ||
    "admin@example.com";


  const initials =
    getInitials(fullName || "Admin User");


  const avatar =
    document.getElementById(
      "settingsAvatar"
    );

  const nameElement =
    document.getElementById(
      "settingsProfileName"
    );

  const emailElement =
    document.getElementById(
      "settingsProfileEmail"
    );


  if (avatar) {
    avatar.textContent =
      initials;
  }

  if (nameElement) {
    nameElement.textContent =
      fullName || "Admin User";
  }

  if (emailElement) {
    emailElement.textContent =
      email;
  }

}


function getInitials(name) {

  const words =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (!words.length) {
    return "AD";
  }

  if (words.length === 1) {
    return words[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[words.length - 1][0]
  ).toUpperCase();

}


loadProfileIntoForm();


// =========================================================
// SAVE PROFILE
// =========================================================

const saveProfileBtn =
  document.getElementById(
    "saveProfileBtn"
  );


if (saveProfileBtn) {

  saveProfileBtn.addEventListener(
    "click",
    () => {

      const firstName =
        document.getElementById(
          "adminFirstName"
        );

      const lastName =
        document.getElementById(
          "adminLastName"
        );

      const email =
        document.getElementById(
          "adminEmail"
        );

      const phone =
        document.getElementById(
          "adminPhone"
        );


      if (!firstName || !lastName || !email) {
        return;
      }


      if (!firstName.value.trim()) {

        showSettingsMessage(
          "First name is required.",
          "ri-error-warning-line"
        );

        firstName.focus();

        return;

      }


      if (!lastName.value.trim()) {

        showSettingsMessage(
          "Last name is required.",
          "ri-error-warning-line"
        );

        lastName.focus();

        return;

      }


      if (
        !email.value.trim() ||
        !email.value.includes("@")
      ) {

        showSettingsMessage(
          "Enter a valid email address.",
          "ri-error-warning-line"
        );

        email.focus();

        return;

      }


      adminSettings.profile = {

        firstName:
          firstName.value.trim(),

        lastName:
          lastName.value.trim(),

        email:
          email.value.trim(),

        phone:
          phone
            ? phone.value.trim()
            : ""

      };


      saveSettings();

      updateProfileSummary();

      showSettingsMessage(
        "Profile changes saved."
      );

    }
  );

}


// =========================================================
// RESET PROFILE FORM
// =========================================================

const resetProfileBtn =
  document.getElementById(
    "resetProfileBtn"
  );


if (resetProfileBtn) {

  resetProfileBtn.addEventListener(
    "click",
    () => {

      loadProfileIntoForm();

      showSettingsMessage(
        "Changes discarded."
      );

    }
  );

}


// =========================================================
// AVATAR
// =========================================================

const changeAvatarBtn =
  document.getElementById(
    "changeAvatarBtn"
  );


if (changeAvatarBtn) {

  changeAvatarBtn.addEventListener(
    "click",
    () => {

      showSettingsMessage(
        "Avatar upload will be connected to storage.",
        "ri-information-line"
      );

    }
  );

}


// =========================================================
// PASSWORD VISIBILITY
// =========================================================

document
  .querySelectorAll(
    ".admin-password-toggle"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const targetId =
          button.dataset.passwordTarget;

        const input =
          document.getElementById(
            targetId
          );

        if (!input) return;


        const icon =
          button.querySelector("i");


        if (input.type === "password") {

          input.type = "text";

          button.setAttribute(
            "aria-label",
            "Hide password"
          );

          if (icon) {
            icon.className =
              "ri-eye-off-line";
          }

        } else {

          input.type = "password";

          button.setAttribute(
            "aria-label",
            "Show password"
          );

          if (icon) {
            icon.className =
              "ri-eye-line";
          }

        }

      }
    );

  });


// =========================================================
// PASSWORD REQUIREMENTS
// =========================================================

const newPassword =
  document.getElementById(
    "newPassword"
  );


function updatePasswordRequirements() {

  if (!newPassword) return;


  const password =
    newPassword.value;


  const checks = {

    passwordLength:
      password.length >= 8,

    passwordNumber:
      /\d/.test(password),

    passwordUppercase:
      /[A-Z]/.test(password)

  };


  Object.entries(checks)
    .forEach(([id, valid]) => {

      const element =
        document.getElementById(id);

      if (!element) return;


      element.classList.toggle(
        "valid",
        valid
      );


      const icon =
        element.querySelector("i");

      if (!icon) return;


      icon.className =
        valid
          ? "ri-checkbox-circle-fill"
          : "ri-checkbox-blank-circle-line";

    });

}


if (newPassword) {

  newPassword.addEventListener(
    "input",
    updatePasswordRequirements
  );

}


// =========================================================
// CHANGE PASSWORD
// =========================================================

const changePasswordBtn =
  document.getElementById(
    "changePasswordBtn"
  );


if (changePasswordBtn) {

  changePasswordBtn.addEventListener(
    "click",
    () => {

      const current =
        document.getElementById(
          "currentPassword"
        );

      const confirm =
        document.getElementById(
          "confirmPassword"
        );


      if (!current || !newPassword || !confirm) {
        return;
      }


      if (!current.value) {

        showSettingsMessage(
          "Enter your current password.",
          "ri-error-warning-line"
        );

        current.focus();

        return;

      }


      if (newPassword.value.length < 8) {

        showSettingsMessage(
          "New password must contain at least 8 characters.",
          "ri-error-warning-line"
        );

        newPassword.focus();

        return;

      }


      if (newPassword.value !== confirm.value) {

        showSettingsMessage(
          "Passwords do not match.",
          "ri-error-warning-line"
        );

        confirm.focus();

        return;

      }


      /*
       * Backend integration point.
       *
       * Example:
       *
       * await fetch("/api/admin/change-password", {
       *   method: "POST",
       *   headers: {
       *     "Content-Type": "application/json"
       *   },
       *   body: JSON.stringify({
       *     currentPassword: current.value,
       *     newPassword: newPassword.value
       *   })
       * });
       */


      current.value = "";
      newPassword.value = "";
      confirm.value = "";

      updatePasswordRequirements();


      showSettingsMessage(
        "Password update request submitted."
      );

    }
  );

}


// =========================================================
// SECURITY SETTINGS
// =========================================================

const twoFactorToggle =
  document.getElementById(
    "twoFactorToggle"
  );


const loginAlertsToggle =
  document.getElementById(
    "loginAlertsToggle"
  );


function loadSecuritySettings() {

  if (twoFactorToggle) {

    twoFactorToggle.checked =
      !!adminSettings.security.twoFactor;

  }


  if (loginAlertsToggle) {

    loginAlertsToggle.checked =
      !!adminSettings.security.loginAlerts;

  }

}


loadSecuritySettings();


if (twoFactorToggle) {

  twoFactorToggle.addEventListener(
    "change",
    () => {

      adminSettings.security.twoFactor =
        twoFactorToggle.checked;

      saveSettings();

      showSettingsMessage(
        twoFactorToggle.checked
          ? "Two-factor authentication enabled."
          : "Two-factor authentication disabled."
      );

    }
  );

}


if (loginAlertsToggle) {

  loginAlertsToggle.addEventListener(
    "change",
    () => {

      adminSettings.security.loginAlerts =
        loginAlertsToggle.checked;

      saveSettings();

      showSettingsMessage(
        loginAlertsToggle.checked
          ? "Login alerts enabled."
          : "Login alerts disabled."
      );

    }
  );

}


// =========================================================
// NOTIFICATION SETTINGS
// =========================================================

const notificationControls = {

  orders:
    document.getElementById(
      "orderNotifications"
    ),

  payments:
    document.getElementById(
      "paymentNotifications"
    ),

  administrators:
    document.getElementById(
      "adminNotifications"
    ),

  system:
    document.getElementById(
      "systemNotifications"
    )

};


function loadNotificationSettings() {

  Object.entries(
    notificationControls
  ).forEach(([key, element]) => {

    if (!element) return;

    element.checked =
      !!adminSettings.notifications[key];

  });

}


loadNotificationSettings();


Object.entries(
  notificationControls
).forEach(([key, element]) => {

  if (!element) return;


  element.addEventListener(
    "change",
    () => {

      adminSettings.notifications[key] =
        element.checked;

      saveSettings();

      showSettingsMessage(
        element.checked
          ? "Notification enabled."
          : "Notification disabled."
      );

    }
  );

});


// =========================================================
// PREFERENCES
// =========================================================

const defaultPage =
  document.getElementById(
    "defaultPage"
  );


const collapsedSidebar =
  document.getElementById(
    "collapsedSidebar"
  );


const autoRefresh =
  document.getElementById(
    "autoRefresh"
  );


const timeFormat =
  document.getElementById(
    "timeFormat"
  );


function loadPreferences() {

  const preferences =
    adminSettings.preferences;


  if (defaultPage) {

    defaultPage.value =
      preferences.defaultPage;

  }


  if (collapsedSidebar) {

    collapsedSidebar.checked =
      !!preferences.collapsedSidebar;

  }


  if (autoRefresh) {

    autoRefresh.checked =
      !!preferences.autoRefresh;

  }


  if (timeFormat) {

    timeFormat.checked =
      !!preferences.timeFormat;

  }

}


loadPreferences();


const savePreferencesBtn =
  document.getElementById(
    "savePreferencesBtn"
  );


if (savePreferencesBtn) {

  savePreferencesBtn.addEventListener(
    "click",
    () => {

      adminSettings.preferences = {

        defaultPage:
          defaultPage
            ? defaultPage.value
            : "dashboard",

        collapsedSidebar:
          collapsedSidebar
            ? collapsedSidebar.checked
            : false,

        autoRefresh:
          autoRefresh
            ? autoRefresh.checked
            : true,

        timeFormat:
          timeFormat
            ? timeFormat.checked
            : false

      };


      saveSettings();


      showSettingsMessage(
        "Dashboard preferences saved."
      );

    }
  );

}


// =========================================================
// SESSION ACTIONS
// =========================================================

document
  .querySelectorAll(
    ".admin-session-revoke"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const session =
          button.closest(
            ".admin-session-item"
          );

        if (!session) return;


        const confirmed =
          window.confirm(
            "Sign out this device?"
          );


        if (!confirmed) return;


        session.remove();


        showSettingsMessage(
          "Session revoked."
        );

      }
    );

  });


// =========================================================
// SIGN OUT OTHER SESSIONS
// =========================================================

const logoutOtherSessionsBtn =
  document.getElementById(
    "logoutOtherSessionsBtn"
  );


if (logoutOtherSessionsBtn) {

  logoutOtherSessionsBtn.addEventListener(
    "click",
    () => {

      const confirmed =
        window.confirm(
          "Sign out all other administrator sessions?"
        );


      if (!confirmed) return;


      document
        .querySelectorAll(
          ".admin-session-item:not(.current)"
        )
        .forEach(session => {
          session.remove();
        });


      showSettingsMessage(
        "Other sessions have been signed out."
      );

    }
  );

}


// =========================================================
// INITIAL PASSWORD STATE
// =========================================================

updatePasswordRequirements();