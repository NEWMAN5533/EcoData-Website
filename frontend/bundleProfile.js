/* =========================================
   ECODATA CUSTOMER PROFILE
   FIRESTORE + LOCAL STORAGE FALLBACK
========================================= */

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyClNBlfigtQk8AZWdMZcU9sEtVcIrS0D1g",
  authDomain: "ecodata-2bee6.firebaseapp.com",
  projectId: "ecodata-2bee6",
  storageBucket: "ecodata-2bee6.firebasestorage.app",
  messagingSenderId: "544837123249",
  appId: "1:544837123249:web:6c362350a00c6dab10b690"
};


// ============================================================
// INITIALIZE FIREBASE ONCE
// ============================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// ============================================================
// DOM
// ============================================================

const customerAvatar =
  document.getElementById("customerAvatar");

const usernameInitials =
  document.getElementById("usernameInitials");

const pointsProgress =
  document.getElementById("pointsProgress");

const recentOrdersContainer =
  document.getElementById("recentOrders");


// ============================================================
// LOCAL STORAGE
// ============================================================

const LOCAL_ORDER_KEYS = [
  "ecoDataLiveOrders",
  "ecoLiveOrders"
];

const LOCAL_USER_KEYS = [
  "ecoDataUser",
  "userData",
  "currentUser",
  "user"
];


// ============================================================
// GLOBAL
// ============================================================

let customer = null;

let currentFirebaseUser = null;


// ============================================================
// SAFE DOM TEXT
// ============================================================

function safeDomText(id, value) {

  const element =
    document.getElementById(id);

  if (element) {
    element.textContent =
      value ?? "-";
  }
}


// ============================================================
// INITIALS
// ============================================================

