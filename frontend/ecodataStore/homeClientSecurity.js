// ==========================================
// SECURITY PAGE
// ==========================================

const SECURITY_KEY = "ecoStoreSecurity";


// ==========================================
// DEFAULT SECURITY STATE
// ==========================================

const defaultSecurityState = {
  passkeyEnabled: false,
  twoFactorEnabled: false
};


let securityState = loadSecurityState();


// ==========================================
// LOAD SECURITY STATE
// ==========================================

function loadSecurityState() {

  try {

    const saved =
      localStorage.getItem(SECURITY_KEY);

    if (!saved) {
      return {
        ...defaultSecurityState
      };
    }

    const parsed =
      JSON.parse(saved);

    return {
      ...defaultSecurityState,
      ...(parsed || {})
    };

  } catch (error) {

    console.error(
      "Unable to load security settings:",
      error
    );

    return {
      ...defaultSecurityState
    };
  }
}


// ==========================================
// SAVE SECURITY STATE
// ==========================================

function saveSecurityState() {

  localStorage.setItem(
    SECURITY_KEY,
    JSON.stringify(securityState)
  );
}


// ==========================================
// PASSKEY SUPPORT
// ==========================================

function supportsPasskeys() {

  return (
    window.isSecureContext &&
    "PublicKeyCredential" in window &&
    typeof navigator.credentials?.create === "function"
  );
}


// ==========================================
// PASSKEY UI
// ==========================================

function updatePasskeyUI() {

  const status =
    document.getElementById("passkeyStatus");

  const title =
    document.getElementById("passkeyTitle");

  const description =
    document.getElementById("passkeyDescription");

  const setupButton =
    document.getElementById("setupPasskeyBtn");

  const removeButton =
    document.getElementById("removePasskeyBtn");


  if (!status || !setupButton) return;


  if (securityState.passkeyEnabled) {

    status.textContent = "Enabled";
    status.className = "security-status secure";

    status.innerHTML = `
      <i class="ri-check-line"></i>
      Enabled
    `;

    title.textContent =
      "Passkey is enabled";

    description.textContent =
      "This device can use biometric authentication or your device PIN to sign in.";

    setupButton.innerHTML = `
      <i class="ri-add-line"></i>
      Add Another Passkey
    `;

    removeButton.hidden = false;

    return;
  }


  status.textContent = "Not enabled";
  status.className = "security-status";

  title.textContent =
    "Secure sign-in";

  description.textContent =
    "Register this device with a passkey. You can use fingerprint, Face ID or your device PIN when supported.";

  setupButton.innerHTML = `
    <i class="ri-fingerprint-line"></i>
    Set Up Passkey
  `;

  removeButton.hidden = true;
}


// ==========================================
// SET UP PASSKEY
// ==========================================

async function setupPasskey() {

  const button =
    document.getElementById("setupPasskeyBtn");

  if (!button) return;


  // Check browser support first
  if (!supportsPasskeys()) {

    alert(
      "Passkeys are not available in this browser or page. Make sure you are using a supported browser over HTTPS."
    );

    return;
  }


  const originalHTML =
    button.innerHTML;


  button.disabled = true;

  button.innerHTML = `
    <i class="ri-loader-4-line ri-spin"></i>
    Checking device...
  `;


  try {

    /*
      FRONTEND DEMO

      We are not creating a real credential yet.

      When Firebase/backend authentication is connected,
      navigator.credentials.create() will be used here
      with a server-generated WebAuthn challenge.
    */

    await new Promise(resolve =>
      setTimeout(resolve, 1000)
    );


    securityState.passkeyEnabled = true;

    saveSecurityState();

    updatePasskeyUI();

    updateSecurityProgress();

    alert(
      "Passkey setup is ready for this device. Real biometric registration will be connected when authentication is added."
    );

  } catch (error) {

    console.error(
      "Passkey setup error:",
      error
    );

    alert(
      "Unable to set up the passkey."
    );

  } finally {

    button.disabled = false;

    if (!securityState.passkeyEnabled) {
      button.innerHTML = originalHTML;
    }
  }
}


// ==========================================
// REMOVE PASSKEY
// ==========================================

