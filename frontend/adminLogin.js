  async function initializeAdminLogin() {
    const mount = document.getElementById("clerk-sign-in");
    const errorBox = document.getElementById("error-message");

    try {
      // Wait for Clerk to load
      for (let i = 0; i < 50 && !window.Clerk; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (!window.Clerk) {
        throw new Error(
          "Clerk did not load. Check your connection and publishable key."
        );
      }

      console.log(
        "Clerk UI constructor:", 
        typeof window.__internal_ClerkUICtor
      );

      await window.Clerk.load({
        ui: {
          ClerkUI: window.__internal_ClerkUICtor
        }
      });

      // Check existing session
      if (window.Clerk.user) {
        window.location.replace("../ecodataStoreAdmin/index.html");
        return;
      }

      mount.innerHTML = "";

      console.log("Clerk object:", window.Clerk);
      console.log(
        "mountSignIn:",
        typeof window.Clerk.mountSignIn
      );

      // Mount Clerk sign-in
      if (typeof window.Clerk.mountSignIn !== "function") {
        throw new Error(
          "Clerk sign-in component is unavailable. Check the Clerk JS version and integration."
        );
      }

      window.Clerk.mountSignIn(mount, {
        forceRedirectUrl:
          window.location.origin + "../ecodataStoreAdmin/index.html",
        fallbackRedirectUrl:
          window.location.origin + "../ecodataStoreAdmin/index.html"
      });

      console.log("Clerk sign-in mount requested.");

    } catch (error) {
      console.error("Admin login initialization failed:", error);

      errorBox.textContent = error.message;
      errorBox.style.display = "block";
    }
  }

  initializeAdminLogin();