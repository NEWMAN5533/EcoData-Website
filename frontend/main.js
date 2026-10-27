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
  getDoc,
  getFirestore,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 
"https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";





  // ---------- CONFIG ----------
const API_BASE = (() => {
  // use current host in prod or localhost for local dev
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }
  return "https://ecodata-app.onrender.com"; // your deployed backend
})();


//=========================
// LEADERBOARD START DATE
//=========================
const LEADERBOARD_START = new Date("2026-10-01");
const LEADERBOARD_ENDS = new Date("2026-10-31T23:59:59");

const leaderboardStartText = LEADERBOARD_START.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
});

const endTimeText = LEADERBOARD_ENDS.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
});




//=========================
// LEADERBOARD START DATE
//=========================

// ---------- GLOBAL VARIABLES ----------
let STATUS_POLL_INTERVAL = 5000;
let _statusPollTimer = null; // to hold the interval timer ID

// ---------- GLOBAL STATE ----------
let selectedBundle = null;      // used for UI selection (normal view)
let lastPurchasedBundle = null; // used after payment (normal + grid)

// protect payment (save successful)
let lastValidation = null;

// default selectedPackage
let selectedPackageName = "mtn_data_express_delivery";

const PACKAGE_MAP = {
  normal: "mtn_data_normal_delivery",
  express: "mtn_data_express_delivery",
  numbers: "mtn_verified_numbers",
  mashup: "special_mashup_bundle_packages"
};

const STORAGE_KEY = "selected_mtn_package";


function getVendorForPackage(packageName) {
  const normalizedPackage = String(packageName || "").trim();

  return normalizedPackage === 
  PACKAGE_MAP.normal
    ? "datamart"
    : "swiftdata";
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




//NEW UPDATED 21/01/2026  (DOMCONTENTLOADER)//
document.addEventListener("DOMContentLoaded", () => {


  

const selectBtn = document.getElementById("selectBtn");
const dropdownOffer = document.getElementById("dropdownOffer");
const deliveryOptions = document.querySelectorAll(".optionDelevery");


const targetDiv = document.getElementById("topOpt");
const unTargetDiv = document.getElementById("bottomOpt");

const gridExpressDiv = document.getElementById("gridExpressDiv");
const gridNormalDiv = document.getElementById("gridNormalDiv");
const gridMashupDiv = document.getElementById("mashGridDiv");

// MASHUP TOGGLE
const mashupNormal = document.getElementById("mash");
const flexingContainer = document.getElementById("moveDown");
const mashOptTextCont = document.getElementById("optionBtn");
const mashLabel = document.querySelector(".sel");
const mashRecipient = document.querySelector(".bundleRecipient");
const mashPacks = document.querySelector(".packs");
const mashTitle = document.querySelector(".top-dashboard h2");
const mashTopRightContainerh2= document.querySelector(".top-right-content h2");
const mashTopRightContainerSmall= document.querySelector(".top-right-content small");
const mashTopRightContainerBtn= document.querySelector(".btn-div");

 // Update modal placeholders

const mtnArea = document.getElementById("mtnArea");
const mtnAreaDiv = document.getElementById("bundles");


//=================================
//  CHECK RESTRICTIONS
//=================================

async function checkRestrictions(){
  try {
    const response = await fetch("/api/restrictions");

    return await response.json();
  } catch(error) {
    console.error("Restrictions check failed", error);
    return {
      success: false
    };
  }
}


async function canUseNormalDeliveryMode() {
  // Normal Delivery is always selectable.
  // Vendor routing is handled by getVendorForPackage().
  // Recipient verification is handled before payment.

  return true;
}


//=================================
//  CHECK RESTRICTIONS ENDS
//=================================

//=================================
//  VALIDATE RECIPIENT 
//=================================
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
      message: "Recipient validation not required for this network."
    };
  }

  console.log("Sending validation:", {
    phone,
    offerSlug,
    network: normalizedNetwork
  });

  try {
    const response = await fetch("/api/validate-recipient", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        phone,
        offerSlug
      })
    });

    return await response.json();

  } catch (error) {
    console.log("Validation Error", error);

    return {
      success: false,
      eligible: false,
      message: "Unable to verify recipient"
    };
  }
}
//=================================
// VALIDATE RECIPIENT ENDS
//=================================