function getInitials(name = "") {

  const parts =
    String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (!parts.length) {
    return "U";
  }

  if (parts.length === 1) {

    return parts[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}


// ============================================================
// AVATAR
// ============================================================

function updateAvatar(name) {

  const initials =
    getInitials(name);

  if (customerAvatar) {
    customerAvatar.textContent =
      initials;
  }

  if (usernameInitials) {
    usernameInitials.textContent =
      initials;
  }
}


// ============================================================
// DATE
// ============================================================

function parseDate(value) {

  if (!value) {
    return null;
  }

  if (
    typeof value.toDate === "function"
  ) {
    return value.toDate();
  }

  if (
    typeof value.toMillis === "function"
  ) {
    return new Date(
      value.toMillis()
    );
  }

  if (
    typeof value === "object" &&
    typeof value.seconds === "number"
  ) {
    return new Date(
      value.seconds * 1000
    );
  }

  if (typeof value === "number") {

    return new Date(
      value < 10000000000
        ? value * 1000
        : value
    );
  }

  const date =
    new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
}


function formatMemberDate(value) {

  const date =
    parseDate(value);

  if (!date) {
    return "-";
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      year: "numeric"
    }
  );
}


function formatOrderDate(value) {

  const date =
    parseDate(value);

  if (!date) {
    return "-";
  }

  return date.toLocaleDateString(
    "en-US",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  );
}


// ============================================================
// ORDER TIMESTAMP
// ============================================================

function getOrderTimestamp(order) {

  const value =
    order.timestamp ||
    order.createdAt ||
    order.date ||
    0;

  const date =
    parseDate(value);

  return date
    ? date.getTime()
    : 0;
}


// ============================================================
// LOCAL USER
// ============================================================

function getLocalUser() {

  for (const key of LOCAL_USER_KEYS) {

    try {

      const stored =
        localStorage.getItem(key);

      if (!stored) {
        continue;
      }

      const parsed =
        JSON.parse(stored);

      if (
        parsed &&
        typeof parsed === "object"
      ) {

        console.log(
          `Local user found from ${key}`
        );

        return parsed;
      }

    } catch (error) {

      console.warn(
        `Could not read local user from ${key}`,
        error
      );
    }
  }

  return null;
}


// ============================================================
// LOCAL ORDERS
// ============================================================

function getLocalOrders() {

  for (const key of LOCAL_ORDER_KEYS) {

    try {

      const stored =
        localStorage.getItem(key);

      if (!stored) {
        continue;
      }

      const parsed =
        JSON.parse(stored);

      if (Array.isArray(parsed)) {

        console.log(
          `Local orders found from ${key}:`,
          parsed.length
        );

        return parsed;
      }

    } catch (error) {

      console.warn(
        `Could not read ${key}`,
        error
      );
    }
  }

  return [];
}


// ============================================================
// FIRESTORE USER
// ============================================================

async function loadUserFromFirestore(uid) {

  if (!uid) {
    return null;
  }

  try {

    const userRef =
      doc(
        db,
        "users",
        uid
      );

    const userSnap =
      await getDoc(userRef);

    if (!userSnap.exists()) {

      console.warn(
        "No Firestore user document found."
      );

      return null;
    }

    return {
      uid,
      ...userSnap.data()
    };

  } catch (error) {

    console.error(
      "Failed to load Firestore user:",
      error
    );

    return null;
  }
}


// ============================================================
// FIRESTORE ORDERS
//
// IMPORTANT:
// This is the indexed query.
//
// createdBy ASC
// createdAt DESC
//
// Used for ALL statistics.
// Recent orders are taken using slice(0, 5).
// ============================================================

async function loadAllUserOrders(uid) {

  if (!uid) {
    return [];
  }

  try {

    const ordersRef =
      collection(
        db,
        "orders"
      );

    const ordersQuery =
      query(

        ordersRef,

        where(
          "createdBy",
          "==",
          uid
        ),

        orderBy(
          "createdAt",
          "desc"
        )

      );

    const snapshot =
      await getDocs(
        ordersQuery
      );

    const orders =
      snapshot.docs.map(
        orderDoc => ({

          id:
            orderDoc.id,

          ...orderDoc.data()

        })
      );

    console.log(
      `Firestore orders loaded: ${orders.length}`
    );

    return orders;

  } catch (error) {

    console.error(
      "Failed to load indexed user orders:",
      error
    );

    return [];
  }
}


// ============================================================
// NORMALIZE ORDER
// ============================================================

function normalizeOrder(order = {}) {

  return {

    ...order,

    orderId:
      order.orderId ||
      order.reference ||
      order.id ||
      "-",

    reference:
      order.reference ||
      order.orderId ||
      "-",

    status:
      String(
        order.status ||
        order["LD-Status"] ||
        "pending"
      )
      .toLowerCase()
      .trim(),

    recipient:
      order.recipient ||
      "-",

    network:
      order.network &&
      order.network !== "-"
        ? String(order.network)
            .toUpperCase()
        : getNetwork(order),

    volume:
      Number(
        order.volume ||
        order.size ||
        0
      ),

    amount:
      Number(
        order.amount ||
        order.price ||
        0
      )

  };
}


// ============================================================
// NORMALIZE + SORT
// ============================================================

function normalizeAndSortOrders(orders = []) {

  return orders
    .filter(Boolean)
    .map(normalizeOrder)
    .sort(
      (a, b) =>
        getOrderTimestamp(b) -
        getOrderTimestamp(a)
    );
}


// ============================================================
// MERGE LOCAL + FIRESTORE
// ============================================================

function mergeOrders(
  localOrders = [],
  firestoreOrders = []
) {

  const map =
    new Map();


  // ------------------------------------------
  // LOCAL FIRST
  // ------------------------------------------

  localOrders.forEach(order => {

    const key =
      order.orderId ||
      order.reference ||
      order.id;

    if (key) {

      map.set(
        String(key),
        order
      );

    }

  });


  // ------------------------------------------
  // FIRESTORE
  //
  // Firestore overwrites local information
  // for the same order.
  // ------------------------------------------

  firestoreOrders.forEach(order => {

    const key =
      order.orderId ||
      order.reference ||
      order.id;

    if (!key) {
      return;
    }

    const existing =
      map.get(
        String(key)
      );

    map.set(
      String(key),

      existing
        ? {
            ...existing,
            ...order
          }
        : order
    );

  });


  return Array.from(
    map.values()
  );
}


// ============================================================
// PROFILE ORDERS
//
// LOCAL STORAGE FIRST
// FIRESTORE SUPPLEMENTS WHEN LOGGED IN
// ============================================================

async function getProfileOrders(
  firebaseUser = null
) {

  // ------------------------------------------
  // LOCAL
  // ------------------------------------------

  const localOrders =
    getLocalOrders();


  // ------------------------------------------
  // GUEST
  // ------------------------------------------

  if (!firebaseUser) {

    return normalizeAndSortOrders(
      localOrders
    );
  }


  // ------------------------------------------
  // FIRESTORE
  // ------------------------------------------

  const firestoreOrders =
    await loadAllUserOrders(
      firebaseUser.uid
    );


  // ------------------------------------------
  // MERGE
  // ------------------------------------------

  const mergedOrders =
    mergeOrders(
      localOrders,
      firestoreOrders
    );


  return normalizeAndSortOrders(
    mergedOrders
  );
}


// ============================================================
// NETWORK DETECTION
// ============================================================

function getNetwork(order = {}) {

  if (
    order.network &&
    order.network !== "-" &&
    order.network !== "UNKNOWN"
  ) {

    return String(
      order.network
    ).toUpperCase();
  }


  let phone =
    String(
      order.recipient ?? ""
    )
    .replace(/\D/g, "");


  if (
    phone.startsWith("233")
  ) {

    phone =
      "0" +
      phone.slice(3);
  }


  const prefix =
    phone.slice(0, 3);


  if (
    [
      "024",
      "025",
      "053",
      "054",
      "055",
      "059"
    ].includes(prefix)
  ) {

    return "MTN";
  }


  if (
    [
      "020",
      "050"
    ].includes(prefix)
  ) {

    return "TELECEL";
  }


  if (
    [
      "026",
      "027",
      "056",
      "057"
    ].includes(prefix)
  ) {

    return "AIRTELTIGO";
  }


  return "UNKNOWN";
}


// ============================================================
// APPLY USER
// ============================================================

function applyUserToProfile(user = {}) {

  const name =
    user.name ||
    user.fullName ||
    user.displayName ||
    user.username ||
    "User";


  const phone =
    user.phone ||
    user.phoneNumber ||
    user.mobile ||
    "-";


  safeDomText(
    "customerName",
    name
  );

  safeDomText(
    "customerPhone",
    phone
  );

  safeDomText(
    "accountPhone",
    phone
  );


  updateAvatar(name);


  const registeredDate =
    user.registeredDate ||
    user.createdAt ||
    user.created_at ||
    user.memberSince ||
    user.registrationDate;


  const memberDate =
    formatMemberDate(
      registeredDate
    );


  safeDomText(
    "memberSince",
    memberDate
  );

  safeDomText(
    "accountMemberSince",
    memberDate
  );
}


// ============================================================
// STATISTICS
// ============================================================

function calculateStatistics(
  orders = []
) {

  let totalData = 0;

  let completed = 0;

  let pending = 0;

  let failed = 0;


  orders.forEach(order => {

    totalData +=
      Number(
        order.volume || 0
      );


    const status =
      String(
        order.status || ""
      )
      .toLowerCase();


    if (
      status === "delivered" ||
      status === "completed"
    ) {

      completed++;

    }

    else if (
      status === "pending" ||
      status === "processing"
    ) {

      pending++;

    }

    else if (
      status === "failed" ||
      status === "cancelled" ||
      status === "refunded"
    ) {

      failed++;
    }

  });


  return {

    totalOrders:
      orders.length,

    totalData:
      Number.isInteger(totalData)
        ? totalData
        : Number(
            totalData.toFixed(2)
          ),

    completed,

    pending,

    failed

  };
}


// ============================================================
// NETWORK STATISTICS
// ============================================================

function updateNetworkStats(
  orders = []
) {

  const networks = {

    MTN: {
      orders: 0,
      data: 0
    },

    TELECEL: {
      orders: 0,
      data: 0
    },

    AIRTELTIGO: {
      orders: 0,
      data: 0
    }

  };


  orders.forEach(order => {

    const network =
      getNetwork(order);


    const volume =
      Number(
        order.volume || 0
      );


    if (
      network === "MTN"
    ) {

      networks.MTN.orders++;

      networks.MTN.data +=
        volume;

    }

    else if (
      network === "TELECEL"
    ) {

      networks.TELECEL.orders++;

      networks.TELECEL.data +=
        volume;

    }

    else if (
      network === "AIRTELTIGO"
    ) {

      networks.AIRTELTIGO.orders++;

      networks.AIRTELTIGO.data +=
        volume;

    }

  });


  safeDomText(
    "mtnOrders",
    networks.MTN.orders
  );

  safeDomText(
    "mtnData",
    networks.MTN.data
  );


  safeDomText(
    "telecelOrders",
    networks.TELECEL.orders
  );

  safeDomText(
    "telecelData",
    networks.TELECEL.data
  );


  safeDomText(
    "airteltigoOrders",
    networks.AIRTELTIGO.orders
  );

  safeDomText(
    "airteltigoData",
    networks.AIRTELTIGO.data
  );
}


// ============================================================
// STATUS CLASS
// ============================================================

function getStatusClass(status) {

  const value =
    String(status)
      .toLowerCase()
      .trim();


  if (
    value.includes("deliver")
  ) {

    return "delivered";
  }

  if (
    value.includes("process")
  ) {

    return "processing";
  }

  if (
    value.includes("pending")
  ) {

    return "pending";
  }

  if (
    value.includes("fail")
  ) {

    return "failed";
  }

  if (
    value.includes("cancel")
  ) {

    return "cancelled";
  }

  if (
    value.includes("refund")
  ) {

    return "refunded";
  }

  if (
    value.includes("resolved")
  ) {

    return "resolved";
  }


  return "pending";
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

  return String(
    value ?? ""
  )

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );
}


