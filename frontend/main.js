// UPDATED AT 24th/October, 2026 [BACKUP MAIN.JS]

// --- Firebase Imports ---
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  collection,
  addDoc,
  onSnapshot,
  limit,
  doc,
  setDoc,
  getDoc,
  getFirestore,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ---------- CONFIG ----------
const API_BASE = (() => {
  // use current host in prod or localhost for local dev
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return "http://localhost:3000";
  }
  return "https://ecodata-app.onrender.com"; // your deployed backend
})();

//=========================
// LEADERBOARD START DATE
//=========================
const LEADERBOARD_START = new Date("2026-11-01");
const LEADERBOARD_ENDS = new Date("2026-11-30T23:59:59");

const leaderboardStartText = LEADERBOARD_START.toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
});

const endTimeText = LEADERBOARD_ENDS.toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

//=========================
// LEADERBOARD START DATE
//=========================

// ---------- GLOBAL VARIABLES ----------
let STATUS_POLL_INTERVAL = 5000;
let _statusPollTimer = null; // to hold the interval timer ID

// ---------- GLOBAL STATE ----------
let selectedBundle = null; // used for UI selection (normal view)
let lastPurchasedBundle = null; // used after payment (normal + grid)

// protect payment (save successful)
let lastValidation = null;

// default selectedPackage
let selectedPackageName = "mtn_data_express_delivery";

const PACKAGE_MAP = {
  normal: "mtn_data_normal_delivery",
  express: "mtn_data_express_delivery",
  numbers: "mtn_verified_numbers",
  mashup: "special_mashup_bundle_packages",
};

const STORAGE_KEY = "selected_mtn_package";

function getVendorForPackage(packageName) {
  const normalizedPackage = String(packageName || "").trim();

  return normalizedPackage === PACKAGE_MAP.normal ? "datamart" : "swiftdata";
}

function resolvePackageName(network) {
  if (network === "mtn") {
    return selectedPackageName;
  }

  if (network === "at") {
    return "ishare_data_bundle";
  }

  if (network === "telecel") {
    return "telecel_expiry_bundle";
  }
}

//NEW UPDATED (DOMCONTENTLOADER) - synced with eco-bundle HTML//
document.addEventListener("DOMContentLoaded", () => {
  // =========================================
  //  ELEMENT REFERENCES
  // =========================================

  // Delivery offer dropdown (NOT the bundle options)
  const selectBtn = document.getElementById("selectBtn");
  const dropdownOffer = document.getElementById("dropdownOffer");
  const deliveryOptions = document.querySelectorAll(".eco-offer-option");

  const targetDiv = document.getElementById("topOpt");
  const unTargetDiv = document.getElementById("bottomOpt");

  const gridExpressDiv = document.getElementById("gridExpressDiv");
  const gridNormalDiv = document.getElementById("gridNormalDiv");
  const gridMashupDiv = document.getElementById("mashGridDiv");

  // Bundle picker (new eco-bundle markup)
  const optionBtn = document.getElementById("optionBtn");
  const moveDown = document.getElementById("moveDown");
  const recipientInput = document.getElementById("ecoBundleRecipient");

  // Mashup toggle
  const mashupNormal = document.getElementById("mash");
  const mashLabel = document.querySelector(".eco-bundle-field-label");
  const mashRecipient = document.querySelector(".eco-bundle-label");
  const mashPacks = document.querySelector(".packs");
  const mashTitle = document.querySelector(".top-dashboard h2");
  const mashTopRightContainerh2 = document.querySelector(
    ".top-right-content h2",
  );
  const mashTopRightContainerSmall = document.querySelector(
    ".top-right-content small",
  );
  const mashTopRightContainerBtn = document.querySelector(".btn-div");

  const mtnArea = document.getElementById("mtnArea");
  const mtnAreaDiv = document.getElementById("bundles");

  const bottomNavDiv = document.getElementById("navIconDiv");

  // =========================================
  //  SMALL HELPERS
  // =========================================

  function setText(el, text) {
    if (el) el.textContent = text;
  }

  function setTextById(id, text) {
    setText(document.getElementById(id), text);
  }

  function setDisplay(el, value) {
    if (el) el.style.display = value;
  }

  // Updates only the inner text of the picker button so the icon/chevron survive
  function setPicker(title, hint = "Choose your preferred data size") {
    if (!optionBtn) return;
    setText(optionBtn.querySelector(".eco-bundle-picker-copy strong"), title);
    setText(optionBtn.querySelector(".eco-bundle-picker-copy small"), hint);
  }

  function clearActiveBundle() {
    document
      .querySelectorAll(".eco-bundle-option--active")
      .forEach((o) => o.classList.remove("eco-bundle-option--active"));
  }

  // Dropdown open/close with aria-expanded
  function closeAllDropdowns() {
    if (moveDown) moveDown.style.display = "none";
    if (optionBtn) optionBtn.setAttribute("aria-expanded", "false");
  }

  function openBundleDropdown() {
    if (moveDown) moveDown.style.display = "block";
    if (optionBtn) optionBtn.setAttribute("aria-expanded", "true");
  }

  // Applies the network colour to the grid confirmation modal
  function applyNetworkTheme(network) {
    const themes = {
      mtn: "rgba(245, 179, 57, 0.932)",
      telecel: "linear-gradient(to right, rgb(241, 62, 122), rgb(192, 3, 82))",
      at: "linear-gradient(to right, rgb(75, 148, 233), rgb(4, 145, 170))",
    };

    const bg = themes[network];
    if (!bg) return;

    [
      document.querySelector(".modal-content-top"),
      document.querySelector(".continue"),
      document.getElementById("networkTag"),
    ].forEach((el) => {
      if (el) el.style.background = bg;
    });
  }

  function setOfferButton(option) {
    if (!selectBtn) return;

    const icon = option.querySelector(".eco-offer-option-icon i");
    const title = option.querySelector(".eco-offer-option-copy strong");
    const note = option.querySelector(".eco-offer-option-copy small");

    selectBtn.innerHTML = `
    <span class="eco-offer-selector-leading">
      <span class="eco-offer-selector-icon">
        <i class="${icon ? icon.className : "ri-wifi-line"}" aria-hidden="true"></i>
      </span>
      <span class="eco-offer-selector-label">
        <small>${note ? note.textContent.trim() : "SELECTED OFFER"}</small>
        <strong>${title ? title.textContent.trim() : ""}</strong>
      </span>
    </span>

    <span class="eco-offer-selector-chevron">
      <i class="ri-arrow-down-s-line" aria-hidden="true"></i>
    </span>
  `;
  }

  function setActiveOffer(option) {
    deliveryOptions.forEach((o) =>
      o.classList.remove("active", "eco-offer-option--active"),
    );
    option.classList.add("active", "eco-offer-option--active");
  }

  function setOfferDropdown(open) {
    dropdownOffer.classList.toggle("show", open);
    selectBtn.setAttribute("aria-expanded", String(open));
  }

  function setButtonBusy(button, busy, label = "Processing...") {
    button.disabled = busy;
    button.setAttribute("aria-busy", String(busy));

    // Only touch the <span> label so the icons survive
    const span = button.querySelector("span");
    if (!span) return;

    if (busy) {
      span.dataset.original = span.textContent;
      span.textContent = label;
    } else if (span.dataset.original) {
      span.textContent = span.dataset.original;
      delete span.dataset.original;
    }
  }

  // =========================================
  //  CHECK RESTRICTIONS
  // =========================================

  async function checkRestrictions() {
    try {
      const response = await fetch("/api/restrictions");
      return await response.json();
    } catch (error) {
      console.error("Restrictions check failed", error);
      return { success: false };
    }
  }

  async function canUseNormalDeliveryMode() {
    // Normal Delivery is always selectable.
    // Vendor routing is handled by getVendorForPackage().
    // Recipient verification is handled before payment.
    return true;
  }

  // =========================================
  //  VALIDATE RECIPIENT
  // =========================================

  async function validateRecipient(phone, offerSlug, network) {
    const normalizedNetwork = String(network || "")
      .trim()
      .toLowerCase();

    // AT and Telecel do not require MTN recipient validation
    if (["at", "telecel"].includes(normalizedNetwork)) {
      return {
        success: true,
        eligible: true,
        skipped: true,
        message: "Recipient validation not required for this network.",
      };
    }

    console.log("Sending validation:", {
      phone,
      offerSlug,
      network: normalizedNetwork,
    });

    try {
      const response = await fetch("/api/validate-recipient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, offerSlug }),
      });

      return await response.json();
    } catch (error) {
      console.log("Validation Error", error);

      return {
        success: false,
        eligible: false,
        message: "Unable to verify recipient",
      };
    }
  }

  /* =========================================
     VENDOR-AWARE RECIPIENT VALIDATION

     SwiftData: uses the existing validateRecipient().
     DataMart: uses the backend verification
     before allowing payment to continue.
  ========================================= */

  function normalizeGhanaPhone(phone) {
    let value = String(phone || "").trim();

    if (value.startsWith("+233")) {
      value = "0" + value.substring(4);
    } else if (value.startsWith("233")) {
      value = "0" + value.substring(3);
    }

    return value;
  }

  async function precheckRecipientBeforePayment(bundle, recipient) {
    const phone = normalizeGhanaPhone(recipient);

    // 1. Validate phone number locally first.
    if (!/^0\d{9}$/.test(phone)) {
      showSnackBar(
        "Enter a valid 10-digit Ghanaian phone number.",
        "error",
        4000,
      );
      return false;
    }

    const vendor = getVendorForPackage(bundle.packageName);

    console.log("Offer:", bundle.packageName);
    console.log("Selected vendor:", vendor);

    try {
      // =========================================
      // DATAMART RECIPIENT VERIFICATION
      // =========================================
      if (vendor === "datamart") {
        const response = await fetch("/api/verify-recipient", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            network: bundle.network || "mtn",
            recipient: phone,
            size: Number(bundle.size),
            offerSlug: bundle.packageName,
          }),
        });

        let result;

        try {
          result = await response.json();
        } catch {
          result = null;
        }

        console.log("DataMart verification response:", {
          httpStatus: response.status,
          result,
        });

        // A. Backend explicitly approves purchase.
        if (result?.canProceed === true) {
          lastValidation = {
            success: true,
            eligible: true,
            provider: result.provider || "datamart",
            verification: result.verification || null,
            verificationSkipped: result.verificationSkipped === true,
          };

          showSnackBar(
            result.message || "Recipient check complete. You may continue.",
            "success",
            3000,
          );

          return true;
        }

        // B. Confirmed recipient rejection. These MUST block payment.
        const blockingCodes = [
          "INVALID_RECIPIENT",
          "RECIPIENT_NOT_VERIFIED",
          "RECIPIENT_ACTIVATION_REQUIRED",
        ];

        if (
          blockingCodes.includes(result?.code) ||
          result?.activationRequired === true
        ) {
          showSnackBar(
            result.message ||
              "This recipient cannot receive the selected bundle. Please select another offer",
            "error",
            5000,
          );

          return false;
        }

        // C. Verification temporarily unavailable: allow payment to continue.
        const temporaryFailureCodes = [
          "VERIFY_UNAVAILABLE",
          "VERIFICATION_FAILED",
          "INVALID_VERIFICATION_RESPONSE",
          "NETWORK_VERIFICATION_UNAVAILABLE",
          "VERIFICATION_CONFIG_ERROR",
          "VENDOR_UNAVAILABLE",
        ];

        const temporaryHttpStatuses = [408, 429, 500, 502, 503, 504];

        const verificationUnavailable =
          temporaryFailureCodes.includes(result?.code) ||
          temporaryHttpStatuses.includes(response.status);

        if (verificationUnavailable) {
          lastValidation = {
            success: true,
            eligible: true,
            provider: "datamart",
            verificationSkipped: true,
            verificationStatus: "unavailable",
          };

          showSnackBar(
            "Verification is successful",
            "info",
            5000,
          );

          return true;
        }

        // D. Unknown or ambiguous response: fail safely.
        showSnackBar(
          result?.message ||
            "We could not confirm this recipient. Please try again.",
          "error",
          5000,
        );

        return false;
      }
