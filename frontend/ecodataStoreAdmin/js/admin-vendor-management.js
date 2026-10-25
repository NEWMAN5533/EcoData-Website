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
  const refreshVendorSettings = document.getElementById("refreshVendorSettings");

  let loadedVendor = null;
  let requestInProgress = false;

  const vendorNames = {
    swiftdata: "SwiftData",
    datamart: "DataMart Ghana",
  };

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

  async function getAdminToken() {
    const clerk = window.Clerk;

    if (!clerk) {
      throw new Error(
        "Clerk is not available. Make sure Clerk is initialized on the admin page."
      );
    }

    if (typeof clerk.load === "function") {
      await clerk.load();
    }

    if (!clerk.session) {
      throw new Error("Please sign in to your administrator account.");
    }

    const token = await clerk.session.getToken();

    if (!token) {
      throw new Error("Unable to obtain your sign-in session. Please sign in again.");
    }

    return token;
  }

  async function vendorRequest(url, options = {}) {
    const token = await getAdminToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success) {
      if (response.status === 401) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      if (response.status === 403) {
        throw new Error("Your account is not authorized to manage vendors.");
      }

      throw new Error(
        result.message || `Request failed with status ${response.status}.`
      );
    }

    return result;
  }

  function renderVendor(activeVendor, updatedAt) {
    loadedVendor = activeVendor;

    currentVendorName.textContent =
      vendorNames[activeVendor] || activeVendor;

    currentVendorDescription.textContent =
      activeVendor === "swiftdata"
        ? "New bundle purchase requests are routed to SwiftData."
        : "New bundle purchase requests are routed to DataMart Ghana.";

    vendorStatusBadge.textContent = "Active";
    activeVendorSelect.value = activeVendor;

    if (updatedAt) {
      currentVendorDescription.textContent +=
        ` Last updated: ${new Date(updatedAt).toLocaleString()}.`;
    }
  }

  async function loadVendorSettings() {
    if (requestInProgress) return;

    requestInProgress = true;
    refreshVendorSettings.disabled = true;
    saveVendorSettings.disabled = true;
    refreshVendorSettings.textContent = "Loading...";
    clearVendorAlert();

    try {
      const result = await vendorRequest("/api/admin/vendor/settings");

      const settings = result.settings;

      if (!settings || !vendorNames[settings.activeVendor]) {
        throw new Error("The server returned an unexpected vendor setting.");
      }

      renderVendor(settings.activeVendor, settings.updatedAt);
    } catch (error) {
      console.error("Load vendor settings failed:", error);
      showVendorAlert(error.message, "error");
      currentVendorName.textContent = "Unavailable";
      currentVendorDescription.textContent =
        "Could not retrieve the active vendor from the server.";
      vendorStatusBadge.textContent = "Error";
    } finally {
      requestInProgress = false;
      refreshVendorSettings.disabled = false;
      saveVendorSettings.disabled = false;
      refreshVendorSettings.textContent = "↻ Refresh";
    }
  }

  vendorSettingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (requestInProgress) return;

    const activeVendor = activeVendorSelect.value;

    if (!vendorNames[activeVendor]) {
      showVendorAlert("Please select a valid vendor.", "error");
      return;
    }

    if (activeVendor === loadedVendor) {
      showVendorAlert("This vendor is already active.", "success");
      return;
    }

    const confirmed = window.confirm(
      `Switch the active bundle vendor to ${vendorNames[activeVendor]}? ` +
      "This affects new purchases routed through the vendor setting."
    );

    if (!confirmed) return;

    requestInProgress = true;
    saveVendorSettings.disabled = true;
    refreshVendorSettings.disabled = true;
    saveVendorSettings.textContent = "Saving...";
    clearVendorAlert();

    try {
      const result = await vendorRequest("/api/admin/vendor/settings", {
        method: "PUT",
        body: JSON.stringify({ activeVendor }),
      });

      renderVendor(
        result.settings.activeVendor,
        result.settings.updatedAt
      );

      showVendorAlert(result.message || "Vendor settings updated.", "success");
    } catch (error) {
      console.error("Save vendor settings failed:", error);
      showVendorAlert(error.message, "error");

      // Restore the last confirmed selection.
      if (loadedVendor) {
        activeVendorSelect.value = loadedVendor;
      }
    } finally {
      requestInProgress = false;
      saveVendorSettings.disabled = false;
      refreshVendorSettings.disabled = false;
      saveVendorSettings.textContent = "Save vendor settings";
    }
  });

  refreshVendorSettings.addEventListener("click", loadVendorSettings);

  // Expose this function for your existing dashboard navigation.
  window.loadAdminVendorManagement = loadVendorSettings;
}