/* =========================================
   VENDOR-AWARE RECIPIENT VALIDATION

   SwiftData:
   Uses the existing validateRecipient().

   DataMart:
   Uses the backend DataMart verification
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
      4000
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
          "Accept": "application/json"
        },
        body: JSON.stringify({
          network: bundle.network || "mtn",
          recipient: phone,
          size: Number(bundle.size),
          offerSlug: bundle.packageName
        })
      });

      let result;

      try {
        result = await response.json();
      } catch {
        result = null;
      }

      console.log("DataMart verification response:", {
        httpStatus: response.status,
        result
      });

      // -----------------------------------------
      // A. Backend explicitly approves purchase.
      // -----------------------------------------
      if (result?.canProceed === true) {
        lastValidation = {
          success: true,
          eligible: true,
          provider: result.provider || "datamart",
          verification: result.verification || null,
          verificationSkipped:
            result.verificationSkipped === true
        };

        showSnackBar(
          result.message ||
            "Recipient check complete. You may continue.",
          "success",
          3000
        );

        return true;
      }

      // -----------------------------------------
      // B. Confirmed recipient rejection.
      // These conditions MUST block payment.
      // -----------------------------------------
      const blockingCodes = [
        "INVALID_RECIPIENT",
        "RECIPIENT_NOT_VERIFIED",
        "RECIPIENT_ACTIVATION_REQUIRED"
      ];

      if (
        blockingCodes.includes(result?.code) ||
        result?.activationRequired === true
      ) {
        showSnackBar(
          result.message ||
            "This recipient cannot receive the selected bundle. Please select another offer",
          "error",
          5000
        );

        return false;
      }

      // -----------------------------------------
      // C. Verification unavailable.
      // Allow payment to continue if the backend
      // explicitly marks the failure as temporary.
      // -----------------------------------------
      const temporaryFailureCodes = [
        "VERIFY_UNAVAILABLE",
        "VERIFICATION_FAILED",
        "INVALID_VERIFICATION_RESPONSE",
        "NETWORK_VERIFICATION_UNAVAILABLE",
        "VERIFICATION_CONFIG_ERROR",
        "VENDOR_UNAVAILABLE"
      ];

      const temporaryHttpStatuses = [
        408,
        429,
        500,
        502,
        503,
        504
      ];

      const verificationUnavailable =
        temporaryFailureCodes.includes(result?.code) ||
        temporaryHttpStatuses.includes(response.status);

      if (verificationUnavailable) {
        lastValidation = {
          success: true,
          eligible: true,
          provider: "datamart",
          verificationSkipped: true,
          verificationStatus: "unavailable"
        };

        showSnackBar(
          "Recipient verification is temporarily unavailable. You can continue with your purchase.",
          "info",
          5000
        );

        return true;
      }

      // -----------------------------------------
      // D. Unknown or ambiguous response.
      // Fail safely instead of assuming approval.
      // -----------------------------------------
      showSnackBar(
        result?.message ||
          "We could not confirm this recipient. Please try again.",
        "error",
        5000
      );

      return false;
    }

    // =========================================
    // SWIFTDATA: KEEP EXISTING VALIDATION
    // =========================================
    const validation = await validateRecipient(
      "233" + phone.substring(1),
      bundle.packageName,
      bundle.network
    );

    if (!validation.success || !validation.eligible) {
      showSnackBar(
        validation.message || "Recipient validation failed.",
        "error",
        4000
      );

      return false;
    }

    lastValidation = {
      ...validation,
      provider: "swiftdata"
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
        verificationStatus: "unavailable"
      };

      showSnackBar(
        "Recipient verification is temporarily unavailable. You can continue with your purchase.",
        "info",
        5000
      );

      return true;
    }

    showSnackBar(
      "Unable to verify the recipient. Please try again.",
      "error",
      4000
    );

    return false;
  }
}



  function applyPackageUI(mode) {
  selectedPackageName = PACKAGE_MAP[mode];

  if(mode === "express" ||  mode === "numbers"){


  mashTopRightContainerh2.textContent = "MTN Data Bundle";
  mashTopRightContainerSmall.textContent = "Purchase MTN data bundles for single or multiple recipients";
  mashTopRightContainerBtn.textContent = "14 Packages Available";

      // resize the dropdown container
    flexingContainer.style.height = "28rem";
    flexingContainer.style.margin = "-12rem";

    // title to
    mashTitle.textContent = "MTN DATA BUNDLE";

    // packs to
    mashPacks.textContent = "13 Packages Available";
   
    // change labelRecipient to
    mashRecipient.textContent = "Bundle Recipient Number";
    // change label to
    mashLabel.textContent = "Bundle";
    
     // change text to
    mashOptTextCont.textContent = "Select Bundle";






    targetDiv.style.display = "none";
    gridExpressDiv.style.display = "block";
    gridNormalDiv.style.display = "none";


    unTargetDiv.style.display = "block";
    gridMashupDiv.style.display = "none";

    mtnArea.style.display = "block";
    mtnAreaDiv.style.display = "block";
  } else{
    gridExpressDiv.style.display = "none";
    unTargetDiv.style.display = "none";

    targetDiv.style.display = "block";
   

    gridNormalDiv.style.display = "block";
  }



  // IF NORMAL
  if(mode === "normal") {

     mashTopRightContainerh2.textContent = "MTN Data Bundle";
  mashTopRightContainerSmall.textContent = "Purchase MTN data bundles for single or multiple recipients";

  mashTopRightContainerBtn.textContent = "14 Packages Available";

      // resize the dropdown container
    flexingContainer.style.height = "28rem";
    flexingContainer.style.margin = "-12rem";


  // title to
    mashTitle.textContent = "MTN DATA BUNDLE";

    // packs to
    mashPacks.textContent = "14 Packages Available";
   
    // change labelRecipient to
    mashRecipient.textContent = "Bundle Recipient Number";
    // change label to
    mashLabel.textContent = "Bundle";
    
     // change text to
    mashOptTextCont.textContent = "Select Bundle";



    gridExpressDiv.classList.add("active");
    gridMashupDiv.style.display = "none";

    mtnArea.style.display = "block";
    mtnAreaDiv.style.display = "block";
  } else{
    gridExpressDiv.classList.remove("active");
  }


  // MASHUP
  if(mode === "mashup"){

  mashTopRightContainerh2.textContent = "Special Mashup Bundle";
  mashTopRightContainerSmall.textContent = "Purchase MASHUP bundle for single  or multiple recipients";

  mashTopRightContainerBtn.textContent = "13 Packages Available";
     

    mashupNormal.style.display = "block";

    // resize the dropdown container
    flexingContainer.style.height = "32.5rem";
    flexingContainer.style.margin = "-20rem";

    // title to
    mashTitle.textContent = "SPECIAL MASHUP BUNDLES";

    // packs to
    mashPacks.textContent = "13 Packages Available";
   
    // change labelRecipient to
    mashRecipient.textContent = "Mashup Recipient Number";
    // change label to
    mashLabel.textContent = "Mashup";
    
     // change text to
    mashOptTextCont.textContent = "Select Mashup Bundle";


    targetDiv.style.display = "none";
    unTargetDiv.style.display = "none";
    gridNormalDiv.style.display = "none";
    gridExpressDiv.style.display = "none";

       // Update modal preview

    gridMashupDiv.style.display = "block";
    mtnArea.style.display = "block";
    mtnAreaDiv.style.display = "block";
  } else{
    mashupNormal.style.display = "none";

   








  }

  
}







function resetSelectedBundle(reason = "") {
  selectedBundle = null;

  // reset button UI
  optionBtn.innerHTML = `Select bundle <span><img src="./css/icons/more.png.png"></span>`;

  // clear placeholders
  const gbHolder = document.querySelector(".selectedModal-top-left-content");
  if (gbHolder) gbHolder.textContent = "";

  const totalHintText = document.querySelector(".selectedModal-bottom-left-content");
  if(totalHintText) totalHintText.textContent = "";

  const priceHolder = document.querySelector(".placeHolderPrice");
  if(priceHolder) priceHolder.textContent = "";

  const totalAmountText = document.getElementById("totalAmountText");
  if(totalAmountText) totalAmountText.textContent = "";

  const priceHolder2 = document.getElementById("placeHolderPriceTotal");
  if(priceHolder2) priceHolder2.textContent = "";

  const networkHolder = document.querySelector(".selectedModal-top-right-content");
  if(networkHolder) networkHolder.textContent = "";


  const img = document.querySelector(".selectedModal-left-left img");
  if (img) img.style.display = "none";

  // clears phone input (normal mode)

  const input = document.querySelector("#normalView .normalInput");
  if (input) input.value = "";

  // feedback
  if (reason) {
    showSnackBar(reason, "info", 5000);
  }
}



  const saveMode = 
  localStorage.getItem(STORAGE_KEY) || "normal";

  const activeOption = document.querySelector(`.optionDelevery[data-mode="${saveMode}"]`);

  if(activeOption) {
    applyPackageUI(saveMode);
    selectedPackageName =
    PACKAGE_MAP[saveMode];


      // UI state
    dropdownOffer.classList.remove("show");
    deliveryOptions.forEach(o => o.classList.remove("active"));
    activeOption.classList.add("active");

    // update button tex
    selectBtn.innerHTML = `${activeOption.querySelector("span").textContent} 
    <p class='doneSelect'> <img src="./css/icons/done (2).png" ></p>
    <p class='doneSelect darkM'> <img src="./css/icons/done (1).png" ></p>
    <span><img src="./css/icons/more.png.png"></span>`;
  };





// Toggle dropdown
selectBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  dropdownOffer.classList.toggle("show");
});

// Select delivery package
deliveryOptions.forEach(option => {
  option.addEventListener("click", async (e) => {
    e.stopPropagation();

    const mode = option.dataset.mode;

    // Only DataMart can use NORMAL DELIVERY MODE.
    // Check before changing the UI or saving the selection.
    if (mode === "normal") {
      const allowed = await canUseNormalDeliveryMode();

      if (!allowed) {
        showSnackBar("Please choose another offer. Normal Delivery Mode is currently unavailable.", "error", 4000
        );
        dropdownOffer.classList.remove("show");
        return;
      }
    }

    // Validate the selected mode.
    if (!PACKAGE_MAP[mode]) {
      showSnackBar(
        "Invalid delivery offer selected.",
        "error",
        4000
      );
      return;
    }

    // Reset the previously selected bundle.
    resetSelectedBundle("Offer changed. Please select a bundle.");

    // Save the selection only after the vendor check passes.
    localStorage.setItem(STORAGE_KEY, mode);

    // Update the existing package UI.
    applyPackageUI(mode);

    selectedPackageName = PACKAGE_MAP[mode];

    // Update the main selection button.
    selectBtn.innerHTML = `
      ${option.querySelector("span").textContent}
      <p class="doneSelect">
        <img src="./css/icons/done (2).png">
      </p>
      <p class="doneSelect darkM">
        <img src="./css/icons/done (1).png">
      </p>
      <span>
        <img src="./css/icons/more.png.png">
      </span>
    `;

    // Update active option.
    dropdownOffer.classList.remove("show");

    deliveryOptions.forEach(item => {
      item.classList.remove("active");
    });

    option.classList.add("active");

    showSnackBar("Offer updated.", "info", 2000);
  });
});

// Close when clicking outside
document.addEventListener("click", () => {
  dropdownOffer.classList.remove("show");
});


  // ---------- OPTION SELECT (NORMAL VIEW) ---(MTN)-------
  document.querySelectorAll('.optionSelect').forEach(opt => {
    opt.addEventListener('click', () => {

      selectedBundle = {
        network: opt.dataset.network,
        dataValue: opt.dataset.value,
        packageName: resolvePackageName(opt.dataset.network),
        size: Number(opt.dataset.size),
        price: Number(opt.dataset.price),
      };

  
       const feeToPay = (selectedBundle.price * 1.0195).toFixed(2);
       const onlyFee = (feeToPay - selectedBundle.price).toFixed(2);
      

      // Update button UI
      optionBtn.innerHTML = `
     
        ${opt.querySelector("span").textContent}
        <span class="price-badge">GHS ${selectedBundle.price}</span>
        <span class="fee-badge">Fee: ${onlyFee}</span>
        <span><img src="./css/icons/more.png.png"></span>
      `;

    
        // NORMAL VIEW PAYSTACK FEE REMOVED
         const priceWithFees = selectedBundle.price * 1.0195.toFixed(2);

      // Update selectedModal placeholders
      const img = document.querySelector(".spanImgContent img");
      if (img) img.style.display = "flex";

      const gbHolder = document.getElementById("placeHolderGB");
      if (gbHolder) gbHolder.textContent = `${opt.querySelector("span").textContent}`;


      const totalAmountContent = document.getElementById("totalAmountText");
      if(totalAmountContent) totalAmountContent.textContent = 
     "TotalAmount:";

      const priceHolder = document.getElementById("placeHolderPriceTotal");

      if (priceHolder) priceHolder.textContent = `GHS₵${priceWithFees.toFixed(2)}`;

      const networkHolder = document.getElementById("networkTextContent");
      if (networkHolder) networkHolder.textContent = selectedBundle.network.toUpperCase();

      closeAllDropdowns();
    });
  });




   // BOTTOM NAVIGATION BAR (DISPLAY = NONE if())
  const bottomNavDiv = document.getElementById("navIconDiv");




  // ---------- BUY BUTTONS (NORMAL + GRID) ----------
  document.querySelectorAll("#normalView .buy-btn,  #gridView .buy-btn")
    .forEach(button => {

      button.addEventListener("click", async () => {


      bottomNavDiv.style.display = "flex";

        let bundle;
        let recipient = "";

       
        // ================= NORMAL VIEW =================
        if (button.closest("#normalView")) {
          if (!selectedBundle) {
            // if no selected bundle ( bottomNav = flex )
          bottomNavDiv.style.display = "flex";
            showSnackBar("📱 Please select a bundle first");
            return;
          }

          const input = document.querySelector("#normalView .normalInput");
          if (!input || !input.value.trim()) {
            // if no input content keyed (bottomNav = flex)
            bottomNavDiv.style.display = "flex";

            showSnackBar("📱 Please enter a phone number");
            return;
          }

          recipient = input.value.trim();

          if (!/^[0-9]{10}$/.test(recipient)) {
  
            showSnackBar("📱 Phone number must be exactly 10 digits");
            return;
          }

          bundle = {...selectedBundle};




          const precheckPassed = await
          precheckRecipientBeforePayment(
            bundle,
            recipient
          );

          if(!precheckPassed) {
            return;
          }


          lastPurchasedBundle = bundle; // 🔑 SAVE FOR POST-PAYMENT

          //====================
          // VALIDATE ROUTING 
          //====================
 

          //==========================
          // VALIDATE ROUTING (NUMBER)
          //==========================


          





          // if(validate.success){proceed to payment}
          payWithPaystack(bundle, recipient);
          resetSelectedBundle();
        }

        // ================= GRID VIEW =================
        else {
          bundle = {
            network: button.dataset.network,
            dataValue: button.dataset.value,
            packageName: resolvePackageName(button.dataset.network),
            size: Number(button.dataset.size),
            price: Number(button.dataset.price),
          };


          // Validate
          if(
            !bundle.network ||
            !Number.isFinite(bundle.size) ||
            bundle.size <= 0 ||
            !Number.isFinite(bundle.price ) ||
            bundle.price <= 0
          ) {
            showSnackBar("Invalid bundle details. Please try again.", "error", 4000);
            return;
          }


          // MTN NETWORK BG
            if(button.dataset.network === "mtn"){
               document.querySelector(".modal-content-top").style.backgroundColor = 
              "rgba(245, 179, 57, 0.932)";

              document.querySelector(".continue").style.backgroundColor = 
              "rgba(245, 179, 57, 0.932)";


              document.getElementById("networkTag").style.backgroundColor =
              "rgba(245, 179, 57, 0.932)";
             }
        
            // TELECEL NETWORK BG
            if(button.dataset.network === "telecel"){
              document.querySelector(".modal-content-top").style.background = 
              "linear-gradient(to right, rgb(241, 62, 122), rgb(192, 3, 82))";

              document.querySelector(".continue").style.background = 
              "linear-gradient(to right, rgb(241, 62, 122), rgb(192, 3, 82))";


              document.getElementById("networkTag").style.background =
              "linear-gradient(to right, rgb(241, 62, 122), rgb(192, 3, 82))";

              
            }

            // AT NETWORK BG
              if(button.dataset.network === "at"){
              document.querySelector(".modal-content-top").style.background = 
              " linear-gradient(to right, rgb(75, 148, 233), rgb(4, 145, 170))";

              document.querySelector(".continue").style.background = 
              " linear-gradient(to right, rgb(75, 148, 233), rgb(4, 145, 170))";

              document.getElementById("networkTag").style.background =
              "linear-gradient(to right, rgb(75, 148, 233), rgb(4, 145, 170))";

               
            }

           

            const priceWithFee = (bundle.price * 1.0195).toFixed(2);

            const priceFee = (priceWithFee - bundle.price).toFixed(2);

          // Update modal preview

          //========================
           // SAVE DOM TEXT
           //========================
          setDashboardText(
            "priceTag",
            `GHS₵ ${bundle.price}`
          )

          setDashboardText(
            "networkTag",
            `${bundle.network.toUpperCase()} `
          )

          setDashboardText(
            "sizeTag",
            `${bundle.dataValue}`
          )

          setDashboardText(
            "netWorth",
          `${bundle.network.toUpperCase()}`
          )

          setDashboardText(
            "gbSize",
            `${bundle.dataValue.toUpperCase()}`
          )

             // PAYSTACK CHARGE FEE REMOVED
          setDashboardText(
            "amount",
            `GHS₵ ${priceWithFee}`
          )


          setDashboardText(
            "priceWithFee",
            `GHS₵ ${priceFee}`
          )
















          // if(validate.success){proceed to payment}
          createPhoneModal(async inputNumber => {

            const precheckPassed = await precheckRecipientBeforePayment(
              bundle,
              inputNumber
            );

            if(!precheckPassed) return;


            

            let formattedPhone = inputNumber.trim();
            // convert Ghana format (024xxxxxxxx) to 23324xxxxxxxxx
            if(formattedPhone.startsWith("0")){
              formattedPhone = "233" + formattedPhone.substring(1);
            }

       
            // save bundle 
            lastPurchasedBundle = bundle;

            payWithPaystack(bundle, inputNumber);
            resetSelectedBundle();
          });
        }
      });
    });




// normal & grid js code
const btn = document.getElementById('selectBtn');
const dropdown = document.getElementById('dropdown');



document.querySelectorAll('.option').forEach(opt => {
  opt.onclick = () => {
    btn.innerHTML = `
      ${opt.dataset.gb}GB 
      <span>GHS ${opt.dataset.price}</span>
    `;
    dropdown.style.display = 'none';
  };
});

// NORMAL MODE JS
// ---------- SELECT OPTION / DROPDOWN ----------

const optionBtn = document.getElementById('optionBtn');
const moveDown = document.getElementById('moveDown');


// Helper
function closeAllDropdowns() {
  moveDown.style.display = "none";
}

// MTN
optionBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  closeAllDropdowns();
  moveDown.style.display = "block";
});


// ---------- NORMAL & GRID MODE TOGGLE ----------

const normalModeBtn = document.getElementById("normalModeBtn");
const gridModeBtn = document.getElementById("gridModeBtn");
const normalView = document.getElementById("normalView");
const gridView = document.getElementById("gridView");
// target bundleTitle section
const bundleTitle = document.getElementById("bundleTitle");
const telecelAirtel = document.getElementById("teleAirtel");

//package divs
const mtnPackageDiv = document.querySelector(".packages");
const telecelPackageDiv = document.querySelector(".packagesta");






// NORMAL MODE BTN
normalModeBtn.addEventListener("click", (e) => {
  e.stopPropagation();

  bundleTitle.textContent = "MTN Bundles";
  

  telecelAirtel.style.display = "block";

  // remove background to the div when active
 telecelPackageDiv.style.background = "white";

 
 mtnPackageDiv.style.background = " background: linear-gradient(134deg, rgb(241, 218, 8),rgb(180, 106, 8));"


    // RESET BUNDLE WHEN MODE CHANGED
  resetSelectedBundle();

  // TOGGLE CONTAINERS
  normalView.style.display = "block";
  gridView.style.display = "none";

});

// GRID MODE BTN
gridModeBtn.addEventListener("click", (e) => {
  e.stopPropagation();
 bundleTitle.textContent = "MTN";
 telecelAirtel.style.display = "flex";




 mtnPackageDiv.style.background = "white";

    // RESET BUNDLE WHEN MODE CHANGED
  resetSelectedBundle();
  gridView.style.display = "block";
  normalView.style.display = "none";

  closeAllDropdowns();
});


// ---------- OTHER NETWORKS TOGGLE ----------


// ---------- CLOSE DROPDOWN WHEN CLICKING OUTSIDE ----------

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
    if(!/^[0-9]{10}$/.test(recipient)) {
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
  if(!loader) return;
  loader.style.display = "flex";
  document.body.classList.add("no-scroll");
}

function hideLoader() {
  const loader = document.getElementById("paystackLoader");
  if(!loader) return;
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

  const audioCtx = new (window.AudioContext ||
    window.webkitAudioContext)();

  const playTone = (freq, start, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(2.5,
      audioCtx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001,
        audioCtx.currentTime + start + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(audioCtx.currentTime + start);
      osc.stop(audioCtx.currentTime + start + duration);
  };

  // Three-tone success chime
  playTone(800, 0, 0.15);
  playTone(1000, 0.15, 0.15);
  playTone(1300, 0.30, 0.2);
}

// =======================
// PLAY SOUND WHEN ORDER IS SUCCESSFUL ENDS
// =======================



// =================================================
// CHECK IF THE RECIPIENT HAS ACTIVE ORDER (ALREADY)
// =================================================


const activeStatus = ["pending", "queued", "processing"];

function normalizeNumber(num = "") {
  return String(num).replace(/\D/g, "").slice(-9);
}

function hasActiveOrder(recipient) {
  const orders =
    JSON.parse(localStorage.getItem(LIVE_ORDERS_KEY)) || [];

  const target = normalizeNumber(recipient);

  return orders.some(o => {
    const status = (o.status || "").toLowerCase();

    return (
      normalizeNumber(o.recipient) === target &&
      activeStatus.includes(status)
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
 const firstTracker = document.getElementById("deliveryTracker1").style.display = "flex";

 const secondTracker = document.getElementById("deliveryTracker2").style.display = "flex";
};



// un activate trackers when no orders
function unActivateTrackers(){
 const firstTracker = document.getElementById("deliveryTracker1").style.display = "none";

 const secondTracker = document.getElementById("deliveryTracker2").style.display = "none";
}

//=================================
// ACTIVATE DELIVERY TRACKER ENDS
//=================================

//=======================
// SAFE DOM TEXT UPDATE
//=======================
function setDashboardText(id, value){
 const element = 
 document.getElementById(id);

 if(element){
  element.textContent = value;
 }
}






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

const requiresRecipientValidation =
  !["at", "telecel"].includes(normalizedNetwork);

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
    3000
  );
  return;
}



  if(hasActiveOrder(recipient)){
    showSnackBar("❌ Number already has an active order", "warning", 4000
    );
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
  paystackAmountPesewas: Math.round(payWithFee * 100)
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
      lastPurchasedBundle?.packageName || packageName;

    if (!currentPackageName) {
      throw new Error(
        "Selected package is missing. Cannot determine the vendor."
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
        response.reference
      );
    } else {
      console.log("➡️ Calling Vendor1 purchase function...");

      await orderBundle(
        network,
        recipient,
        currentPackageName,
        size,
        response.reference
      );
    }

  } catch (error) {
    console.error("❌ Post-payment processing error:", error);

    showSnackBar(
      "Payment succeeded, but order processing could not start. Contact support with your payment reference: " +
        response.reference,
      "error",
      8000
    );
  }
},

      onCancel: () => {
        hideLoader();
        showSnackBar("❌ Payment cancelled");
      }
    });
  }, 3120); 
}
// SELECTED BUNDLE FOR UI UPDATE


//NEW UPDATED 21/01/2026 //
// === SEND ORDER TO BACKEND ===

async function orderBundle(network, recipient, packageName, size, reference, ) {

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



  const response = await fetch(
  `${API_BASE}/api/buy-data`,
  {
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
  }
);

    const result = await response.json();

    if (!result.success) {
      showSnackBar(`❌ ${result.message || "Order failed"}`, "error", 5000);
      return;
    }

    playSuccessSound();
      showSnackBar(`📱${size}GB ORDER PLACED SUCCESSFULLY!`, "success", 6000);
   


const returnedOrder = result.order?.order || result.order || result;

const orderData = {
  orderId:
    returnedOrder.orderId ||
    returnedOrder.reference,

  reference: returnedOrder.reference,

  recipient,

  network: bundle.network,

  volume: Number(bundle.size || size || 0),

  dataValue: `${(bundle.dataValue || selectedBundle.dataValue || 0)}`,

  amount: Number(bundle.price * 1.0195 || 0),

  status: "pending",

  source: "web",

  isGuest: !auth.currentUser,

  createdBy: auth.currentUser?.uid || "guest",

  createdAt: Date.now(),
};

await handleOrderByActiveVendor({
  ...returnedOrder,
  provider: "swiftdata"
},
"swiftdata"
);

updateHomepageTotals(orderData);

 console.log("Calling saveOrderToFirestore...");
 console.log(orderData);

try {
  const firestoreId =
  await saveOrderToFirestore(orderData);
  console.log("Returned Firestore ID:", firestoreId);
} catch (e) {
console.error("SaveOrderToFireStore failed:", e)
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

  showSnackBar(`📱${size}GB ORDER PLACED SUCCESSFULLY!`, "success", 6000);
}
}
//ends//
//ends//


async function orderDataMartBundle(
  network,
  recipient,
  packageName,
  size,
  reference
) {
  const API_BASE =
    window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://ecodata-app.onrender.com";

  try {
   

    const response = await fetch(
      `${API_BASE}/api/datamart/buy-data`,
      {
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
      }
    );

    
const result = await response.json();

//  returns the purchase details inside result.data.
const order = result.data || {};

// Use the public order reference as EcoData's displayed order ID.

const orderId = order.orderReference
  ? `ED-${String(order.orderReference).slice(-5)}`
  : "";


if (result.status !== "success" || !orderId) {
  showSnackBar(
    result.message || "Unable to confirm the DataMart order.",
    "error",
    5000
  );
  return;
}


    const bundle = lastPurchasedBundle;
    

    const orderStatus = String(
      order.orderStatus || "processing"
    ).toLowerCase();


const orderData = {
  orderId: orderId,
  reference: orderId,
  paymentReference: reference,

  recipient,
  network: order.network || bundle?.network || network,
  volume: Number(order.capacity ?? bundle?.size ?? size),
  dataValue: String(bundle?.dataValue ?? order.capacity ?? size),

  amount: Number(order.price ?? bundle?.price ?? 0),
  costPrice: Number(order.price ?? 0),

  status: String(order.orderStatus || "processing").toLowerCase(),

  source: "web",
  provider: "datamart",
  isGuest: !auth.currentUser,
  createdBy: auth.currentUser?.uid || "guest",

  createdAt: Date.now(),
  updatedAt: Date.now()
};


    // Only announce completed delivery as a completed purchase.
    if (orderStatus === "completed") {
      playSuccessSound();

      showSnackBar(
        `${size}GB bundle purchased successfully!`,
        "success",
        6000
      );
    } else {
      showSnackBar(
        `${size}GB order received. Current status: ${orderStatus}.`,
        "success",
        6000
      );
    }



   await handleOrderByActiveVendor({
  ...orderData,
  ...order,

  orderId: orderData.orderId,
  reference: orderData.reference,
  paymentReference: reference,
  recipient,
  network: orderData.network,
  volume: orderData.volume,
  provider: "datamart"
},
"datamart"
);

    updateHomepageTotals(orderData);

    try {
      await saveOrderToFirestore(orderData);
    } catch (error) {
      console.error(" Firestore save failed:", error);
    }

    try {
      saveGuestOrder(orderData);
    } catch (error) {
      console.error(" guest order save failed:", error);
    }

    try {
      activateTrackers();
    } catch (error) {
      console.error(" tracker activation failed:", error);
    }
  } catch (error) {
    console.error(" order error:", error);

    showSnackBar(
      "We could not confirm the order status. Check your order history before retrying.",
      "warning",
      6000
    );
  }

}
//====================
// SAVE WITH RETRY
//====================
async function saveWithRetry(collectionRef, orderData) {

  let attempt = 1;

  while (true) {

    try {

      const docRef = await addDoc(
        collectionRef,
        orderData
      );

      console.log(
        `✅ Order saved on attempt ${attempt}`,
        docRef.id
      );

      return docRef;

    } catch (error) {

      console.warn(
        `❌ Save failed (Attempt ${attempt})`,
        error
      );

      //==========================
      // STOP RETRYING
      //==========================
      if (
        error.code === "permission-denied" ||
        error.code === "failed-precondition" ||
        error.code === "resource-exhausted" || // quota exceeded
        error.code === "unauthenticated" ||
        error.code === "invalid-argument"
      ) {

        console.error(
          "⛔ Permanent Firestore error. Retry stopped.",
          error
        );

        throw error;

      }

      //==========================
      // RETRY FOREVER
      //==========================
      console.log(
        `🔄 Retrying in 2 seconds...`
      );

      await new Promise(resolve =>
        setTimeout(resolve, 2000)
      );

      attempt++;

    }

  }

}

// ---------- FIRESTORE HELPER ----------
async function saveOrderToFirestore(orderData) {
  console.log("Entered saveOrderToFirestore()");
  console.log(orderData);
  try {
    const db = window.FIRESTORE;

    if (!db) {
      console.warn("Window.FIRESTORE is undefined");
      return null;
    }


 const firestoreData = {

  orderId: orderData.orderId,

  reference: orderData.reference,

  status: String(orderData.status || "pending"),

  recipient: orderData.recipient || "-",

  volume: Number(orderData.volume || 0),

  amount: Number(orderData.amount || 0),

  dataValue: `${(orderData.dataValue  || 0)}`,




  network: orderData.network || "-",

  source: "web",

  createdAt: serverTimestamp(),

  createdBy: orderData.createdBy || "guest",

};


console.log("Saving document...");
console.log(firestoreData);
    const ordersCol = collection(db, "orders");
    const result = await saveWithRetry(ordersCol, firestoreData);
    
    console.log(" Order saved to Firestore:", result.id);
    return result.id;

  } catch (err) {
    console.error("❌ Error saving order to Firestore:", err);
    return null;
  }
}




// ---------- LOCAL STORAGE HELPER ----------

// Save Guest Orders to Local Storage
function saveGuestOrder(orderData) {
  try {
    // Load existing guest orders or start fresh
    const existing = JSON.parse(localStorage.getItem("guestOrders") || "[]");

    // Avoid saving duplicates
    const isDuplicate = existing.some(o => o.orderId === orderData.orderId);
    if (isDuplicate) return;

    existing.push(orderData);

    localStorage.setItem("guestOrders", JSON.stringify(existing));
    console.log("💾 Guest order saved locally:", orderData);

  } catch (err) {
    console.error("❌ Failed to save guest order:", err);
  }
}


async function handleOrderByActiveVendor(orderResult) {
  const response = await fetch(
    `${API_BASE}/api/vendor-status`,
    {
      headers: { Accept: "application/json" },
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error("Unable to retrieve active vendor.");
  }

  const result = await response.json();

  if (!result.success || !result.activeVendor) {
    throw new Error("Active vendor was not returned.");
  }

  const activeVendor = String(result.activeVendor).toLowerCase();

  if (activeVendor === "datamart") {
    handleNewDataMartOrder(orderResult);
  } else if (activeVendor === "swiftdata") {
    handleNewOrder(orderResult);
  } else {
    throw new Error(`Unsupported vendor: ${activeVendor}`);
  }
}




function handleNewOrder(returnedOrder) {
  if (!returnedOrder) return;

  // Normalize Swift response
const normalized = {

  orderId:
    returnedOrder.orderId ||
    returnedOrder.id ||
    returnedOrder.order_id ||
    returnedOrder.reference ||
    null,

  reference:
    returnedOrder.reference ||
    returnedOrder.orderId ||
    null,

  status:
    returnedOrder.status ||
    returnedOrder.state ||
    "processing",

  recipient:
    returnedOrder.items?.[0]?.recipient ||
    returnedOrder.recipient ||
    "-",

  // CUSTOMER PRICE
  amount:
    Number(selectedBundle?.price || 0),

  // ECODATA COST PRICE
  costPrice:
    Number(returnedOrder.price || 0),

  // PROFIT
  profit:
    Number(selectedBundle?.price || 0)
    -
    Number(returnedOrder.price || 0),

  // NETWORK
  network:
    selectedBundle?.network || "-",

  // DATA SIZE
  volume:
    selectedBundle?.size ||
    returnedOrder.volume ||
    0,

  source: "web",

};

  if (!normalized.orderId) return;

  // Persist last order ID
  localStorage.setItem("lastOrderId", normalized.orderId);

  // ---------- LIVE ORDERS TABLE ----------
  const tableBody = document.getElementById("liveOrderRows");
  if (!tableBody) return;

  // Remove empty placeholder
  const empty = tableBody.querySelector(".empty-state");
  if (empty) empty.remove();

  // Prevent duplicate row
  if (tableBody.querySelector(`[data-id="${normalized.orderId}"]`)) return;

  // Create row
  const row = document.createElement("div");
  row.className = "live-row";
  row.dataset.id = normalized.orderId;

  row.innerHTML = `
    <span>
      ${normalized.orderId}
    </span>

    <span>
      ${normalized.volume}GB
    </span>

    <span>
      ${normalized.recipient}
    </span>

    <span class="status-cell">
      <sp class="status-badge ${getStatusClass(normalized.status)}">
        ${normalized.status}
      </span>
    </span>
  `;

  // Add newest on top
  tableBody.appendChild(row);

  console.log(normalized);
  
  // save for refresh persistence
  saveLiveOrder(normalized);

  renderLiveOrderRow(normalized);

  // ---------- POPUP STATUS CARD ----------
  createOrUpdateStatusCard(normalized);

  // ---------- LIVE STATUS POLLING ----------
  startAutoPolling(normalized.orderId);
}








function handleNewDataMartOrder(returnedOrder) {
  if (!returnedOrder) return;

  const orderId = String(
    returnedOrder.orderId ||
    returnedOrder.purchaseId ||
    returnedOrder.providerOrderReference ||
    returnedOrder.orderReference ||
    returnedOrder.reference ||
    returnedOrder.paymentReference ||
    ""
  );

  if (!orderId) {
    console.error(
      " Order cannot be displayed because its ID is missing:",
      returnedOrder
    );
    return;
  }

  const costPrice = Number(
    returnedOrder.costPrice ??
    returnedOrder.providerPrice ??
    returnedOrder.price ??
    0
  );

const normalized = {
// Public EcoData order ID, e.g. ED-2CD34.
orderId,

// Full DataMart reference used for provider status checks,
// e.g. GN-AB12CD34.
providerOrderReference: String(
returnedOrder.providerOrderReference ||
returnedOrder.orderReference ||
returnedOrder.reference ||
""
).trim(),

// existing reference field for compatibility.
reference: String(
returnedOrder.reference ||
returnedOrder.orderReference ||
returnedOrder.providerOrderReference ||
orderId
),

paymentReference:
returnedOrder.paymentReference || null,

status: String(
returnedOrder.status ||
returnedOrder.orderStatus ||
"processing"
).toLowerCase(),

recipient:
returnedOrder.recipient ||
returnedOrder.phoneNumber ||
returnedOrder.phone ||
returnedOrder.items?.[0]?.recipient ||
"-",

amount: Number(
returnedOrder.amount ??
selectedBundle?.price ??
0
),

costPrice,

profit: Number(
returnedOrder.profit ??
(
Number(
returnedOrder.amount ??
selectedBundle?.price ??
0
) - costPrice
)
),

network:
returnedOrder.network ||
selectedBundle?.network ||
"-",

volume: Number(
returnedOrder.volume ??
returnedOrder.capacity ??
returnedOrder.capacityGb ??
returnedOrder.size ??
selectedBundle?.size ??
0
),

dataValue: String(
returnedOrder.dataValue ??
selectedBundle?.dataValue ??
""
),

source: "web",
provider: "datamart",
createdAt: returnedOrder.createdAt || Date.now()
};

  localStorage.setItem(
    "lastDataMartOrderReference",
    normalized.orderId
  );

  // Persist and update the live table.
  saveLiveOrder(normalized);
  renderLiveOrderRow(normalized);
  createOrUpdateStatusCard(normalized);

 if(normalized.providerOrderReference){
  startDataMartAutoPolling(normalized.providerOrderReference);
 } else{
  console.error("Cannot poll live status: provider reference is missing.", 
    normalized.orderId
  )
 }

  console.log("DataMart live order normalized:", normalized);
}






const dataMartPollingTimers = new Map();

function startDataMartAutoPolling(providerReference) {
  if (!providerReference) return;

  const reference = String(providerReference);

  // Prevent duplicate polling loops.
  if (dataMartPollingTimers.has(reference)) return;

  let stopped = false;
  let requestInProgress = false;
  let timer = null;

  const terminalStatuses = [
    "completed",
    "delivered",
    "success",
    "successful",
    "failed",
    "cancelled",
    "canceled",
    "refunded"
  ];

  async function checkStatus() {
    if (stopped || requestInProgress) return;

    requestInProgress = true;

    try {
      const response = await fetch(
        `${API_BASE}/api/datamart/order-status/${encodeURIComponent(reference)}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store"
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.warn(
          "DataMart status check failed:",
          result.message || response.status
        );
        return;
      }

      const orderData = result.order || result.data || {};

      const rawStatus = String(
        orderData.status ||
        orderData.orderStatus ||
        "processing"
      ).trim().toLowerCase();

      const statusMap = {
        completed: "completed",
        delivered: "completed",
        success: "completed",
        successful: "completed",
        failed: "failed",
        cancelled: "failed",
        canceled: "failed",
        refunded: "refunded",
        waiting: "processing",
        pending: "processing",
        processing: "processing",
        in_progress: "processing",
        "in progress": "processing"
      };

      const status = statusMap[rawStatus] || rawStatus;

      // Read the current saved order.
      const orders = JSON.parse(
        localStorage.getItem(LIVE_ORDERS_KEY) || "[]"
      );

      const index = orders.findIndex(order =>
        String(order.orderId) === reference &&
        String(order.provider || "swiftdata").toLowerCase() === "datamart"
      );

      if (index === -1) {
        console.warn(
          "DataMart order is not in ecoLiveOrders:",
          reference
        );

        stopPolling();
        return;
      }

      const currentOrder = orders[index];

      // Never downgrade a terminal status from saved local data.
      const currentIsTerminal =
        terminalStatuses.includes(
          String(currentOrder.status || "").toLowerCase()
        );

      if (currentIsTerminal) {
        stopPolling();
        return;
      }

      const updatedOrder = {
        ...currentOrder,
        status,
        updatedAt: Date.now(),
        provider: "datamart"
      };

      // Preserve createdAt and timestamp.
      orders[index] = updatedOrder;

      localStorage.setItem(
        LIVE_ORDERS_KEY,
        JSON.stringify(orders)
      );

      // Refresh the existing UI.
      renderLiveOrderRow(updatedOrder);
      createOrUpdateStatusCard(updatedOrder);

      updatePendingCard();
      loadActiveBadge();

      console.log(
        "DataMart live status:",
        reference,
        status
      );

      if (terminalStatuses.includes(status)) {
        stopPolling();
      }
    } catch (error) {
      console.error("DataMart polling error:", error);
    } finally {
      requestInProgress = false;
    }
  }

  function stopPolling() {
    stopped = true;

    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }

    dataMartPollingTimers.delete(reference);
  }

  // Check immediately, then every 10 seconds.
  checkStatus();

  timer = setInterval(checkStatus, 10000);

  dataMartPollingTimers.set(reference, stopPolling);
}



const LIVE_ORDERS_KEY = "ecoLiveOrders";
const MAX_LIVE_ORDERS = 1000;

function saveLiveOrder(order) {
  if (!order || !order.orderId) {
    console.error("Cannot save live order: missing orderId.", order);
    return false;
  }

  const normalizedOrder = {
    ...order,
    orderId: String(order.orderId),
    provider: String(order.provider || "swiftdata").toLowerCase()
  };

  let existing = [];

  try {
    const stored = localStorage.getItem(LIVE_ORDERS_KEY);
    const parsed = stored ? JSON.parse(stored) : [];

    existing = Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Could not read saved live orders:", error);
    existing = [];
  }

  const index = existing.findIndex(item =>
    String(item.orderId) === normalizedOrder.orderId &&
    String(item.provider || "swiftdata").toLowerCase() ===
      normalizedOrder.provider
  );

  if (index !== -1) {
    const current = existing[index];
    const currentIsTerminal = isTerminalStatus(current.status);

    existing[index] = {
      ...current,
      ...normalizedOrder,
      status: currentIsTerminal
        ? current.status
        : normalizedOrder.status,
      createdAt: current.createdAt || Date.now(),
      timestamp: current.timestamp || Date.now(),
      updatedAt: normalizedOrder.updatedAt || current.updatedAt
    };
  } else {
    existing.unshift({
      ...normalizedOrder,
      createdAt: normalizedOrder.createdAt || Date.now(),
      timestamp: normalizedOrder.timestamp || Date.now(),
      updatedAt: normalizedOrder.updatedAt || Date.now()
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

  updatePendingCard();
  loadActiveBadge();

  return true;
}

// ends


// =========================
// RENDER LIVE ORDER ROW
// =========================
function renderLiveOrderRow(order) {
  if (!order || !order.orderId) {
    console.error("Cannot render live order: missing orderId.", order);
    return;
  }

  const tableBody = document.getElementById("liveOrderRows");
  if (!tableBody) return;

  // =========================
  // NORMALIZE ORDER
  // =========================
  const normalized = {
    ...order,
    orderId: String(order.orderId),
    provider: String(order.provider || "swiftdata").toLowerCase(),
    recipient: order.recipient || "-",
    volume: order.volume ?? 0,
    status: order.status || "processing"
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
      year: "numeric"
    });

    const timePart = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }).toUpperCase();

    return `${datePart} ${timePart}`;
  }

  // Structure created date
  const date = formatOrderDate(
    normalized.createdAt || normalized.timestamp
  );

  // Structure updated date
  const update = formatOrderDate(normalized.updatedAt);

  // =========================
  // DEBUG LOGS
  // =========================
  console.log("Live order:", normalized);
  console.log("createdAt:", normalized.createdAt);
  console.log("updatedAt:", normalized.updatedAt);
  console.log("timestamp:", normalized.timestamp);

  // =========================
  // FIND EXISTING ROW
  // Match order ID + provider
  // =========================
  let row = Array.from(
    tableBody.querySelectorAll(".live-row")
  ).find(item =>
    item.dataset.id === normalized.orderId &&
    String(item.dataset.provider || "swiftdata").toLowerCase() ===
      normalized.provider
  );

  const isNewRow = !row;

  if (!row) {
    row = document.createElement("div");
    row.className = "live-row";
    row.dataset.id = normalized.orderId;
    row.dataset.provider = normalized.provider;
  }

  // =========================
  // BUILD ROW
  // Preserve your existing seven-column design
  // =========================
  row.replaceChildren();

  function addCell(value, className = "") {
    const span = document.createElement("span");

    if (className) span.className = className;

    span.textContent = String(value ?? "-");
    row.appendChild(span);

    return span;
  }

  // Order ID
  addCell(normalized.orderId);

  // Recipient
  addCell(normalized.recipient);

  // Data volume
  addCell(`${normalized.volume}GB`);

  // Status
  const statusCell = addCell("", "status-cell");
  const badge = document.createElement("span");

  badge.className =
    `status-badge ${getStatusClass(normalized.status)}`;

 // =========================
  // STATUS BADGE WITH REMIX ICON
  // =========================
 

  badge.className =
    `status-badge ${getStatusClass(normalized.status)}`;

  // Render the Remix Icon HTML returned by getStatusIcon()
  const iconContainer = document.createElement("span");
  iconContainer.innerHTML = getStatusIcon(normalized.status);

  badge.appendChild(iconContainer.firstElementChild);

  // Status text
  const statusText = document.createElement("span");
  statusText.textContent = normalized.status;

  badge.appendChild(statusText);
  statusCell.appendChild(badge);



  badge.appendChild(statusText);
  statusCell.appendChild(badge);

  // Network
  addCell(getNetwork(normalized));

  // Payment
  addCell("Yes");

  // Created date
  addCell(date);

  // =========================
  // INSERT NEWEST ROW AT TOP
  // =========================
  if (isNewRow || tableBody.firstElementChild !== row) {
    tableBody.appendChild(row);
  }

  console.log("Live order row rendered:", {
    orderId: normalized.orderId,
    provider: normalized.provider,
    status: normalized.status,
    createdDate: date,
    updatedDate: update
  });
}
console.log(JSON.parse(localStorage.getItem("ecoLiveOrders")));


// ---------- LIVE ORDER CARD ---------



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

// checks if status is terminal
function isTerminalStatus(status) {
  const s = (status || "").toLowerCase();
  return [
    "delivered",
    "completed",
    "success",
    "failed",
    "cancelled",
    "refunded",
    "resolved"].includes(s);
}

// ---------- POLLING FUNCTION ----------
async function checkOrderStatusOnce(orderIdOrRef) {
  try {
    // Talk to backend (not directly )
    const res = await fetch(`${API_BASE}/api/v1/order/status/${encodeURIComponent(orderIdOrRef)}`,{
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });


    if (!res.ok) {
      console.warn("Status endpoint returned non-200", res.status);
      return null;
    }
    const data = await res.json();
    if (data && data.success && data.order) return data.order;
    return null;
  } catch (err) {
    console.error("Error checking order status:", err);
    return null;
}
}






// ---------- UPDATE HOME TOTALS ----------


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

  return orders.filter(order => {

    if (!order.createdAt) return false;

    const date = new Date(order.createdAt);

    if (isNaN(date.getTime())) return false;

    return (
      date.getFullYear() === year &&
      date.getMonth() === month
    );
  });
}



function getOrderStatus(order) {
  return String(order.status || "pending").toLowerCase();
}


function isPendingOrder(order) {
  return getOrderStatus(order) === "pending";
}


function isCompletedOrder(order) {
  return getOrderStatus(order) === "delivered";
}


function calculateOrderData(orders) {

  return orders.reduce((total, order) => {

    const volume = Number(
      String(order.volume || "")
        .replace(/GB/gi, "")
        .trim()
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
  isData = false
) {
  const element = document.getElementById(elementId);

  if (!element) return;

  current = Number(current) || 0;
  previous = Number(previous) || 0;

  const change = calculatePercentageChange(
    current,
    previous
  );

  const percentage = Math.abs(change).toFixed(1);

  let icon = "ri-arrow-right-line";
  let state = "neutral";
  let directionText = "No change";

  if (change > 0) {
    icon = "ri-arrow-right-up-line";

    state = lowerIsBetter
      ? "decrease"
      : "increase";

    directionText = "higher";

  } else if (change < 0) {
    icon = "ri-arrow-right-down-line";

    state = lowerIsBetter
      ? "increase"
      : "decrease";

    directionText = "lower";
  }


  // Format the comparison values
  const currentDisplay = isData
    ? formatDataSize(current)
    : current.toLocaleString();

  const previousDisplay = isData
    ? formatDataSize(previous)
    : previous.toLocaleString();


  element.className =
    `card-performance ${state}`;


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












function renderPendingPerformance(pendingCount, totalOrders){
  const element = 
  document.getElementById("pendingPerformance");

  if(!element) return;

  const percentage =
  totalOrders > 0
  ? (pendingCount / totalOrders) * 100
  : 0

  const percentageText =
  percentage.toFixed(1);

  const isGood = percentage <= 50;
  const arrowIcon =
  isGood
  ? "ri-arrow-right-down-line"
  : "ri-arrow-right-up-line";

  const percentageColor =
  isGood
  ? "#159570"
  : "#e05252";

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

  const ordersEl =
    document.getElementById("totalOrders");

  const gbEl =
    document.getElementById("totalGB");

  const pendingEl =
    document.getElementById("pendingTotal");

  const completedEl =
    document.getElementById("completedOrders");


  const orders =
    JSON.parse(
      localStorage.getItem(LIVE_ORDERS_KEY)
    ) || [];


  if (!ordersEl || !gbEl) return;


  // ==========================================
  // ALL-TIME TOTALS
  // ==========================================

  ordersEl.textContent = orders.length;


  // Your existing all-time data total
  gbEl.textContent =
    formatDataSize(ecoTotals.gb);


  // ==========================================
  // CURRENT TOTAL STATUS
  // ==========================================

  const pendingOrders =
    orders.filter(isPendingOrder);

  const completedOrders =
    orders.filter(isCompletedOrder);

  // ==========================================
  //  SAVE DOM TEXT

  if(pendingEl){
    setDashboardText(
    "pendingTotal",
    pendingOrders.length
  )
}



 if(completedEl){
    setDashboardText(
    "pendingTotal",
     completedOrders.length
  )
}


 


  // ==========================================
  // CURRENT MONTH
  // ==========================================

  const now = new Date();

  const currentMonthOrders =
    getOrdersForMonth(
      orders,
      now.getFullYear(),
      now.getMonth()
    );


  // ==========================================
  // PREVIOUS MONTH
  // ==========================================

  const previousMonthDate =
    new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

  const previousMonthOrders =
    getOrdersForMonth(
      orders,
      previousMonthDate.getFullYear(),
      previousMonthDate.getMonth()
    );


  // ==========================================
  // TOTAL ORDERS PERFORMANCE
  // ==========================================

  renderCardPerformance(
    "ordersPerformance",

    currentMonthOrders.length,

    previousMonthOrders.length
  );


  // ==========================================
  // TOTAL DATA PERFORMANCE
  // ==========================================

  const currentMonthGB =
    calculateOrderData(
      currentMonthOrders
    );

  const previousMonthGB =
    calculateOrderData(
      previousMonthOrders
    );


  renderCardPerformance(
    "dataPerformance",

    currentMonthGB,

    previousMonthGB,
    false,
    true
  );


  // ==========================================
  // PENDING ORDERS PERFORMANCE
  // ==========================================

  const currentPending =
    currentMonthOrders.filter(
      isPendingOrder
    ).length;

  const currentTotalOrders =
  currentMonthOrders.length;

  renderPendingPerformance(
    currentPending,  // pendingCount
    currentTotalOrders  // totalOrders
  );



  // ==========================================
  // COMPLETED ORDERS PERFORMANCE
  // ==========================================

  const currentCompleted =
    currentMonthOrders.filter(
      isCompletedOrder
    ).length;

  const previousCompleted =
    previousMonthOrders.filter(
      isCompletedOrder
    ).length;


  renderCardPerformance(
    "completedPerformance",

    currentCompleted,

    previousCompleted
  );
}






//========================
// FORMAT TOTAL GB end
//========================

// Load totals on page refresh
document.addEventListener("DOMContentLoaded", () => {
  
  ecoTotals = JSON.parse(localStorage.getItem("ecoTotals")) || ecoTotals;
  renderHomepageTotals();
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
  updateLiveOrderCard(order);      // persistent

  // Resume polling
  startAutoPolling(lastOrderId);
});


// lIVE ORDER ENDS







function startAutoPolling(orderIdOrRef) {
  // Stop any existing polling first
  stopStatusPolling();

  const statusResult = document.getElementById("statusResult");
  if (statusResult) statusResult.innerHTML = "";

  // Initial immediate check for this specific order
  (async () => {
    if (!orderIdOrRef) return;
    const order = await checkOrderStatusOnce(orderIdOrRef);
    if (order) {
      createOrUpdateStatusCard(order); // popup card
      updateLiveOrderCard(order);      // table row
      updateStatusBadge(order.status || "pending");
      saveLiveOrder(order);            // persist status
    }
  })();

  // Poll all stored orders for updates (except terminal)
  _statusPollTimer = setInterval(async () => {
    const orders = getStoredOrders();
    for (let order of orders) {
      if (isTerminalStatus(order.status)) continue; // skip delivered/failed
      const latest = await checkOrderStatusOnce(order.orderId);
      if (!latest) continue;

      saveLiveOrder(latest);           // merge status
      renderLiveOrderRow(latest);      // update table
      if (orderIdOrRef === latest.orderId) {
        createOrUpdateStatusCard(latest);  // popup card only for this order
        updateStatusBadge(latest.status || "pending");
      }
    }
  }, STATUS_POLL_INTERVAL);
}





// ---------- AFTER PURCHASE: show and poll ----------
// Load live orders on page refresh

function loadLiveOrders() {
  const tableBody = document.getElementById("liveOrderRows");
  if (!tableBody) return;


  const orders =
    JSON.parse(localStorage.getItem(LIVE_ORDERS_KEY)) || [];


  const empty = tableBody.querySelector(".empty-state");
  if (empty) empty.remove();

  orders
    .sort((a, b) => {
      return (b.timestamp || b.createdAt) - (a.timestamp || a.createdAt);
    })
    .forEach(renderLiveOrderRow);

  if (!orders.length) {
    tableBody.innerHTML = `<p class="empty-state">No recent orders yet</p>`;
  }
}


// FUNCTION GET NETWORK PREFIX
function getNetwork(order) {

  console.log("======== GET NETWORK ========");
  console.log("Order:", order);

  // Already saved?
  if (
    order.network &&
    order.network !== "-" &&
    order.network !== "UNKNOWN"
  ) {
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

    case "cancelled":
      return `<i class="ri-close-circle-line status-icon"></i>`;

    default:
      return `<i class="ri-information-line status-icon"></i>`;
  }
}


// ===========================
// FUNCTION LOAD ACTIVE BADGE
// ==========================

 function loadActiveBadge(){
  const orders = 
  JSON.parse(localStorage.getItem(LIVE_ORDERS_KEY)) || [];

  const activeOrderCount = orders.filter(ord => 
    ord.status === "pending" || 
    ord.status === "processing");

    const activeBag = document.getElementById("activeBadge");

  if(activeOrderCount.length === 0){
    activeBag.style.display = "none";
    unActivateTrackers();
    return;
  }

  
  activeBag.style.display = "flex";

  activeBag.textContent = activeOrderCount.length;
  activateTrackers();
}


// ================================
// FUNCTION LOAD ACTIVE BADGE ENDS
// ================================



// ---------- LIVE ORDERS PERSISTENCE ----------




function getOrderStats() {
  const orders = JSON.parse(localStorage.getItem(LIVE_ORDERS_KEY)) || [];


  const completedStatuses = ["delivered", "completed", "success","cancelled", "failed"];


  return {
    pending: orders.filter(o => (o.status || "").toLowerCase() === "pending").length,


    completed: orders.filter(o => completedStatuses.includes(o.status?.toLowerCase())).length
  };

}







function updateLiveOrderStatus(orderId, newStatus) {
  if (!orderId || !newStatus) return;

  const orders = getStoredOrders();

  const index = orders.findIndex(
    o => o.orderId === orderId
  );

  if (index === -1) return;

  const currentStatus =
    orders[index].status || "pending";

  // Prevent status downgrade
  if (
    STATUS_PRIORITY[newStatus] <
    STATUS_PRIORITY[currentStatus]
  ) {
    console.warn(
      `Blocked downgrade: ${currentStatus} → ${newStatus}`
    );

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
      currentStatus !== newStatus
        ? Date.now()
        : orders[index].updatedAt,

    deliveredAt:
      nowDelivered
        ? (
            orders[index].deliveredAt ||
            Date.now()
          )
        : orders[index].deliveredAt
  };

  localStorage.setItem(
    LIVE_ORDERS_KEY,
    JSON.stringify(orders)
  );

  // ONLY increment once when the order first becomes completed
  if (
    !wasDelivered &&
    nowDelivered
  ) {
    let completedTotal =
      parseInt(
        localStorage.getItem(
          "ecoCompletedTotal"
        )
      ) || 0;

    completedTotal++;

    localStorage.setItem(
      "ecoCompletedTotal",
      completedTotal
    );
  }

  updatePendingCard();

  // Recovery
  syncCompletedIfMismatch();
}






function updatePendingCard() {
  const stats = getOrderStats();

  // pending from storage
 const pendingEl = document.getElementById("pendingTotal");
  if(pendingEl) pendingEl.textContent = stats.pending;
 


  const completedEl = document.getElementById("completedOrders");

    // read from permanent storage
    const completedTotal =
  parseInt(localStorage.getItem("ecoCompletedTotal")) || 0;

  if(completedEl) completedEl.textContent = completedTotal;
}






// AUTO FIX WHEN MISMATCH
function syncCompletedIfMismatch() {
  const orders =
    JSON.parse(localStorage.getItem(LIVE_ORDERS_KEY)) || [];

  const completedStatuses = ["delivered", "completed", "success", "cancelled", "failed"];



  const realCompleted = orders.filter(o =>
    completedStatuses.includes(o.status?.toLowerCase())
  ).length;

  let storedCompleted =
    parseInt(localStorage.getItem("ecoCompletedTotal")) || 0;

  // 🔥 FIX BOTH DIRECTIONS (not just <)
  if (storedCompleted !== realCompleted) {
    localStorage.setItem("ecoCompletedTotal", realCompleted);

    console.warn(
      `Completed count corrected: ${storedCompleted} → ${realCompleted}`
    );
  }
}




// INITIALIZE ON PAGE LOAD (ONCE)
function initializeCompletedCount() {
 const storedTotal = localStorage.getItem("ecoCompletedTotal");

 // IF ALREADY EXIST RETURN
 if(storedTotal !== null) return;


const orders = JSON.parse(localStorage.getItem(LIVE_ORDERS_KEY)) || [];


  const deliveredCount = orders.filter(o =>
    ["delivered", "completed", "success", "cancelled", "failed"].includes(
      o.status?.toLowerCase()
    )
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
  failed: 4
};

function getStoredOrders() {
  const orders =
    JSON.parse(localStorage.getItem(LIVE_ORDERS_KEY) || "[]");

  return orders .sort((a, b) => b.timestamp - a.timestamp);
}



// ends

function pollOrderStatus(orderId) {
  fetch(`check-status/${orderId}`)
  .then(res => res.json())
  .then(data => {
    if (data.status) {
      updateLiveOrderStatus(orderId, data.status);
      loadLiveOrders(); // refresh ui
    }
  })
  .catch(err => console.error(err));
}
//ends

// ---------- LIVE ORDERS PERSISTENCE ----------
document.addEventListener("DOMContentLoaded", () => {
  // single entry point for rendering
  loadLiveOrders();

// background updates (if polling)
  startAutoPolling();

  // Read delivered orders from HISTORY
  initializeCompletedCount();

  // Auto fix
  syncCompletedIfMismatch();

// updatePendingOrders
  updatePendingCard();

  // load nav badge
  loadActiveBadge();
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

mtnScrollBtn.addEventListener("click", () =>{
  if (mtnScrollSection) {
    mtnScrollSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
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
    block: "start"
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
      block: "start"
    });
  }
});




//========================================
// ADD ORDER TO LEADERBOARD
//========================================

function addOrderToLeaderboard(customers, order) {

    const phone =
        String(order.recipient || "").trim();

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

            manualUpdatedAt: 0

        };

    }


    const customer =
        customers[phone];

    const isAdminLeaderboard =
    order.LD_Status === "leaderboard" ||
    order.status === "leaderboard";


    


    //========================================
    // NORMAL CUSTOMER ORDER
    //========================================

    if(!isAdminLeaderboard){
    const gb =
        Number(order.volume || 0);

    const amount =
        Number(order.amount || 0);


    customer.totalGB += gb;

    customer.totalOrders++;

    customer.totalSpent += amount;

    }

    //========================================
    // CHECK MANUAL POINTS FROM ADMIN
    //========================================

    const hasManualPoints =
        order.manualPoints !== undefined &&
        order.manualPoints !== null;


    if (hasManualPoints) {

        const manualValue =
            Number(order.manualPoints);


        //====================================
        // MANUAL UPDATE TIME
        //====================================

        const manualTime =
            order.manualUpdatedAt?.toDate
                ? order.manualUpdatedAt
                    .toDate()
                    .getTime()
                : new Date(
                    order.manualUpdatedAt || 0
                  ).getTime();


        //====================================
        // NEWEST MANUAL ASSIGNMENT WINS
        //====================================

        if (
            !customer.manualOverride ||
            manualTime >
            customer.manualUpdatedAt
        ) {

            customer.manualOverride = true;

            customer.manualPoints =
                manualValue;

            customer.manualUpdatedAt =
                manualTime;

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

  const q =
    query(collection(db, "orders"));


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

      const previousMonthStart =
        new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1,
          0,
          0,
          0,
          0
        );


      //========================================
      // PREVIOUS MONTH END
      //========================================

      const previousMonthEnd =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          0,
          23,
          59,
          59,
          999
        );

      //========================================
      // READ ALL ORDERS ONCE
      //========================================

      snapshot.forEach(doc => {

        const order = doc.data();


        //========================================
        // IGNORE FAILED / CANCELLED
        //========================================

        const status =
          String(order.status || "")
            .toLowerCase();


        if (
          status === "failed" ||
          status === "cancelled"
        ) {
          return;
        }

        
        const isAdminLeaderboard =
        order.LD_Status === "leaderboard";
        if(!isAdminLeaderboard && 
          (order.status === "failed" ||
            order.status === "cancelled"
          )
        ) { return;}





        //========================================
        // ORDER DATE
        //========================================

        const orderDate =
          order.createdAt?.toDate
            ? order.createdAt.toDate()
            : new Date(order.createdAt);


        if (
          isNaN(orderDate.getTime())
        ) {
          return;
        }


        //========================================
        // CUSTOMER PHONE
        //========================================

        const phone =
          String(
            order.recipient || ""
          ).trim();


        if (!phone) return;


        //========================================
        // PREVIOUS MONTH
        //========================================

        if (
          orderDate >= previousMonthStart &&
          orderDate <= previousMonthEnd
        ) {

          addOrderToLeaderboard(
            previousCustomers,
            order
          );

        }


        //========================================
        // CURRENT GIVEAWAY
        //========================================

        if (
          orderDate >= LEADERBOARD_START &&
          orderDate <= LEADERBOARD_ENDS
        ) {

          addOrderToLeaderboard(
            currentCustomers,
            order
          );

        }

      });


      finalizeLeaderboardPoints(currentCustomers);

      finalizeLeaderboardPoints(previousCustomers);

      //========================================
      // SORT CURRENT MONTH
      //========================================

      const currentLeaders =
        Object.values(currentCustomers)
          .sort(sortLeaderboard)
          .slice(0, 9);


      //========================================
      // SORT PREVIOUS MONTH
      //========================================

      const previousWinners =
        Object.values(previousCustomers)
          .sort(sortLeaderboard)
          .slice(0, 3);


      //========================================
      // UPDATE NORMAL LEADERBOARD
      //========================================

      renderLeaderboard(
        currentLeaders
      );


      //========================================
      // UPDATE CELEBRATION
      // WITH LAST MONTH'S TOP 3
      //========================================

      updateWinnerCelebration(
        previousWinners
      );


      //========================================
      // DEBUG
      //========================================

      console.log(
        "🏆 Current Month Leaders:",
        currentLeaders
      );


      console.log(
        "🎉 Previous Month Winners:",
        previousWinners
      );

    },


    (error) => {

      console.error(
        "Leaderboard listener error:",
        error
      );

    }

  );

}



//=========================
// FINALIZE POINTS
//=========================
function finalizeLeaderboardPoints(customers){

Object.values(customers).forEach(customer => {
if (customer.manualOverride){
// Admin-assigned points
customer.points =
customer.manualPoints;

} else{
// Normal calculation
// 1GB = 6 POINTS
customer.points =
customer.totalGB * 6;
}


});
}

//========================================
// SORT LEADERBOARD
//========================================

function sortLeaderboard(a, b) {

  // Highest points first

  if (
    b.points !== a.points
  ) {

    return (
      b.points -
      a.points
    );

  }


  // Tie breaker:
  // Highest GB first

  return (
    b.totalGB -
    a.totalGB
  );

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

    document
      .querySelectorAll(`#leaderPhone${i}`)
      .forEach(el => {
        el.textContent = "---";
      });

    document
      .querySelectorAll(`#leaderPoints${i}`)
      .forEach(el => {
        el.textContent = "0 points";
      });

    document
      .querySelectorAll(`#leaderStars${i}`)
      .forEach(el => {
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
    document
      .querySelectorAll(`#leaderPhone${i}`)
      .forEach(el => {

        el.textContent =
          maskPhone(leader.phone);

      });


    document
      .querySelectorAll(`#leaderPoints${i}`)
      .forEach(el => {

        el.textContent =
          Number(leader.points || 0) +
          " points";

      });


    document
      .querySelectorAll(`#leaderStars${i}`)
      .forEach(el => {

        el.innerHTML =
          getStars(i);

      });

  });

}


//=================
// HIDE PHONE
//=================
function maskPhone(phone){

    if(!phone) return "Unknown";

    return phone.substring(0,5) + "***" + phone.substring(8);

}


//==============
// GET STARS
//==============
function getStars(rank){

    let stars="";

    for(let i=0;i<6-rank;i++){

        stars += `<i class="ri-star-fill"></i>`;

    }

    return stars;

}


loadLeaderboard();
resetGiveAwayHtml();

// RESET GIVEAWAY TIMER HTML
function resetGiveAwayHtml(){
  //TIME
const defaultHtml = document.getElementById("leaderboardStartText");

const leaderboardResetText = document.getElementById("leaderboardResetText");



if(!defaultHtml) return;


const now = new
Date();


// Competition has ended
if(now >= LEADERBOARD_ENDS){

  defaultHtml.textContent = 
  `Free GB GIVEAWAY: ${leaderboardStartText} - ${endTimeText} ends.`
} else {
  defaultHtml.textContent =
  `Free GB GIVEAWAY: ${leaderboardStartText} - ${endTimeText}`
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

  const topThree =
    winners.slice(0, 3);


  for (
    let i = 1;
    i <= 3;
    i++
  ) {

    const winner =
      topThree[i - 1];


    const phoneElement =
      document.getElementById(
        `celebrationWinner${i}`
      );


    const pointsElement =
      document.getElementById(
        `celebrationPoints${i}`
      );


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

      phoneElement.textContent =
        maskPhone(
          winner.phone
        );

    }


    //======================================
    // POINTS
    //======================================

    if (pointsElement) {

      pointsElement.textContent =
        Number(
          winner.points || 0
        ) + " points";

    }

  }


  console.log(
    "🎉 Celebration Top 3:",
    topThree
  );

}




//========================================
// ACTUAL GIVEAWAY DATES
//========================================

const GIVEAWAY_END_DATE =
    new Date("2026-10-31T23:59:59");

const CELEBRATION_START =
    new Date("2026-11-01T00:00:00");

const CELEBRATION_END =
    new Date("2026-11-01T23:59:59");


//========================================
// GIVEAWAY CELEBRATION DATE
//========================================

let celebrationDismissed = false;

document.addEventListener("DOMContentLoaded", ()=> {
 //========================================
// WINNER CELEBRATION SYSTEM
//========================================

const winnerCelebration =
    document.getElementById(
        "winnerCelebration"
    );

const fireworksCanvas =
    document.getElementById(
        "fireworksCanvas"
    );

const confettiCanvas =
    document.getElementById(
        "confettiCanvas"
    );

const winnerCloseBtn =
    document.getElementById(
        "winnerCloseBtn"
    );


const fireworksCtx =
    fireworksCanvas.getContext("2d");

const confettiCtx =
    confettiCanvas.getContext("2d");


//========================================
// CANVAS SIZE
//========================================

function resizeCelebrationCanvas() {

    fireworksCanvas.width =
        window.innerWidth;

    fireworksCanvas.height =
        window.innerHeight;


    confettiCanvas.width =
        window.innerWidth;

    confettiCanvas.height =
        window.innerHeight;

}


resizeCelebrationCanvas();


window.addEventListener(
    "resize",
    resizeCelebrationCanvas
);


//========================================
// FIREWORK PARTICLES
//========================================

let fireworks = [];

let fireworkRockets = [];


function createFirework(
    x,
    y
) {

    const particleCount =
        70 + Math.floor(
            Math.random() * 50
        );


    for (
        let i = 0;
        i < particleCount;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI *
            2;


        const speed =
            2 +
            Math.random() * 5;


        fireworks.push({

            x,
            y,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            life:
                1,

            decay:
                .012 +
                Math.random() * .018,

            size:
                1 +
                Math.random() * 2.5,

            hue:
                Math.floor(
                    Math.random() * 360
                )

        });

    }

}


//========================================
// FIREWORK ROCKET
//========================================

function launchFirework() {

    fireworkRockets.push({

        x:
            Math.random() *
            fireworksCanvas.width,

        y:
            fireworksCanvas.height,

        targetY:
            100 +
            Math.random() *
            (
                fireworksCanvas.height *
                .45
            ),

        speed:
            7 +
            Math.random() * 4

    });

}


//========================================
// UPDATE FIREWORKS
//========================================

function updateFireworks() {

    fireworksCtx.clearRect(
        0,
        0,
        fireworksCanvas.width,
        fireworksCanvas.height
    );


    //=============================
    // ROCKETS
    //=============================

    for (
        let i =
            fireworkRockets.length - 1;

        i >= 0;

        i--
    ) {

        const rocket =
            fireworkRockets[i];


        rocket.y -=
            rocket.speed;


        // Rocket glow

        fireworksCtx.beginPath();

        fireworksCtx.arc(
            rocket.x,
            rocket.y,
            3,
            0,
            Math.PI * 2
        );

        fireworksCtx.fillStyle =
            "#ffffff";

        fireworksCtx.shadowBlur =
            15;

        fireworksCtx.shadowColor =
            "#ffffff";

        fireworksCtx.fill();

        fireworksCtx.shadowBlur = 0;


        // Explosion

        if (
            rocket.y <=
            rocket.targetY
        ) {

            createFirework(
                rocket.x,
                rocket.y
            );

            fireworkRockets.splice(
                i,
                1
            );

        }

    }


    //=============================
    // PARTICLES
    //=============================

    for (
        let i =
            fireworks.length - 1;

        i >= 0;

        i--
    ) {

        const particle =
            fireworks[i];


        particle.x +=
            particle.vx;

        particle.y +=
            particle.vy;


        // Gravity

        particle.vy +=
            .045;


        particle.vx *=
            .985;


        particle.life -=
            particle.decay;


        if (
            particle.life <= 0
        ) {

            fireworks.splice(
                i,
                1
            );

            continue;

        }


        fireworksCtx.beginPath();


        fireworksCtx.arc(
            particle.x,
            particle.y,
            particle.size,
            0,
            Math.PI * 2
        );


        fireworksCtx.fillStyle =
            `hsla(
                ${particle.hue},
                100%,
                65%,
                ${particle.life}
            )`;


        fireworksCtx.shadowBlur =
            12;

        fireworksCtx.shadowColor =
            `hsl(
                ${particle.hue},
                100%,
                60%
            )`;


        fireworksCtx.fill();

        fireworksCtx.shadowBlur =
            0;

    }

}


//========================================
// CONFETTI
//========================================

let confetti = [];


function createConfetti() {

    confetti = [];


    const amount =
        Math.min(
            180,
            Math.floor(
                window.innerWidth / 5
            )
        );


    for (
        let i = 0;
        i < amount;
        i++
    ) {

        confetti.push({

            x:
                Math.random() *
                confettiCanvas.width,

            y:
                -Math.random() *
                confettiCanvas.height,

            width:
                5 +
                Math.random() * 7,

            height:
                8 +
                Math.random() * 12,

            speed:
                1 +
                Math.random() * 3,

            rotation:
                Math.random() *
                Math.PI *
                2,

            rotationSpeed:
                -.08 +
                Math.random() *
                .16,

            drift:
                -.5 +
                Math.random(),

            hue:
                Math.floor(
                    Math.random() * 360
                )

        });

    }

}


//========================================
// UPDATE CONFETTI
//========================================

function updateConfetti() {

    confettiCtx.clearRect(
        0,
        0,
        confettiCanvas.width,
        confettiCanvas.height
    );


    confetti.forEach(
        piece => {

            piece.y +=
                piece.speed;

            piece.x +=
                Math.sin(
                    piece.y * .02
                ) *
                piece.drift;

            piece.rotation +=
                piece.rotationSpeed;


            if (
                piece.y >
                confettiCanvas.height
            ) {

                piece.y = -20;

                piece.x =
                    Math.random() *
                    confettiCanvas.width;

            }


            confettiCtx.save();


            confettiCtx.translate(
                piece.x,
                piece.y
            );


            confettiCtx.rotate(
                piece.rotation
            );


            confettiCtx.fillStyle =
                `hsl(
                    ${piece.hue},
                    90%,
                    55%
                )`;


            confettiCtx.fillRect(
                -piece.width / 2,
                -piece.height / 2,
                piece.width,
                piece.height
            );


            confettiCtx.restore();

        }
    );

}

//========================================
// ANIMATION LOOP
//========================================

let celebrationAnimation;


function celebrationLoop() {

    updateFireworks();

    updateConfetti();

    celebrationAnimation =
        requestAnimationFrame(
            celebrationLoop
        );

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
    if (
        winnerCelebration.classList.contains(
            "active"
        )
    ) {
        return;
    }


    //========================================
    // SHOW WHOLE CONTAINER
    //========================================

    winnerCelebration.style.display =
        "flex";


    winnerCelebration.classList.add(
        "active"
    );


    //========================================
    // RESET ANIMATION
    //========================================

    fireworks = [];

    fireworkRockets = [];

    createConfetti();


    cancelAnimationFrame(
        celebrationAnimation
    );


    celebrationLoop();


    //========================================
    // FIRST FIREWORK
    //========================================

    launchFirework();


    //========================================
    // FIREWORK INTERVAL
    //========================================

    clearInterval(
        fireworkInterval
    );


    fireworkInterval =
        setInterval(() => {

            if (
                !winnerCelebration.classList.contains(
                    "active"
                )
            ) {

                clearInterval(
                    fireworkInterval
                );

                fireworkInterval = null;

                return;
            }


            launchFirework();


            // Sometimes launch two

            if (
                Math.random() > 0.55
            ) {

                setTimeout(
                    launchFirework,
                    250
                );

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

    winnerCelebration.style.display =
        "none";


    winnerCelebration.classList.remove(
        "active"
    );


    //========================================
    // STOP FIREWORKS
    //========================================

    clearInterval(
        fireworkInterval
    );

    fireworkInterval = null;


    //========================================
    // STOP ANIMATION
    //========================================

    cancelAnimationFrame(
        celebrationAnimation
    );


    //========================================
    // CLEAR PARTICLES
    //========================================

    fireworks = [];

    fireworkRockets = [];

    confetti = [];


    //========================================
    // CLEAR CANVASES
    //========================================

    fireworksCtx.clearRect(
        0,
        0,
        fireworksCanvas.width,
        fireworksCanvas.height
    );


    confettiCtx.clearRect(
        0,
        0,
        confettiCanvas.width,
        confettiCanvas.height
    );

}


if (winnerCloseBtn) {

    winnerCloseBtn.addEventListener(
        "click",
        closeWinnerCelebration
    );

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

    winnerCelebration.style.display =
        "none";


    winnerCelebration.classList.remove(
        "active"
    );


    //========================================
    // STOP FIREWORKS
    //========================================

    clearInterval(
        fireworkInterval
    );

    fireworkInterval = null;


    //========================================
    // STOP ANIMATION
    //========================================

    cancelAnimationFrame(
        celebrationAnimation
    );


    //========================================
    // CLEAR PARTICLES
    //========================================

    fireworks = [];

    fireworkRockets = [];

    confetti = [];


    //========================================
    // CLEAR CANVASES
    //========================================

    fireworksCtx.clearRect(
        0,
        0,
        fireworksCanvas.width,
        fireworksCanvas.height
    );


    confettiCtx.clearRect(
        0,
        0,
        confettiCanvas.width,
        confettiCanvas.height
    );

}


//========================================
// CHECK CELEBRATION TIME
//========================================

function checkGiveawayCelebration() {

    const now =
        new Date();


    if (
        now >= CELEBRATION_START &&
        now <= CELEBRATION_END
    ) {

        startWinnerCelebration();

    }
    else {

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

setInterval(
    checkGiveawayCelebration,
    1000
);


});
















// ============================================================
// LIVE ORDER STATUS SEARCH
// ============================================================

const LIVE_ORDER_STORAGE_KEY = "ecoDataLiveOrders";

const OrderSearchInput =
  document.getElementById("OrderSearchInput");

const searchStatBtn =
  document.getElementById("searchStatBtn");

const liveOrderResult =
  document.getElementById("liveOrderResult");

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

    const saved =
      localStorage.getItem(LIVE_ORDER_STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch (error) {

    console.error(
      "Failed to load live orders:",
      error
    );

    return [];
  }
}


function saveLiveOrders() {

  try {

    localStorage.setItem(
      LIVE_ORDER_STORAGE_KEY,
      JSON.stringify(liveOrders)
    );

  } catch (error) {

    console.error(
      "Failed to save live orders:",
      error
    );

  }
}


// ============================================================
// SEARCH ORDER
// ============================================================

async function searchLiveOrder() {

  const orderIdOrRef =
    OrderSearchInput.value.trim();


  if (!orderIdOrRef) {

    showLiveOrderMessage(
      "Enter an Order ID to search.",
      "error"
    );

    return;
  }


  // Prevent duplicate searches while loading
  searchStatBtn.disabled = true;

  searchStatBtn.textContent = "Searching...";


  showLiveOrderMessage(
    "Checking live order status...",
    "loading"
  );


  try {

    // --------------------------------------------------------
    // CALL YOUR NEW ROUTER
    // --------------------------------------------------------

    const response = await fetch(
      `/api/live-order-status/${encodeURIComponent(orderIdOrRef)}`
    );


    const returnedOrder =
      await response.json();


    // --------------------------------------------------------
    // CHECK RESPONSE
    // --------------------------------------------------------

    if (
      !response.ok ||
      !returnedOrder.success ||
      !returnedOrder.order
    ) {

      throw new Error(
        returnedOrder.message ||
        "Order not found."
      );
    }


    const order =
      returnedOrder.order;


    // --------------------------------------------------------
    // CHECK IF ORDER ALREADY EXISTS
    // --------------------------------------------------------

    const existingIndex =
      liveOrders.findIndex(
        item =>
          item.orderId === order.orderId
      );


    if (existingIndex !== -1) {

      // ------------------------------------------------------
      // UPDATE EXISTING ORDER
      // ------------------------------------------------------

      liveOrders[existingIndex] = {
        ...liveOrders[existingIndex],

        recipient:
          order.recipient ||
          liveOrders[existingIndex].recipient,

        size:
          order.size ??
          liveOrders[existingIndex].size,

        status:
          order.status ||
          liveOrders[existingIndex].status,

        timestamp:
          order.timestamp ||
          liveOrders[existingIndex].timestamp
      };

    } else {

      // ------------------------------------------------------
      // CREATE NEW ORDER
      // ------------------------------------------------------

      liveOrders.push({

        orderId:
          order.orderId,

        recipient:
          order.recipient || "—",

        size:
          order.size ?? "—",

        status:
          order.status || "unknown",

        timestamp:
          order.timestamp || null

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

    console.error(
      "Live order search error:",
      error
    );


    showLiveOrderMessage(
      error.message ||
      "Unable to retrieve order status.",
      "error"
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

  [...liveOrders]
  .reverse()
  .forEach(order => {

    const row =
      document.createElement("div");

    row.className = "live-row";

    row.dataset.orderId =
      order.orderId;


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

          ${escapeLiveOrderHTML(
            formatLiveStatus(order.status)
          )}

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
        `/api/live-order-status/${encodeURIComponent(order.orderId)}`
      );


      const returnedOrder =
        await response.json();


      if (
        !response.ok ||
        !returnedOrder.success ||
        !returnedOrder.order
      ) {

        continue;
      }


      const freshOrder =
        returnedOrder.order;


      // ------------------------------------------------------
      // FIND STORED ORDER
      // ------------------------------------------------------

      const index =
        liveOrders.findIndex(
          item =>
            item.orderId === order.orderId
        );


      if (index === -1) {
        continue;
      }


      // ------------------------------------------------------
      // UPDATE LIVE STATUS
      // ------------------------------------------------------

      liveOrders[index].status =
        freshOrder.status ||
        liveOrders[index].status;


      // ------------------------------------------------------
      // Keep latest timestamp if Swift provides it
      // ------------------------------------------------------

      if (freshOrder.timestamp) {

        liveOrders[index].timestamp =
          freshOrder.timestamp;

      }


      // Recipient can also be refreshed
      if (freshOrder.recipient) {

        liveOrders[index].recipient =
          freshOrder.recipient;

      }


      // Size can also be refreshed
      if (freshOrder.size !== undefined) {

        liveOrders[index].size =
          freshOrder.size;

      }


      // ------------------------------------------------------
      // UPDATE ONLY THE ROW
      // ------------------------------------------------------

      updateLiveOrderRow(
        liveOrders[index]
      );


    } catch (error) {

      console.error(
        `Failed to refresh ${order.orderId}:`,
        error
      );

    }

  }


  // Save latest statuses
  saveLiveOrders();

}


// ============================================================
// UPDATE ONE ROW WITHOUT REBUILDING THE TABLE
// ============================================================

function updateLiveOrderRow(order) {

  const row =
    liveOrderResult.querySelector(
      `.live-row[data-order-id="${CSS.escape(order.orderId)}"]`
    );


  if (!row) {
    return;
  }


  const statusCell =
    row.querySelector(".status-cell");


  if (statusCell) {

    statusCell.innerHTML = `

      <span
        class="live-status-pill ${getLiveStatusClass(order.status)}"
      >

        <span class="live-status-dot"></span>

        ${escapeLiveOrderHTML(
          formatLiveStatus(order.status)
        )}

      </span>

    `;

  }


  // Update recipient if changed
  const recipientCell =
    row.querySelector(".recipient-cell");

  if (recipientCell) {

    recipientCell.textContent =
      order.recipient || "—";

  }


  // Update size if changed
  const sizeCell =
    row.querySelector(".size-cell");

  if (sizeCell) {

    sizeCell.textContent =
      order.size ?? "—";

  }


  // Update timestamp
  const dateCell =
    row.querySelector(".date-cell");

  if (dateCell) {

    dateCell.textContent =
      formatLiveOrderDate(order.timestamp);

  }

}


// ============================================================
// STATUS CLASS
// ============================================================

function getLiveStatusClass(status) {

  const normalized =
    String(status || "")
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


  const value =
    String(status)
      .toLowerCase()
      .trim();


  return value.charAt(0).toUpperCase() +
         value.slice(1);

}


// ============================================================
// FORMAT DATE
// ============================================================

function formatLiveOrderDate(timestamp) {

  if (!timestamp) {
    return "—";
  }


  const date =
    new Date(timestamp);


  if (Number.isNaN(date.getTime())) {
    return "—";
  }


  return date.toLocaleString(
    undefined,
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  );

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

function showLiveOrderMessage(
  message,
  type = "error"
) {

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

  searchStatBtn.addEventListener(
    "click",
    searchLiveOrder
  );

}


// ============================================================
// ENTER KEY SEARCH
// ============================================================

if (OrderSearchInput) {

  OrderSearchInput.addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {

        event.preventDefault();

        searchLiveOrder();

      }

    }
  );

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
  while(true){
    try {
      await refreshLiveOrderStatuses();

    } catch(error){
      console.log("Live order polling error:", error
      );
    }

    // wait 30 seconds AFTER the current polling cycle finishes
    await new Promise(resolve => {
      setTimeout(resolve, 40000);
    }
  );
  }
}

document.addEventListener("DOMContentLoaded",()=> {
  // start polling
  startLiveOrderVendorPolling();
})