// =========================================
      // SWIFTDATA V2 BENEFICIARY CHECK
      // =========================================

      const swiftResponse = await fetch(
        "/api/validate-recipient",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            phones: ["233" + phone.substring(1)],
            offerSlug: bundle.packageName,
          }),
        }
      );

      const validation = await swiftResponse.json();

      console.log("SwiftData beneficiary check:", {
        httpStatus: swiftResponse.status,
        validation,
      });

      if (
        !swiftResponse.ok ||
        validation?.eligible !== true
      ) {
        showSnackBar(
          validation?.message ||
            validation?.error?.message ||
            "Recipient validation failed.",
          "error",
          4000
        );

        return false;
      }

      lastValidation = {
        ...validation,
        success: true,
        eligible: true,
        provider: "swiftdata",
      };

      return true;
    } catch (error) {
      console.error("Recipient precheck error:", error);

      // A network exception means verification failed,
      // not that the recipient was confirmed invalid.
      // Allow the purchase to continue for DataMart only.
      if (vendor === "datamart") {
        lastValidation = {
          success: true,
          eligible: true,
          provider: "datamart",
          verificationSkipped: true,
          verificationStatus: "unavailable",
        };

        showSnackBar(
          "Recipient Can Purchase.",
          "info",
          3000,
        );

        return true;
      }

      showSnackBar(
        "Unable to verify the recipient. Please try again.",
        "error",
        4000,
      );
      return false;
    }
  }

  // =========================================
  //  PACKAGE UI (NORMAL / EXPRESS / NUMBERS / MASHUP)
  // =========================================

  function applyPackageUI(mode) {
    selectedPackageName = PACKAGE_MAP[mode];

    // Shared MTN text (express, numbers, normal)
    function applyMtnText(packCount) {
      setText(mashTopRightContainerh2, "MTN Data Bundle");
      setText(
        mashTopRightContainerSmall,
        "Purchase MTN data bundles for single or multiple recipients",
      );
      setText(mashTopRightContainerBtn, "14 Packages Available");

      setText(mashTitle, "MTN DATA BUNDLE");
      setText(mashPacks, packCount);

      setText(mashRecipient, "Bundle Recipient Number");
      setText(mashLabel, "Select your bundle");
      setPicker("Select Bundle");
    }

    if (mode === "express" || mode === "numbers") {
      applyMtnText("13 Packages Available");

      setDisplay(targetDiv, "none");
      setDisplay(gridExpressDiv, "block");
      setDisplay(gridNormalDiv, "none");

      setDisplay(unTargetDiv, "block");
      setDisplay(gridMashupDiv, "none");

      setDisplay(mtnArea, "block");
      setDisplay(mtnAreaDiv, "block");
    } else {
      setDisplay(gridExpressDiv, "none");
      setDisplay(unTargetDiv, "none");

      setDisplay(targetDiv, "block");
      setDisplay(gridNormalDiv, "block");
    }

    // NORMAL
    if (mode === "normal") {
      applyMtnText("14 Packages Available");

      if (gridExpressDiv) gridExpressDiv.classList.add("active");
      setDisplay(gridMashupDiv, "none");

      setDisplay(mtnArea, "block");
      setDisplay(mtnAreaDiv, "block");
    } else if (gridExpressDiv) {
      gridExpressDiv.classList.remove("active");
    }

    // MASHUP
    if (mode === "mashup") {
      setText(mashTopRightContainerh2, "Special Mashup Bundle");
      setText(
        mashTopRightContainerSmall,
        "Purchase MASHUP bundle for single or multiple recipients",
      );
      setText(mashTopRightContainerBtn, "13 Packages Available");

      setDisplay(mashupNormal, "block");

      setText(mashTitle, "SPECIAL MASHUP BUNDLES");
      setText(mashPacks, "13 Packages Available");

      setText(mashRecipient, "Mashup Recipient Number");
      setText(mashLabel, "Select your mashup bundle");
      setPicker("Select Mashup Bundle");

      setDisplay(targetDiv, "none");
      setDisplay(unTargetDiv, "none");
      setDisplay(gridNormalDiv, "none");
      setDisplay(gridExpressDiv, "none");

      setDisplay(gridMashupDiv, "block");
      setDisplay(mtnArea, "block");
      setDisplay(mtnAreaDiv, "block");
    } else {
      setDisplay(mashupNormal, "none");
    }
  }

  // =========================================
  //  RESET SELECTED BUNDLE
  // =========================================

  function resetSelectedBundle(reason = "") {
    selectedBundle = null;

    setPicker("Select bundle");

    [
      "placeHolderGB",
      "networkTextContent",
      "totalAmountText",
      "placeHolderPriceTotal",
    ].forEach((id) => setTextById(id, ""));

    clearActiveBundle();

    if (recipientInput) recipientInput.value = "";

    if (reason) {
      showSnackBar(reason, "info", 5000);
    }
  }

  // =========================================
  //  RESTORE SAVED DELIVERY MODE
  // =========================================

  const savedMode = localStorage.getItem(STORAGE_KEY);
  const saveMode = PACKAGE_MAP[savedMode] ? savedMode : "normal";

  const activeOption = document.querySelector(
    `.eco-offer-option[data-mode="${saveMode}"]`,
  );

  if (activeOption) {
    applyPackageUI(saveMode);
    selectedPackageName = PACKAGE_MAP[saveMode];
    setActiveOffer(activeOption);
    setOfferButton(activeOption);
    setOfferDropdown(false);
  }

  // =========================================
  //  DELIVERY OFFER DROPDOWN
  // =========================================

  if (selectBtn && dropdownOffer) {
    selectBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setOfferDropdown(!dropdownOffer.classList.contains("show"));
    });
  }

  document.addEventListener("click", () => {
    if (dropdownOffer) setOfferDropdown(false);
  });

  // Select delivery package
  deliveryOptions.forEach((option) => {
    option.addEventListener("click", async (e) => {
      e.stopPropagation();

      const mode = option.dataset.mode;

      if (mode === "normal") {
        const allowed = await canUseNormalDeliveryMode();

        if (!allowed) {
          showSnackBar(
            "Please choose another offer. Normal Delivery Mode is currently unavailable.",
            "error",
            4000,
          );
          dropdownOffer.classList.remove("show");
          return;
        }
      }

      // Validate the selected mode.
      if (!PACKAGE_MAP[mode]) {
        showSnackBar("Invalid delivery offer selected.", "error", 4000);
        return;
      }

      // Reset the previously selected bundle.
      resetSelectedBundle("Offer changed. Please select a bundle.");

      // Save the selection only after the checks pass.
      localStorage.setItem(STORAGE_KEY, mode);

      applyPackageUI(mode);
      selectedPackageName = PACKAGE_MAP[mode];

      // Update the main selection button.

      setOfferButton(option);
      setOfferDropdown(false);
      setActiveOffer(option);

      showSnackBar("Offer updated.", "info", 2000);
    });
  });

  // =========================================
  //  BUNDLE PICKER (NORMAL VIEW)
  // =========================================

  // Open / close the bundle dropdown
  if (optionBtn) {
    optionBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      const isOpen = optionBtn.getAttribute("aria-expanded") === "true";

      if (isOpen) {
        closeAllDropdowns();
      } else {
        openBundleDropdown();
      }
    });
  }

  // Select a bundle option
  document.querySelectorAll(".eco-bundle-option").forEach((opt) => {
    opt.addEventListener("click", () => {
      selectedBundle = {
        network: opt.dataset.network,
        dataValue: opt.dataset.value,
        packageName: resolvePackageName(opt.dataset.network),
        size: Number(opt.dataset.size),
        price: Number(opt.dataset.price),
      };

      // Fee is 1.95% (same rate used for the total and the fee badge)
      const total = Number((selectedBundle.price * 1.0195).toFixed(2));
      const fee = (total - selectedBundle.price).toFixed(2);

      // Active state
      clearActiveBundle();
      opt.classList.add("eco-bundle-option--active");

      // Picker button
      setPicker(
        opt.dataset.value,
        `GH₵ ${selectedBundle.price.toFixed(2)} · Fee: ${fee}`,
      );

      // Order summary
      setTextById("placeHolderGB", opt.dataset.value);
      setTextById("networkTextContent", selectedBundle.network.toUpperCase());
      setTextById("placeHolderPriceTotal", `GH₵ ${total.toFixed(2)}`);
      setTextById("totalAmountText", `GH₵ ${total.toFixed(2)}`);

      closeAllDropdowns();
    });
  });

  // =========================================
  //  PLACE ORDER / BUY BUTTONS (NORMAL + GRID)
  // =========================================

  document
    .querySelectorAll(
      "#normalView .eco-bundle-order-button, #gridView .buy-btn",
    )
    .forEach((button) => {
      button.addEventListener("click", async () => {
        if (button.disabled) return; // blocks double taps
        setButtonBusy(button, true, "Verifying Number...");

        let paymentStarted = false;

        try {
          if (bottomNavDiv) bottomNavDiv.style.display = "flex";

          // ================= NORMAL VIEW =================
          if (button.closest("#normalView")) {
            if (!selectedBundle) {
              showSnackBar("📱 Please select a bundle first");
              return;
            }

            if (!recipientInput || !recipientInput.value.trim()) {
              showSnackBar("📱 Please enter a phone number");
              return;
            }

            const recipient = recipientInput.value.trim();

            if (!/^[0-9]{10}$/.test(recipient)) {
              showSnackBar("📱 Phone number must be exactly 10 digits");
              return;
            }

            const bundle = { ...selectedBundle };

            const precheckPassed = await precheckRecipientBeforePayment(
              bundle,
              recipient,
            );
            if (!precheckPassed) return;

            lastPurchasedBundle = bundle;

            paymentStarted = true;
            payWithPaystack(bundle, recipient);
            resetSelectedBundle();
          }

          // ================= GRID VIEW =================
          else {
            const bundle = {
              network: button.dataset.network,
              dataValue: button.dataset.value,
              packageName: resolvePackageName(button.dataset.network),
              size: Number(button.dataset.size),
              price: Number(button.dataset.price),
            };

            if (
              !bundle.network ||
              !Number.isFinite(bundle.size) ||
              bundle.size <= 0 ||
              !Number.isFinite(bundle.price) ||
              bundle.price <= 0
            ) {
              showSnackBar(
                "Invalid bundle details. Please try again.",
                "error",
                4000,
              );
              return;
            }

            applyNetworkTheme(button.dataset.network);

            const priceWithFee = (bundle.price * 1.0195).toFixed(2);
            const priceFee = (priceWithFee - bundle.price).toFixed(2);

            setDashboardText("priceTag", `GHS₵ ${bundle.price}`);
            setDashboardText("networkTag", `${bundle.network.toUpperCase()} `);
            setDashboardText("sizeTag", `${bundle.dataValue}`);
            setDashboardText("netWorth", `${bundle.network.toUpperCase()}`);
            setDashboardText("gbSize", `${bundle.dataValue.toUpperCase()}`);
            setDashboardText("amount", `GHS₵ ${priceWithFee}`);
            setDashboardText("priceWithFee", `GHS₵ ${priceFee}`);

            let submitting = false; // guards the modal's continue button

            createPhoneModal(async (inputNumber) => {
              if (submitting) return;
              submitting = true;

              try {
                const precheckPassed = await precheckRecipientBeforePayment(
                  bundle,
                  inputNumber,
                );
                if (!precheckPassed) return;

                lastPurchasedBundle = bundle;

                payWithPaystack(bundle, inputNumber);
                resetSelectedBundle();
              } finally {
                // allow a retry if the check failed, stay locked once payment started
                setTimeout(() => {
                  submitting = false;
                }, 3000);
              }
            });
          }
        } finally {
          // Failed checks unlock right away; after payment starts, keep a short cooldown
          setTimeout(
            () => setButtonBusy(button, false),
            paymentStarted ? 3000 : 0,
          );
        }
      });
    });
  // =========================================
  //  NORMAL & GRID MODE TOGGLE
  // =========================================

  const normalModeBtn = document.getElementById("normalModeBtn");
  const gridModeBtn = document.getElementById("gridModeBtn");
  const normalView = document.getElementById("normalView");
  const gridView = document.getElementById("gridView");

  const bundleTitle = document.getElementById("bundleTitle");
  const telecelAirtel = document.getElementById("teleAirtel");

  // package divs
  const mtnPackageDiv = document.querySelector(".packages");
  const telecelPackageDiv = document.querySelector(".packagesta");

  // NORMAL MODE BTN
  if (normalModeBtn) {
    normalModeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      normalModeBtn.classList.add("active");
      gridModeBtn.classList.remove("active");

      setText(bundleTitle, "MTN Bundles");
      setDisplay(telecelAirtel, "block");

      if (telecelPackageDiv) telecelPackageDiv.style.background = "white";
      if (mtnPackageDiv) {
        mtnPackageDiv.style.background =
          "linear-gradient(134deg, rgb(241, 218, 8), rgb(180, 106, 8))";
      }

      // RESET BUNDLE WHEN MODE CHANGED
      resetSelectedBundle();

      setDisplay(normalView, "block");
      setDisplay(gridView, "none");
    });
  }

  // GRID MODE BTN
  if (gridModeBtn) {
    gridModeBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      normalModeBtn.classList.remove("active");
      gridModeBtn.classList.add("active");

      setText(bundleTitle, "MTN");
      setDisplay(telecelAirtel, "flex");

      if (mtnPackageDiv) mtnPackageDiv.style.background = "white";

      // RESET BUNDLE WHEN MODE CHANGED
      resetSelectedBundle();

      setDisplay(gridView, "block");
      setDisplay(normalView, "none");

      closeAllDropdowns();
    });
  }

  // =========================================
  //  CLOSE BUNDLE DROPDOWN WHEN CLICKING OUTSIDE
  // =========================================

  window.addEventListener("click", () => {
    closeAllDropdowns();
  });
});

//NEW UPDATED 21/01/2026 //
function createPhoneModal(callback) {
  const modal = document.getElementById("phoneModal");
  const confirmBtn = document.getElementById("confirmBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const input = document.getElementById("recipientInput");

  // Show modal
  modal.classList.add("show");

  cancelBtn.onclick = () => {
    modal.classList.remove("show");
  };

  confirmBtn.onclick = () => {
    const recipient = input.value.trim();
    if (!recipient) {
      showSnackBar("📱 Please enter your phone number");
      return;
    }

    // digit only + exactly 10 numbers
    if (!/^[0-9]{10}$/.test(recipient)) {
      showSnackBar("📱 Phone number must be exactly 10 digits");
      return; // stop
    }
    modal.classList.remove("show");
    callback(recipient);
  };
}

// ===================
// LOADER SPINNERS IFRAME
//=====================

// --------------------==========

function showLoader() {
  const loader = document.getElementById("paystackLoader");
  if (!loader) return;
  loader.style.display = "flex";
  document.body.classList.add("no-scroll");
}

function hideLoader() {
  const loader = document.getElementById("paystackLoader");
  if (!loader) return;
  loader.style.display = "none";
  document.body.classList.remove("no-scroll");
}

// ===================
// LOADER SPINNER IFRAME
//=====================

// =======================
// PLAY SOUND WHEN ORDER IS SUCCESSFUL
// ===========================
function playSuccessSound() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  const playTone = (freq, start, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(2.5, audioCtx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioCtx.currentTime + start + duration,
    );

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(audioCtx.currentTime + start);
    osc.stop(audioCtx.currentTime + start + duration);
  };

  // Three-tone success chime
  playTone(800, 0, 0.15);
  playTone(1000, 0.15, 0.15);
  playTone(1300, 0.3, 0.2);
}

// =======================
// PLAY SOUND WHEN ORDER IS SUCCESSFUL ENDS
// =======================

// =================================================
// CHECK IF THE RECIPIENT HAS ACTIVE ORDER (ALREADY)
// =================================================

const activeStatus = [ "queued"];

function normalizeNumber(num = "") {
  return String(num).replace(/\D/g, "").slice(-9);
}

function hasActiveOrder(recipient) {
  const orders = JSON.parse(localStorage.getItem(LIVE_ORDERS_KEY)) || [];

  const target = normalizeNumber(recipient);

  return orders.some((o) => {
    const status = (o.status || "").toLowerCase();

    return (
      normalizeNumber(o.recipient) === target && activeStatus.includes(status)
    );
  });
}
// =================================================
// CHECK IF THE RECIPIENT HAS ACTIVE ORDER (ALREADY) ENDS
// =================================================

//===========================
// ACTIVATE DELIVERY TRACKER
//===========================

function activateTrackers() {
  const firstTracker = (document.getElementById(
    "deliveryTracker1",
  ).style.display = "none");

  const secondTracker = (document.getElementById(
    "deliveryTracker2",
  ).style.display = "flex");
}

// un activate trackers when no orders
function unActivateTrackers() {
  const firstTracker = (document.getElementById(
    "deliveryTracker1",
  ).style.display = "none");

  const secondTracker = (document.getElementById(
    "deliveryTracker2",
  ).style.display = "none");
}

//=================================
// ACTIVATE DELIVERY TRACKER ENDS
//=================================

//=======================
// SAFE DOM TEXT UPDATE
//=======================
function setDashboardText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

const SUCCESS_ORDER_ICON = "./css/icons/checked.jpeg";
const ORDERS_SECTION_ID = "eco-table-scroll-section";

let successOrderPopupTimer = null;

// Load the image early so the popup never waits for it
(function preloadSuccessIcon() {
  const img = new Image();
  img.src = SUCCESS_ORDER_ICON;
})();

function showSuccessfulOrderPopup({ size, recipient } = {}) {
  const overlay = document.getElementById("successOrderPopup");
  if (!overlay) return;

  const card = overlay.querySelector(".success-modal-content");
  const icon = document.getElementById("successOrderIcon");
  const sizeEl = document.getElementById("successOrderSize");
  const recipientEl = document.getElementById("successOrderRecipient");

  if (icon && !icon.getAttribute("src")) icon.src = SUCCESS_ORDER_ICON;

  // textContent, never innerHTML: the recipient comes from user input
  if (sizeEl) sizeEl.textContent = `${Number(size) || 0}GB`;
  if (recipientEl) recipientEl.textContent = String(recipient || "your number");

  clearTimeout(successOrderPopupTimer);

  // Reset so the animation plays for every new order
  overlay.classList.remove("is-visible");
  overlay.setAttribute("aria-hidden", "true");
  if (card) void card.offsetWidth;

  overlay.classList.add("is-visible");
  overlay.setAttribute("aria-hidden", "false");

  document
    .getElementById("successOrderViewBtn")
    ?.focus({ preventScroll: true });

  successOrderPopupTimer = setTimeout(closeSuccessfulOrderPopup, 30000);
}

function closeSuccessfulOrderPopup() {
  const overlay = document.getElementById("successOrderPopup");
  if (!overlay) return;

  clearTimeout(successOrderPopupTimer);
  overlay.classList.remove("is-visible");
  overlay.setAttribute("aria-hidden", "true");
}

function scrollToOrdersTable() {
  const target = document.getElementById(ORDERS_SECTION_ID);
  if (!target) return;

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({
    behavior: reduce ? "auto" : "smooth",
    block: "start",
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("successOrderPopup");

  // View Order: hide the popup, then scroll to the orders table
  document
    .getElementById("successOrderViewBtn")
    ?.addEventListener("click", () => {
      closeSuccessfulOrderPopup();
      requestAnimationFrame(scrollToOrdersTable);
    });

  // Tap outside the card to close
  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) closeSuccessfulOrderPopup();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSuccessfulOrderPopup();
  });
});

//NEW UPDATED 21/01/2026 //
// === PAYSTACK PAYMENT (Firebase version) ===

async function payWithPaystack(bundle, recipient) {
  //  if(bundle.network?.toLowerCase() === "mtn") {
  //   showSnackBar("📱 MTN ORDER PAUSED, WE ARE IMPLEMENTING  PREMIUM SYSTEM TO IMPROVE DELIVERY. PLEASE TRY AGAIN LATER.",   "success", 10000);
  //  return;
  // }

  const normalizedNetwork = String(bundle.network || "")
    .trim()
    .toLowerCase();

  const requiresRecipientValidation = !["at", "telecel"].includes(
    normalizedNetwork,
  );

  const validatedProvider = lastValidation?.provider;

  // DataMart validation uses success.
  // SwiftData retains its existing eligible check.
  const recipientValidated =
    validatedProvider === "datamart"
      ? lastValidation?.success === true
      : lastValidation?.eligible === true;

  if (requiresRecipientValidation && !recipientValidated) {
    showSnackBar(
      "Recipient verification required before payment",
      "warning",
      3000,
    );
    return;
  }

  if (hasActiveOrder(recipient)) {
    showSnackBar("❌ Number already has an active order", "warning", 4000);
    return; // STOP PAYMENT
  }

  const { network, packageName, size } = bundle;

  const payWithFee = Number((bundle.price * 1.0195).toFixed(2));

  console.log("Checkout price debug:", {
    offer: packageName,
    network,
    size,
    bundlePrice: bundle.price,
    checkoutPrice: payWithFee,
    paystackAmountPesewas: Math.round(payWithFee * 100),
  });

  const user = auth.currentUser;
  const userEmail = user?.email || `${recipient}@ecodata.com`;
  const userName = user?.nameDisplay || "Guest User";

  // 1️⃣ Show YOUR loader first
  showLoader();

  // 2️⃣ Let browser paint it
  setTimeout(() => {
    const paystack = new PaystackPop();

    paystack.newTransaction({
      key: "pk_live_635856447ee14b583349141b7271f64c9b969749",
      email: userEmail,
      amount: payWithFee * 100,
      currency: "GHS",

      metadata: {
        type: "bundle",
        recipient,
        network,
        pkg: packageName,
        size,

        custom_fields: [
          { display_name: "User Name", value: userName },
          { display_name: "Recipient", value: recipient },
          { display_name: "Network", value: network },
          { display_name: "Size", value: `${size}GB` },
          { display_name: "Package", value: packageName },
        ],
      },

      onSuccess: async (response) => {
        console.log("✅ Paystack onSuccess fired:", response.reference);

        hideLoader();

        try {
          // =========================
          // GET THE SELECTED PACKAGE
          // =========================
          const currentPackageName =
            lastPurchasedBundle?.packageName ||
            packageName ||
            bundle.packageName ||
            selectedBundle.packageName;

          if (!currentPackageName) {
            throw new Error(
              "Selected package is missing. Cannot determine the vendor.",
            );
          }

          console.log("📦 Selected package:", currentPackageName);

          // =========================
          // DETERMINE VENDOR BY PACKAGE
          // =========================
          const activeVendor = getVendorForPackage(currentPackageName);

          console.log("🚚 Vendor selected for package:", activeVendor);

          // =========================
          // PROCESS THE PURCHASE
          // =========================
          if (activeVendor === "datamart") {
            console.log("➡️ Calling Vendor2 purchase function...");

            await orderDataMartBundle(
              network,
              recipient,
              currentPackageName,
              size,
              response.reference,
            );
          } else {
            console.log("➡️ Calling Vendor1 purchase function...");

            await orderBundle(
              network,
              recipient,
              currentPackageName,
              size,
              response.reference,
            );
          }
        } catch (error) {
          console.error("❌ Post-payment processing error:", error);

          showSnackBar(
            "Payment succeeded, but order processing could not start. Contact support with your payment reference: " +
              response.reference,
            "error",
            8000,
          );
        }
      },

      onCancel: () => {
        hideLoader();
        showSnackBar("❌ Payment cancelled");
      },
    });
  }, 3120);
}
// SELECTED BUNDLE FOR UI UPDATE

