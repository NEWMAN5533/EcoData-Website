
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
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return "http://localhost:3000";
  }

  return "https://ecodata-app.onrender.com";
})();

let selectedVoucher = {};
let selectedQty = 1;
let availableStock = 0;
let totalPrice = 0;

const STORAGE_VOUCHER_KEY = "selected_voucher_slug";


document.addEventListener("DOMContentLoaded", () => {

  // RUN IMMEDIATELY
  displayVoucherPrice();
  activateVoucherStock();
  refreshVoucherUi();



  const voucherContainer = document.getElementById("voucherContainer");
  const closeVoucherModal = document.getElementById("closeVoucher");

  const voucherTitle1 = document.getElementById("voucherName1");
  const voucherTitle2 = document.getElementById("voucherName2");


  const decreaseBtn = document.getElementById("decreaseBtn");
  const increaseBtn = document.getElementById("increaseBtn");
  const qtyCounter = document.getElementById("count");

  const phoneInput = document.getElementById("voucherPhone");
  const emailInput = document.getElementById("voucherEmail");
  const whatsappInput = document.getElementById("sendWhatsapp");
  const purchaseBtn = document.getElementById("buy-vtn");

  const totalAmount = document.getElementById("totalPrice");
  const activePriceCard = document.getElementById("activePrice");


  qtyCounter.textContent = selectedQty;



  //======================
  // DISPLAY VOUCHER PRICE
  //======================
  function displayVoucherPrice(){
    document.querySelectorAll(".grid-voucher-card").forEach(card => {
      const activeCardPriceEl = document.getElementById("activePrice");
      const topDescStocked = document.getElementById("topDecsStock");

      const price = 
      Number(card.dataset.price);
      const priceEl = 
      card.querySelector(".bece-left-btom p");
  
    

        // check out of stock
        const priceAvailable =
      card.dataset.stock === "true";

      const priceUnAvailable = 
      card.dataset.stock === "false";

      const cardStocked1 = 
      card.dataset.stocked;

    


      if(priceEl){
        priceEl.textContent =`
        GHS ${price.toFixed(2)}`;
      }

     
        

      if(priceAvailable){
        priceEl.textContent = `
        GHS ${price.toFixed(2)}`;

       activeCardPriceEl.textContent = `
       GHS ${price.toFixed(2)}`;
      
          // insert the stockPrice at top desc
        topDescStocked.textContent = `
        ${cardStocked1} left . GHS ${price.toFixed(2)} each`;
      }

      if(priceUnAvailable){
        priceEl.textContent =
        "GHS N/A";
      }

    });
  }

  //=======================
  // ACTIVATE STOCK VOUCHER
  //========================
  function activateVoucherStock(){
    document.querySelectorAll(".grid-voucher-card").forEach(card => {


      const available =
      card.dataset.stock === "true";

      const unAvailable = 
      card.dataset.stock === "false";

      const cardStocked = 
      card.dataset.stocked;

     

      if(available){
        card.querySelector(".outStock").style.display = "none";
        card.querySelector(".stock").style.display = "flex";

  

        // means there is a stocked
        card.querySelector(".stock").textContent = `
        ${cardStocked} left`;

        // buy-btn opacity (1)
        card.querySelector(".bece-btom-right button").innerHTML =
        "Buy Now";
        card.querySelector(".bece-btom-right button").style.opacity = "1";

        
      }

      if(unAvailable){
         // prevent clicking
        card.style.pointerEvents = "none";



        card.querySelector(".stock").style.display = "none";
        card.querySelector(".outStock").style.display = "flex";

        // buy-btn opacity (.4)
        card.querySelector(".bece-btom-right button").innerHTML =
        "Sold Out";
        card.querySelector(".bece-btom-right").style.opacity = "0.4";

      }


    })
  }

   //================================
  // FUNCTION UPDATE VOUCHER TOTAL
  //================================
  function updateVoucherTotal(){
    totalPrice = selectedVoucher.price * selectedQty;

    totalAmount.textContent =
    `GHS ${totalPrice.toFixed(2)}`;

    purchaseBtn.innerHTML =`
    <i class="ri-shopping-cart-line icon"></i>
    Pay GHS ${totalPrice.toFixed(2)}
    `;
  }



  // ==========================
  // OPEN MODAL
  // ==========================
  document.querySelectorAll(".grid-voucher-card").forEach(card => {

    const cardStocked = 
      card.dataset.stocked;

    card.addEventListener("click", () => {

      selectedVoucher = {
        slug: card.dataset.slug,
        name: card.dataset.name,
        price: Number(card.dataset.price)
      };


      localStorage.setItem(
        STORAGE_VOUCHER_KEY,
        selectedVoucher.slug
      );

      voucherTitle1.textContent = selectedVoucher.name;
      voucherTitle2.textContent = selectedVoucher.name;
      
    

      updateVoucherTotal();

      availableStock = Number(cardStocked);

      selectedQty = 1;
      qtyCounter.textContent = selectedQty;

      voucherContainer.style.display = "flex";

    });

  });



  // ==========================
  // CLOSE MODAL
  // ==========================

  function closeModal() {
    voucherContainer.style.display = "none";
  }

  closeVoucherModal.addEventListener("click", closeModal);

  voucherContainer.addEventListener("click", e => {

    if (e.target === voucherContainer) {

      closeModal();

    }

  });

 

  // ==========================
  // QUANTITY
  // ==========================

  decreaseBtn.addEventListener("click", () => {

  

    if (selectedQty <= 1) return;

      selectedQty--;
      qtyCounter.textContent = selectedQty;
      updateVoucherTotal();

   


  });

  increaseBtn.addEventListener("click", () => {

      if(selectedQty >= availableStock){
      showSnackBar(`Only ${availableStock} voucher(s) available.`, "warning", 2500

      );
      return;
    }

    selectedQty++;
    qtyCounter.textContent = selectedQty;

    updateVoucherTotal();

  });

  // ==========================
  // BUY BUTTON
  // ==========================

    purchaseBtn.addEventListener("click", ()=> {
      console.log("BUY CLICKED");

      const phone = phoneInput.value.trim();
      const email = emailInput.value.trim();
      const sendViaWhatsApp = whatsappInput.checked;

     // Phone validation
if (!phone) {
  showSnackBar("Please enter the recipient phone number.", "warning");
  return;
}

// Accepts:
// 0551234567
// +233551234567
// 233551234567
const phonePattern = /^(0\d{9}|\+233\d{9}|233\d{9})$/;

if (!phonePattern.test(phone)) {
  showSnackBar(
    "Enter a valid Ghana phone number.",
    "warning",
    4000
  );
  return;
}

     // Email validation
if (!email) {
  showSnackBar("Please enter your email address.", "warning", 3000);
  return;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailPattern.test(email)) {
  showSnackBar(
    "Please enter a valid email address (e.g. name@example.com).",
    "warning",
    4000
  );
  return;
}

      payWithPaystack({

        slug: selectedVoucher.slug,
        name: selectedVoucher.name,
        price: selectedVoucher.price,
        quantity: selectedQty,
        phone,
        email,
        sendViaWhatsApp

      });


      console.log(phoneInput);
      console.log(emailInput);
      console.log(purchaseBtn);


    });

      });







