// ==========================================
// ECODATA USER SIGNUP
// Clerk Authentication + Neon PostgreSQL
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {
  // ==========================================
  // DOM ELEMENTS
  // ==========================================

  const form = document.getElementById("userSignupForm");
  const signupButton = document.getElementById("userSignupButton");
  const signupMessage = document.getElementById("signupMessage");

  const firstNameInput = document.getElementById("signupFirstName");
  const lastNameInput = document.getElementById("signupLastName");
  const emailInput = document.getElementById("signupEmail");
  const passwordInput = document.getElementById("signupPassword");
  const confirmPasswordInput = document.getElementById(
    "signupConfirmPassword"
  );

  const googleButton = document.getElementById("continueWithGoogle");

  const passwordToggle = document.getElementById(
    "signupPasswordToggle"
  );

  const confirmPasswordToggle = document.getElementById(
    "signupConfirmPasswordToggle"
  );

  const codeModal = document.getElementById("codeModal");
  const successModal = document.getElementById("successModal");
  const failedModal = document.getElementById("failedModal");

  const verificationInput = document.getElementById(
    "signupVerificationCode"
  );

  const verifyButton = codeModal?.querySelector(".verifyBtn");

  // ==========================================
  // STATE
  // ==========================================

  let clerk = null;
  let currentSignup = null;
  let busy = false;

  // ==========================================
  // MESSAGE HELPERS
  // ==========================================

  function showMessage(message, type = "error") {
    if (!signupMessage) {
      console[type === "error" ? "error" : "log"](message);
      return;
    }

    signupMessage.textContent = message;
    signupMessage.style.display = "block";
    signupMessage.dataset.type = type;
    signupMessage.setAttribute("role", "status");
  }

  function clearMessage() {
    if (!signupMessage) return;

    signupMessage.textContent = "";
    signupMessage.style.display = "none";
    delete signupMessage.dataset.type;
  }

  function setBusy(value, button = signupButton) {
    busy = value;

    if (button) {
      button.disabled = value;

      if (value) {
        button.dataset.originalText ??= button.textContent;
        button.textContent = "Please wait...";
      } else if (button.dataset.originalText) {
        button.textContent = button.dataset.originalText;
      }
    }

    if (form) {
      form.setAttribute("aria-busy", String(value));
    }
  }

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

  function getErrorMessage(error) {
    const clerkError = error?.errors?.[0];

    return (
      clerkError?.longMessage ||
      clerkError?.message ||
      error?.message ||
      "Something went wrong. Please try again."
    );
  }

  // ==========================================
  // PASSWORD VISIBILITY
  // ==========================================

  function setupPasswordToggle(button, input) {
    if (!button || !input) return;

    button.addEventListener("click", (event) => {
      event.preventDefault();

      const isPassword = input.type === "password";

      input.type = isPassword ? "text" : "password";

      button.setAttribute(
        "aria-label",
        isPassword ? "Hide password" : "Show password"
      );
    });
  }

  setupPasswordToggle(passwordToggle, passwordInput);

  setupPasswordToggle(
    confirmPasswordToggle,
    confirmPasswordInput
  );

  // ==========================================
  // PASSWORD VALIDATION
  // ==========================================

// ==========================================
// PASSWORD VALIDATION
// ==========================================

function validatePassword(password) {
  const hasLength = password.length >= 15;
  const hasNumber = /\d/.test(password);
  const hasUppercase = /[A-Z]/.test(password);

  const lengthIndicator = document.getElementById("signupLength");
  const numberIndicator = document.getElementById("signupNumber");
  const uppercaseIndicator = document.getElementById(
    "signupUppercase"
  );

  function updateIndicator(element, passed) {
    if (!element) return;

    element.classList.toggle("valid", passed);
    element.classList.toggle("invalid", !passed);
  }

  updateIndicator(lengthIndicator, hasLength);
  updateIndicator(numberIndicator, hasNumber);
  updateIndicator(uppercaseIndicator, hasUppercase);

  return hasLength && hasNumber && hasUppercase;
}


  passwordInput?.addEventListener("input", () => {
    validatePassword(passwordInput.value);
  });

  // ==========================================
  // INITIALIZE CLERK
  // ==========================================

  async function initializeClerk() {
    if (!window.Clerk) {
      throw new Error(
        "Clerk did not load. Check your Clerk script URLs and publishable key."
      );
    }

    clerk = window.Clerk;

    await clerk.load({
      ui: {
        ClerkUI: window.__internal_ClerkUICtor
      }
    });

    // Handle an OAuth redirect back to this page.
    const params = new URLSearchParams(window.location.search);

    if (
      params.has("__clerk_status") ||
      params.has("__clerk_ticket")
    ) {
      await clerk.handleRedirectCallback({
        redirectUrlComplete: new URL(
          "./index.html",
          window.location.href
        ).href
      });

      return;
    }

    // Existing authenticated user.
    if (clerk.isSignedIn) {
      await saveProfileAndContinue();
    }
  }

  // ==========================================
  // SAVE PROFILE TO NEON
  // ==========================================

  async function saveProfileAndContinue() {
    if (!clerk?.session) {
      throw new Error(
        "Your account session is not ready. Please sign in again."
      );
    }

    const token = await clerk.session.getToken();

    if (!token) {
      throw new Error(
        "Unable to obtain your authentication session."
      );
    }

    const user = clerk.user;

    const email =
      user?.primaryEmailAddress?.emailAddress;

    const firstName =
      user?.firstName ||
      firstNameInput?.value.trim();

    const lastName =
      user?.lastName ||
      lastNameInput?.value.trim();

    if (!email || !firstName || !lastName) {
      throw new Error(
        "Your account details are incomplete. Please check your profile."
      );
    }

    const response = await fetch("/api/profile", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },

      body: JSON.stringify({
        firstName,
        lastName,
        email
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Unable to save your EcoData profile."
      );
    }

    // Preserve compatibility with existing frontend pages.
    localStorage.setItem(
      "username",
      `${firstName} ${lastName}`
    );

    localStorage.setItem("role", result.user.role || "user");

    return result.user;
  }

  // ==========================================
  // EMAIL/PASSWORD SIGNUP
  // ==========================================

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (busy) return;

    clearMessage();

    const firstName = firstNameInput?.value.trim() || "";
    const lastName = lastNameInput?.value.trim() || "";
    const email = emailInput?.value.trim().toLowerCase() || "";

    const password = passwordInput?.value || "";
    const confirmPassword = confirmPasswordInput?.value || "";

    if (!firstName || !lastName || !email) {
      showMessage("Please complete all required fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMessage("Please enter a valid email address.");
      return;
    }

    if (!validatePassword(password)) {
      showMessage(
        "Your password must contain at least 8 characters, one number, and one uppercase letter."
      );
      return;
    }

    if (password !== confirmPassword) {
      showMessage("Your passwords do not match.");
      return;
    }

    // The terms checkbox is hidden in the HTML previously shared.
    // Enforce it only when the checkbox is visible.
    const termsCheckbox = document.getElementById("signupTerms");

    if (
      termsCheckbox &&
      termsCheckbox.offsetParent !== null &&
      !termsCheckbox.checked
    ) {
      showMessage("Please accept the terms before continuing.");
      return;
    }

    setBusy(true);

    try {
      if (!clerk) {
        throw new Error("Authentication is still loading. Try again.");
      }

      // Create a Clerk signup attempt.
      currentSignup = await clerk.client.signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password
      });

      // Send the email verification code.
      currentSignup =
        await currentSignup.prepareEmailAddressVerification({
          strategy: "email_code"
        });

      // Display the existing verification modal.
      showModal(codeModal);

      if (verificationInput) {
        verificationInput.value = "";
        verificationInput.focus();
      }

      showMessage(
        "We've sent a verification code to your email address.",
        "success"
      );

    } catch (error) {
      console.error("EcoData signup error:", error);

      showMessage(getErrorMessage(error));

    } finally {
      setBusy(false);
    }
  });

  // ==========================================
  // VERIFY EMAIL ADDRESS
  // ==========================================

  verifyButton?.addEventListener("click", async (event) => {
    event.preventDefault();

    if (busy) return;

    clearMessage();

    const code = verificationInput?.value.trim() || "";

    if (!currentSignup) {
      showMessage(
        "Your signup session has expired. Please submit the form again."
      );
      hideModal(codeModal);
      return;
    }

    if (!code) {
      showMessage("Please enter the verification code.");
      verificationInput?.focus();
      return;
    }

    setBusy(true, verifyButton);

    try {
      currentSignup =
        await currentSignup.attemptEmailAddressVerification({
          code
        });

      if (
        currentSignup.status !== "complete" ||
        !currentSignup.createdSessionId
      ) {
        throw new Error(
          "Verification is incomplete. Please follow the instructions and try again."
        );
      }

      // Activate the authenticated Clerk session.
      await clerk.setActive({
        session: currentSignup.createdSessionId
      });

      // Refresh the client state after session activation.
      await clerk.session?.reload?.();

      // Save the user's profile through the authenticated backend.
      await saveProfileAndContinue();

      hideModal(codeModal);

      showModal(successModal);

      showMessage(
        "Your email has been verified and your EcoData profile is ready.",
        "success"
      );

      // Redirect after a short success message.
      setTimeout(() => {
        window.location.href = "./index.html";
      }, 1800);

    } catch (error) {
      console.error("Email verification error:", error);

      showMessage(getErrorMessage(error));

    } finally {
      setBusy(false, verifyButton);
    }
  });

  // ==========================================
  // GOOGLE SIGNUP
  // ==========================================

  googleButton?.addEventListener("click", async (event) => {
    event.preventDefault();

    if (busy) return;

    clearMessage();

    setBusy(true, googleButton);

    try {
      if (!clerk) {
        throw new Error("Authentication is still loading.");
      }

      await clerk.client.signUp.authenticateWithRedirect({
        strategy: "oauth_google",

        redirectUrl: window.location.href,

        redirectUrlComplete: new URL(
          "./index.html",
          window.location.href
        ).href
      });

    } catch (error) {
      console.error("Google signup error:", error);

      showMessage(getErrorMessage(error));

      setBusy(false, googleButton);
    }
  });

  // ==========================================
  // INITIALIZE
  // ==========================================

  try {
    await initializeClerk();

    console.log("EcoData Clerk signup initialized successfully.");

  } catch (error) {
    console.error("Clerk initialization error:", error);

    showMessage(
      "Authentication could not be initialized. Please refresh the page or try again later."
    );
  }
});