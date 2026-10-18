// ==========================================
// ECODATASTORE LOGIN
// CLERK + NEON POSTGRESQL
// ==========================================


// ==========================================
// ELEMENTS
// ==========================================

const loginForm = document.getElementById("loginForm");

const loginButton = document.getElementById("userSignupButton");

const loginMessage = document.getElementById("signupMessage");

const loginPassword = document.getElementById("loginPassword");

const loginPasswordToggle = document.getElementById("loginPasswordToggle");


// ==========================================
// MESSAGE
// ==========================================

function showLoginMessage(message, type = "error") {
  if (!loginMessage) return;

  loginMessage.textContent = message;
  loginMessage.className = `signup-message ${type}`;
}

function clearLoginMessage() {
  if (!loginMessage) return;

  loginMessage.textContent = "";
  loginMessage.className = "signup-message";
}


// ==========================================
// LOADING
// ==========================================

function setLoginLoading(loading) {
  if (!loginButton) return;

  loginButton.disabled = loading;
  loginButton.classList.toggle("loading", loading);
}


// ==========================================
// CLERK READY
// ==========================================

async function waitForClerk(timeout = 10000) {
  const start = Date.now();

  while (!window.Clerk) {
    if (Date.now() - start > timeout) {
      throw new Error("Clerk failed to load. Please refresh the page.");
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  await window.Clerk.load();

  return window.Clerk;
}


// ==========================================
// GET BACKEND ACCOUNT
// ==========================================

async function getAccount() {
  const clerk = await waitForClerk();

  if (!clerk.user) {
    throw new Error("Please sign in to continue.");
  }

  const token = await clerk.session?.getToken();

  if (!token) {
    throw new Error("Your login session could not be verified. Please sign in again.");
  }

  const response = await fetch("/api/account/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    },
    credentials: "same-origin"
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        "Your account profile was not found. Please complete your account registration."
      );
    }

    if (response.status === 403) {
      throw new Error(
        data.message || "Your account is inactive or access is restricted."
      );
    }

    throw new Error(
      data.message || "Unable to retrieve your account."
    );
  }

  if (!data.success || !data.account) {
    throw new Error("The server returned an invalid account response.");
  }

  return data.account;
}


// ==========================================
// CLEAR OLD CLIENT-SIDE SESSION DATA
// ==========================================

function clearLocalAccountData() {
  const keys = [
    "accountType",
    "role",
    "sellerId",
    "sellerStoreName",
    "sellerStatus",
    "username",
    "userId",
    "isAdmin"
  ];

  for (const key of keys) {
    localStorage.removeItem(key);
  }
}


// ==========================================
// SAVE BASIC ACCOUNT DISPLAY DATA
// These values are for UI convenience only.
// Backend authorization remains authoritative.
// ==========================================

function saveAccountDisplayData(account) {
  clearLocalAccountData();

  localStorage.setItem("accountType", account.accountType);
  localStorage.setItem("role", account.role);

  localStorage.setItem(
    "username",
    `${account.firstName || ""} ${account.lastName || ""}`.trim() || "User"
  );

  localStorage.setItem("userId", account.userId);

  if (account.seller) {
    localStorage.setItem("sellerId", account.userId);
    localStorage.setItem("sellerStoreName", account.seller.storeName || "");
    localStorage.setItem("sellerStatus", account.seller.status || "pending");
  }
}


// ==========================================
// ROUTE ACCOUNT
// ==========================================

function redirectAccount(account) {
  // Seller profile takes priority.
  if (account.seller) {
    if (account.seller.status === "suspended") {
      showLoginMessage(
        "Your seller account is suspended. Please contact support.",
        "error"
      );

      return;
    }

    showLoginMessage("Seller login successful!", "success");

    setTimeout(() => {
      window.location.replace("sellerDashboard.html");
    }, 500);

    return;
  }

  // Administrator access must be explicitly configured
  // and authorized by the backend before redirecting.
  if (account.role === "admin") {
    showLoginMessage(
      "Administrator access is not yet configured. Please contact support.",
      "error"
    );

    return;
  }

  // Agent authorization is not included in the current
  // Neon schema/API. Do not trust old Firestore flags.
  if (account.role === "agent") {
    showLoginMessage(
      "Agent access is not yet configured. Please contact support.",
      "error"
    );

    return;
  }

  showLoginMessage("Login successful! Welcome back.", "success");

  setTimeout(() => {
    window.location.replace("index.html");
  }, 500);
}


// ==========================================
// PASSWORD VISIBILITY
// ==========================================