// =====================
// PLAY SOUND
//======================

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




// ===================================
// PLAY SOUND WHEN ORDER IS SUCCESSFUL
// ====================================
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

// =========================================
// PLAY SOUND WHEN ORDER IS SUCCESSFUL ENDS
// ==========================================

//==================
// PAYMENT
//==================

async function payWithPaystack(voucherData) {

    const user = auth.currentUser;

    const userEmail =
        user?.email || voucherData.email || `${voucherData.phone}@ecodata.com`;

    const userName =
        user?.displayName || "Guest User";

    // Total price
    const amount =
        voucherData.price * voucherData.quantity;

    showLoader();

    setTimeout(() => {

        const paystack =
            new PaystackPop();

        paystack.newTransaction({

            key: "pk_live_635856447ee14b583349141b7271f64c9b969749",

            email: userEmail,

            amount: amount * 100,

            currency: "GHS",

            metadata: {

                type: "Voucher",

                voucherSlug:
                    voucherData.slug,

                quantity:
                    voucherData.quantity,

                phone:
                    voucherData.phone,

                email:
                    voucherData.email,

                sendViaWhatsApp:
                    voucherData.sendViaWhatsApp,

                custom_fields: [

                    {
                        display_name:
                            "Voucher",

                        value:
                            voucherData.name
                    },

                    {
                        display_name:
                            "Phone",

                        value:
                            voucherData.phone
                    },

                    {
                        display_name:
                            "Quantity",

                        value:
                            voucherData.quantity
                    },

                    {
                        display_name:
                            "Customer",

                        value:
                            userName
                    }

                ]

            },

            onSuccess: async (response) => {

                hideLoader();
                await orderVoucher({
                  voucherSlug: voucherData.slug,
                  quantity: voucherData.quantity,
                  phone: voucherData.phone,
                  email: voucherData.email,
                  sendViaWhatsApp: voucherData.sendViaWhatsApp,
                  paymentReference: response.reference
                });
                },

            onCancel: () => {

                hideLoader();

                showSnackBar(
                    "❌ Payment cancelled"
                );

            }

        });

    }, 500);

}