//NEW UPDATED 21/01/2026 //
// === SEND ORDER TO BACKEND ===

async function orderBundle(network, recipient, packageName, size, reference) {
  try {
    const bundle = lastPurchasedBundle;
    if (!bundle) {
      showSnackBar("⚠ Order context missing");
      return;
    }

    const API_BASE =
      window.location.hostname === "localhost"
        ? "http://localhost:3000"
        : "https://ecodata-app.onrender.com";

    const response = await fetch(`${API_BASE}/api/buy-data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        network,
        recipient,
        package: packageName,
        size,
        paymentReference: reference,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      showSnackBar(`❌ ${result.message || "Order failed"}`, "error", 5000);
      return;
    }

    const returnedOrder = result.order?.order || result.order || result;

    const orderId = String(
      returnedOrder.orderId || returnedOrder.publicId || returnedOrder.clientReference || returnedOrder.id || returnedOrder.reference || reference || ""
    ).trim();

    const orderData = {
      orderId,
      
      reference: returnedOrder.reference,

      recipient,

      network: bundle.network,

        // Portal identification
      packageName: packageName ||
      bundle.packageName || "",

      volume: Number(bundle.size || size || 0),

      dataValue: `${bundle.dataValue || selectedBundle.dataValue || 0}`,

      amount: Number(bundle.price * 1.0195 || 0),
      provider: "swiftdata",

      status: "pending",

      source: "web",

      isGuest: !auth.currentUser,

      createdBy: auth.currentUser?.uid || "guest",

      createdAt: Date.now(),
    };

    handleNewOrder(orderData);

    try {
      playSuccessSound();
      showSuccessfulOrderPopup({
        size: orderData.volume,
        recipient: orderData.recipient,
      });
    } catch (e) {
      console.error("Success popup failed:", e);
    }

    updateHomepageTotals(orderData);

    console.log("Calling saveOrderToFirestore...");
    console.log(orderData);

    try {
      const firestoreId = await saveOrderToFirestore(orderData);
      console.log("Returned Firestore ID:", firestoreId);
    } catch (e) {
      console.error("SaveOrderToFireStore failed:", e);
    }

    try {
      saveGuestOrder(orderData);
    } catch (e) {
      console.error("saveGuestOrder failed:", e);
    }

    try {
      activateTrackers();
    } catch (e) {
      console.error("activateTrackers failed:", e);
    }
  } catch (err) {
    console.error("orderBundle error:", err);
    console.error(err.stack);

    // showSnackBar(`📱${size}GB ORDER PLACED SUCCESSFULLY!`, "success", 6000);
  }
}
//ends//
//ends//

async function orderDataMartBundle(
  network,
  recipient,
  packageName,
  size,
  reference,
) {
  const API_BASE =
    window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://ecodata-app.onrender.com";

  try {
    const response = await fetch(`${API_BASE}/api/datamart/buy-data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        network,
        recipient,
        package: packageName,
        size,
        paymentReference: reference,
      }),
    });

    // =========================
    // PARSE BACKEND RESPONSE
    // =========================
    let result;

    try {
      result = await response.json();
    } catch {
      throw new Error(
        `EcoData returned an invalid response (HTTP ${response.status}).`,
      );
    }

    console.log("FULL DATAMART PURCHASE RESPONSE:", result);

    const order = result.order || result.data || {};

    // =========================
    // ACCEPTANCE CHECK
    // =========================
    const paymentReference = String(
      order.paymentReference || reference || "",
    ).trim();

    const providerOrderReference = String(
      order.providerOrderReference ||
        order.orderReference ||
        (paymentReference ? `Ia553341879ecodata-${paymentReference}` : ""),
    ).trim();

    const isAcceptedResponse =
      response.status === 202 &&
      Boolean(paymentReference || providerOrderReference);

    if (!response.ok || (!result.success && !isAcceptedResponse)) {
      showSnackBar(
        result.message || "Unable to confirm the order.",
        "error",
        5000,
      );

      return {
        success: false,
        order,
      };
    }

    // =========================
    // CREATE STABLE ORDER ID
    // =========================
    const existingPublicId = String(order.orderId || order.id || "").trim();

    const orderId = existingPublicId.startsWith("EDO-")
      ? existingPublicId
      : providerOrderReference
        ? `EDO-${providerOrderReference.slice(-6)}`
        : "";

    if (!orderId) {
      console.error(
        "Purchase accepted, but the response lacks usable order references:",
        result,
      );

      showSnackBar(
        "The purchase may have been accepted, but its order reference is missing. Check Order History before retrying.",
        "warning",
        6000,
      );

      return {
        success: false,
        order,
      };
    }

    const bundle = lastPurchasedBundle;

    // =========================
    // NORMALIZE STATUS
    // =========================
    const rawStatus = String(order.orderStatus || order.status || "processing")
      .trim()
      .toLowerCase();

    const statusMap = {
      completed: "delivered",
      delivered: "delivered",
      success: "delivered",
      successful: "delivered",

      failed: "failed",
      cancelled: "failed",
      canceled: "failed",
      rejected: "failed",

      refunded: "refunded",

      pending: "processing",
      waiting: "processing",
      processing: "processing",
      in_progress: "processing",
      "in progress": "processing",
      unknown: "processing",
    };

    const status = statusMap[rawStatus] || rawStatus;

    // =========================
    // PRESERVE RECIPIENT NUMBER
    // =========================
    const orderRecipient =
      order.recipient ||
      order.phoneNumber ||
      order.phone ||
      order.recipientNumber ||
      order.msisdn ||
      order.items?.[0]?.recipient ||
      order.items?.[0]?.phoneNumber ||
      recipient ||
      "-";

    const amount = Number(
      order.sellingPrice ??
        order.amount ??
        order.checkoutAmount ??
        bundle?.price ??
        0,
    );

    const costPrice = Number(
      order.providerPrice ?? order.costPrice ?? order.price ?? 0,
    );

    const orderData = {
      orderId,
      providerOrderReference,
      reference: orderId,
      paymentReference,

      recipient: orderRecipient,
     

        // Portal identification
      packageName: packageName ||
      bundle.packageName || "",

      network: order.network || bundle?.network || network,

      volume: Number(
        order.capacity ?? order.volume ?? bundle?.size ?? size ?? 0,
      ),

      dataValue: String(
        order.dataValue ?? bundle?.dataValue ?? order.capacity ?? size ?? "",
      ),

      amount,
      costPrice,
      profit: Number(order.profit ?? amount - costPrice),

      status,

      source: "web",
      provider: "datamart",

      isGuest: !auth.currentUser,
      createdBy: auth.currentUser?.uid || "guest",

      createdAt: order.createdAt
        ? new Date(order.createdAt).getTime()
        : Date.now(),

      updatedAt: Date.now(),
    };

    console.log("NORMALIZED DATAMART ORDER:", orderData);

    // =========================
    // UPDATE HOMEPAGE TOTALS
    // =========================
    try {
      updateHomepageTotals(orderData);
    } catch (error) {
      console.error("Homepage totals update failed:", error);
    }

    // =========================
    // SAVE FIRESTORE ORDER
    // =========================
    try {
      await saveOrderToFirestore(orderData);
    } catch (error) {
      console.error("Firestore save failed:", error);
    }

    // =========================
    // SAVE GUEST ORDER
    // =========================
    try {
      saveGuestOrder(orderData);
    } catch (error) {
      console.error("Guest order save failed:", error);
    }

    // =========================
    // SAVE AND RENDER LIVE ORDER
    // =========================
    try {
      // The handler receives the submitted recipient and
      // complete references, even if DataMart omitted them.
      handleNewDataMartOrder(orderData);
    } catch (error) {
      console.error(
        "Purchase accepted, but live-order rendering failed:",
        error,
      );
    }

    // =========================
    // ACTIVATE TRACKERS
    // =========================
    try {
      activateTrackers();

      // handleNewDataMartOrder already starts DataMart polling.
      // Do not start it a second time here.
    } catch (error) {
      console.error("Tracker activation failed:", error);
    }

    // =========================
    // USER FEEDBACK
    // =========================
    if (status === "delivered") {
      try {
        playSuccessSound();
      } catch (error) {
        console.warn("Success sound unavailable:", error);
      }

      showSnackBar(
        `${orderData.volume}GB ORDER DELIVERED SUCCESSFULLY!`,
        "success",
        6000,
      );
    } else if (status === "failed") {
      showSnackBar(
        "The provider reported that this purchase failed. Check the order record before retrying.",
        "error",
        6000,
      );
    } else {
      try {
        playSuccessSound();
      } catch {}
      showSuccessfulOrderPopup({
        size: orderData.volume,
        recipient: orderData.recipient,
      });
    }

    return {
      success: true,
      completed: status === "delivered",
      order: orderData,
    };
  } catch (error) {
    console.error(" Order request failed:", error);

    showSnackBar(
      "We could not confirm the order response. Check Order History before retrying.",
      "warning",
      6000,
    );

    return {
      success: false,
      error: error.message,
    };
  }
}

const ORDER_SAVE_QUEUE_KEY = "ecoPendingOrderSaves";
const ORDER_FEE_RATE = 1.0195;
const round3 = (n) => Math.round(Number(n || 0) * 1000) / 1000;