function removePasskey() {

  const confirmed =
    confirm(
      "Remove the passkey from this account?"
    );

  if (!confirmed) return;


  securityState.passkeyEnabled = false;

  saveSecurityState();

  updatePasskeyUI();

  updateSecurityProgress();

  alert(
    "Passkey removed."
  );
}


// ==========================================
// SECURITY PROGRESS
// ==========================================

function updateSecurityProgress() {

  const percent =
    document.getElementById("securityPercent");

  const progress =
    document.getElementById("securityProgress");


  if (!percent || !progress) return;


  let score = 50;


  // Passkey
  if (securityState.passkeyEnabled) {
    score += 25;
  }


  // 2FA
  if (securityState.twoFactorEnabled) {
    score += 25;
  }


  score = Math.min(score, 100);


  percent.textContent =
    `${score}%`;

  progress.style.width =
    `${score}%`;
}


// ==========================================
// PASSWORD VISIBILITY
// ==========================================

function setupPasswordToggles() {

  const buttons =
    document.querySelectorAll(
      ".password-toggle"
    );


  buttons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const targetId =
          button.dataset.target;

        const input =
          document.getElementById(targetId);

        const icon =
          button.querySelector("i");


        if (!input || !icon) return;


        if (input.type === "password") {

          input.type = "text";

          icon.className =
            "ri-eye-off-line";

        } else {

          input.type = "password";

          icon.className =
            "ri-eye-line";
        }

      }
    );

  });

}


// ==========================================
// PASSWORD STRENGTH
// ==========================================

function checkPasswordStrength(password) {

  let score = 0;


  if (password.length >= 8) {
    score++;
  }

  if (/[a-z]/.test(password)) {
    score++;
  }

  if (/[A-Z]/.test(password)) {
    score++;
  }

  if (/[0-9]/.test(password)) {
    score++;
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score++;
  }


  return score;
}


function updatePasswordStrength() {

  const input =
    document.getElementById("newPassword");

  const text =
    document.getElementById(
      "passwordStrengthText"
    );

  const bar =
    document.getElementById(
      "passwordStrengthBar"
    );


  if (!input || !text || !bar) {
    return;
  }


  const password =
    input.value;


  if (!password) {

    text.textContent = "—";

    bar.style.width = "0%";

    return;
  }


  const score =
    checkPasswordStrength(password);


  const levels = [
    {
      label: "Very weak",
      width: "20%"
    },
    {
      label: "Weak",
      width: "40%"
    },
    {
      label: "Fair",
      width: "60%"
    },
    {
      label: "Strong",
      width: "80%"
    },
    {
      label: "Very strong",
      width: "100%"
    }
  ];


  const level =
    levels[Math.max(score - 1, 0)];


  text.textContent =
    level.label;

  bar.style.width =
    level.width;
}


// ==========================================
// PASSWORD FORM
// ==========================================

function setupPasswordForm() {

  const form =
    document.getElementById(
      "passwordForm"
    );

  if (!form) return;


  form.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const current =
        document.getElementById(
          "currentPassword"
        ).value.trim();


      const password =
        document.getElementById(
          "newPassword"
        ).value;


      const confirmPassword =
        document.getElementById(
          "confirmPassword"
        ).value;


      if (!current) {

        alert(
          "Enter your current password."
        );

        return;
      }


      if (password.length < 8) {

        alert(
          "Your new password must contain at least 8 characters."
        );

        return;
      }


      if (password !== confirmPassword) {

        alert(
          "The passwords do not match."
        );

        return;
      }


      if (checkPasswordStrength(password) < 3) {

        alert(
          "Please choose a stronger password."
        );

        return;
      }


      /*
        FRONTEND DEMO ONLY.

        The real password change will later be handled
        securely by Firebase Authentication.
      */

      alert(
        "Password change is ready. Firebase Authentication will handle the real password update."
      );


      form.reset();

      updatePasswordStrength();

    }
  );

}


// ==========================================
// TWO FACTOR
// ==========================================

