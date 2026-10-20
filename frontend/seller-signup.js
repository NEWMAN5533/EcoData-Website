// ==========================================
// ECODATA SELLER SIGNUP
// CLERK AUTHENTICATION + NEON POSTGRESQL
// ==========================================

const clerkPublishableKey =
  document.querySelector("[data-clerk-publishable-key]")
    ?.getAttribute("data-clerk-publishable-key");

const sellerSignupForm =
  document.getElementById("sellerSignupForm");

const sellerSignupButton =
  document.getElementById("sellerSignupButton");

const sellerSignupMessage =
  document.getElementById("sellerSignupMessage");

const codeModal =
  document.getElementById("codeModal");

const successModal =
  document.getElementById("successModal");

const failedModal =
  document.getElementById("failedModal");

const verificationInput =
  codeModal?.querySelector('input[type="text"], input:not([type])');

const verifyButton =
  codeModal?.querySelector(".verifyBtn");

  // ==========================================
// ECODATA CUSTOM LOCATION SELECTS
// Country + Region
// ==========================================

function initializeCustomSelect(selectId, hiddenInputId) {
const select = document.getElementById(selectId);

if (!select) {
console.error("Dropdown not found: ${selectId}");
return;
}

const trigger = select.querySelector(".custom-select-trigger");
const valueDisplay = select.querySelector(".custom-select-value");
const optionsContainer = select.querySelector(".custom-select-options");
const hiddenInput = document.getElementById(hiddenInputId);

if (!trigger || !valueDisplay || !optionsContainer || !hiddenInput) {
console.error("Missing dropdown elements:", {
selectId,
trigger,
valueDisplay,
optionsContainer,
hiddenInput
});
return;
}

console.log("Dropdown initialized: ${selectId}");

// OPEN / CLOSE DROPDOWN
trigger.addEventListener("click", (event) => {
event.preventDefault();
event.stopPropagation();

const shouldOpen = !select.classList.contains("active");

// Close all custom dropdowns first.
document.querySelectorAll(".custom-select.active").forEach((item) => {
  item.classList.remove("active");

  const itemTrigger = item.querySelector(".custom-select-trigger");
  const itemOptions = item.querySelector(".custom-select-options");

  itemTrigger?.setAttribute("aria-expanded", "false");

  if (itemOptions) {
    itemOptions.style.display = "none";
  }
});

if (shouldOpen) {
  select.classList.add("active");
  trigger.setAttribute("aria-expanded", "true");

  // Explicitly display the options card.
  optionsContainer.style.display = "flex";

  console.log(`Dropdown opened: ${selectId}`, {
    optionsCount: optionsContainer.querySelectorAll(
      ".custom-select-option"
    ).length,
    display: getComputedStyle(optionsContainer).display
  });
}

});

// SELECT AN OPTION
optionsContainer.addEventListener("click", (event) => {
const option = event.target.closest(".custom-select-option");

if (!option || !optionsContainer.contains(option)) {
   if(!optionsContainer.contains(event.target)) {
    optionsContainer.style.display = "none";
   }
  return;
};

const selectedValue = option.dataset.value;

if (!selectedValue) {
  console.warn("Dropdown option has no data-value:", option);
  return;
}

hiddenInput.value = selectedValue;

valueDisplay.textContent =
  option.querySelector("span")?.textContent.trim() ||
  selectedValue;

optionsContainer.querySelectorAll(".custom-select-option").forEach((item) => {
  const isSelected = item === option;

  item.classList.toggle("selected", isSelected);
  item.setAttribute("aria-selected", String(isSelected));
});

select.classList.remove("active");
trigger.setAttribute("aria-expanded", "false");
optionsContainer.style.display = "none";

hiddenInput.dispatchEvent(new Event("change", { bubbles: true }));

console.log(`Selected ${selectId}:`, selectedValue);

});
}


// ==========================================
// INITIALIZE CUSTOM LOCATION SELECTS
// ==========================================

function initializeSellerLocationSelects() {
  initializeCustomSelect(
    "sellerCountrySelect",
    "sellerCountry"
  );

  initializeCustomSelect(
    "sellerRegionSelect",
    "sellerRegion"
  );
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeSellerLocationSelects,
    { once: true }
  );
} else {
  initializeSellerLocationSelects();
}


// CLOSE DROPDOWNS WHEN CLICKING OUTSIDE

document.addEventListener("click", (event) => {
  if (event.target.closest(".custom-select")) {
    return;
  }

  document.querySelectorAll(".custom-select.active")
    .forEach((select) => {
      select.classList.remove("active");

      select
        .querySelector(".custom-select-trigger")
        ?.setAttribute("aria-expanded", "false");
    });
});