function buildFirestoreOrder(o) {
  const provider = String(o.provider || "swiftdata").toLowerCase();

  // orderData.amount is the base price, so the fee is added here.
  // Swift's orderBundle already applies the fee before calling this, so it is not applied twice.
  const charged =
    provider === "datamart"
      ? round3(o.amount * ORDER_FEE_RATE)
      : round3(o.amount);
  const selling =
    provider === "datamart"
      ? round3(o.amount)
      : round3(o.amount / ORDER_FEE_RATE);

  const status = String(o.status || "processing").toLowerCase();

  return {
    orderId: o.orderId,
    reference: o.reference || o.orderId,
    provider,
    paymentReference: o.paymentReference || null,
    providerOrderReference: o.providerOrderReference || null,

    recipient: o.recipient || "-",
    packageName: o.packageName || null,
    network: o.network || "-",
    volume: Number(o.volume || 0),
    dataValue: String(o.dataValue ?? ""),

    amount: charged,
    sellingPrice: selling,
    costPrice: round3(o.costPrice),
    profit: round3(o.profit ?? selling - Number(o.costPrice || 0)),

    status,
    providerStatus: status,
    statusSource: "web",

    source: "web",
    isGuest: Boolean(o.isGuest),
    createdBy: o.createdBy || "guest",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

async function saveOrderToFirestore(orderData) {
  const db = window.FIRESTORE;

  if (!db) {
    console.warn("Window.FIRESTORE is undefined");
    return null;
  }
  if (!orderData?.orderId) {
    console.error("saveOrderToFirestore: missing orderId", orderData);
    return null;
  }

  const provider = String(orderData.provider || "swiftdata").toLowerCase();


  const key =
    provider === "datamart" ? 
      (orderData.paymentReference || orderData.orderId) :
      orderData.orderId;

  if (!key) {
    console.error("saveOrderToFirestore: missing payment reference", orderData);
    return null;
  }

  // Fixed document ID: saving twice can never create a duplicate
  const ref = doc(db, "orders", `${provider}_${key}`);

  try {
    await setDoc(ref, buildFirestoreOrder(orderData));
    console.log("Order saved to Firestore:", ref.id);
    return ref.id;
  } catch (err) {
    console.error("Firestore order save failed:", err.code, err.message);

    if (err.code !== "permission-denied" && err.code !== "invalid-argument") {
      queueOrderSave(orderData); // retried on refresh or when back online
    }
    return null;
  }
}

// ---------- retry queue (survives refresh, capped) ----------
function queueOrderSave(orderData) {
  try {
    const q = JSON.parse(localStorage.getItem(ORDER_SAVE_QUEUE_KEY) || "[]");
    if (!q.some((x) => x.orderId === orderData.orderId)) {
      q.push({ ...orderData, _tries: 0 });
      localStorage.setItem(ORDER_SAVE_QUEUE_KEY, JSON.stringify(q.slice(-50)));
    }
  } catch {}
}

async function flushOrderSaveQueue() {
  let q = [];
  try {
    q = JSON.parse(localStorage.getItem(ORDER_SAVE_QUEUE_KEY) || "[]");
  } catch {}
  if (!q.length) return;

  const remaining = [];
  for (const item of q) {
    const id = await saveOrderToFirestore({ ...item, _noQueue: true });
    if (!id && (item._tries || 0) < 5)
      remaining.push({ ...item, _tries: (item._tries || 0) + 1 });
  }
  localStorage.setItem(ORDER_SAVE_QUEUE_KEY, JSON.stringify(remaining));
}

window.addEventListener("online", flushOrderSaveQueue);
document.addEventListener("DOMContentLoaded", () =>
  setTimeout(flushOrderSaveQueue, 3000),
);

// ---------- LOCAL STORAGE HELPER ----------

// Save Guest Orders to Local Storage
function saveGuestOrder(orderData) {
  try {
    // Load existing guest orders or start fresh
    const existing = JSON.parse(localStorage.getItem("guestOrders") || "[]");

    // Avoid saving duplicates
    const isDuplicate = existing.some((o) => o.orderId === orderData.orderId);
    if (isDuplicate) return;

    existing.push(orderData);

    localStorage.setItem("guestOrders", JSON.stringify(existing));
    console.log("💾 Guest order saved locally:", orderData);
  } catch (err) {
    console.error("❌ Failed to save guest order:", err);
  }
}



function handleNewOrder(returnedOrder) {
  if (!returnedOrder) return;

 

  const orderId = String(
    returnedOrder.orderId || returnedOrder.publicId || returnedOrder.clientReference ||
    returnedOrder.id || returnedOrder.order_id || returnedOrder.reference || ""
  ).trim();

  if (!orderId) {
    console.error("Swift order has no usable ID, so it can't be shown:", returnedOrder);
    return;
  }

  const raw = String(returnedOrder.status || returnedOrder.state || "processing")
    .trim().toLowerCase();

  const normalized = {
    orderId,
    reference: String(returnedOrder.reference || orderId),
    provider: "swiftdata",
    status: (typeof DM_STATUS_MAP === "object" && DM_STATUS_MAP[raw]) || raw || "processing",
    recipient: returnedOrder.items?.[0]?.recipient || returnedOrder.recipient || "-",
    amount: Number(selectedBundle?.price || 0),
    costPrice: Number(returnedOrder.price || 0),
    profit: Number(selectedBundle?.price || 0) - Number(returnedOrder.price || 0),
    network: selectedBundle?.network || returnedOrder.network || "-",
    volume: selectedBundle?.size || returnedOrder.volume || 0,

    source: "web",
    createdAt: returnedOrder.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  try { localStorage.setItem("lastOrderId", orderId); } catch {}

  // Save first, so the order is never lost if the table is missing or drawing fails
  saveLiveOrder(normalized);

  try { renderLiveOrderRow(normalized); } catch (e) { console.error("renderLiveOrderRow failed:", e); }
  try { createOrUpdateStatusCard(normalized); } catch (e) { console.error(e); }
  try { startAutoPolling(orderId); } catch (e) { console.error(e); }

  return normalized;
}









function handleNewDataMartOrder(returnedOrder) {
  if (!returnedOrder) return;

  // Support either the unwrapped order or the backend response.
  const order = returnedOrder.order || returnedOrder.data || returnedOrder;

  const paymentReference = String(order.paymentReference || "").trim();

  const providerOrderReference = String(
    order.providerOrderReference ||
      order.orderReference ||
      (paymentReference ? `Ia553341879ecodata-${paymentReference}` : ""),
  ).trim();

  // Keep EcoData's public ID separate from DataMart's reference.
  const existingOrderId = String(order.orderId || "").trim();

  const orderId = existingOrderId.startsWith("EDO-")
    ? existingOrderId
    : providerOrderReference
      ? `EDO-${providerOrderReference.slice(-6)}`
      : existingOrderId;

  if (!orderId) {
    console.error(
      "DataMart order cannot be displayed: order ID is missing.",
      order,
    );
    return;
  }

  const costPrice = Number(
    order.costPrice ?? order.providerPrice ?? order.price ?? 0,
  );

  const amount = Number(
    order.amount ??
      order.sellingPrice ??
      order.checkoutAmount ??
      selectedBundle?.price ??
      0,
  );

  const rawStatus = String(order.status || order.orderStatus || "pending")
    .trim()
    .toLowerCase();

  const statusMap = {
    completed: "delivered",
    delivered: "delivered",
    success: "delivered",
    successful: "delivered",

    failed: "failed",
    cancelled: "failed",
    canceled: "failed",
    rejected: "failed",

    refunded: "refunded",

    pending: "pending",
    waiting: "pending",

    processing: "processing",
    in_progress: "processing",
    "in progress": "processing",
    unknown: "pending",
  };

  const normalized = {
    orderId,

    // Full DataMart reference, used for status requests.
    providerOrderReference,

    // Preserve the public ID in the existing compatibility field.
    reference: orderId,

    paymentReference: order.paymentReference || null,

    status: statusMap[rawStatus] || rawStatus,

    recipient:
      returnedOrder.items?.[0]?.recipient ||
      returnedOrder.recipient ||
      returnedOrder.phoneNumber ||
      order.recipient ||
      order.phoneNumber ||
      order.phone ||
      order.recipientNumber ||
      order.items?.[0]?.recipient ||
      order.items?.[0]?.phoneNumber ||
      selectedBundle?.recipient ||
      selectedBundle?.phoneNumber ||
      bundle?.recipient ||
      bundle?.phoneNumber ||
      "",

    network: order.network || selectedBundle?.network || "-",

    volume: Number(
      order.volume ??
        order.capacity ??
        order.capacityGb ??
        order.size ??
        selectedBundle?.size ??
        0,
    ),

    dataValue: String(
      order.dataValue ??
        selectedBundle?.dataValue ??
        order.capacity ??
        order.size ??
        "",
    ),

    amount,
    costPrice,

    profit: Number(order.profit ?? amount - costPrice),
   

    source: "web",
    provider: "datamart",

    createdAt: order.createdAt || Date.now(),
    updatedAt: Date.now(),
  };

  // Store the FULL provider reference for recovery/status checks.
  if (providerOrderReference) {
    localStorage.setItem("lastDataMartOrderReference", providerOrderReference);
  }

  // Persist and update the live table.
  saveLiveOrder(normalized);
  renderLiveOrderRow(normalized);
  createOrUpdateStatusCard(normalized);

  // Start Auto polling
  startDataMartAutoPolling(order.providerOrderReference);

  console.log(" Live order normalized:", normalized);

  return normalized;
}

const LIVE_ORDERS_KEY = "ecoLiveOrders";
const MAX_LIVE_ORDERS = 1000;

function resolveOrderId(o) {
  return String(
    o?.orderId || o?.publicId || o?.clientReference || o?.id || o?.reference || ""
  ).trim();
}

function orderAliases(o) {
  return [o?.orderId, o?.publicId, o?.clientReference, o?.reference, o?.id]
    .filter(v => v != null && String(v).trim())
    .map(v => String(v).trim().toLowerCase());
}

function saveLiveOrder(order) {
  const orderId = resolveOrderId(order);

  if (!orderId) {
    console.error("Cannot save live order: no usable ID.", order);
    return false;
  }

  const provider = String(order.provider || "swiftdata").toLowerCase();

  // normalise the status if the shared map exists; never depend on it
  const rawStatus = String(order.status || "").trim().toLowerCase();
  const status =
    (typeof DM_STATUS_MAP === "object" && DM_STATUS_MAP[rawStatus]) || rawStatus;

  const normalizedOrder = {
    ...order,
    orderId,
    provider,
    status,
    providerOrderReference: String(
      order.providerOrderReference || order.orderReference || ""
    ).trim()
  };

  // empty values must never erase saved ones
  const incoming = Object.fromEntries(
    Object.entries(normalizedOrder).filter(
      ([, v]) => v !== undefined && v !== null && v !== ""
    )
  );

  let existing = [];
  try {
    const parsed = JSON.parse(localStorage.getItem(LIVE_ORDERS_KEY) || "[]");
    existing = Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Could not read saved live orders:", error);
  }

  // match on ANY shared ID, same provider
  const newAliases = new Set(orderAliases(normalizedOrder));
  const index = existing.findIndex(item =>
    String(item.provider || "swiftdata").toLowerCase() === provider &&
    orderAliases(item).some(a => newAliases.has(a))
  );

  if (index !== -1) {
    const current = existing[index];
    const currentIsTerminal = isTerminalStatus(current.status);

    existing[index] = {
      ...current,
      ...incoming,
      orderId: current.orderId,                 // keep the ID the row was drawn with
      status: currentIsTerminal ? current.status : (incoming.status || current.status),
      createdAt: current.createdAt || incoming.createdAt || Date.now(),
      timestamp: current.timestamp || incoming.timestamp || Date.now(),
      updatedAt: incoming.updatedAt || current.updatedAt || Date.now()
    };
  } else {
    existing.unshift({
      ...incoming,
      createdAt: incoming.createdAt || Date.now(),
      timestamp: incoming.timestamp || Date.now(),
      updatedAt: incoming.updatedAt || Date.now()
    });
  }

  try {
    localStorage.setItem(
      LIVE_ORDERS_KEY,
      JSON.stringify(existing.slice(0, MAX_LIVE_ORDERS))
    );
  } catch (error) {
    console.error("Could not persist live order:", error);
    return false;
  }

  // a failed card update must never stop the badge from updating
  try { updatePendingCard(); } catch (e) { console.error("updatePendingCard:", e); }
  try { loadActiveBadge(); } catch (e) { console.error("loadActiveBadge:", e); }

  return true;
}




function sortLiveOrders(orders) {
  if (!Array.isArray(orders)) {
    console.warn("sortLiveOrders: Expected an array.");
    return [];
  }

  // Convert supported date formats into milliseconds.
  function getTimestamp(value) {
    if (value === null || value === undefined || value === "") {
      return 0;
    }

    // Date objects
    if (value instanceof Date) {
      const time = value.getTime();
      return Number.isFinite(time) ? time : 0;
    }

    // Firestore Timestamp objects
    if (typeof value === "object") {
      if (typeof value.toMillis === "function") {
        const time = value.toMillis();
        return Number.isFinite(time) ? time : 0;
      }

      if (typeof value.seconds === "number") {
        return value.seconds * 1000;
      }

      if (typeof value._seconds === "number") {
        return value._seconds * 1000;
      }
    }

    // Numeric Unix timestamp (seconds or milliseconds)
    if (typeof value === "number") {
      if (!Number.isFinite(value) || value <= 0) return 0;

      return value < 1e12 ? value * 1000 : value;
    }

    // Numeric timestamp stored as a string
    if (/^\d+$/.test(String(value).trim())) {
      const numeric = Number(value);

      if (!Number.isFinite(numeric) || numeric <= 0) return 0;

      return numeric < 1e12 ? numeric * 1000 : numeric;
    }

    // ISO date strings and other parseable date strings
    const parsed = Date.parse(value);

    return Number.isFinite(parsed) ? parsed : 0;
  }

  function getCreationTime(order) {
    // Prefer original creation time so status updates
    // do not push old orders to the top.
    const fields = [
      order.createdAt,
      order.timestamp,
      order.created_at,
      order.dateCreated,
      order.orderDate,
    ];

    for (const field of fields) {
      const time = getTimestamp(field);

      if (time > 0) return time;
    }

    // Fallback only when no creation time exists.
    return getTimestamp(order.updatedAt);
  }

  return orders
    .filter((order) => order && typeof order === "object")
    .map((order, index) => ({
      order,
      index,
      creationTime: getCreationTime(order),
    }))
    .sort((a, b) => {
      // Newest order first.
      const timeDifference = b.creationTime - a.creationTime;

      if (timeDifference !== 0) {
        return timeDifference;
      }

      // Keep the original order for equal or missing timestamps.
      return a.index - b.index;
    })
    .map((item) => item.order);
}

const FINAL_STATUSES = new Set(["delivered", "failed", "refunded"]);

const DM_STATUS_MAP = {
  completed: "delivered",
  delivered: "delivered",
  success: "delivered",
  successful: "delivered",
  processed: "delivered",
  failed: "failed",
  cancelled: "failed",
  canceled: "failed",
  rejected: "failed",
  refunded: "refunded",
  pending: "pending",
  waiting: "pending",
  processing: "processing",
  in_progress: "processing",
  "in progress": "processing",
  unknown: "pending",
};

const normalizedStatus = raw => {
  const s = String(raw || "").trim().toLowerCase();
  return DM_STATUS_MAP[s] || s || "processing";
}




function readOrders() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LIVE_ORDERS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function applyDataMartStatus({ reference, paymentReference }, rawStatus) {
  const raw = String(rawStatus || "")
    .trim()
    .toLowerCase();
  if (!raw) return null;

  const next = DM_STATUS_MAP[raw] || "processing"; // unknown -> processing

  const orders = readOrders(); // fresh read, right before writing
  const index = orders.findIndex(
    (o) =>
      String(o.provider || "").toLowerCase() === "datamart" &&
      (String(o.providerOrderReference || "").trim() === reference ||
        String(o.orderReference || "").trim() === reference ||
        (paymentReference &&
          String(o.paymentReference || "").trim() === paymentReference)),
  );
  if (index === -1) return null;

  const current = orders[index];
  // Stop polling when user manually set
  if (current.statusLocked) return current;

  const cur = String(current.status || "")
    .trim()
    .toLowerCase();

  // never downgrade a final status
  if (FINAL_STATUSES.has(cur) && !FINAL_STATUSES.has(next)) return current;

  if (cur === next && current.providerStatus === raw) return current;

  const updated = {
    ...current,
    provider: "datamart",
    providerOrderReference: reference,
    paymentReference: paymentReference || current.paymentReference,
    status: next,
    providerStatus: raw,
    updatedAt: Date.now(),
  };
  orders[index] = updated;
  localStorage.setItem(LIVE_ORDERS_KEY, JSON.stringify(orders));

  const safe = (fn, ...a) => {
    try {
      if (typeof fn === "function") fn(...a);
    } catch (e) {
      console.error("UI update failed:", fn?.name, e);
    }
  };
  safe(renderLiveOrderRow, updated);
  safe(createOrUpdateStatusCard, updated);
  safe(updatePendingCard);
  safe(renderHomepageTotals);
  safe(loadActiveBadge);

  console.log("DataMart status saved:", reference, cur, "->", next);
  return updated;
}





// =====================================
// MANUAL USER ACTION BUTTON 
//======================================
const ORDER_STATUS_CHOICES = ["pending", "processing", "delivered", "failed", "refunded"];

let orderMenu = null;
let orderMenuTarget = null;

// ---------- storage helpers ----------
function liveOrdersRead() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LIVE_ORDERS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function liveOrdersWrite(list) {
  localStorage.setItem(LIVE_ORDERS_KEY, JSON.stringify(list));
}

const sameOrder = (o, id, provider) =>
  String(o.orderId) === String(id) &&
  String(o.provider || "swiftdata").toLowerCase() === String(provider || "swiftdata").toLowerCase();

function findLiveOrder(id, provider) {
  return liveOrdersRead().find(o => sameOrder(o, id, provider)) || null;
}

function refreshOrderViews() {
  for (const fn of [updatePendingCard, renderHomepageTotals, loadActiveBadge]) {
    try { if (typeof fn === "function") fn(); } catch (e) { console.error(fn?.name, e); }
  }
}

const orderToast = (msg, type = "success") =>
  typeof showSnackBar === "function" ? showSnackBar(msg, type, 3000) : console.log(msg);

// ---------- copy ----------
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {}
  try {
    const t = document.createElement("textarea");
    t.value = text;
    t.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(t);
    t.select();
    const ok = document.execCommand("copy");
    t.remove();
    return ok;
  } catch { return false; }
}

async function copyOrder(order) {
  const when = new Date(order.createdAt || order.timestamp);

  const text = [
    `Order: ${order.orderId}`,
    `Recipient: ${order.recipient || "-"}`,
    `Data: ${order.volume ?? 0}GB${order.network ? ` (${order.network})` : ""}`,
    `Status: ${order.status}`,
    `Date: ${Number.isNaN(when.getTime()) ? "N/A" : when.toLocaleString()}`
  ].join("\n");           // to copy only the ID, use: const text = String(order.orderId);

  orderToast(await copyText(text) ? "Order details copied" : "Could not copy", "success");
}

// ---------- delete ----------
function deleteLiveOrder(order, row) {
  if (!confirm(
    `Delete order ${order.orderId} from this device?\n` +
    `This does not cancel the order or change anything at the provider.`
  )) return;

  const id = String(order.orderId);
  const provider = order.provider;

  liveOrdersWrite(liveOrdersRead().filter(o => !sameOrder(o, id, provider)));

  // the backup copy, so it can't come back
  try {
    const g = JSON.parse(localStorage.getItem("guestOrders") || "[]");
    localStorage.setItem("guestOrders", JSON.stringify(g.filter(o => String(o.orderId) !== id)));
  } catch {}

  // stop the DataMart poller for this order
  try {
    const ref = order.providerOrderReference ||
      (order.paymentReference ? `${DATAMART_PREFIX}${order.paymentReference}` : "");
    if (ref && typeof dataMartPollingTimers !== "undefined") {
      dataMartPollingTimers.get(ref)?.("Order deleted:");
    }
  } catch {}

  row?.remove();

  if (!document.querySelector("#liveOrderRows .live-row")) {
    const emptyBox = document.getElementById("liveOrderEmpty");
    if (emptyBox) emptyBox.style.display = "flex";
  }

  refreshOrderViews();
  orderToast("Order deleted");
}

// ---------- change status ----------
function setLiveOrderStatus(order, status) {
  const list = liveOrdersRead();
  const i = list.findIndex(o => sameOrder(o, order.orderId, order.provider));
  if (i === -1) return;

  list[i] = {
    ...list[i],
    status,
    statusLocked: true,        // pollers leave a manually set status alone
    statusSource: "manual",
    updatedAt: Date.now()
  };
  liveOrdersWrite(list);

  try { renderLiveOrderRow(list[i]); } catch (e) { console.error(e); }
  refreshOrderViews();
  orderToast(`Status set to ${status}`);
}

function resumeAutoStatus(order) {
  const list = liveOrdersRead();
  const i = list.findIndex(o => sameOrder(o, order.orderId, order.provider));
  if (i === -1) return;

  const { statusLocked, ...rest } = list[i];
  list[i] = { ...rest, status: "processing", statusSource: "web", updatedAt: Date.now() };
  liveOrdersWrite(list);

  try { renderLiveOrderRow(list[i]); } catch (e) { console.error(e); }

  // restart checking
  try {
    if (String(list[i].provider).toLowerCase() === "datamart") {
      startDataMartAutoPolling(
        list[i].providerOrderReference || list[i].paymentReference,
        { paymentReference: list[i].paymentReference }
      );
    } else {
      startAutoPolling();
    }
  } catch (e) { console.error(e); }

  refreshOrderViews();
  orderToast("Auto status resumed");
}

// ---------- menu ----------
function menuItem(label, onClick, className = "") {
  const b = document.createElement("button");
  b.type = "button";
  b.className = `order-menu-item ${className}`.trim();
  b.setAttribute("role", "menuitem");
  b.textContent = label;
  b.onclick = onClick;
  return b;
}

function placeOrderMenu(menu, btn) {
  const r = btn.getBoundingClientRect();
  const m = menu.getBoundingClientRect();

  let top = r.bottom + 6;
  if (top + m.height > innerHeight - 8) top = Math.max(8, r.top - m.height - 6);

  const left = Math.min(Math.max(8, r.right - m.width), innerWidth - m.width - 8);

  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;
}

function closeOrderMenu() {
  if (!orderMenu) return;
  orderMenu.remove();
  orderMenuTarget?.setAttribute("aria-expanded", "false");
  orderMenu = null;
  orderMenuTarget = null;
}

function openOrderMenu(btn) {
  const row = btn.closest(".live-row");
  const order = row && findLiveOrder(row.dataset.id, row.dataset.provider);
  if (!order) return;

  const wasThisButton = orderMenuTarget === btn;
  closeOrderMenu();
  if (wasThisButton) return;              // a second tap closes it

  const menu = document.createElement("div");
  menu.className = "order-menu";
  menu.setAttribute("role", "menu");

  const showMain = () => {
    menu.replaceChildren(
      menuItem("Copy details", () => { closeOrderMenu(); copyOrder(order); }),
      menuItem("Change status", showStatuses),
      menuItem("Delete order", () => { closeOrderMenu(); deleteLiveOrder(order, row); }, "danger")
    );
    placeOrderMenu(menu, btn);
  };

  const showStatuses = () => {
    const current = String(order.status || "").trim().toLowerCase();

    const items = ORDER_STATUS_CHOICES.map(s => {
      const b = menuItem(s[0].toUpperCase() + s.slice(1), () => {
        closeOrderMenu();
        setLiveOrderStatus(order, s);
      });
      if (s === current) b.classList.add("current");
      return b;
    });

    if (order.statusLocked) {
      items.push(menuItem("Resume auto status", () => { closeOrderMenu(); resumeAutoStatus(order); }));
    }
    items.push(menuItem("‹ Back", showMain, "muted"));

    menu.replaceChildren(...items);
    placeOrderMenu(menu, btn);
  };

  document.body.appendChild(menu);
  orderMenu = menu;
  orderMenuTarget = btn;
  btn.setAttribute("aria-expanded", "true");

  showMain();
  menu.querySelector("button")?.focus();
}

// one listener for every row, including rows drawn later
document.addEventListener("click", e => {
  const btn = e.target.closest(".row-action-btn");
  if (btn) { openOrderMenu(btn); return; }
  if (orderMenu && !orderMenu.contains(e.target)) closeOrderMenu();
});
document.addEventListener("keydown", e => { if (e.key === "Escape") closeOrderMenu(); });
window.addEventListener("resize", closeOrderMenu);
document.addEventListener("scroll", closeOrderMenu, true);

//=======================================
// USER MANUAL ACTION BUTTON ENDS
//=======================================





// =========================
// RENDER LIVE ORDER ROW
// =========================
function renderLiveOrderRow(order) {
  const resolvedOrderId = String(
    order?.orderId || order?.publicId || order?.clientReference ||
    order?.id || order?.reference || ""
  ).trim();

  if (!resolvedOrderId) {
    console.error("Cannot render live order: missing order identifier.", order);
    return;
  }

  order = { ...order, orderId: resolvedOrderId };

  const tableBody = document.getElementById("liveOrderRows");
  if (!tableBody) {
    console.error("Cannot find #liveOrderRows.");
    return;
  }

  const emptyBox = document.getElementById("liveOrderEmpty");
  if (emptyBox) emptyBox.style.display = "none";

  const recipient =
    order.recipient ||
    order.phoneNumber ||
    order.phone ||
    order.recipientNumber ||
    order.items?.[0]?.recipient ||
    order.items?.[0]?.phoneNumber ||
    selectedBundle?.recipient ||
    selectedBundle?.phoneNumber ||
    bundle?.recipient ||
    bundle?.phoneNumber ||
    "";

  // =========================
  // NORMALIZE ORDER
  // =========================
  const normalized = {
    ...order,
    orderId: String(order.orderId),
    provider: String(order.provider || "swiftdata").toLowerCase(),
    recipient,
    volume: order.volume ?? 0,
    status: order.status || "processing",
  };

  // =========================
  // REMOVE EMPTY PLACEHOLDER
  // =========================
  const empty = tableBody.querySelector(".empty-state");
  if (empty) empty.remove();

  // =========================
  // FORMAT DATE
  // =========================
  function formatOrderDate(value) {
    if (!value) return "N/A";

    const d = new Date(value);

    if (Number.isNaN(d.getTime())) return "N/A";

    const datePart = d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });

    const timePart = d
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toUpperCase();

    return `${datePart} ${timePart}`;
  }

  const date = formatOrderDate(normalized.createdAt || normalized.timestamp);

  const update = formatOrderDate(normalized.updatedAt);

  // =========================
  // FIND EXISTING ROW
  // Match order ID + provider
  // =========================
  let row = Array.from(tableBody.querySelectorAll(".live-row")).find(
    (item) =>
      item.dataset.id === normalized.orderId &&
      String(item.dataset.provider || "swiftdata").toLowerCase() ===
        normalized.provider,
  );

  const isNewRow = !row;

  // =========================
  // CREATE ROW ONLY IF NEW
  // =========================
  if (isNewRow) {
    row = document.createElement("div");
    row.className = "live-row";
    row.dataset.id = normalized.orderId;
    row.dataset.provider = normalized.provider;
  }

  // =========================
  // BUILD / REFRESH ROW CELLS
  // =========================

  const created =
    new Date(normalized.createdAt || normalized.timestamp).getTime() ||
    Date.now();

  row.dataset.created = created;
  row.replaceChildren();

  function addCell(value, className = "") {
    const span = document.createElement("span");

    if (className) span.className = className;

    span.textContent = String(value ?? "-");
    row.appendChild(span);

    return span;
  }

  // Status
  const statusCell = addCell("", "status-cell");
  const badge = document.createElement("span");

  badge.className = `status-badge ${getStatusClass(normalized.status)}`;

  const iconContainer = document.createElement("span");
  iconContainer.innerHTML = getStatusIcon(normalized.status);

  if (iconContainer.firstElementChild) {
    badge.appendChild(iconContainer.firstElementChild);
  }

  const statusText = document.createElement("span");
  statusText.textContent = normalized.status;

  badge.appendChild(statusText);
  statusCell.appendChild(badge);

  // Data volume
  addCell(`${normalized.volume}GB`);

  // Recipient
  addCell(normalized.recipient);

  // Payment
  addCell("Yes");

  // Network
  
  let network = normalized.network || "-";
  try { network = getNetwork(normalized);}
  catch(e) { console.error("getNetwork failed:", e);}
  addCell(network);

  // Order ID
  addCell(normalized.orderId);

  // Created date
  addCell(date);

 // Actions
  const actionCell = addCell("", "action-cell");
  const actionBtn = document.createElement("button");
  actionBtn.type = "button";
  actionBtn.className = "row-action-btn";
  actionBtn.textContent = "⋮";
  actionBtn.setAttribute("aria-label", "Order actions");
  actionBtn.setAttribute("aria-haspopup", "menu");
  actionBtn.setAttribute("aria-expanded", "false");
  actionCell.appendChild(actionBtn);



  // Insert new rows by creation time (newest on top)
  if (isNewRow) {
    const next = Array.from(tableBody.querySelectorAll(".live-row")).find(
      (r) => Number(r.dataset.created || 0) < created,
    );
    tableBody.insertBefore(row, next || null);
  }

  console.log("Live order row rendered:", {
    orderId: normalized.orderId,
    status: normalized.status,
    isNewRow,
  });
}