//==================
// ORDER VOUCHER
//==================

async function orderVoucher(voucherData) {
   
    try {

        const response = await fetch(

            `${API_BASE}/api/voucher/purchase`,

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify(voucherData)
              });

        const data =
            await response.json();

        if (!data.success) {

            throw new Error(data.message || "Voucher purchase failed.");

        }

        playSuccessSound();

        showSnackBar(

            `${voucherData.quantity} ${voucherData.name} purchased successfully!`,

            "success",

            6000

        );


        // save to database
        await saveVoucherOrder({
                  voucherSlug: voucherData.slug,
                  voucherName: voucherData.name,
                  quantity: voucherData.quantity,
                  phone: voucherData.phone,
                  amount:  voucherData.price * voucherData.quantity,
                  email: voucherData.email,
                  unitPrice: voucherData.price,
                  deliveryStatus: "Sent",
                  completed: false,
                  sendViaWhatsApp: voucherData.sendViaWhatsApp,
                  paymentReference: voucherData.paymentReference,
                  createdAt: serverTimestamp()
        });


        // save to localStorage
        const order = {
            voucherSlug: voucherData.slug,
                  voucherName: voucherData.name,
                  quantity: voucherData.quantity,
                  phone: voucherData.phone,
                  amount:  voucherData.price * voucherData.quantity,
                  email: voucherData.email,
                  unitPrice: voucherData.price,
                  deliveryStatus: "Sent",
                  completed: false,
                  sendViaWhatsApp: voucherData.sendViaWhatsApp,
                  paymentReference: voucherData.paymentReference,
                  createdAt: new Date().toISOString(),
        }


        const orders = 
        JSON.parse(localStorage.getItem("voucherOrders")) || [];

        orders.unshift(order);

        localStorage.setItem("voucherOrders",
          JSON.stringify(orders)
        );


        // refresh both cards totals & table
        refreshVoucherUi();

        // Close modal
        document
            .getElementById("voucherContainer")
            .style.display = "none";

        // Clear inputs

        document.getElementById("voucherPhone").value = "";

        document.getElementById("voucherEmail").value = "";

        document.getElementById("sendWhatsapp").checked = true;

    }

    catch (error) {

        console.error(error);

        showSnackBar(

            error.message || "Voucher purchase failed.", "error"

        );

    }

}





//=======================
// SAVE VOUCHER ORDER
//=======================
async function saveVoucherOrder(order) {
  try{
    const docRef = await addDoc(collection(db, "voucherOrders"),
    {
      ...order,
    }
  );
  return {
    success: true,
    id: docRef.id
  };

  } catch(error){
    console.error("Firestore Error:", error);
    return{
      success: false,
      error
    };
  }
}

// ==============================
// VOUCHER SEARCH
// ==============================

const voucherSearch = document.querySelector(".voucherSearch");
const voucherCards = document.querySelectorAll(".grid-voucher-card");