let clerk = null;
let currentSignup = null;
let sellerDetails = null;
let isProcessingSignup = false;




// ==========================================
// MESSAGE HELPER
// ==========================================

function showSellerMessage(message, type = "error") {
  if (!sellerSignupMessage) {
    console.log(message);
    return;
  }

  sellerSignupMessage.textContent = message;
  sellerSignupMessage.className = "seller-message " + type;
}


// ==========================================
// MODAL HELPERS
// ==========================================

function showModal(modal) {
  if (modal) {
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
  }
}

function hideModal(modal) {
  if (modal) {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
  }
}

function showFailedModal(message) {
  if (failedModal) {
    const messageElement =
      failedModal.querySelector(
        "[data-modal-message], .modal-message, p"
      );

    if (messageElement && message) {
      messageElement.textContent = message;
    }

    showModal(failedModal);
  } else {
    showSellerMessage(message, "error");
  }
}


// ==========================================
// PHONE NORMALIZATION — GHANA
// ==========================================

function normalizeGhanaPhone(phone) {
  const value = String(phone || "")
    .trim()
    .replace(/[\s()-]/g, "");

  // Format: 0241234567 → 233241234567
  if (/^0\d{9}$/.test(value)) {
    return "233" + value.substring(1);
  }

  // Format: +233241234567 → 233241234567
  if (/^\+233\d{9}$/.test(value)) {
    return value.substring(1);
  }

  // Format: 233241234567
  if (/^233\d{9}$/.test(value)) {
    return value;
  }

  // Format: 241234567 → 233241234567
  if (/^\d{9}$/.test(value)) {
    return "233" + value;
  }

  // Invalid phone number
  return null;
}


// ==========================================
// PASSWORD VALIDATION
// ==========================================

function validatePassword(password) {
  return {
    length: password.length >= 15,
    number: /\d/.test(password),
    uppercase: /[A-Z]/.test(password)
  };
}

function updatePasswordRequirements(password) {
  const rules = validatePassword(password);

  document.getElementById("sellerLength")
    ?.classList.toggle("valid", rules.length);

  document.getElementById("sellerNumber")
    ?.classList.toggle("valid", rules.number);

  document.getElementById("sellerUppercase")
    ?.classList.toggle("valid", rules.uppercase);
}


// ==========================================
// PASSWORD INPUT
// ==========================================

const sellerPassword =
  document.getElementById("sellerPassword");

sellerPassword?.addEventListener("input", () => {
  updatePasswordRequirements(sellerPassword.value);
});


// ==========================================
// PASSWORD VISIBILITY
// ==========================================

function setupPasswordToggle(buttonId, inputId) {
  const button = document.getElementById(buttonId);
  const input = document.getElementById(inputId);

  if (!button || !input) return;

  button.addEventListener("click", () => {
    const show = input.type === "password";

    input.type = show ? "text" : "password";

    button.setAttribute(
      "aria-label",
      show ? "Hide password" : "Show password"
    );

    const icon = button.querySelector("i");

    if (icon) {
      icon.classList.toggle("ri-eye-line", !show);
      icon.classList.toggle("ri-eye-off-line", show);
    }
  });
}

setupPasswordToggle(
  "sellerPasswordToggle",
  "sellerPassword"
);

setupPasswordToggle(
  "sellerConfirmPasswordToggle",
  "sellerConfirmPassword"
);


// ==========================================
// SELLER TYPES
// ==========================================

function getSellerTypes() {
  return Array.from(
    document.querySelectorAll(
      'input[name="sellerType"]:checked'
    )
  ).map(input => input.value);
}


// ==========================================
// WHATSAPP VISIBILITY
// ==========================================

const physicalType =
  document.getElementById("sellerTypePhysical");

const serviceType =
  document.getElementById("sellerTypeService");

const whatsappSection =
  document.getElementById("sellerWhatsappSection");

function updateWhatsappVisibility() {
  if (!whatsappSection) return;

  const shouldShow = Boolean(
    physicalType?.checked || serviceType?.checked
  );

  whatsappSection.style.display = shouldShow ? "" : "none";

  if (!shouldShow) {
    const number =
      document.getElementById("sellerWhatsapp");

    const enabled =
      document.getElementById("sellerWhatsappEnabled");

    if (number) number.value = "";
    if (enabled) enabled.checked = false;
  }
}

physicalType?.addEventListener(
  "change",
  updateWhatsappVisibility
);

serviceType?.addEventListener(
  "change",
  updateWhatsappVisibility
);

updateWhatsappVisibility();


// ==========================================
// INITIALIZE CLERK
// ==========================================