console.log(JSON.parse(localStorage.getItem("ecoLiveOrders")));

// ---------- LIVE ORDER CARD -------

const MANUAL_DATAMART_PAYMENT_REFERENCES = ["T722189380499497"];

async function reconcileManualDataMartOrders() {
  const API_BASE =
    window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://ecodata-app.onrender.com";

  const references = [
    ...new Set(
      MANUAL_DATAMART_PAYMENT_REFERENCES.map((ref) =>
        String(ref || "").trim(),
      ).filter(Boolean),
    ),
  ];

  if (!references.length) {
    console.warn("No payment references provided.");
    return;
  }

  for (const paymentReference of references) {
    const providerReference = `Ia553341879ecodata-${paymentReference}`;

    console.log("Checking Live order:", providerReference);

    try {
      const response = await fetch(
        `${API_BASE}/api/datamart/order-status/${encodeURIComponent(providerReference)}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok || result.success !== true) {
        console.error("Status lookup failed:", paymentReference, result);
        continue;
      }

      const providerOrder = result.order || result.data || {};

      const rawStatus = providerOrder.status || providerOrder.orderStatus || "";

      const updated = applyDataMartStatus(
        { reference: providerReference, paymentReference },
        rawStatus,
      );

      console.log(
        updated ? "Reconciled:" : "No match / no status:",
        paymentReference,
        updated?.status,
      );
    } catch (error) {
      console.error("Manual reconciliation failed:", paymentReference, error);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  reconcileManualDataMartOrders();
});

const dataMartPollingTimers = new Map();

const STATUSES_PREFIX = "Ia553341879ecodata-";

function startDataMartAutoPolling(providerReference, normalized) {
  const input = String(providerReference || "").trim();

  // Derive both references the same way reconciliation does
  const paymentReference = String(
    normalized?.paymentReference ||
      (input.startsWith(STATUSES_PREFIX)
        ? input.slice(STATUSES_PREFIX.length)
        : input),
  ).trim();

  if (!paymentReference) return;

  const reference = `${STATUSES_PREFIX}${paymentReference}`;

  if (dataMartPollingTimers.has(reference)) return;

  const API_BASE =
    window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://ecodata-app.onrender.com";

  const terminalStatuses = new Set(["delivered", "failed", "refunded"]);

  let stopped = false;
  let requestInProgress = false;
  let timer = null;
  let attempts = 0;

  const MAX_ATTEMPTS = 180; // 30 min at 10s
  const POLLING_INTERVAL_MS = 10000;

  function stopPolling(reason = "Polling stopped") {
    if (stopped) return;
    stopped = true;

    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }

    dataMartPollingTimers.delete(reference);
    console.log(reason, reference);
  }

  async function checkStatus() {
    if (stopped || requestInProgress) return;

    if (attempts >= MAX_ATTEMPTS) {
      stopPolling("Polling limit reached:");
      return;
    }

    requestInProgress = true;
    attempts++;

    try {
      const response = await fetch(
        `
        ${API_BASE}/api/datamart/order-status/${encodeURIComponent(reference)}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        },
      );

      let result;
      try {
        result = await response.json();
      } catch {
        console.warn("Invalid status JSON:", response.status, reference);
        return;
      }

      if (!response.ok || result.success !== true) {
        console.warn("DataMart status request failed:", {
          reference,
          httpStatus: response.status,
          message: result.message,
        });
        return;
      }

      const providerOrder = result.order || result.data || {};

      const rawStatus = String(
        providerOrder.status || providerOrder.orderStatus || "",
      )
        .trim()
        .toLowerCase();

      if (!rawStatus) {
        console.warn("No status in provider response:", providerOrder);
        return;
      }

      const updated = applyDataMartStatus(
        { reference, paymentReference },
        rawStatus,
      );

      if (!updated) {
        console.warn("No matching local order:", {
          reference,
          paymentReference,
        });
        return;
      }

      // Stop when user manually set status
      if (updated.statusLocked) {
        stopPolling("Status locked manually:");
        return;
      }

      if (FINAL_STATUSES.has(String(updated.status).toLowerCase())) {
        stopPolling("Terminal order status reached:");
      }

      // Only write/render when something actually changed
      if (latestStatus !== status || latestOrder.providerStatus !== rawStatus) {
        const updatedOrder = {
          ...latestOrder,
          provider: "datamart",
          providerOrderReference: reference,
          paymentReference,
          status,
          providerStatus: rawStatus,
          updatedAt: Date.now(),
        };

        orders[index] = updatedOrder;

        const sortedOrders =
          typeof sortLiveOrders === "function"
            ? sortLiveOrders(orders)
            : orders;

        localStorage.setItem(LIVE_ORDERS_KEY, JSON.stringify(sortedOrders));

        if (typeof renderLiveOrderRow === "function")
          renderLiveOrderRow(updatedOrder);
        if (typeof createOrUpdateStatusCard === "function")
          createOrUpdateStatusCard(updatedOrder);
        if (typeof loadActiveBadge === "function") loadActiveBadge();

        if (typeof updatePendingCard === "function") updatePendingCard();
        if (typeof renderHomepageTotals === "function") renderHomepageTotals();

        console.log("DataMart status updated:", {
          reference,
          previousStatus: latestStatus,
          providerStatus: rawStatus,
          savedStatus: status,
        });
      }

      if (terminalStatuses.has(status)) {
        stopPolling("Terminal order status reached:");
      }
    } catch (error) {
      console.error(" polling error:", {
        reference,
        message: error.message,
      });
    } finally {
      requestInProgress = false;
    }
  }

  dataMartPollingTimers.set(reference, stopPolling);
  timer = setInterval(checkStatus, POLLING_INTERVAL_MS);
  checkStatus();
}

document.addEventListener("DOMContentLoaded", () => {
  const terminal = new Set(["delivered", "failed", "refunded"]);
  const orders = JSON.parse(localStorage.getItem(LIVE_ORDERS_KEY) || "[]");

  orders.forEach((order) => {
    if (
      String(order.provider || "").toLowerCase() === "datamart" &&
      !terminal.has(String(order.status || "").toLowerCase())
    ) {
      startDataMartAutoPolling(
        order.providerOrderReference || order.paymentReference,
        { paymentReference: order.paymentReference },
      );
    }
  });
});

// popup statusCard

function createOrUpdateStatusCard(order) {
  // order expected: { orderId, reference, status, recipient, volume, timestamp }
  const root = document.getElementById("orderStatusContainerRoot");
  if (!root) return;

  const existing = document.getElementById("orderStatusCard");
  const status = (order.status || "pending").toLowerCase();
  const badgeClass = getStatusClass(status);
  const desc = getStatusTextMapping(status);

  const html = `
    <div id="orderStatusCardInner">
      <h4>Order Status</h4>
      <p><strong>Order ID: 
      </strong> ${order.orderId || order.reference || "N/A"}</p>
      <p><strong>Recipient:</strong> ${order.recipient || "-"}</p>
      <p><strong>Volume:</strong> ${order.volume ?? "-"} GB</p>
      <p>
        <strong>Status:</strong>
        <span class="status-badge ${badgeClass}">${status}</span>
      </p>
      <p style="font-size:0.9rem;color:#555;margin-top:6px">${desc}</p>
    </div>
  `;

  if (existing) {
    existing.innerHTML = html;
    existing.classList.remove("hidden");
  } else {
    const card = document.createElement("div");
    card.id = "orderStatusCard";
    card.innerHTML = html;
    root.appendChild(card);
  }
}

// stop polling
function stopStatusPolling() {
  if (_statusPollTimer) {
    clearInterval(_statusPollTimer);
    _statusPollTimer = null;
  }
}






/**
 * Checks whether an order has reached a terminal status.
 */
// checks if status is terminal
function isTerminalStatus(status) {
  return FINAL_STATUSES.has(normalizedStatus(status));
}