function setupTwoFactor() {

  const toggle =
    document.getElementById(
      "twoFactorToggle"
    );

  if (!toggle) return;


  toggle.checked =
    securityState.twoFactorEnabled;


  toggle.addEventListener(
    "change",
    () => {

      securityState.twoFactorEnabled =
        toggle.checked;


      saveSecurityState();

      updateSecurityProgress();


      if (toggle.checked) {

        alert(
          "Two-factor authentication is enabled in demo mode. The authenticator setup will be connected later."
        );

      } else {

        alert(
          "Two-factor authentication has been disabled in demo mode."
        );

      }

    }
  );

}


// ==========================================
// SIGN OUT OTHER DEVICES
// ==========================================

function signOutOtherDevices() {

  const confirmed =
    confirm(
      "Sign out all other devices?"
    );

  if (!confirmed) return;


  const button =
    document.getElementById(
      "signOutOtherBtn"
    );


  if (!button) return;


  const originalHTML =
    button.innerHTML;


  button.disabled = true;

  button.innerHTML = `
    <i class="ri-loader-4-line ri-spin"></i>
    Signing out...
  `;


  setTimeout(() => {

    button.disabled = false;

    button.innerHTML =
      originalHTML;


    alert(
      "All other devices have been signed out."
    );

  }, 800);
}


// ==========================================
// SIGN OUT ALL DEVICES
// ==========================================

function signOutAllDevices() {

  const confirmed =
    confirm(
      "This will sign out your account from all devices. Continue?"
    );

  if (!confirmed) return;


  alert(
    "All active sessions will be terminated when account authentication is connected."
  );
}


// ==========================================
// DELETE ACCOUNT
// ==========================================

function deleteAccount() {

  const firstConfirm =
    confirm(
      "Are you sure you want to delete your account?"
    );

  if (!firstConfirm) return;


  const secondConfirm =
    confirm(
      "This action cannot be easily undone. Continue?"
    );

  if (!secondConfirm) return;


  alert(
    "Account deletion will be handled securely by the backend and Firebase Authentication."
  );
}


// ==========================================
// CART COUNT
// ==========================================

function updateCartCount() {

  const countElement =
    document.getElementById(
      "navCartCount"
    );

  if (!countElement) return;


  try {

    const saved =
      localStorage.getItem(
        "ecoStoreCart"
      );


    if (!saved) {

      countElement.textContent = "0";

      return;
    }


    const cart =
      JSON.parse(saved);


    if (!Array.isArray(cart)) {

      countElement.textContent = "0";

      return;
    }


    const count =
      cart.reduce(
        (total, item) =>
          total + Number(item.quantity || 1),
        0
      );


    countElement.textContent =
      count;

  } catch {

    countElement.textContent = "0";
  }
}


// ==========================================
// SIGN OUT
// ==========================================

function setupSignOut() {

  const button =
    document.getElementById(
      "signOutBtn"
    );

  if (!button) return;


  button.addEventListener(
    "click",
    () => {

      const confirmed =
        confirm(
          "Are you sure you want to sign out?"
        );

      if (!confirmed) return;


      /*
        Later:

        Firebase:
        await signOut(auth);
      */

      window.location.href =
        "index.html";

    }
  );

}


// ==========================================
// INITIALIZE
// ==========================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    updatePasskeyUI();

    updateSecurityProgress();

    setupPasswordToggles();

    setupPasswordForm();

    setupTwoFactor();

    setupSignOut();

    updateCartCount();


    // Password strength
    const passwordInput =
      document.getElementById(
        "newPassword"
      );

    passwordInput?.addEventListener(
      "input",
      updatePasswordStrength
    );


    // Passkey
    document
      .getElementById("setupPasskeyBtn")
      ?.addEventListener(
        "click",
        setupPasskey
      );


    // Remove passkey
    document
      .getElementById("removePasskeyBtn")
      ?.addEventListener(
        "click",
        removePasskey
      );


    // Other devices
    document
      .getElementById("signOutOtherBtn")
      ?.addEventListener(
        "click",
        signOutOtherDevices
      );


    // All devices
    document
      .getElementById("signOutAllBtn")
      ?.addEventListener(
        "click",
        signOutAllDevices
      );


    // Delete account
    document
      .getElementById("deleteAccountBtn")
      ?.addEventListener(
        "click",
        deleteAccount
      );

  }
);