if (voucherSearch && voucherCards.length) {
  voucherSearch.addEventListener("input", () => {
    const activeCardPriceEl = document.getElementById("activePrice");
    const searchValue = voucherSearch.value.trim().toLowerCase();

    voucherCards.forEach((card) => {
      const voucherName =
        card.querySelector("h2")?.textContent.toLowerCase() || "";

      const voucherDesc =
        card.querySelector("small")?.textContent.toLowerCase() || "";

      const category =
        card.querySelector(".voucher-badge p")?.textContent.toLowerCase() || "";

      // Show all cards if the input is empty
      if (searchValue === "") {
        card.style.display = "";
        return;
      }

      const matches =
        voucherName.includes(searchValue) ||
        voucherDesc.includes(searchValue) ||
        category.includes(searchValue);

      card.style.display = matches ? "" : "none";
      activeCardPriceEl.textContent = "GHS N/A";
    });
  });
}


// ==============================
// REFRESH VOUCHER CARDS
// ==============================

const refreshBtn = document.querySelector(".rightOpRefresh");
const refreshIcon = refreshBtn.querySelector("i");

refreshBtn.addEventListener("click", () => {

    // Prevent multiple clicks while animating
    if (refreshIcon.classList.contains("spinning")) return;

    // Start animation
    refreshIcon.classList.add("spinning");

    // Clear search
    voucherSearch.value = "";

    // Show all cards
    voucherCards.forEach(card => {
        card.style.display = "";

        card.classList.remove("refreshing");
        setTimeout(()=> {
          card.classList.add("refreshing");
        }, 10);
    });

    

    // Remove animation class when finished
    refreshIcon.addEventListener("animationend", () => {
        refreshIcon.classList.remove("spinning");
    }, { once: true });

});
// ==============================
// VOUCHER SEARCH ENDS
// ==============================


//===============================
// VOUCHER TOTAL ANALYTICS
//===============================
function updateVoucherDashboardCards(){
const orders = JSON.parse(localStorage.getItem("voucherOrders")) || [];

const totalOrders =
document.getElementById("totalVouchers");

const totalQty = 
document.getElementById("totalVoc");

const totalAmount =
document.getElementById("totalVocAmount");

const vocCompleted =
document.getElementById("vocCompletedOrders");

totalOrders.textContent =
orders.length;

let qty = 0;
let amount = 0;
let completedCount = 0;

orders.forEach(order => {
  qty += Number(order.quantity);

  amount += Number(order.totalAmount);

  const completedStatus = ["Sent", "Delivered"];

  if( completedStatus.includes(order.deliveryStatus) ){
    completedCount++;
  }
});

totalQty.textContent = qty;

totalAmount.textContent =`GHS ${amount.toFixed(2)}`;

vocCompleted.textContent = completedCount;

}



//===============================
// THE VOUCHER TABLE
//===============================
function renderVoucherHistory() {

    const tableBody = document.getElementById("liveOrderRows");
    if (!tableBody) return;

    const orders =
        JSON.parse(localStorage.getItem("voucherOrders")) || [];

    // Clear old rows
    tableBody.innerHTML = "";

    // Empty state
    if (orders.length === 0) {
        tableBody.innerHTML = `
            <div class="empty-state">
                No voucher purchase yet
            </div>
        `;
        return;
    }

    orders.forEach(order => {

        const date = order.createdAt
            ? new Date(order.createdAt).toLocaleDateString()
            : "-";

        tableBody.innerHTML += `
            <div class="live-row">
                <span>${order.voucherName}</span>
                <span>${order.quantity}</span>
                <span>${order.phone}</span>
                <span class="status-badge ${order.deliveryStatus.toLowerCase()}">
                    ${order.deliveryStatus}
                </span>
                <span>GHS ${Number(order.amount).toFixed(2)}</span>
                <span>${date}</span>
                <span>${order.email}</span>
            </div>
        `;
    });

}

// both function together
 function refreshVoucherUi(){
  updateVoucherDashboardCards();
  renderVoucherHistory();
 }


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