async function checkOrderStatusesOnce(orderIdsOrRefs) {
  const empty = { orders: [], groups: [], missing: [] };
  if (!Array.isArray(orderIdsOrRefs)) return empty;

  const API_BASE = window.location.hostname === "localhost"
    ? "http://localhost:3000" : "https://ecodata-app.onrender.com";

  const identifiers = [...new Set(
    orderIdsOrRefs.filter(id => typeof id === "string" && id.trim()).map(id => id.trim())
  )];
  if (!identifiers.length) return empty;

  const all = { orders: [], groups: [], missing: [] };

  for (let i = 0; i < identifiers.length; i += 200) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);

    try {
      const res = await fetch(`${API_BASE}/api/v2/orders/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ identifiers: identifiers.slice(i, i + 200) }),
        cache: "no-store",
        signal: ctrl.signal
      });

      if (!res.ok) { console.warn("Bulk status returned", res.status); continue; }

      const data = await res.json();
      if (!data.success) { console.warn("Bulk status failed:", data.message); continue; }

      all.orders.push(...(data.orders || []));
      all.groups.push(...(data.groups || []));
      all.missing.push(...(data.missing || []));
    } catch (err) {
      console.error("Bulk status error:", err.name === "AbortError" ? "timeout" : err.message);
    } finally {
      clearTimeout(timer);
    }
  }
  return all;
}

function swiftRefs(order) {
  return [order?.publicId, order?.clientReference, order?.reference, order?.orderId, order?.id]
    .filter(v => v != null).map(v => String(v).trim().toLowerCase());
}

async function checkOrderStatusOnce(orderIdOrRef) {
  const result = await checkOrderStatusesOnce([orderIdOrRef]);
  const wanted = String(orderIdOrRef).trim().toLowerCase();
  // No fallback to orders[0]: an unmatched order must stay unmatched
  return result.orders.find(o => swiftRefs(o).includes(wanted)) || null;
}

// Called AFTER a successful order is confirmed
// ---------- UPDATE HOME TOTALS ----------

// Load stored totals or initialize
let ecoTotals = JSON.parse(localStorage.getItem("ecoTotals")) || {
  orders: 0,
  gb: 0,
};

// Called AFTER a successful EcoData order
function updateHomepageTotals(orderData) {
  if (!orderData || !orderData.orderId) return;

  // Prevent double-counting the same order
  const seenOrders = JSON.parse(localStorage.getItem("ecoSeenOrders") || "[]");
  if (seenOrders.includes(orderData.orderId)) return;

  // Mark this order as counted
  seenOrders.push(orderData.orderId);
  localStorage.setItem("ecoSeenOrders", JSON.stringify(seenOrders));

  // Update totals using EcoData values (from button/data-price, NOT Swift)
  ecoTotals.orders += 1;
  ecoTotals.gb += Number(orderData.volume || 0);

  // Persist totals to localStorage
  localStorage.setItem("ecoTotals", JSON.stringify(ecoTotals));

  // Update UI
  renderHomepageTotals();
}

//========================
// FORMAT TOTAL GB
//========================

// ---------- FORMAT DATA SIZE ----------
function formatDataSize(gb) {
  gb = Number(gb) || 0;

  if (gb >= 1000) {
    const tb = gb / 1000;

    return `${Number(tb.toFixed(2))}TB`;
  }

  return `${Number(gb.toFixed(2))}GB`;
}

function getOrdersForMonth(orders, year, month) {
  return orders.filter((order) => {
    if (!order.createdAt) return false;

    const date = new Date(order.createdAt);

    if (isNaN(date.getTime())) return false;

    return date.getFullYear() === year && date.getMonth() === month;
  });
}

function getOrderStatus(order) {
  return String(order.status || "pending").toLowerCase();
}

function isPendingOrder(order) {
  return PENDING_STATUSES.has(getOrderStatus(order));
}

function isCompletedOrder(order) {
  return COMPLETED_STATUSES.has(getOrderStatus(order));
}

function calculateOrderData(orders) {
  return orders.reduce((total, order) => {
    const volume =
      Number(
        String(order.volume || "")
          .replace(/GB/gi, "")
          .trim(),
      ) || 0;

    return total + volume;
  }, 0);
}

function calculatePercentageChange(current, previous) {
  current = Number(current) || 0;
  previous = Number(previous) || 0;

  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
}

function renderCardPerformance(
  elementId,
  current,
  previous,
  lowerIsBetter = false,
  isData = false,
) {
  const element = document.getElementById(elementId);

  if (!element) return;

  current = Number(current) || 0;
  previous = Number(previous) || 0;

  const change = calculatePercentageChange(current, previous);

  const percentage = Math.abs(change).toFixed(1);

  let icon = "ri-arrow-right-line";
  let state = "neutral";
  let directionText = "No change";

  if (change > 0) {
    icon = "ri-arrow-right-up-line";

    state = lowerIsBetter ? "decrease" : "increase";

    directionText = "higher";
  } else if (change < 0) {
    icon = "ri-arrow-right-down-line";

    state = lowerIsBetter ? "increase" : "decrease";

    directionText = "lower";
  }

  // Format the comparison values
  const currentDisplay = isData
    ? formatDataSize(current)
    : current.toLocaleString();

  const previousDisplay = isData
    ? formatDataSize(previous)
    : previous.toLocaleString();

  element.className = `card-performance ${state}`;

  // No change
  if (change === 0) {
    element.innerHTML = `
      <div class="performance-main">
        <i class="${icon}"></i>

        <span class="performance-value">
          No change
        </span>
      </div>

      <div class="performance-detail">
        ${currentDisplay} this month
        •
        ${previousDisplay} last month
      </div>
    `;

    return;
  }

  // Increase / decrease
  element.innerHTML = `
    <div class="performance-main">

      <i class="${icon}"></i>

      <span class="performance-value">
        ${percentage}%
      </span>

      <span class="performance-direction">
        ${directionText}
      </span>

    </div>

    <div class="performance-detail">
      ${currentDisplay} this month
      •
      ${previousDisplay} last month
    </div>
  `;
}

function renderPendingPerformance(pendingCount, totalOrders) {
  const element = document.getElementById("pendingPerformance");

  if (!element) return;

  const percentage = totalOrders > 0 ? (pendingCount / totalOrders) * 100 : 0;

  const percentageText = percentage.toFixed(1);

  const isGood = percentage <= 50;
  const arrowIcon = isGood
    ? "ri-arrow-right-down-line"
    : "ri-arrow-right-up-line";

  const percentageColor = isGood ? "#159570" : "#e05252";

  element.className = "card-performance neutral";

  element.innerHTML = `
  <div class="performance-main">
   <i class="${arrowIcon}" style="color: ${percentageColor};"></i>

   <span class="performance-value" style="color: ${percentageColor};">
    ${percentageText}%
   </span>

   <span class="performance-direction">
   of monthly orders
   </span>
  </div>

  <div class="performance-detail">
   ${pendingCount.toLocaleString()}
   of
   ${totalOrders.toLocaleString()}
   orders this month
  </div>
  `;
}

// ---------- RENDER TOTALS ----------
function renderHomepageTotals() {
  const ordersEl = document.getElementById("totalOrders");

  const gbEl = document.getElementById("totalGB");

  const pendingEl = document.getElementById("pendingTotal");

  const completedEl = document.getElementById("completedOrders");

  const orders = JSON.parse(localStorage.getItem(LIVE_ORDERS_KEY)) || [];

  if (!ordersEl || !gbEl) return;

  // ==========================================
  // ALL-TIME TOTALS
  // ==========================================

  ordersEl.textContent = orders.length;

  // Your existing all-time data total
  gbEl.textContent = formatDataSize(ecoTotals.gb);

  // ==========================================
  // CURRENT TOTAL STATUS
  // ==========================================
  const { pending, completed } = getOrderStats();

  const pendingOrders = orders.filter(isPendingOrder);

  const completedOrders = orders.filter(isCompletedOrder);

  // ==========================================
  //  SAVE DOM TEXT

  if (pendingEl) pendingEl.textContent = pending;
  if (completedEl) completedEl.textContent = completed;

  // ==========================================
  // CURRENT MONTH
  // ==========================================

  const now = new Date();

  const currentMonthOrders = getOrdersForMonth(
    orders,
    now.getFullYear(),
    now.getMonth(),
  );

  // ==========================================
  // PREVIOUS MONTH
  // ==========================================

  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const previousMonthOrders = getOrdersForMonth(
    orders,
    previousMonthDate.getFullYear(),
    previousMonthDate.getMonth(),
  );

  // ==========================================
  // TOTAL ORDERS PERFORMANCE
  // ==========================================

  renderCardPerformance(
    "ordersPerformance",

    currentMonthOrders.length,

    previousMonthOrders.length,
  );

  // ==========================================
  // TOTAL DATA PERFORMANCE
  // ==========================================

  const currentMonthGB = calculateOrderData(currentMonthOrders);

  const previousMonthGB = calculateOrderData(previousMonthOrders);

  renderCardPerformance(
    "dataPerformance",

    currentMonthGB,

    previousMonthGB,
    false,
    true,
  );

  // ==========================================
  // PENDING ORDERS PERFORMANCE
  // ==========================================

  const currentPending = currentMonthOrders.filter(isPendingOrder).length;

  const currentTotalOrders = currentMonthOrders.length;

  renderPendingPerformance(
    currentPending, // pendingCount
    currentTotalOrders, // totalOrders
  );

  // ==========================================
  // COMPLETED ORDERS PERFORMANCE
  // ==========================================

  const currentCompleted = currentMonthOrders.filter(isCompletedOrder).length;

  const previousCompleted = previousMonthOrders.filter(isCompletedOrder).length;

  renderCardPerformance(
    "completedPerformance",

    currentCompleted,

    previousCompleted,
  );
}

//========================
// FORMAT TOTAL GB end
//========================

// Load totals on page refresh
document.addEventListener("DOMContentLoaded", () => {
  ecoTotals = JSON.parse(localStorage.getItem("ecoTotals")) || ecoTotals;

  if (typeof renderHomepageTotals === "function") renderHomepageTotals();
});

function getStatusClass(status) {
  return `status-${(status || "").toLowerCase()}`;
}

// LIVE ORDER
// LIVE ORDER (table-compatible)
function updateLiveOrderCard(order) {
  if (!order?.orderId) return;

  const row = document.querySelector(`[data-id="${order.orderId}"]`);
  if (!row) return;

  const statusCell = row.querySelector(".status-cell");
  if (!statusCell) return;

  const status = (order.status || "pending").toLowerCase();

  statusCell.innerHTML = `
    <span class="status-badge ${getStatusClass(status)}">
      ${status}
    </span>
  `;
}
/// live order card ends

function updateStatusBadge(newStatus) {
  const badge = document.querySelector("#liveStatusBadge");
  if (!badge) return;

  const currentStatus = badge.dataset.status;
  if (currentStatus === newStatus) return; // no change

  // Remove old status classes
  badge.className = "status-badge";

  // Add new status class
  badge.classList.add(getStatusClass(newStatus));

  // Update text
  badge.textContent = newStatus;
  badge.dataset.status = newStatus;

  // Trigger animation
  badge.classList.remove("status-animate");
  void badge.offsetWidth; // reflow trick
  badge.classList.add("status-animate");
}

document.addEventListener("DOMContentLoaded", async () => {
  const lastOrderId = localStorage.getItem("lastOrderId");
  if (!lastOrderId) return;

  // Try to fetch latest status
  const order = await checkOrderStatusOnce(lastOrderId);
  if (!order) return;

  // Rebuild UI
  updateLiveOrderCard(order); // persistent

  // Resume polling
  startAutoPolling(lastOrderId);
});

// lIVE ORDER ENDS







function applySwiftStatus(localOrderId, swiftOrder) {
  const raw = String(swiftOrder?.status || swiftOrder?.orderStatus || "")
    .trim().toLowerCase();
  if (!raw) return null;

  const next = DM_STATUS_MAP[raw] || "processing";   // unknown counts as active

  const orders = readOrders();                        // fresh read, right before writing
  const index = orders.findIndex(o =>
    String(o.orderId) === String(localOrderId) &&
    String(o.provider || "swiftdata").toLowerCase() !== "datamart"
  );
  if (index === -1) return null;

  const current = orders[index];
  // Stop polling whn user manually set 
  if (current.statusLocked) return current;
  
  const curRaw = String(current.status || "").trim().toLowerCase();
  const cur = DM_STATUS_MAP[curRaw] || curRaw;

  // never turn a finished order back into an active one
  if (FINAL_STATUSES.has(cur) && !FINAL_STATUSES.has(next)) return current;
  if (cur === next && current.providerStatus === raw) return current;

  // only status fields change, nothing else is overwritten
  const updated = {
    ...current,
    provider: String(current.provider || "swiftdata").toLowerCase(),
    status: next,
    providerStatus: raw,
    updatedAt: Date.now()
  };
  orders[index] = updated;
  localStorage.setItem(LIVE_ORDERS_KEY, JSON.stringify(orders));

  const safe = (fn, ...a) => {
    try { if (typeof fn === "function") fn(...a); }
    catch (e) { console.error("UI update failed:", fn?.name, e); }
  };
  safe(renderLiveOrderRow, updated);
  safe(updatePendingCard);
  safe(renderHomepageTotals);
  safe(loadActiveBadge);

  console.log("Swift status saved:", localOrderId, cur, "->", next);
  return updated;
}



const SWIFT_POLL_MAX_AGE_MS = 72 * 3600 * 1000;

function startAutoPolling(orderIdOrRef) {
  stopStatusPolling();

  const statusResult = document.getElementById("statusResult");
  if (statusResult) statusResult.innerHTML = "";

  let busy = false;

  async function tick() {
    if (busy || document.hidden) return;
    busy = true;

    try {
      const cutoff = Date.now() - SWIFT_POLL_MAX_AGE_MS;

      const eligible = getStoredOrders().filter(o =>
        o.orderId &&
        String(o.provider || "swiftdata").toLowerCase() !== "datamart" &&
        !isTerminalStatus(o.status) &&
        (new Date(o.createdAt || o.timestamp).getTime() || Date.now()) >= cutoff
      );
      if (!eligible.length) return;

      for (let i = 0; i < eligible.length; i += 200) {
        const batch = eligible.slice(i, i + 200);
        const result = await checkOrderStatusesOnce(batch.map(o => o.orderId));

        const byRef = new Map();
        for (const item of result.orders)
          for (const key of swiftRefs(item)) byRef.set(key, item);

        for (const stored of batch) {
          const latest = byRef.get(String(stored.orderId).trim().toLowerCase());
          if (!latest) continue;                        // unmatched is never a delivery

          const updated = applySwiftStatus(stored.orderId, latest);
          if (!updated) continue;

          if (orderIdOrRef === stored.orderId) {
            try {
              createOrUpdateStatusCard(updated);
              updateStatusBadge(updated.status || "pending");
            } catch (e) { console.error(e); }
          }
        }
      }
    } catch (error) {
      console.error("Bulk SwiftData polling error:", error);
    } finally {
      busy = false;
    }
  }

  tick();                                               // first check runs immediately
  _statusPollTimer = setInterval(tick, STATUS_POLL_INTERVAL);
}

// catch up the moment the tab comes back
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && _statusPollTimer) startAutoPolling();
});




const flat = v => {
  if (v == null) return "";
  if (typeof v === "object") return String(v.name ?? v.label ?? v.value ?? v.code ?? "");
  return String(v);
};

const toMs = v => {
  if (typeof v === "number") return v < 1e12 ? v * 1000 : v;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : 0;
};

function parseGB(v) {
  if (typeof v === "number") return v;
  const m = String(v ?? "").match(/[\d.]+/);
  if (!m) return 0;
  const n = Number(m[0]);
  return /mb/i.test(String(v)) ? n / 1000 : n;
}

function repairStoredOrders() {
  let list;
  try { list = JSON.parse(localStorage.getItem(LIVE_ORDERS_KEY) || "[]"); } catch { return; }
  if (!Array.isArray(list)) return;

  const fixed = list
    .filter(o => o && typeof o === "object")
    .map(o => {
      const s = flat(o.status).trim().toLowerCase();
      return {
        ...o,
        orderId: String(o.orderId || o.publicId || o.clientReference || o.reference || o.id || "").trim(),
        recipient: flat(o.recipient || o.beneficiaryMsisdn || o.msisdn) || "-",
        network: flat(o.network) || undefined,
        volume: parseGB(o.volume ?? o.sizeLabel ?? o.size),
        status: (typeof DM_STATUS_MAP === "object" && DM_STATUS_MAP[s]) || s || "processing",
        createdAt: toMs(o.createdAt) || toMs(o.timestamp) || Date.now(),
        timestamp: toMs(o.timestamp) || toMs(o.createdAt) || Date.now(),
        updatedAt: toMs(o.updatedAt) || Date.now()
      };
    })
    .filter(o => o.orderId);

  if (JSON.stringify(fixed) !== JSON.stringify(list)) {
    localStorage.setItem(LIVE_ORDERS_KEY, JSON.stringify(fixed));
  }
}




// ---------- AFTER PURCHASE: show and poll ----------
// Load live orders on page refresh

function loadLiveOrders() {
  const tableBody = document.getElementById("liveOrderRows");
  if (!tableBody) return;

  try { repairStoredOrders(); } catch (e) { console.error("repair failed:", e); }

  let orders = [];
  try {
    const parsed = JSON.parse(localStorage.getItem(LIVE_ORDERS_KEY) || "[]");
    orders = Array.isArray(parsed) ? parsed : [];
  } catch (e) { console.error(e); }

  const emptyBox = document.getElementById("liveOrderEmpty");
  if (emptyBox) emptyBox.style.display = orders.length ? "none" : "flex";

  orders
    .sort((a, b) => toMs(a.createdAt) - toMs(b.createdAt))   // oldest first, each new row goes on top
    .forEach(order => {
      try { renderLiveOrderRow(order); }
      catch (e) { console.error("Row failed:", order?.orderId, e); }
    });
}












// FUNCTION GET NETWORK PREFIX
function getNetwork(order) {
  console.log("======== GET NETWORK ========");
  console.log("Order:", order);

  // Already saved?
  if (order.network && order.network !== "-" && order.network !== "UNKNOWN") {
    console.log("✅ Using saved network:", order.network);
    return order.network.toUpperCase();
  }

  let phone = String(order.recipient ?? "").trim();
  console.log("📞 Raw phone:", phone);

  phone = phone.replace(/\D/g, "");

  // Convert 233xxxxxxxxx -> 0xxxxxxxxx
  if (phone.startsWith("233")) {
    phone = "0" + phone.slice(3);
  }

  console.log("📱 Normalized phone:", phone);

  const prefix = phone.slice(0, 3);
  console.log("🔎 Prefix:", prefix);

  let detected = "UNKNOWN";

  // MTN
  if (["024", "025", "053", "054", "055", "059"].includes(prefix)) {
    detected = "MTN";
  }

  // TELECEL
  else if (["020", "050"].includes(prefix)) {
    detected = "TELECEL";
  }

  // AIRTELTIGO
  else if (["026", "027", "056", "057"].includes(prefix)) {
    detected = "AIRTELTIGO";
  }

  console.log("🌐 Detected network:", detected);

  // Save detected network
  if (detected !== "UNKNOWN" && !order.network) {
    console.log("💾 Saving detected network:", detected);

    order.network = detected.toLowerCase();

    saveLiveOrder(order);

    console.log("✅ Saved to localStorage");
  }

  console.log("Returning:", detected);
  console.log("============================");

  return detected;
}

//====================
// GET STATUS ICON
//====================
function getStatusIcon(status) {
  switch ((status || "").toLowerCase()) {
    case "pending":
      return `<i class="ri-time-line status-icon"></i>`;

    case "processing":
      return `<i class="ri-refresh-line status-icon spinning"></i>`;

    case "delivered":
    case "sent":
      return `<i class="ri-check-double-line status-icon"></i>`;

      case "processed":
      return `<i class="ri-check-double-line status-icon"></i>`;

    case "cancelled":
      return `<i class="ri-close-circle-line status-icon"></i>`;

    default:
      return `<i class="ri-information-line status-icon"></i>`;
  }
}

function loadActiveBadge() {
  let orders = [];
  try {
    const parsed = JSON.parse(localStorage.getItem(LIVE_ORDERS_KEY) || "[]");
    orders = Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("loadActiveBadge: bad storage", e);
  }

  const activeCount = orders.filter((ord) => {
    const s = String(ord.status || "")
      .trim()
      .toLowerCase();
    return s === "pending" || s === "processing";
  }).length;

  const activeBag = document.getElementById("activeBadge");

  if (activeBag) {
    if (activeCount === 0) {
      activeBag.style.display = "none";
    } else {
      activeBag.style.display = "flex";
      activeBag.textContent = activeCount;
    }
  } else {
    console.warn("loadActiveBadge: #activeBadge not found");
  }

  try {
    if (activeCount === 0) {
      if (typeof unActivateTrackers === "function") unActivateTrackers();
    } else if (typeof activateTrackers === "function") {
      activateTrackers();
    }
  } catch (e) {
    console.error("Tracker toggle failed:", e);
  }
}

// ================================
// FUNCTION LOAD ACTIVE BADGE ENDS
// ================================

// ---------- LIVE ORDERS PERSISTENCE ----------

const COMPLETED_STATUSES = new Set([
  "delivered",
  "completed",
  "success",
  "successful",
  "failed",
  "cancelled",
  "rejected",
  "processed",
  "refunded",
]);

const PENDING_STATUSES = new Set(["pending", "waiting", "queued"]);

function getOrderStats() {
  let orders = [];

  try {
    const parsed = JSON.parse(localStorage.getItem(LIVE_ORDERS_KEY) || "[]");
    orders = Array.isArray(parsed) ? parsed : [];
  } catch {}

  let pending = 0,
    completed = 0;

  orders.forEach((o) => {
    const s = String(o.status || "pending")
      .trim()
      .toLowerCase();
    if (COMPLETED_STATUSES.has(s)) completed++;
    else if (PENDING_STATUSES.has(s)) pending++;
  });

  return { pending, completed };
}

function updatePendingCard() {
  const { pending, completed } = getOrderStats();

  const pendingEl = document.getElementById("pendingTotal");
  const completedEl = document.getElementById("completedOrders");

  if (pendingEl) pendingEl.textContent = pending;
  if (completedEl) completedEl.textContent = completed;
}

function updateLiveOrderStatus(orderId, newStatus) {
  if (!orderId || !newStatus) return;

  const orders = getStoredOrders();

  const index = orders.findIndex((o) => o.orderId === orderId);

  if (index === -1) return;

  const currentStatus = orders[index].status || "pending";

  // Prevent status downgrade
  if (STATUS_PRIORITY[newStatus] < STATUS_PRIORITY[currentStatus]) {
    console.warn(`Blocked downgrade: ${currentStatus} → ${newStatus}`);

    return;
  }

  // Detect whether this order was already completed
  const wasDelivered =
    currentStatus === "delivered" ||
    currentStatus === "cancelled" ||
    currentStatus === "failed";

  // Detect whether this update completes the order
  const nowDelivered =
    newStatus === "delivered" ||
    newStatus === "cancelled" ||
    newStatus === "failed";

  orders[index] = {
    ...orders[index],

    status: newStatus,

    updatedAt:
      currentStatus !== newStatus ? Date.now() : orders[index].updatedAt,

    deliveredAt: nowDelivered
      ? orders[index].deliveredAt || Date.now()
      : orders[index].deliveredAt,
  };

  localStorage.setItem(LIVE_ORDERS_KEY, JSON.stringify(orders));

  // ONLY increment once when the order first becomes completed
  if (!wasDelivered && nowDelivered) {
    let completedTotal =
      parseInt(localStorage.getItem("ecoCompletedTotal")) || 0;

    completedTotal++;

    localStorage.setItem("ecoCompletedTotal", completedTotal);
  }

  updatePendingCard();

  // Recovery
  syncCompletedIfMismatch();
}

// AUTO FIX WHEN MISMATCH
function syncCompletedIfMismatch() {
  const orders = JSON.parse(localStorage.getItem(LIVE_ORDERS_KEY)) || [];

  const completedStatuses = [
    "delivered",
    "completed",
    "success",
    "processed",
    "cancelled",
    "failed",
  ];

  const realCompleted = orders.filter((o) =>
    completedStatuses.includes(o.status?.toLowerCase()),
  ).length;

  let storedCompleted =
    parseInt(localStorage.getItem("ecoCompletedTotal")) || 0;

  // 🔥 FIX BOTH DIRECTIONS (not just <)
  if (storedCompleted !== realCompleted) {
    localStorage.setItem("ecoCompletedTotal", realCompleted);

    console.warn(
      `Completed count corrected: ${storedCompleted} → ${realCompleted}`,
    );
  }
}

// INITIALIZE ON PAGE LOAD (ONCE)
function initializeCompletedCount() {
  const storedTotal = localStorage.getItem("ecoCompletedTotal");

  // IF ALREADY EXIST RETURN
  if (storedTotal !== null) return;

  const orders = JSON.parse(localStorage.getItem(LIVE_ORDERS_KEY)) || [];

  const deliveredCount = orders.filter((o) =>
    ["delivered", "completed", "success", "cancelled", "failed"].includes(
      o.status?.toLowerCase(),
    ),
  ).length;

  const alreadyInitialized = localStorage.getItem("ecoCompletedInitialized");

  if (alreadyInitialized) return; //  prevents running again

  localStorage.setItem("ecoCompletedTotal", deliveredCount);
  localStorage.setItem("ecoCompletedInitialized", "true");
}

// DEBUG
console.log(localStorage.getItem("ecoCompletedTotal"));

// STATUS PRIORITY LOADER

const STATUS_PRIORITY = {
  pending: 1,
  processing: 2,
  delivered: 3,
  failed: 4,
};

function getStoredOrders() {
  const orders = JSON.parse(localStorage.getItem(LIVE_ORDERS_KEY) || "[]");

  return orders.sort((a, b) => b.timestamp - a.timestamp);
}

// ends

function pollOrderStatus(orderId) {
  fetch(`check-status/${orderId}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.status) {
        updateLiveOrderStatus(orderId, data.status);
        loadLiveOrders(); // refresh ui
      }
    })
    .catch((err) => console.error(err));
}
//ends