// ============================================================
// RECENT ORDERS
//
// ONLY FIRST 5
// ============================================================

function renderRecentOrders(
  orders = []
) {

  if (!recentOrdersContainer) {
    return;
  }


  recentOrdersContainer.innerHTML =
    "";


  const recent =
    orders.slice(0, 5);


  if (!recent.length) {

    recentOrdersContainer.innerHTML = `

      <div class="profile-empty-orders">

        <i class="ri-shopping-bag-3-line"></i>

        <span>
          No recent orders yet.
        </span>

      </div>

    `;

    return;
  }


  recent.forEach(
    rawOrder => {

      const order =
        normalizeOrder(
          rawOrder
        );


      const row =
        document.createElement(
          "div"
        );


      row.className =
        "recent-order";


      const network =
        document.createElement(
          "div"
        );


      network.className =
        "network-badge";


      network.textContent =
        order.network;


      const main =
        document.createElement(
          "div"
        );


      main.className =
        "recent-order-info";


      const bundle =
        document.createElement(
          "strong"
        );


      bundle.textContent =
        `${order.volume}GB Data`;


      const details =
        document.createElement(
          "small"
        );


      details.textContent =
        `${order.recipient} · ${formatOrderDate(
          order.createdAt ||
          order.timestamp
        )}`;


      main.appendChild(
        bundle
      );

      main.appendChild(
        details
      );


      const status =
        document.createElement(
          "span"
        );


      status.className =
        `recent-order-status status-${getStatusClass(
          order.status
        )}`;


      status.textContent =
        order.status;


      row.appendChild(
        network
      );

      row.appendChild(
        main
      );

      row.appendChild(
        status
      );


      recentOrdersContainer.appendChild(
        row
      );

    }
  );
}


