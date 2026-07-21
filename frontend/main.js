// UPDATED AT 18th/July, 2026 [BACKUP MAIN.JS]


// --- Firebase Imports ---
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  collection,
  addDoc,
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



// ---------- GLOBAL VARIABLES ----------
let STATUS_POLL_INTERVAL = 5000;
let _statusPollTimer = null; // to hold the interval timer ID

// ---------- GLOBAL STATE ----------
let selectedBundle = null;      // used for UI selection (normal view)
let lastPurchasedBundle = null; // used after payment (normal + grid)

// default selectedPackage
let selectedPackageName = "mtn_data_normal_delivery";

const PACKAGE_MAP = {
  normal: "mtn_data_express_delivery",
  express: "mtn_data_express_delivery",
  numbers: "mtn_verified_numbers",
  mashup: "special_mashup_bundle_packages"
};

const STORAGE_KEY = "selected_mtn_package";




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
//  VALIDATE RECIPIENT 
//=================================
   async function validateRecipient(phone, offerSlug) {
    try {
      const response = await fetch("/api/validate-recipient", {
        method: "POST",
        headers: {
          "content-Type": "application/json"
        },
        body: JSON.stringify({
          phone,
          offerSlug
        })
      });

      return await response.json();

    }  catch(error){
      console.log("Validation Error", error);

      return {
        success: false,
        message: "Unable to verify recipient"
      }
   }
  }
