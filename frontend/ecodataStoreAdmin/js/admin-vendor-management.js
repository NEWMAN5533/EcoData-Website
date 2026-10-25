/* =========================================
   ECODATASTORE ADMIN VENDOR MANAGEMENT
   Authentication: Clerk
   Backend: /api/admin/vendor/settings
========================================= */

const vendorPage = document.getElementById("vendorManagementPage");

if (vendorPage) {
  const vendorAlert = document.getElementById("vendorAlert");
  const currentVendorName = document.getElementById("currentVendorName");
  const currentVendorDescription = document.getElementById(
    "currentVendorDescription"
  );
  const vendorStatusBadge = document.getElementById("vendorStatusBadge");
  const activeVendorSelect = document.getElementById("activeVendorSelect");
  const vendorSettingsForm = document.getElementById("vendorSettingsForm");
  const saveVendorSettings = document.getElementById("saveVendorSettings");
  const refreshVendorSettings = document.getElementById(
    "refreshVendorSettings"
  );

  /* =========================================
     STATE
  ========================================= */

  let loadedVendor = null;
  let hasLoadedVendor = false;
  let requestInProgress = false;

  const vendorNames = {
    swiftdata: "SwiftData",
    datamart: "DataMart Ghana",
  };

  /* =========================================
     VALIDATE REQUIRED ELEMENTS
  ========================================= */

  const requiredElements = {
    vendorAlert,
    currentVendorName,
    currentVendorDescription,
    vendorStatusBadge,
    activeVendorSelect,
    vendorSettingsForm,
    saveVendorSettings,
    refreshVendorSettings,
  };

  const missingElements = Object.entries(requiredElements)
    .filter(([, element]) => !element)
    .map(([name]) => name);

  if (missingElements.length > 0) {
    console.error(
      "Vendor management is missing HTML elements:",
      missingElements
    );
  } else {
    initializeVendorManagement();
  }

  function initializeVendorManagement() {
    /* =========================================
       ALERTS
    ========================================= */

    function showVendorAlert(message, type = "success") {
      vendorAlert.textContent = message;
      vendorAlert.className = `vendor-alert ${type}`;
      vendorAlert.hidden = false;
    }

    function clearVendorAlert() {
      vendorAlert.hidden = true;
      vendorAlert.textContent = "";
      vendorAlert.className = "vendor-alert";
    }

    /* =========================================
       CLERK AUTHENTICATION
    ========================================= */

    async function getAdminToken() {
      const clerk = window.Clerk;

      if (!clerk) {
        throw new Error(
          "Clerk is unavailable. Check that Clerk is loaded and initialized on this page."
        );
      }

      if (typeof clerk.load === "function") {
        await clerk.load();
      }

      if (!clerk.session) {
        throw new Error(
          "Please sign in to your administrator account."
        );
      }

      const token = await clerk.session.getToken();

      if (!token) {
        throw new Error(
          "Unable to obtain your session token. Please sign in again."
        );
      }

      return token;
    }

    /* =========================================
       AUTHENTICATED API REQUEST
    ========================================= */

    async function vendorRequest(url, options = {}) {
      const token = await getAdminToken();

      const response = await fetch(url, {
        ...options,
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success !== true) {
        if (response.status === 401) {
          throw new Error(
            "Your session has expired. Please sign in again."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "Your account is not authorized to manage vendors."
          );
        }

        throw new Error(
          result.message ||
          `Vendor request failed with status ${response.status}.`
        );
      }

      return result;
    }

    /* =========================================
       RENDER CONFIRMED ACTIVE VENDOR
    ========================================= */

    function renderVendor(activeVendor, updatedAt) {
      const vendor = String(activeVendor || "").trim().toLowerCase();

      if (!Object.prototype.hasOwnProperty.call(vendorNames, vendor)) {
        throw new Error("The server returned an invalid active vendor.");
      }

      loadedVendor = vendor;
      hasLoadedVendor = true;

      currentVendorName.textContent = vendorNames[vendor];

      currentVendorDescription.textContent =
        vendor === "swiftdata"
          ? "New bundle purchase requests are routed to SwiftData."
          : "New bundle purchase requests are routed to DataMart Ghana.";

      if (updatedAt) {
        const parsedDate = new Date(updatedAt);

        if (!Number.isNaN(parsedDate.getTime())) {
          currentVendorDescription.textContent +=
            ` Last updated: ${parsedDate.toLocaleString()}.`;
        }
      }

      vendorStatusBadge.textContent = "Active";
      activeVendorSelect.value = vendor;
      vendorStatusBadge.dataset.status = "active";
    }

    /* =========================================
       LOAD ACTIVE VENDOR
    ========================================= */

    async function loadVendorSettings() {
      if (requestInProgress) return;

      requestInProgress = true;

      refreshVendorSettings.disabled = true;
      saveVendorSettings.disabled = true;

      // Only show the initial checking message before
      // the first successful response.
      if (!hasLoadedVendor) {
        currentVendorName.textContent = "Checking active vendor...";
        currentVendorDescription.textContent =
          "Retrieving the active vendor from the server.";
        vendorStatusBadge.textContent = "Checking";
        vendorStatusBadge.dataset.status = "loading";
      }

      // Keep the refresh button label stable.
      refreshVendorSettings.textContent = "↻ Refresh";

      clearVendorAlert();

      try {
        const result = await vendorRequest(
          "/api/admin/vendor/settings"
        );

        const settings = result.settings;

        if (
          !settings ||
          !Object.prototype.hasOwnProperty.call(
            vendorNames,
            String(settings.activeVendor || "").toLowerCase()
          )
        ) {
          throw new Error(
            "The server returned an unexpected vendor setting."
          );
        }

        renderVendor(
          settings.activeVendor,
          settings.updatedAt
        );

      } catch (error) {
        console.error(
          "Failed to load vendor settings:",
          error
        );

        showVendorAlert(
          error.message || "Unable to load vendor settings.",
          "error"
        );

        // Preserve the last successfully confirmed vendor
        // if a later refresh fails.
        if (!hasLoadedVendor) {
          currentVendorName.textContent = "Unavailable";

          currentVendorDescription.textContent =
            "Could not retrieve the active vendor. Please refresh to try again.";

          vendorStatusBadge.textContent = "Error";
          vendorStatusBadge.dataset.status = "error";
        }

      } finally {
        requestInProgress = false;

        refreshVendorSettings.disabled = false;
        saveVendorSettings.disabled = false;

        refreshVendorSettings.textContent = "↻ Refresh";
      }
    }

    /* =========================================
       SAVE ACTIVE VENDOR
    ========================================= */

    vendorSettingsForm.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        if (requestInProgress) return;

        const activeVendor = String(
          activeVendorSelect.value || ""
        ).trim().toLowerCase();

        if (
          !Object.prototype.hasOwnProperty.call(
            vendorNames,
            activeVendor
          )
        ) {
          showVendorAlert(
            "Please select a valid vendor.",
            "error"
          );
          return;
        }

        if (!hasLoadedVendor) {
          showVendorAlert(
            "Load the current vendor setting before making a change.",
            "error"
          );
          return;
        }

        if (activeVendor === loadedVendor) {
          showVendorAlert(
            "This vendor is already active.",
            "success"
          );
          return;
        }

        const confirmed = window.confirm(
          `Switch the active bundle vendor to ${vendorNames[activeVendor]}? ` +
          "This affects new purchases routed through the vendor setting."
        );

        if (!confirmed) {
          activeVendorSelect.value = loadedVendor;
          return;
        }

        requestInProgress = true;

        saveVendorSettings.disabled = true;
        refreshVendorSettings.disabled = true;
        saveVendorSettings.textContent = "Saving...";

        clearVendorAlert();

        try {
          const result = await vendorRequest(
            "/api/admin/vendor/settings",
            {
              method: "PUT",
              body: JSON.stringify({
                activeVendor,
              }),
            }
          );

          if (
            !result.settings ||
            !Object.prototype.hasOwnProperty.call(
              vendorNames,
              String(result.settings.activeVendor || "").toLowerCase()
            )
          ) {
            throw new Error(
              "The server response did not contain a valid active vendor."
            );
          }

          renderVendor(
            result.settings.activeVendor,
            result.settings.updatedAt
          );

          showVendorAlert(
            result.message || "Vendor settings updated successfully.",
            "success"
          );

        } catch (error) {
          console.error(
            "Failed to save vendor settings:",
            error
          );

          showVendorAlert(
            error.message || "Unable to update vendor settings.",
            "error"
          );

          // Restore the last confirmed vendor selection.
          if (loadedVendor) {
            activeVendorSelect.value = loadedVendor;
          }

        } finally {
          requestInProgress = false;

          saveVendorSettings.disabled = false;
          refreshVendorSettings.disabled = false;

          saveVendorSettings.textContent = "Save vendor settings";
        }
      }
    );

    /* =========================================
       MANUAL REFRESH
    ========================================= */

    refreshVendorSettings.addEventListener(
      "click",
      loadVendorSettings
    );

    /* =========================================
       DASHBOARD NAVIGATION SUPPORT
    ========================================= */

    window.loadAdminVendorManagement = loadVendorSettings;

    /* =========================================
       INITIAL LOAD
    ========================================= */

    loadVendorSettings();
  }
}