// ---------- LIVE ORDERS PERSISTENCE ----------
document.addEventListener("DOMContentLoaded", () => {
  // single entry point for rendering
  loadLiveOrders();
  // Read delivered orders from HISTORY
  initializeCompletedCount();

  // Auto fix
  syncCompletedIfMismatch();

  // updatePendingOrders
  updatePendingCard();

  // load nav badge
  loadActiveBadge();

  try {
    startAutoPolling();
  } catch (e) {
    console.error(e);
  }
});
// handleNewOrders Dom ends//

// SNACKBAR SECTION //
// ===== SNACKBAR FUNCTION ===== //
let snackbarTimeout = null;

function showSnackBar(message, type = "info", duration = 4000) {
  let snackbar = document.querySelector(".snackbar");

  // Create snackbar if it doesn't exist
  if (!snackbar) {
    snackbar = document.createElement("div");
    snackbar.className = "snackbar";

    snackbar.innerHTML = `
      <span class="snackbar-text"></span>
      <div class="snackbar-progress"></div>
    `;

    document.body.appendChild(snackbar);
  }

  // Update text
  snackbar.querySelector(".snackbar-text").textContent = message;

  // Color by type
  if (type === "success") snackbar.style.background = "rgba(7, 29, 26, 0.95)";
  else if (type === "error") snackbar.style.background = "#88353f";
  else if (type === "warning") snackbar.style.background = "#413b2a";
  else snackbar.style.background = "rgba(7, 29, 26, 0.95)";

  // Reset progress animation
  const progress = snackbar.querySelector(".snackbar-progress");
  progress.style.animation = "none";
  void progress.offsetWidth;
  progress.style.animation = `snackbar-progress ${duration}ms linear forwards`;

  snackbar.classList.add("show");

  // Clear previous timeout
  if (snackbarTimeout) clearTimeout(snackbarTimeout);

  snackbarTimeout = setTimeout(() => {
    snackbar.classList.remove("show");
  }, duration);
}
// snackbar ends

// SCROLL TO SECTION BY CLICKING ON THE CARD-BOX
const mtnScrollBtn = document.querySelector(".mtnBt");

const mtnScrollSection = document.getElementById("mtnArea");

mtnScrollBtn.addEventListener("click", () => {
  if (mtnScrollSection) {
    mtnScrollSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
});

// do same for telecel
const teleScrollBtn = document.querySelector(".telecel");

const teleScrollSection = document.getElementById("teleArea");

teleScrollBtn.addEventListener("click", () => {
  if (teleScrollSection) {
    teleScrollSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
});

// same for AirtelTigo
const airtelScrollBtn = document.querySelector(".at");

const airtelScrollSection = document.getElementById("tigoArea");

airtelScrollBtn.addEventListener("click", () => {
  if (airtelScrollSection) {
    airtelScrollSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
});

//========================================
// ADD ORDER TO LEADERBOARD
//========================================

function addOrderToLeaderboard(customers, order) {
  const phone = String(order.recipient || "").trim();

  if (!phone) return;

  //========================================
  // CREATE CUSTOMER
  //========================================

  if (!customers[phone]) {
    customers[phone] = {
      phone,

      totalGB: 0,

      totalOrders: 0,

      totalSpent: 0,

      points: 0,

      manualOverride: false,

      manualPoints: null,

      manualUpdatedAt: 0,
    };
  }

  const customer = customers[phone];

  const isAdminLeaderboard =
    order.LD_Status === "leaderboard" || order.status === "leaderboard";

  //========================================
  // NORMAL CUSTOMER ORDER
  //========================================

  if (!isAdminLeaderboard) {
    const gb = Number(order.volume || 0);

    const amount = Number(order.amount || 0);

    customer.totalGB += gb;

    customer.totalOrders++;

    customer.totalSpent += amount;
  }

  //========================================
  // CHECK MANUAL POINTS FROM ADMIN
  //========================================

  const hasManualPoints =
    order.manualPoints !== undefined && order.manualPoints !== null;

  if (hasManualPoints) {
    const manualValue = Number(order.manualPoints);

    //====================================
    // MANUAL UPDATE TIME
    //====================================

    const manualTime = order.manualUpdatedAt?.toDate
      ? order.manualUpdatedAt.toDate().getTime()
      : new Date(order.manualUpdatedAt || 0).getTime();

    //====================================
    // NEWEST MANUAL ASSIGNMENT WINS
    //====================================

    if (!customer.manualOverride || manualTime > customer.manualUpdatedAt) {
      customer.manualOverride = true;

      customer.manualPoints = manualValue;

      customer.manualUpdatedAt = manualTime;
    }
  }
}

//===================
// MONTHLY LEADERBOARD
//====================
function loadLeaderboard() {
  const db = window.FIRESTORE;

  if (!db) return;

  //========================================
  // NO ORDERBY
  // NO FIRESTORE INDEX REQUIRED
  //========================================

  const q = query(collection(db, "orders"));

  onSnapshot(
    q,
    (snapshot) => {
      //========================================
      // CURRENT + PREVIOUS MONTH CUSTOMERS
      //========================================

      const currentCustomers = {};

      const previousCustomers = {};

      //========================================
      // CURRENT DATE
      //========================================

      const now = new Date();

      //========================================
      // PREVIOUS MONTH START
      //========================================

      const previousMonthStart = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
        0,
        0,
        0,
        0,
      );

      //========================================
      // PREVIOUS MONTH END
      //========================================

      const previousMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59,
        999,
      );

      //========================================
      // READ ALL ORDERS ONCE
      //========================================

      snapshot.forEach((doc) => {
        const order = doc.data();

        //========================================
        // IGNORE FAILED / CANCELLED
        //========================================

        const status = String(order.status || "").toLowerCase();

        if (status === "failed" || status === "cancelled") {
          return;
        }

        const isAdminLeaderboard = order.LD_Status === "leaderboard";
        if (
          !isAdminLeaderboard &&
          (order.status === "failed" || order.status === "cancelled")
        ) {
          return;
        }

        //========================================
        // ORDER DATE
        //========================================

        const orderDate = order.createdAt?.toDate
          ? order.createdAt.toDate()
          : new Date(order.createdAt);

        if (isNaN(orderDate.getTime())) {
          return;
        }

        //========================================
        // CUSTOMER PHONE
        //========================================

        const phone = String(order.recipient || "").trim();

        if (!phone) return;

        //========================================
        // PREVIOUS MONTH
        //========================================

        if (orderDate >= previousMonthStart && orderDate <= previousMonthEnd) {
          addOrderToLeaderboard(previousCustomers, order);
        }

        //========================================
        // CURRENT GIVEAWAY
        //========================================

        if (orderDate >= LEADERBOARD_START && orderDate <= LEADERBOARD_ENDS) {
          addOrderToLeaderboard(currentCustomers, order);
        }
      });

      finalizeLeaderboardPoints(currentCustomers);

      finalizeLeaderboardPoints(previousCustomers);

      //========================================
      // SORT CURRENT MONTH
      //========================================

      const currentLeaders = Object.values(currentCustomers)
        .sort(sortLeaderboard)
        .slice(0, 9);

      //========================================
      // SORT PREVIOUS MONTH
      //========================================

      const previousWinners = Object.values(previousCustomers)
        .sort(sortLeaderboard)
        .slice(0, 3);

      //========================================
      // UPDATE NORMAL LEADERBOARD
      //========================================

      renderLeaderboard(currentLeaders);

      //========================================
      // UPDATE CELEBRATION
      // WITH LAST MONTH'S TOP 3
      //========================================

      updateWinnerCelebration(previousWinners);

      //========================================
      // DEBUG
      //========================================

      console.log("🏆 Current Month Leaders:", currentLeaders);

      console.log("🎉 Previous Month Winners:", previousWinners);
    },

    (error) => {
      console.error("Leaderboard listener error:", error);
    },
  );
}

//=========================
// FINALIZE POINTS
//=========================
function finalizeLeaderboardPoints(customers) {
  Object.values(customers).forEach((customer) => {
    if (customer.manualOverride) {
      // Admin-assigned points
      customer.points = customer.manualPoints;
    } else {
      // Normal calculation
      // 1GB = 6 POINTS
      customer.points = customer.totalGB * 6;
    }
  });
}

//========================================
// SORT LEADERBOARD
//========================================

function sortLeaderboard(a, b) {
  // Highest points first

  if (b.points !== a.points) {
    return b.points - a.points;
  }

  // Tie breaker:
  // Highest GB first

  return b.totalGB - a.totalGB;
}

//===========================
// RENDER LEADERS
//===========================
function renderLeaderboard(leaders) {
  //========================================
  // CLEAR ALL 5 POSITIONS
  // UPDATE EVERY SWIPER CLONE TOO
  //========================================
  for (let i = 1; i <= 9; i++) {
    document.querySelectorAll(`#leaderPhone${i}`).forEach((el) => {
      el.textContent = "---";
    });

    document.querySelectorAll(`#leaderPoints${i}`).forEach((el) => {
      el.textContent = "0 points";
    });

    document.querySelectorAll(`#leaderStars${i}`).forEach((el) => {
      el.innerHTML = "";
    });
  }

  //========================================
  // RENDER CURRENT LEADERS
  //========================================
  leaders.forEach((leader, index) => {
    const i = index + 1;

    //======================================
    // UPDATE ALL CLONES
    //======================================
    document.querySelectorAll(`#leaderPhone${i}`).forEach((el) => {
      el.textContent = maskPhone(leader.phone);
    });

    document.querySelectorAll(`#leaderPoints${i}`).forEach((el) => {
      el.textContent = Number(leader.points || 0) + " points";
    });

    document.querySelectorAll(`#leaderStars${i}`).forEach((el) => {
      el.innerHTML = getStars(i);
    });
  });
}

//=================
// HIDE PHONE
//=================
function maskPhone(phone) {
  if (!phone) return "Unknown";

  return phone.substring(0, 5) + "***" + phone.substring(8);
}

//==============
// GET STARS
//==============
function getStars(rank) {
  let stars = "";

  for (let i = 0; i < 6 - rank; i++) {
    stars += `<i class="ri-star-fill"></i>`;
  }

  return stars;
}

loadLeaderboard();
resetGiveAwayHtml();

// RESET GIVEAWAY TIMER HTML
function resetGiveAwayHtml() {
  //TIME
  const defaultHtml = document.getElementById("leaderboardStartText");

  const leaderboardResetText = document.getElementById("leaderboardResetText");

  if (!defaultHtml) return;

  const now = new Date();

  // Competition has ended
  if (now >= LEADERBOARD_ENDS) {
    defaultHtml.textContent = `Free GB GIVEAWAY: ${leaderboardStartText} - ${endTimeText} ends.`;
  } else {
    defaultHtml.textContent = `Free GB GIVEAWAY: ${leaderboardStartText} - ${endTimeText}`;
  }

  return;
}

//========================================
// AUTOMATIC CELEBRATION CHECK
//========================================

//========================================
// UPDATE CELEBRATION WINNERS
//========================================

//========================================
// UPDATE WINNER CELEBRATION
// LAST MONTH'S TOP 3
//========================================

function updateWinnerCelebration(winners) {
  if (!Array.isArray(winners)) {
    return;
  }

  //========================================
  // TOP 3 ONLY
  //========================================

  const topThree = winners.slice(0, 3);

  for (let i = 1; i <= 3; i++) {
    const winner = topThree[i - 1];

    const phoneElement = document.getElementById(`celebrationWinner${i}`);

    const pointsElement = document.getElementById(`celebrationPoints${i}`);

    //======================================
    // NO WINNER
    //======================================

    if (!winner) {
      if (phoneElement) {
        phoneElement.textContent = "---";
      }

      if (pointsElement) {
        pointsElement.textContent = "---";
      }

      continue;
    }

    //======================================
    // PHONE
    //======================================

    if (phoneElement) {
      phoneElement.textContent = maskPhone(winner.phone);
    }

    //======================================
    // POINTS
    //======================================

    if (pointsElement) {
      pointsElement.textContent = Number(winner.points || 0) + " points";
    }
  }

  console.log("🎉 Celebration Top 3:", topThree);
}

//========================================
// ACTUAL GIVEAWAY DATES
//========================================

const GIVEAWAY_END_DATE = new Date("2026-11-30T23:59:59");

const CELEBRATION_START = new Date("2026-12-01T00:00:00");

const CELEBRATION_END = new Date("2026-12-01T23:59:59");

//========================================
// GIVEAWAY CELEBRATION DATE
//========================================

let celebrationDismissed = false;

document.addEventListener("DOMContentLoaded", () => {
  //========================================
  // WINNER CELEBRATION SYSTEM
  //========================================

  const winnerCelebration = document.getElementById("winnerCelebration");

  const fireworksCanvas = document.getElementById("fireworksCanvas");

  const confettiCanvas = document.getElementById("confettiCanvas");

  const winnerCloseBtn = document.getElementById("winnerCloseBtn");

  const fireworksCtx = fireworksCanvas.getContext("2d");

  const confettiCtx = confettiCanvas.getContext("2d");

  //========================================
  // CANVAS SIZE
  //========================================

  function resizeCelebrationCanvas() {
    fireworksCanvas.width = window.innerWidth;

    fireworksCanvas.height = window.innerHeight;

    confettiCanvas.width = window.innerWidth;

    confettiCanvas.height = window.innerHeight;
  }

  resizeCelebrationCanvas();

  window.addEventListener("resize", resizeCelebrationCanvas);

  //========================================
  // FIREWORK PARTICLES
  //========================================

  let fireworks = [];

  let fireworkRockets = [];

  function createFirework(x, y) {
    const particleCount = 70 + Math.floor(Math.random() * 50);

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;

      const speed = 2 + Math.random() * 5;

      fireworks.push({
        x,
        y,

        vx: Math.cos(angle) * speed,

        vy: Math.sin(angle) * speed,

        life: 1,

        decay: 0.012 + Math.random() * 0.018,

        size: 1 + Math.random() * 2.5,

        hue: Math.floor(Math.random() * 360),
      });
    }
  }

  //========================================
  // FIREWORK ROCKET
  //========================================

  function launchFirework() {
    fireworkRockets.push({
      x: Math.random() * fireworksCanvas.width,

      y: fireworksCanvas.height,

      targetY: 100 + Math.random() * (fireworksCanvas.height * 0.45),

      speed: 7 + Math.random() * 4,
    });
  }

  //========================================
  // UPDATE FIREWORKS
  //========================================

  function updateFireworks() {
    fireworksCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);

    //=============================
    // ROCKETS
    //=============================

    for (let i = fireworkRockets.length - 1; i >= 0; i--) {
      const rocket = fireworkRockets[i];

      rocket.y -= rocket.speed;

      // Rocket glow

      fireworksCtx.beginPath();

      fireworksCtx.arc(rocket.x, rocket.y, 3, 0, Math.PI * 2);

      fireworksCtx.fillStyle = "#ffffff";

      fireworksCtx.shadowBlur = 15;

      fireworksCtx.shadowColor = "#ffffff";

      fireworksCtx.fill();

      fireworksCtx.shadowBlur = 0;

      // Explosion

      if (rocket.y <= rocket.targetY) {
        createFirework(rocket.x, rocket.y);

        fireworkRockets.splice(i, 1);
      }
    }

    //=============================
    // PARTICLES
    //=============================

    for (let i = fireworks.length - 1; i >= 0; i--) {
      const particle = fireworks[i];

      particle.x += particle.vx;

      particle.y += particle.vy;

      // Gravity

      particle.vy += 0.045;

      particle.vx *= 0.985;

      particle.life -= particle.decay;

      if (particle.life <= 0) {
        fireworks.splice(i, 1);

        continue;
      }

      fireworksCtx.beginPath();

      fireworksCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);

      fireworksCtx.fillStyle = `hsla(
                ${particle.hue},
                100%,
                65%,
                ${particle.life}
            )`;

      fireworksCtx.shadowBlur = 12;

      fireworksCtx.shadowColor = `hsl(
                ${particle.hue},
                100%,
                60%
            )`;

      fireworksCtx.fill();

      fireworksCtx.shadowBlur = 0;
    }
  }

  //========================================
  // CONFETTI
  //========================================

  let confetti = [];

  function createConfetti() {
    confetti = [];

    const amount = Math.min(180, Math.floor(window.innerWidth / 5));

    for (let i = 0; i < amount; i++) {
      confetti.push({
        x: Math.random() * confettiCanvas.width,

        y: -Math.random() * confettiCanvas.height,

        width: 5 + Math.random() * 7,

        height: 8 + Math.random() * 12,

        speed: 1 + Math.random() * 3,

        rotation: Math.random() * Math.PI * 2,

        rotationSpeed: -0.08 + Math.random() * 0.16,

        drift: -0.5 + Math.random(),

        hue: Math.floor(Math.random() * 360),
      });
    }
  }

  //========================================
  // UPDATE CONFETTI
  //========================================

  function updateConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    confetti.forEach((piece) => {
      piece.y += piece.speed;

      piece.x += Math.sin(piece.y * 0.02) * piece.drift;

      piece.rotation += piece.rotationSpeed;

      if (piece.y > confettiCanvas.height) {
        piece.y = -20;

        piece.x = Math.random() * confettiCanvas.width;
      }

      confettiCtx.save();

      confettiCtx.translate(piece.x, piece.y);

      confettiCtx.rotate(piece.rotation);

      confettiCtx.fillStyle = `hsl(
                    ${piece.hue},
                    90%,
                    55%
                )`;

      confettiCtx.fillRect(
        -piece.width / 2,
        -piece.height / 2,
        piece.width,
        piece.height,
      );

      confettiCtx.restore();
    });
  }

  //========================================
  // ANIMATION LOOP
  //========================================

  let celebrationAnimation;

  function celebrationLoop() {
    updateFireworks();

    updateConfetti();

    celebrationAnimation = requestAnimationFrame(celebrationLoop);
  }

  //========================================
  // START CELEBRATION
  //========================================

  function startWinnerCelebration() {
    if (!winnerCelebration) {
      return;
    }

    // User already closed it
    if (celebrationDismissed) {
      return;
    }

    // Already running
    if (winnerCelebration.classList.contains("active")) {
      return;
    }

    //========================================
    // SHOW WHOLE CONTAINER
    //========================================

    winnerCelebration.style.display = "flex";

    winnerCelebration.classList.add("active");

    //========================================
    // RESET ANIMATION
    //========================================

    fireworks = [];

    fireworkRockets = [];

    createConfetti();

    cancelAnimationFrame(celebrationAnimation);

    celebrationLoop();

    //========================================
    // FIRST FIREWORK
    //========================================

    launchFirework();

    //========================================
    // FIREWORK INTERVAL
    //========================================

    clearInterval(fireworkInterval);

    fireworkInterval = setInterval(() => {
      if (!winnerCelebration.classList.contains("active")) {
        clearInterval(fireworkInterval);

        fireworkInterval = null;

        return;
      }

      launchFirework();

      // Sometimes launch two

      if (Math.random() > 0.55) {
        setTimeout(launchFirework, 250);
      }
    }, 700);
  }

  //========================================
  // CLOSE CELEBRATION
  // USER CAN PURCHASE DATA
  //========================================

  function closeWinnerCelebration() {
    // Prevent automatic reopening
    celebrationDismissed = true;

    //========================================
    // HIDE WHOLE CONTAINER
    //========================================

    winnerCelebration.style.display = "none";

    winnerCelebration.classList.remove("active");

    //========================================
    // STOP FIREWORKS
    //========================================

    clearInterval(fireworkInterval);

    fireworkInterval = null;

    //========================================
    // STOP ANIMATION
    //========================================

    cancelAnimationFrame(celebrationAnimation);

    //========================================
    // CLEAR PARTICLES
    //========================================

    fireworks = [];

    fireworkRockets = [];

    confetti = [];

    //========================================
    // CLEAR CANVASES
    //========================================

    fireworksCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);

    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }

  if (winnerCloseBtn) {
    winnerCloseBtn.addEventListener("click", closeWinnerCelebration);
  }

  //========================================
  // STOP CELEBRATION
  //========================================

  function stopWinnerCelebration() {
    if (!winnerCelebration) {
      return;
    }

    //========================================
    // HIDE WHOLE CONTAINER
    //========================================

    winnerCelebration.style.display = "none";

    winnerCelebration.classList.remove("active");

    //========================================
    // STOP FIREWORKS
    //========================================

    clearInterval(fireworkInterval);

    fireworkInterval = null;

    //========================================
    // STOP ANIMATION
    //========================================

    cancelAnimationFrame(celebrationAnimation);

    //========================================
    // CLEAR PARTICLES
    //========================================

    fireworks = [];

    fireworkRockets = [];

    confetti = [];

    //========================================
    // CLEAR CANVASES
    //========================================

    fireworksCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);

    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }

  //========================================
  // CHECK CELEBRATION TIME
  //========================================

  function checkGiveawayCelebration() {
    const now = new Date();

    if (now >= CELEBRATION_START && now <= CELEBRATION_END) {
      startWinnerCelebration();
    } else {
      stopWinnerCelebration();
    }
  }

  //========================================
  // INITIAL CHECK
  //========================================

  checkGiveawayCelebration();

  //========================================
  // CHECK EVERY SECOND
  //========================================

  setInterval(checkGiveawayCelebration, 1000);
});