//=================================
// VALIDATE RECIPIENT ENDS
//=================================




  function applyPackageUI(mode) {
  selectedPackageName = PACKAGE_MAP[mode];

  if(mode === "express" || "numbers"){


  mashTopRightContainerh2.textContent = "MTN Data Bundle";
  mashTopRightContainerSmall.textContent = "Purchase MTN data bundles for single or multiple recipients";
  mashTopRightContainerBtn.textContent = "16 Packages Available";

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

  mashTopRightContainerBtn.textContent = "16 Packages Available";

      // resize the dropdown container
    flexingContainer.style.height = "28rem";
    flexingContainer.style.margin = "-12rem";


  // title to
    mashTitle.textContent = "MTN DATA BUNDLE";

    // packs to
    mashPacks.textContent = "16 Packages Available";
   
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
  const gbHolder = document.querySelector(".placeHolderGB");
  if (gbHolder) gbHolder.textContent = "";

  const priceHolder = document.querySelector(".placeHolderPrice");
  if(priceHolder) priceHolder.textContent = "";

  const networkHolder = document.querySelector(".selectedModal-right");
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
  localStorage.removeItem(STORAGE_KEY) || "express";

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

// Select package
deliveryOptions.forEach(option => {
  option.addEventListener("click", (e) => {
    e.stopPropagation();

    const mode = option.dataset.mode;

  
    // RESET BUNDLE WHEN MODE CHANGED
    resetSelectedBundle("Offer changed please select bundle.");
    // save to localStorage
    localStorage.setItem(STORAGE_KEY, mode);
    applyPackageUI(mode);

    // ✅ SET GLOBAL PACKAGE NAME
    selectedPackageName = PACKAGE_MAP[mode];

    // Update button text
    selectBtn.innerHTML = `
      ${option.querySelector("span").textContent}
      <p class='doneSelect'> <img src="./css/icons/done (2).png" ></p>
      <p class='doneSelect darkM'> <img src="./css/icons/done (1).png" ></p>
      <span>     <img src="./css/icons/more.png.png"></span>
    `;

    dropdownOffer.classList.remove("show");
    deliveryOptions.forEach(o => 
      o.classList.remove("active"));
      option.classList.add("active");

    showSnackBar(" Offer Updated ", "info", 2000);
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

      button.addEventListener("click", () => {


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
          lastPurchasedBundle = bundle; // 🔑 SAVE FOR POST-PAYMENT

          //====================
          // VALIDATE ROUTING 
          //====================
          if(bundle.network === "mtn"){

            const validation = await
            validateRecipient("233"  + recipient.substring(1),
          "mtn_data_bundle"
        );

        if(!validation.success || !validation.eligible) {
          showSnackBar(
            validation.message || "Recipient is not eligible", "error", 4000
          );
          return;
        }
          }

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

          lastPurchasedBundle = bundle; // 🔑 SAVE FOR POST-PAYMENT

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
          document.getElementById("priceTag").textContent =
            `GHS₵ ${bundle.price}`;
          document.getElementById("networkTag").textContent =
            `${bundle.network.toUpperCase()} `;
          document.getElementById("sizeTag").textContent =
          `${bundle.dataValue}`;
          document.getElementById("netWorth").textContent = 
          `${bundle.network.toUpperCase()}`;
          document.getElementById("gbSize").textContent =
          `${bundle.dataValue.toUpperCase()}`;
          document.getElementById("amount").textContent = 
          `GHS₵ ${priceWithFee}`;
          document.getElementById("priceWithFee").textContent = `GHS₵ ${priceFee}`;



          // if(validate.success){proceed to payment}
          createPhoneModal(async inputNumber => {

            let formattedPhone = inputNumber.trim();
            // convert Ghana format (024xxxxxxxx) to 23324xxxxxxxxx
            if(formattedPhone.startsWith("0")){
              formattedPhone = "233" + formattedPhone.subString(1);
            }

            // Validate routing (number)
            if(bundle.network === "mtn") {

              const validation = await validateRecipient(
                formattedPhone,
                "mtn_data_bundle"
              );

              if(!validate.success || !validation.eligible){
                showSnackBar(validation.message || "Recipient is not eligible", "error"
                );
                return;
              }
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

 const secondTracker = document.getElementById("deliveryTracker2").style.display = 'flex';
};



// un activate trackers when no orders 
function unActivateTrackers(){
   const firstTracker = document.getElementById("deliveryTracker1").style.display = "flex";

 const secondTracker = document.getElementById("deliveryTracker2").style.display = 'flex';
}

//=================================
// ACTIVATE DELIVERY TRACKER ENDS
//=================================















//NEW UPDATED 21/01/2026 //
// === PAYSTACK PAYMENT (Firebase version) ===

async function payWithPaystack(bundle, recipient) {

  if(bundle.network?.toLowerCase() === "mtn") {
   showSnackBar("📱 MTN ORDER PAUSED, WE ARE IMPLEMENTING  PREMIUM SYSTEM TO IMPROVE DELIVERY. THANK YOU",   "success", 10000);
  return;
 }

  if(hasActiveOrder(recipient)){
    showSnackBar("❌ Number already has an active order", "warning", 4000
    );
    return; // STOP PAYMENT
    }

  const { network, packageName, size, price } = bundle;
  const payWithFee = Number((bundle.price * 1.0195).toFixed(2));


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

    

      onSuccess: (response) => {
        hideLoader();
        orderBundle(
          network,
          recipient,
          packageName,
          size,
          response.reference
        );
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

  reference:
    returnedOrder.reference,

  recipient,

  network:
    bundle.network,

  volume:
    Number(bundle.size || size || 0),

  dataValue: `${(bundle.dataValue || selectedBundle.dataValue || 0)}`,

  amount:
    Number(bundle.price || 0),

  
  status: "pending",

  source: "web",

  isGuest: true,

  createdBy: null,

  createdAt: Date.now(),
};

handleNewOrder(returnedOrder);

updateHomepageTotals(orderData);

await saveOrderToFirestore(orderData);

saveGuestOrder(orderData);

activateTrackers();

  } catch (err) {
    console.error("⚠ Server error:", err);
    showSnackBar("Network problem, contact admin now.", "warning", 20000);
  }
}
//ends//
//ends//


// ---------- FIRESTORE HELPER ----------
async function saveOrderToFirestore(orderData) {
  try {
    const db = window.FIRESTORE;
    if (!db) {
      console.warn("Firestore not initialized.");
      return null;
    }

    const { collection, addDoc, serverTimestamp } = await import(
      "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js"
    );

 const firestoreData = {

  orderId: orderData.orderId,

  reference: orderData.reference,

  status: String(orderData.status || "pending"),

  recipient: orderData.recipient || "-",

  volume: Number(orderData.volume || 0),

  amount: Number(orderData.amount || 0),

  vendorPrice:
    Number(orderData.vendorPrice || 0),

    dataValue: `${(orderData.dataValue  || 0)}`,




  network: orderData.network || "-",

  source: "web",

  createdAt: serverTimestamp(),

  createdBy: orderData.createdBy || "guest",

};

    const ordersCol = collection(db, "orders");
    const result = await addDoc(ordersCol, firestoreData);

    console.log("✅ Order saved to Firestore:", result.id);
    return result.id;

  } catch (err) {
    console.error("❌ Error saving order to Firestore:", err);
    return null;
  }
}




// ---------- LOCAL STORAGE HELPER ----------

// ✅ Save Guest Orders to Local Storage
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
    <span>${normalized.orderId}</span>
    <span>${normalized.volume}GB</span>
    <span>${normalized.recipient}</span>
    <span class="status-cell">
      <span class="status-badge ${getStatusClass(normalized.status)}">
        ${normalized.status}
      </span>
    </span>
  `;

  // Add newest on top
  tableBody.prepend(row);

  console.log(normalized);
  
  // save for refresh persistence
  saveLiveOrder(normalized);

  renderLiveOrderRow(normalized);

  // ---------- POPUP STATUS CARD ----------
  createOrUpdateStatusCard(normalized);

  // ---------- LIVE STATUS POLLING ----------
  startAutoPolling(normalized.orderId);
}
// handleNewOrder ends//

const LIVE_ORDERS_KEY = "ecoLiveOrders";
const MAX_LIVE_ORDERS = 1000;

function saveLiveOrder(order) {
  if (!order || !order.orderId) return;

  const existing = 

    JSON.parse(localStorage.getItem(LIVE_ORDERS_KEY) || "[]");

  const index = existing.findIndex(o => o.orderId === order.orderId);

  if (index !== -1) {
    const current = existing[index];

    // Merge without overwriting status if already delivered/failed
    existing[index] = {
      ...current,
      ...order,

   

    // Don't allow terminal status to be overwritten
      status: 
      isTerminalStatus(current.status)
        ? existing[index].status
        : order.status,


     // preserve the origin submitted time
    createdAt: current.createdAt || Date.now(),    

    // keep the original timestamp
      timestamp: current.timestamp || Date.now(),

    // Preserve DeliveredAt; only update it in updatedLiveOrderStatus()
      updatedAt:  order.updatedAt || current.updatedAt,
    };
  } else {
    // New order on top
    existing.unshift({
      ...order,
      timestamp: Date.now(), // SINGLE SOURCE OF TRUTH
    // Submitted time (set once)
      createdAt: order.createdAt || Date.now(),

    // Initial update time (Same as creation)
      updatedAt: order.updatedAt || Date.now(),

    });
  }

  // Keep latest N orders
  localStorage.setItem(
    LIVE_ORDERS_KEY,
    JSON.stringify(existing.slice(0,
  MAX_LIVE_ORDERS))
  );

  updatePendingCard();
  loadActiveBadge();
}

// ends


// RENDER LIVE ORDER ROW
function renderLiveOrderRow(order) {
  const tableBody = document.getElementById("liveOrderRows");
  if (!tableBody) return;

  // Remove empty placeholder
  const empty = tableBody.querySelector(".empty-state");
  if (empty) empty.remove();


  //structure status updatedDated
    const date =
      order.createdAt
        ? (() =>{
          const d = new Date(order.createdAt);
          const datePart =
          d.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric"
          });

          const timePart =
          d.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
          }).toUpperCase();

          return `${datePart} ${timePart}`;
        })() : "N/A";


    // structure status updatedTime
   const update = order.updatedAt
  ? (() => {
      const d = new Date(order.updatedAt);

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
    })()
  : "N/A";


console.log("Order",order);
console.log(
  "createdAt", order.createdAt
);
console.log("UpdatedAt", order.updatedAt);
console.log("timeStamp", order.timestamp);


  let row = tableBody.querySelector(`[data-id="${order.orderId}"]`);

  if (!row) {
    row = document.createElement("div");
    row.className = "live-row";
    row.dataset.id = order.orderId;
    tableBody.appendChild(row);
  }

  row.innerHTML = `
    <span>${order.orderId}</span>
    <span>${order.recipient}</span>
    <span>${order.volume}GB</span>
    <span class="status-cell">
      <span class="status-badge ${getStatusClass(order.status)}">
        ${order.status}
      </span>
    </span>
    <span>${getNetwork(order)}</span>
    <span>Yes</span>
    <span>${date}</span>
  `;
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
    // 🟩 Talk to your own backend now (not directly to SwiftData)
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





// ---------- RENDER TOTALS ----------
function renderHomepageTotals() {
  const ordersEl = document.getElementById("totalOrders");
  const gbEl = document.getElementById("totalGB");


  if (!ordersEl || !gbEl ) return;

  ordersEl.textContent = ecoTotals.orders;
  gbEl.textContent = `${ecoTotals.gb}GB`;
 
}

// Load totals on page refresh
document.addEventListener("DOMContentLoaded", () => {
  ecoTotals = JSON.parse(localStorage.getItem("ecoTotals")) || ecoTotals;
  renderHomepageTotals();
});





 

// POLLING FUNCTION //

// STATUS_POLL_INTERVAL and _statusPollTimer are declared earlier; avoid redeclaration to prevent errors.

 // ---------- HELPERS ----------
function getStatusTextMapping(status) {
  const s = (status || "").toLowerCase();
  return {
    delivered: "Your bundle is successfully delivered ✅.",
    pending: "Order awaiting processing.",
    processing: "Order is processing. Please wait.",
    failed: "Order failed. Contact support or try again.",
    cancelled: "Order was cancelled.",
    refunded: "Payment refunded.",
    resolved: "Issue resolved. Order completed."
  }[s] || "Status update in progress.";
}

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
/**
 * Call this after your backend returns an order reply.
 * Example usage inside orderBundle function after successful response:
 *    const returnedOrder = result.order || result.swift || result; 
 *    handleNewOrder(returnedOrder);
 * 
 * 
 */
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


  const completedStatuses = ["delivered", "completed", "success"];


  return {
    pending: orders.filter(o => (o.status || "").toLowerCase() === "pending").length,


    completed: orders.filter(o => completedStatuses.includes(o.status?.toLowerCase())).length
  };

}







function updateLiveOrderStatus(orderId, newStatus) {
  if (!orderId || !newStatus) return;

  const orders = getStoredOrders();

  const index = orders.findIndex(o => o.orderId === orderId);
  if (index === -1) return;

  const currentStatus = orders[index].status || "pending";
  
  if(STATUS_PRIORITY[newStatus] < STATUS_PRIORITY[currentStatus]) {
    console.warn(`Blocked downgrade : ${currentStatus} → ${newStatus}`);
    return;
}

// Detect first-time delivery
const wasDelivered = currentStatus === "delivered";
const nowDelivered = newStatus === "delivered";

  orders[index] = {
    ...orders[index],
    status: newStatus,

    updatedAt: currentStatus !== newStatus
    ? Date.now()
    : orders[index].updatedAt,

    deliveredAt: nowDelivered 
    ? (orders[index].deliveredAt || Date.now()) 
    : orders[index].deliveredAt
  };


  localStorage.setItem(LIVE_ORDERS_KEY, JSON.stringify(orders));


  // ONLY increment once when it becomes delivered
  if(!wasDelivered && nowDelivered ) {
    let completedTotal = 

    parseInt(localStorage.getItem("ecoCompletedTotal")) || 0;

    completedTotal++;

    localStorage.setItem("ecoCompletedTotal", completedTotal);
  }

  updatePendingCard();  // correct

  syncCompletedIfMismatch(); // recovery
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

  const completedStatuses = ["delivered", "completed", "success"];



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
    ["delivered", "completed", "success"].includes(
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




// MANUAL ORDER CHECKER 
document.addEventListener("DOMContentLoaded", () => {
  const last = localStorage.getItem("lastOrderId");
  const orderInput = document.getElementById("orderInput");
  const checkBtn = document.getElementById("checkBtn");
  const statusResult = document.getElementById("statusResult");

  if (!orderInput || !checkBtn || !statusResult) return;

  // Prefill input only
  if (last) orderInput.value = last;

  // 🔒 Manual checker must start empty
  statusResult.innerHTML = "";

  let manualCheckTriggered = false;

  checkBtn.addEventListener("click", async () => {
    const id = orderInput.value.trim();
    if (!id) return showSnackBar("Please enter order ID.");

    manualCheckTriggered = true;

    statusResult.innerHTML = `
      <div style="padding:10px;border-radius:8px;background:#f0f0f0;">
        🌀 Checking order <strong>${id}</strong>...
      </div>
    `;

    try {
      const order = await checkOrderStatusOnce(id);
      if (!manualCheckTriggered) return;

      if (!order) {
        statusResult.innerHTML = `
          <div style="padding:10px;background:#ffdddd;border-radius:8px;">
            ⚠ Order not found
          </div>
        `;
        return;
      }

      const status = (order.status || "pending").toLowerCase();
      const desc = getStatusTextMapping(status);

      statusResult.innerHTML = `
        <div style="padding:15px;border-radius:10px;border:2px solid #4caf50;">
          <h3 style="text-transform:capitalize">${status}</h3>
          <p><strong>Order ID:</strong> ${order.orderId || order.reference}</p>
          <p><strong>Recipient:</strong> ${order.recipient}</p>
          <p><strong>Volume:</strong> ${order.volume} GB</p>
          <p>${desc}</p>
        </div>
      `;
    } catch (err) {
      statusResult.innerHTML = `
        <div style="padding:10px;background:#ffdddd;border-radius:8px;">
          ❌ Error checking status
        </div>
      `;
    }
  });
});



// ScrollBtn 
 const scrollBtn =
  document.querySelector(".floating-scroll");
  const bundleSection = 
  document.getElementById("bundles");

 scrollBtn.addEventListener("click", () => {
  if ( bundleSection) {
    bundleSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
 });

 // Auto-hide after scroll
 window.addEventListener("scroll", ()=> {
  if (window.scrollY > 80) {
    scrollBtn.style.opacity = "0";
    scrollBtn.style.pointerEvents = 'none';
  } else {
    scrollBtn.style.opacity = "1";
    scrollBtn.style.pointerEvents = "auto";
  }
 });




 // SHARE BTN
 const shareBtn = document.getElementById("shareBtn");

 shareBtn.addEventListener('click', async () =>
{
  const shareData = {
    title: "EcoData",
    text: "Check out Ecodata Website, the smartest, digital and trusted data bundle purchase website y'll love to use.",
    url: window.location.href
  };

  // Native share
  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      console.log("Share Cancelled");
    }
  }
  // FallBack (Desktop)
  else {
    navigator.clipboard.writeText(shareData.url).then(() => {
      showSnackBar("Link copied! ");
  });
}
});




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



// whatsApp sending message btn
 // === CONFIG ===
  const whatsappNumber = "233535565637";

  // === ELEMENTS ===
  const chatButton = document.getElementById("chatButton");
  const chatBox = document.getElementById("chatBox");
  const sendBtn = document.getElementById("sendMsgBtn");

  // === TOGGLE CHAT BOX ===
  chatButton.addEventListener("click", () => {
    chatBox.classList.toggle("show");
  });

  // === SEND MESSAGE ===
  sendBtn.addEventListener("click", () => {
    const message = document.getElementById("whatsappMessage").value.trim();
    if (!message) {
      showSnackBar("Please type your message before sending.");
      return;
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappURL =` https://wa.me/${233535565637}?text=${encodedMessage}`;
    window.open(whatsappURL, "_blank");
    document.getElementById("whatsappMessage").value = ""; // clear after sending
});

// window click event (chatBox)
window.addEventListener("click", function(e){
  e.stopPropagation();
  if(!chatBox.contains(e.target) && !chatButton.contains(e.target)){
    chatBox.style.display = "none";
  } else{
    chatBox.style.display = "flex";
  }
});