// ============================================================
// POINTS
// ============================================================

function updatePoints(
  user = {}
) {

  const points =
    Number(
      user.giveawayPoints ??
      user.giveAwayPoints ??
      user.points ??
      0
    );


  const maximumPoints =
    Number(
      user.pointsTarget ||
      1000
    );


  safeDomText(
    "giveAwayPoints",
    points.toLocaleString()
  );


  safeDomText(
    "pointsProgressText",
    `${points} / ${maximumPoints}`
  );


  if (pointsProgress) {

    const percentage =
      maximumPoints > 0

        ? Math.min(
            (
              points /
              maximumPoints
            ) * 100,
            100
          )

        : 0;


    pointsProgress.style.width =
      `${percentage}%`;
  }
}


// ============================================================
// APPLY EVERYTHING
// ============================================================

async function loadCustomerProfile(
  user,
  orders
) {

  customer =
    user || {};


  applyUserToProfile(
    customer
  );


  const statistics =
    calculateStatistics(
      orders
    );


  safeDomText(
    "totalOrders",
    statistics.totalOrders
  );

  safeDomText(
    "totalData",
    statistics.totalData
  );

  safeDomText(
    "completedOrders",
    statistics.completed
  );

  safeDomText(
    "pendingOrders",
    statistics.pending
  );

  safeDomText(
    "failedOrders",
    statistics.failed
  );


  updateNetworkStats(
    orders
  );


  renderRecentOrders(
    orders.slice(0, 5)
  );


  updatePoints(
    customer
  );
}