async function initializeSellerClerk() {
  if (!window.Clerk) {
    throw new Error(
      "Clerk did not load. Check the Clerk script in your HTML."
    );
  }

  clerk = window.Clerk;

  await clerk.load();

  console.log("Clerk initialized for seller signup.");
}


// ==========================================
// COLLECT AND VALIDATE SELLER DETAILS
// ==========================================

function collectSellerDetails() {
  const value = id =>
    document.getElementById(id)?.value.trim() || "";

  const firstName = value("sellerFirstName");
  const lastName = value("sellerLastName");
  const storeName = value("sellerStoreName");
  const email = value("sellerEmail").toLowerCase();
  const phoneRaw = value("sellerPhone");
  const country = value("sellerCountry");
  const region = value("sellerRegion");
  const city = value("sellerCity");
  const area = value("sellerArea");

  const password =
    document.getElementById("sellerPassword")?.value || "";

  const confirmPassword =
    document.getElementById("sellerConfirmPassword")?.value || "";

  const whatsappRaw = value("sellerWhatsapp");

  const whatsappEnabled = Boolean(
    document.getElementById("sellerWhatsappEnabled")?.checked
  );

  // Your current HTML has one checkbox for both agreements.
  const sellerTermsAccepted = Boolean(
    document.getElementById("sellerTerms")?.checked
  );

  const privacyPolicyAccepted = Boolean(
    document.getElementById("sellerPrivacy")?.checked
  );

  const sellerTypes = getSellerTypes();

  if (
    !firstName ||
    !lastName ||
    !storeName ||
    !email ||
    !phoneRaw ||
    !password ||
    !confirmPassword
  ) {
    throw new Error("Please complete all required fields.");
  }

  if (!country || !region || !city) {
    throw new Error("Please complete your business location.");
  }

  if (!sellerTypes.length) {
    throw new Error("Select at least one seller type.");
  }

  const allowedTypes = ["digital", "physical", "service"];

  if (!sellerTypes.every(type => allowedTypes.includes(type))) {
    throw new Error("One or more seller types are invalid.");
  }

  const phoneNumber = normalizeGhanaPhone(phoneRaw);

  if (!phoneNumber) {
    throw new Error("Enter a valid Ghana phone number.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  const passwordRules = validatePassword(password);

  if (
    !passwordRules.length ||
    !passwordRules.number ||
    !passwordRules.uppercase
  ) {
    throw new Error(
      "Your password must contain at least 15 characters, one number, and one uppercase letter."
    );
  }

  if (password !== confirmPassword) {
    throw new Error("Your passwords do not match.");
  }

  if (!sellerTermsAccepted || !privacyPolicyAccepted) {
    throw new Error(
      "Please accept the Seller Terms and Privacy Policy."
    );
  }

  let whatsappNumber = null;

  const needsWhatsapp =
    sellerTypes.includes("physical") ||
    sellerTypes.includes("service");

  if (needsWhatsapp && whatsappEnabled) {
    whatsappNumber = normalizeGhanaPhone(whatsappRaw);

    if (!whatsappNumber) {
      throw new Error(
        "Enter a valid Ghana WhatsApp number or disable WhatsApp contact."
      );
    }
  }

  if (
    firstName.length > 100 ||
    lastName.length > 100 ||
    storeName.length > 150 ||
    area.length > 100
  ) {
    throw new Error("One or more fields are too long.");
  }

  return {
    firstName,
    lastName,
    email,
    storeName,
    phoneNumber,
    country,
    region,
    city,
    area: area || null,
    sellerTypes,
    whatsappNumber,
    whatsappEnabled: Boolean(
      whatsappNumber && whatsappEnabled
    ),
    password,
    sellerTermsAccepted,
    privacyPolicyAccepted
  };
}


// ==========================================
// SELLER SIGNUP FORM
// ==========================================

sellerSignupForm?.addEventListener("submit", async event => {
  event.preventDefault();

  if (isProcessingSignup) return;

  isProcessingSignup = true;

  if (sellerSignupButton) {
    sellerSignupButton.disabled = true;
    sellerSignupButton.classList.add("loading");
  }

  showSellerMessage("");

  try {
    if (!clerk) {
      await initializeSellerClerk();
    }

    if (clerk.user) {
      throw new Error(
        "You are already signed in. Please sign out before creating another account."
      );
    }

    sellerDetails = collectSellerDetails();

    // Create a Clerk signup attempt.
    currentSignup = await clerk.client.signUp.create({
      firstName: sellerDetails.firstName,
      lastName: sellerDetails.lastName,
      emailAddress: sellerDetails.email,
      password: sellerDetails.password
    });

    // Ask Clerk to send the email verification code.
    await currentSignup.prepareEmailAddressVerification({
      strategy: "email_code"
    });

    if (verificationInput) {
      verificationInput.value = "";
    }

    showModal(codeModal);

    showSellerMessage(
      "We sent a verification code to your email.",
      "success"
    );

  } catch (error) {
    console.error("Seller signup error:", error);

    showFailedModal(
      error.errors?.[0]?.longMessage ||
      error.errors?.[0]?.message ||
      error.message ||
      "Unable to start seller registration."
    );

  } finally {
    isProcessingSignup = false;

    if (sellerSignupButton) {
      sellerSignupButton.disabled = false;
      sellerSignupButton.classList.remove("loading");
    }
  }
});


// ==========================================
// VERIFY EMAIL CODE
// ==========================================

verifyButton?.addEventListener("click", async event => {
  event.preventDefault();

  if (!currentSignup || !sellerDetails) {
    showFailedModal(
      "Please start seller registration again."
    );
    return;
  }

  const code = verificationInput?.value.trim();

  if (!code) {
    showSellerMessage(
      "Enter the verification code sent to your email.",
      "warning"
    );
    return;
  }

  verifyButton.disabled = true;

  try {
    // Verify the email address.
    const verificationResult =
      await currentSignup.attemptEmailAddressVerification({
        code
      });

    if (
      verificationResult.status !== "complete" ||
      !verificationResult.createdSessionId
    ) {
      throw new Error(
        "Email verification is incomplete. Please check the code and try again."
      );
    }

    // Activate the verified Clerk session.
    await clerk.setActive({
      session: verificationResult.createdSessionId
    });

    // Get a session token for the protected backend route.
    const token = await clerk.session.getToken();

    if (!token) {
      throw new Error(
        "Your account was verified, but a secure session token could not be obtained. Please sign in and contact support if the problem continues."
      );
    }

    // Save the seller profile through the Express API.
    const response = await fetch("https://ecodata-app.onrender.com/api/seller", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        firstName: sellerDetails.firstName,
        lastName: sellerDetails.lastName,
        email: sellerDetails.email,
        storeName: sellerDetails.storeName,
        sellerTypes: sellerDetails.sellerTypes,
        phoneNumber: sellerDetails.phoneNumber,
        country: sellerDetails.country,
        region: sellerDetails.region,
        city: sellerDetails.city,
        area: sellerDetails.area,
        whatsappNumber: sellerDetails.whatsappNumber,
        whatsappEnabled: sellerDetails.whatsappEnabled,
        sellerTermsAccepted: sellerDetails.sellerTermsAccepted,
        privacyPolicyAccepted: sellerDetails.privacyPolicyAccepted
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Unable to save your seller profile."
      );
    }

    // Store only non-sensitive UI state locally.
    localStorage.setItem("sellerSignupPending", "true");

    hideModal(codeModal);
    showModal(successModal);

    sellerSignupForm?.reset();

    updatePasswordRequirements("");
    updateWhatsappVisibility();

    // Never store passwords or Clerk session tokens in localStorage.

    setTimeout(() => {
      window.location.href = "login.html";
    }, 2500);

  } catch (error) {
    console.error("Seller email verification/profile error:", error);

    showSellerMessage(
      error.errors?.[0]?.longMessage ||
      error.errors?.[0]?.message ||
      error.message ||
      "Verification failed. Please try again.",
      "error"
    );

  } finally {
    verifyButton.disabled = false;
  }
});


// ==========================================
// RESEND VERIFICATION CODE
// ==========================================

const resendButton =
  codeModal?.querySelector(
    ".resendBtn, [data-resend-code]"
  );

resendButton?.addEventListener("click", async event => {
  event.preventDefault();

  if (!currentSignup) {
    showSellerMessage(
      "Please start registration again.",
      "warning"
    );
    return;
  }

  resendButton.disabled = true;

  try {
    await currentSignup.prepareEmailAddressVerification({
      strategy: "email_code"
    });

    showSellerMessage(
      "A new verification code has been sent.",
      "success"
    );

  } catch (error) {
    console.error("Resend code error:", error);

    showSellerMessage(
      error.errors?.[0]?.longMessage ||
      error.message ||
      "Could not resend the verification code.",
      "error"
    );

  } finally {
    resendButton.disabled = false;
  }
});


// ==========================================
// INITIALIZE
// ==========================================

initializeSellerClerk().catch(error => {
  console.error("Clerk initialization failed:", error);

  showSellerMessage(
    "Authentication could not be initialized. Please refresh the page.",
    "error"
  );
});