if (loginPassword && loginPasswordToggle) {
  loginPasswordToggle.addEventListener("click", () => {
    const showPassword = loginPassword.type === "password";

    loginPassword.type = showPassword ? "text" : "password";

    loginPasswordToggle.setAttribute(
      "aria-label",
      showPassword ? "Hide password" : "Show password"
    );

    loginPasswordToggle.classList.toggle("showing", showPassword);
  });
}


// ==========================================
// LOGIN FORM
// ==========================================

if (loginForm) {
  loginForm.addEventListener("submit", async event => {
    event.preventDefault();

    clearLoginMessage();

    const email = document
      .getElementById("loginEmail")
      ?.value.trim()
      .toLowerCase();

    const password = loginPassword?.value;

    if (!email || !password) {
      showLoginMessage(
        "Please enter your email and password.",
        "error"
      );

      return;
    }

    setLoginLoading(true);

    try {
      const clerk = await waitForClerk();

      // --------------------------------------
      // CLERK EMAIL/PASSWORD AUTHENTICATION
      // --------------------------------------

      if (!clerk.user) {
        const signIn = await clerk.client.signIn.create({
          identifier: email,
          password
        });

        if (signIn.status === "complete") {
          await clerk.setActive({
            session: signIn.createdSessionId
          });
        } else {
          showLoginMessage(
            "Additional verification is required. Please complete the verification steps.",
            "error"
          );

          return;
        }
      }

      // --------------------------------------
      // VERIFY ACCOUNT THROUGH OUR BACKEND
      // --------------------------------------

      const account = await getAccount();

      saveAccountDisplayData(account);

      redirectAccount(account);

    } catch (error) {
      console.error("EcoDataStore login error:", error);

      const clerkCode = error?.errors?.[0]?.code;

      let message = error.message || "Login failed. Please try again.";

      if (
        clerkCode === "form_password_incorrect" ||
        clerkCode === "form_identifier_not_found"
      ) {
        message = "Invalid email or password.";
      } else if (
        clerkCode === "too_many_attempts"
      ) {
        message = "Too many attempts. Please try again later.";
      } else if (
        clerkCode === "session_exists"
      ) {
        message = "You are already signed in. Refresh the page and try again.";
      }

      showLoginMessage(message, "error");

    } finally {
      setLoginLoading(false);
    }
  });
}


// ==========================================
// THEME TOGGLE
// ==========================================

const themeToggle = document.getElementById("signupThemeToggle");

const savedTheme = localStorage.getItem("ecoDataTheme") || "light";

document.documentElement.dataset.theme = savedTheme;

function updateThemeToggle() {
  const isDark = document.documentElement.dataset.theme === "dark";

  themeToggle?.setAttribute("aria-pressed", String(isDark));
  themeToggle?.classList.toggle("is-dark", isDark);
}

themeToggle?.addEventListener("click", () => {
  const isDark = document.documentElement.dataset.theme === "dark";

  const newTheme = isDark ? "light" : "dark";

  document.documentElement.dataset.theme = newTheme;

  localStorage.setItem("ecoDataTheme", newTheme);

  updateThemeToggle();
});

updateThemeToggle();


// ==========================================
// SNACKBAR
// ==========================================

let snackbarTimeout = null;

function showSnackBar(message, type = "info", duration = 4000) {
  let snackbar = document.querySelector(".snackbar");

  if (!snackbar) {
    snackbar = document.createElement("div");
    snackbar.className = "snackbar";

    snackbar.innerHTML = `
      <span class="snackbar-text"></span>
      <div class="snackbar-progress"></div>
    `;

    document.body.appendChild(snackbar);
  }

  snackbar.querySelector(".snackbar-text").textContent = message;

  if (type === "success") {
    snackbar.style.background = "rgba(7, 29, 26, 0.95)";
  } else if (type === "error") {
    snackbar.style.background = "#88353f";
  } else if (type === "warning") {
    snackbar.style.background = "#413b2a";
  } else {
    snackbar.style.background = "rgba(7, 29, 26, 0.95)";
  }

  const progress = snackbar.querySelector(".snackbar-progress");

  progress.style.animation = "none";
  void progress.offsetWidth;

  progress.style.animation = `snackbar-progress ${duration}ms linear forwards`;

  snackbar.classList.add("show");

  if (snackbarTimeout) {
    clearTimeout(snackbarTimeout);
  }

  snackbarTimeout = setTimeout(() => {
    snackbar.classList.remove("show");
  }, duration);
}

console.log("EcoDataStore Clerk login script initialized.");