// ============================================================
// AUTHENTICATED PROFILE
// ============================================================

async function loadAuthenticatedProfile(
  firebaseUser
) {

  currentFirebaseUser =
    firebaseUser;


  console.log(
    "Authenticated user:",
    firebaseUser.uid
  );


  // ------------------------------------------
  // FIRESTORE USER
  // ------------------------------------------

  const firestoreUser =
    await loadUserFromFirestore(
      firebaseUser.uid
    );


  // ------------------------------------------
  // FIRESTORE FIRST
  // AUTH FALLBACK
  // ------------------------------------------

  const profileUser = {

    uid:
      firebaseUser.uid,

    name:
      firestoreUser?.name ||
      firestoreUser?.fullName ||
      firestoreUser?.displayName ||
      firebaseUser.displayName ||
      "User",

    phone:
      firestoreUser?.phone ||
      firestoreUser?.phoneNumber ||
      firestoreUser?.mobile ||
      firebaseUser.phoneNumber ||
      "-",

    displayName:
      firestoreUser?.displayName ||
      firebaseUser.displayName ||
      "User",

    registeredDate:
      firestoreUser?.registeredDate ||
      firestoreUser?.createdAt ||
      firestoreUser?.created_at ||
      firebaseUser.metadata?.creationTime ||
      null,

    giveawayPoints:
      firestoreUser?.giveawayPoints ??
      firestoreUser?.giveAwayPoints ??
      firestoreUser?.points ??
      0,

    pointsTarget:
      firestoreUser?.pointsTarget ||
      1000,

    ...(firestoreUser || {})

  };


  // ------------------------------------------
  // ORDERS
  // ------------------------------------------

  const orders =
    await getProfileOrders(
      firebaseUser
    );


  // ------------------------------------------
  // PROFILE
  // ------------------------------------------

  await loadCustomerProfile(
    profileUser,
    orders
  );


  console.log(
    "Profile successfully synchronized."
  );
}


// ============================================================
// GUEST PROFILE
// ============================================================

async function loadGuestProfile() {

  console.log(
    "No authenticated Firebase user."
  );


  const localUser =
    getLocalUser();


  const localOrders =
    normalizeAndSortOrders(
      getLocalOrders()
    );


  const guestUser =
    localUser || {

      name: "Guest",

      phone: "-",

      giveawayPoints: 0,

      pointsTarget: 1000

    };


  await loadCustomerProfile(
    guestUser,
    localOrders
  );
}


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(
  auth,
  async firebaseUser => {

    try {

      if (firebaseUser) {

        await loadAuthenticatedProfile(
          firebaseUser
        );

      } else {

        await loadGuestProfile();

      }

    } catch (error) {

      console.error(
        "Profile loading error:",
        error
      );


      // --------------------------------------
      // ALWAYS FALL BACK TO LOCAL STORAGE
      // --------------------------------------

      await loadGuestProfile();
    }

  }
);


// ============================================================
// REAL-TIME CLOCK
// ============================================================

function updateClock() {

  const clock =
    document.getElementById(
      "clock"
    );


  if (!clock) {
    return;
  }


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


  const ampm =
    hours >= 12
      ? "PM"
      : "AM";


  hours =
    hours % 12 || 12;


  minutes =
    minutes < 10
      ? `0${minutes}`
      : minutes;


  seconds =
    seconds < 10
      ? `0${seconds}`
      : seconds;


  clock.textContent =
    `${dayName} ${hours}:${minutes}:${seconds} ${ampm}`;
}


updateClock();

setInterval(
  updateClock,
  1000
);
