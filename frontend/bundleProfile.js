/* =========================================
   ECODATA CUSTOMER PROFILE
   DEMO DATA ONLY
========================================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyClNBlfigtQk8AZWdMZcU9sEtVcIrS0D1g",
  authDomain: "ecodata-2bee6.firebaseapp.com",
  projectId: "ecodata-2bee6",
  storageBucket: "ecodata-2bee6.firebasestorage.app",
  messagingSenderId: "544837123249",
  appId: "1:544837123249:web:6c362350a00c6dab10b690"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);



// ======================================================
// GET TWO USERNAME INITIALS
// ======================================================

function getCustomerAvatarName(username) {

  if (!username) return "GU";

  const nameParts = username
    .trim()
    .split(/\s+/)
    .filter(Boolean);


  // No name
  if (nameParts.length === 0) {
    return "GU";
  }


  // Only one name
  if (nameParts.length === 1) {

    return nameParts[0]
      .charAt(0)
      .toUpperCase();

  }


  // First letter of first name
  const firstLetter =
    nameParts[0]
      .charAt(0)
      .toUpperCase();


  // First letter of last name
  const lastLetter =
    nameParts[nameParts.length - 1]
      .charAt(0)
      .toUpperCase();


  return firstLetter + lastLetter;
}



// ======================================================
// AUTH STATE
// ======================================================

onAuthStateChanged(auth, async (user) => {

  const usernameDisplay =
    document.getElementById("customerName");

  // NEW: initials element
  const customerAvatarName =
    document.getElementById("customerAvatar");


  const greeting = updateClock();


  // ====================================================
  // USER LOGGED IN
  // ====================================================

  if (user) {

    try {

      const userSnap =
        await getDoc(
          doc(db, "users", user.uid)
        );


      if (!userSnap.exists()) {

        console.warn(
          "User document does not exist."
        );

        return;

      }


      const userData =
        userSnap.data();


      // user name
      const username =
        userData.username || "User";

      // user phone number
      const userPhone = 
      userData.phone || "--";

      const userTotalData =
      userData.gb.length;

      const userTotalOrders =
      await getDoc(
        doc(db,"orders" === user.uid.data())
      )

      // ==================================================
      // USERNAME DISPLAY
      // ==================================================

      usernameDisplay.innerHTML =
        `Hello, ${username} <img src="./css/icons/waving.png" alt="">`;


      // ==================================================
      // CREATE USERNAME INITIALS
      // ==================================================

      if (customerAvatarName) {

        customerAvatarName.textContent =
          getCustomerAvatarName(username);

        // Only add lind after auth.user
        customerAvatarName.addEventListener("click", ()=> {
          window.location.href = "./bundleProfile.html";
        })

      }




    } catch (err) {

      console.error(
        "Error fetching user data:",
        err
      );

    }


  } else {

    // ==================================================
    // USER NOT LOGGED IN
    // ==================================================

    if (usernameDisplay) {

      usernameDisplay.innerHTML =
        `Hello, <img src="./css/icons/waving.png" alt="">`;

    }


    if (customerAvatarName) {

      customerAvatarName.textContent =
        "GU";

    }

  }

});




// =========================================
// HELPER
// =========================================

function safeDomText(id, value) {
  const element = document.getElementById(id);
  if(element){
    element.textContent = value;
  }
}


// =========================================
// LOAD CUSTOMER PROFILE
// =========================================

function loadCustomerProfile() {


  safeDomText(
    "customerPhone",
    userData.phone
  )




  safeDomText(
    "totalOrders",
    // orders
  )

 safeDomText(
  "totalData",
  customer.totalData
 )

 safeDomText(
  "completedOrders",
  customer.completedOrders
 )

safeDomText(
  "pendingOrders",
  customer.pendingOrders
)

safeDomText(
  "failedOrders",
  customer.failedOrders
)

safeDomText(
  "giveawayPoints",
  customer.giveawayPoints
)


safeDomText(
  "memberSince",
  customer.firstDataPurchasedDate
)

safeDomText(
  "accountMemberSince",
  customer.registeredDate
)



  loadNetworkStats();

  renderRecentOrders();

  updatePointsProgress();

}


// =========================================
// NETWORK STATS
// =========================================

function loadNetworkStats() {

safeDomText(
  "mtnOrders",
  customer.networks?.MTN.orders
)

safeDomText(
  "mtnData",
  customer.networks?.MTN.data
)



// Telecel statistics
safeDomText(
  "telecelOrders",
  customer.networks?.Telecel.orders
)


safeDomText(
  "telecelData",
  customer.networks?.Telecel.data
)



// Airtel statistics
safeDomText(
  "airteltigoOrder",
  customer.networks?.AirtelTigo.orders
)


safeDomText(
  "airteltigoData",
  customer.networks?.AirtelTigo.data
)

}


// =========================================
// RECENT ORDERS // slice(0, 5)
// =========================================

function renderRecentOrders() {

  const container =
    getElement("recentOrders");

  if (!container) return;


  container.innerHTML = "";


  customer.recentOrders.forEach(order => {

    const row =
      document.createElement("div");

    row.className = "order-row";


    const network =
      document.createElement("div");

    network.className =
      "network-badge";

    network.textContent =
      order.network;


    const main =
      document.createElement("div");

    main.className =
      "order-main";


    const bundle =
      document.createElement("strong");

    bundle.textContent =
      `${order.bundle} Data`;


    const date =
      document.createElement("small");

    date.textContent =
      order.date;


    main.appendChild(bundle);

    main.appendChild(date);


    const status =
      document.createElement("div");

    status.className =
      "order-status";


    const normalized =
      order.status
        .toLowerCase()
        .replace(/\s+/g, "-");


    status.classList.add(
      `status-${normalized}`
    );


    status.textContent =
      order.status;


    row.appendChild(network);

    row.appendChild(main);

    row.appendChild(status);


    container.appendChild(row);

  });

}


// =========================================
// POINTS PROGRESS
// =========================================

function updatePointsProgress() {

  const maximumPoints = 1000;

  const percentage =
    Math.min(
      (customer.giveawayPoints /
        maximumPoints) * 100,
      100
    );


  const progress =
    getElement("pointsProgress");

  if (progress) {

    progress.style.width =
      `${percentage}%`;

  }


  const text =
    getElement("pointsProgressText");

  if (text) {

    text.textContent =
      `${customer.giveawayPoints} / ${maximumPoints}`;

  }

}




// ======================================================
// REAL TIME CLOCK
// ======================================================

function updateClock() {

  const clock =
    document.getElementById("clock");


  const now =
    new Date();


  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];


  const dayName =
    days[now.getDay()];


  let hours =
    now.getHours();

  let minutes =
    now.getMinutes();

  let seconds =
    now.getSeconds();


  // ====================================================
  // GREETING
  // ====================================================

  let greeting = "";


  if (hours < 12) {

    greeting =
      "Good Morning";

  } else if (hours < 18) {

    greeting =
      "Good Afternoon";

  } else {

    greeting =
      "Good Evening";

  }


  // ====================================================
  // TIME
  // ====================================================

  const ampm =
    hours >= 12
      ? "PM"
      : "AM";


  hours =
    hours % 12 || 12;


  minutes =
    minutes < 10
      ? "0" + minutes
      : minutes;


  seconds =
    seconds < 10
      ? "0" + seconds
      : seconds;


  if (clock) {

    clock.innerHTML =
      `${dayName} ${hours}:${minutes}:${seconds} ${ampm}`;

  }


  return greeting;

}



setInterval(
  updateClock,
  1000
);


updateClock();




// =========================================
// INITIALIZE
// =========================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadCustomerProfile();

    setupActions();

  }
);