// ============================================================
// LIVE ORDER STATUS SEARCH
// ============================================================

const LIVE_ORDER_STORAGE_KEY = "ecoDataLiveOrders";

const OrderSearchInput = document.getElementById("OrderSearchInput");

const searchStatBtn = document.getElementById("searchStatBtn");

const liveOrderResult = document.getElementById("liveOrderResult");

const emptyDataState = document.getElementById("emptyDataState");

// ============================================================
// LOAD SAVED ORDERS
// ============================================================

let liveOrders = loadCheckedLiveOrders();

// ============================================================
// LOCAL STORAGE
// ============================================================

function loadCheckedLiveOrders() {
  try {
    const saved = localStorage.getItem(LIVE_ORDER_STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load live orders:", error);

    return [];
  }
}

function saveLiveOrders() {
  try {
    localStorage.setItem(LIVE_ORDER_STORAGE_KEY, JSON.stringify(liveOrders));
  } catch (error) {
    console.error("Failed to save live orders:", error);
  }
}

// ============================================================
// SEARCH ORDER
// ============================================================

async function searchLiveOrder() {
  const orderIdOrRef = OrderSearchInput.value.trim();

  if (!orderIdOrRef) {
    showLiveOrderMessage("Enter an Order ID to search.", "error");

    return;
  }

  // Prevent duplicate searches while loading
  searchStatBtn.disabled = true;

  searchStatBtn.textContent = "Searching...";

  showLiveOrderMessage("Checking live order status...", "loading");

  try {
    // --------------------------------------------------------
    // CALL YOUR NEW ROUTER
    // --------------------------------------------------------

    const response = await fetch(
      `/api/live-order-status/${encodeURIComponent(orderIdOrRef)}`,
    );

    const returnedOrder = await response.json();

    // --------------------------------------------------------
    // CHECK RESPONSE
    // --------------------------------------------------------

    if (!response.ok || !returnedOrder.success || !returnedOrder.order) {
      throw new Error(returnedOrder.message || "Order not found.");
    }

    const order = returnedOrder.order;

    // --------------------------------------------------------
    // CHECK IF ORDER ALREADY EXISTS
    // --------------------------------------------------------

    const existingIndex = liveOrders.findIndex(
      (item) => item.orderId === order.orderId,
    );

    if (existingIndex !== -1) {
      // ------------------------------------------------------
      // UPDATE EXISTING ORDER
      // ------------------------------------------------------

      liveOrders[existingIndex] = {
        ...liveOrders[existingIndex],

        recipient: order.recipient || liveOrders[existingIndex].recipient,

        size: order.size ?? liveOrders[existingIndex].size,

        status: order.status || liveOrders[existingIndex].status,

        timestamp: order.timestamp || liveOrders[existingIndex].timestamp,
      };
    } else {
      // ------------------------------------------------------
      // CREATE NEW ORDER
      // ------------------------------------------------------

      liveOrders.push({
        orderId: order.orderId,

        recipient: order.recipient || "—",

        size: order.size ?? "—",

        status: order.status || "unknown",

        timestamp: order.timestamp || null,
      });
    }

    // --------------------------------------------------------
    // SAVE TO LOCAL STORAGE
    // --------------------------------------------------------

    saveLiveOrders();

    // --------------------------------------------------------
    // RENDER TABLE
    // --------------------------------------------------------

    renderLiveOrders();

    // play success sound
    playSuccessSound();

    // Clear search field
    OrderSearchInput.value = "";
  } catch (error) {
    console.error("Live order search error:", error);

    showLiveOrderMessage(
      error.message || "Unable to retrieve order status.",
      "error",
    );
  } finally {
    searchStatBtn.disabled = false;

    searchStatBtn.textContent = "Search";
  }
}

// ============================================================
// RENDER ALL SAVED ORDERS
// ============================================================

function renderLiveOrders() {
  // Clear current rows
  liveOrderResult.innerHTML = "";

  // ----------------------------------------------------------
  // NO ORDERS
  // ----------------------------------------------------------

  if (!liveOrders.length) {
    liveOrderResult.innerHTML = `
      <div class="sellerProductsEmpty">
        No live orders searched yet.
      </div>
    `;

    return;
  }

  // ----------------------------------------------------------
  // CREATE ROW FOR EACH ORDER
  // ----------------------------------------------------------

  [...liveOrders].reverse().forEach((order) => {
    const row = document.createElement("div");

    row.className = "live-row";

    row.dataset.orderId = order.orderId;

    row.innerHTML = `

      <span class="live-order-cell order-id-cell">
        ${escapeLiveOrderHTML(order.orderId)}
      </span>

      <span class="live-order-cell recipient-cell">
        ${escapeLiveOrderHTML(order.recipient)}
      </span>

      <span class="live-order-cell size-cell">
        ${escapeLiveOrderHTML(order.size)}
      </span>

      <span class="live-order-cell status-cell">

        <span
          class="live-status-pill ${getLiveStatusClass(order.status)}"
        >

          <span class="live-status-dot"></span>

          ${escapeLiveOrderHTML(formatLiveStatus(order.status))}

        </span>

      </span>

      <span class="live-order-cell date-cell">
        ${formatLiveOrderDate(order.timestamp)}
      </span>

    `;

    liveOrderResult.appendChild(row);
  });
}

// ============================================================
// POLL SWIFT FOR LIVE STATUS
// ============================================================

async function refreshLiveOrderStatuses() {
  if (!liveOrders.length) {
    return;
  }

  // ----------------------------------------------------------
  // CHECK EVERY SAVED ORDER
  // ----------------------------------------------------------

  for (const order of liveOrders) {
    try {
      const response = await fetch(
        `/api/live-order-status/${encodeURIComponent(order.orderId)}`,
      );

      const returnedOrder = await response.json();

      if (!response.ok || !returnedOrder.success || !returnedOrder.order) {
        continue;
      }

      const freshOrder = returnedOrder.order;

      // ------------------------------------------------------
      // FIND STORED ORDER
      // ------------------------------------------------------

      const index = liveOrders.findIndex(
        (item) => item.orderId === order.orderId,
      );

      if (index === -1) {
        continue;
      }

      // ------------------------------------------------------
      // UPDATE LIVE STATUS
      // ------------------------------------------------------

      liveOrders[index].status = freshOrder.status || liveOrders[index].status;

      // ------------------------------------------------------
      // Keep latest timestamp if Swift provides it
      // ------------------------------------------------------

      if (freshOrder.timestamp) {
        liveOrders[index].timestamp = freshOrder.timestamp;
      }

      // Recipient can also be refreshed
      if (freshOrder.recipient) {
        liveOrders[index].recipient = freshOrder.recipient;
      }

      // Size can also be refreshed
      if (freshOrder.size !== undefined) {
        liveOrders[index].size = freshOrder.size;
      }

      // ------------------------------------------------------
      // UPDATE ONLY THE ROW
      // ------------------------------------------------------

      updateLiveOrderRow(liveOrders[index]);
    } catch (error) {
      console.error(`Failed to refresh ${order.orderId}:`, error);
    }
  }

  // Save latest statuses
  saveLiveOrders();
}

// ============================================================
// UPDATE ONE ROW WITHOUT REBUILDING THE TABLE
// ============================================================

function updateLiveOrderRow(order) {
  const row = liveOrderResult.querySelector(
    `.live-row[data-order-id="${CSS.escape(order.orderId)}"]`,
  );

  if (!row) {
    return;
  }

  const statusCell = row.querySelector(".status-cell");

  if (statusCell) {
    statusCell.innerHTML = `

      <span
        class="live-status-pill ${getLiveStatusClass(order.status)}"
      >

        <span class="live-status-dot"></span>

        ${escapeLiveOrderHTML(formatLiveStatus(order.status))}

      </span>

    `;
  }

  // Update recipient if changed
  const recipientCell = row.querySelector(".recipient-cell");

  if (recipientCell) {
    recipientCell.textContent = order.recipient || "—";
  }

  // Update size if changed
  const sizeCell = row.querySelector(".size-cell");

  if (sizeCell) {
    sizeCell.textContent = order.size ?? "—";
  }

  // Update timestamp
  const dateCell = row.querySelector(".date-cell");

  if (dateCell) {
    dateCell.textContent = formatLiveOrderDate(order.timestamp);
  }
}

// ============================================================
// STATUS CLASS
// ============================================================

function getLiveStatusClass(status) {
  const normalized = String(status || "")
    .toLowerCase()
    .trim();

  if (
    normalized === "delivered" ||
    normalized === "completed" ||
    normalized === "success" ||
    normalized === "successful"
  ) {
    return "status-delivered";
  }

  if (
    normalized === "pending" ||
    normalized === "processing" ||
    normalized === "in-progress"
  ) {
    return "status-pending";
  }

  if (
    normalized === "failed" ||
    normalized === "cancelled" ||
    normalized === "canceled"
  ) {
    return "status-failed";
  }

  return "status-unknown";
}

// ============================================================
// FORMAT STATUS
// ============================================================

function formatLiveStatus(status) {
  if (!status) {
    return "Unknown";
  }

  const value = String(status).toLowerCase().trim();

  return value.charAt(0).toUpperCase() + value.slice(1);
}

// ============================================================
// FORMAT DATE
// ============================================================

function formatLiveOrderDate(timestamp) {
  if (!timestamp) {
    return "—";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================
// ESCAPE HTML
// ============================================================

function escapeLiveOrderHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================================
// MESSAGE
// ============================================================

function showLiveOrderMessage(message, type = "error") {
  liveOrderResult.innerHTML = `

    <div class="liveOrderMessage ${type}">
      ${escapeLiveOrderHTML(message)}
    </div>

  `;
}

// ============================================================
// SEARCH BUTTON
// ============================================================

if (searchStatBtn) {
  searchStatBtn.addEventListener("click", searchLiveOrder);
}

// ============================================================
// ENTER KEY SEARCH
// ============================================================

if (OrderSearchInput) {
  OrderSearchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();

      searchLiveOrder();
    }
  });
}

// ============================================================
// INITIAL TABLE LOAD
// ============================================================

renderLiveOrders();

// ============================================================
// LIVE STATUS POLLING — EVERY 30 SECONDS
// check active orders every 30 seconds
// NEVER RUNS A NEW CYCLE WHILE THE PREVIOUS
// ON IS RUNNING
// ============================================================
async function startLiveOrderVendorPolling() {
  while (true) {
    try {
      await refreshLiveOrderStatuses();
    } catch (error) {
      console.log("Live order polling error:", error);
    }

    // wait 30 seconds AFTER the current polling cycle finishes
    await new Promise((resolve) => {
      setTimeout(resolve, 40000);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // start polling
  startLiveOrderVendorPolling();
});








Object.assign(window, {
  renderLiveOrderRow, loadLiveOrders, saveLiveOrder, getNetwork
});
