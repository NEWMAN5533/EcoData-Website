// =========================
// FIREBASE IMPORTS
// =========================
import { db } from "./firebase-config.js";

import {
  collection,
  where,
  onSnapshot,
  query,
  orderBy,
  limit,
 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";





// =========================
// LOCAL STORAGE KEYS
// =========================
const DELIVERY_TIME_KEY = "ecoLastDeliveryTime";
const LAST_ORDER_KEY = "ecoLastDeliveredOrderId";





// =========================
// DELIVERY INDICATOR
// =========================
function updateDeliveryIndicator(snapshot) {

  try {

   if(snapshot.empty) {
    console.log("No delivered orders.");
    return;
   }



    // =========================
    // FIND LATEST DELIVERED ORDER
    // =========================
    const order = {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    };

    console.log("Latest delivered order:", order);

    // =========================
    // LAST DELIVERED DATE
    // =========================
    const deliveredDate = order.updatedAt?.toDate
      ? order.updatedAt.toDate()
      : new Date(order.updatedAt);

    const lastDelivered =
      `${deliveredDate.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric"
      })} • ${deliveredDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      }).toUpperCase()}`;

    // =========================
    // CACHE DELIVERY TIMESTAMP
    // =========================
    const currentOrderKey =
      order.orderId || order.id;

    const storedOrderKey =
      localStorage.getItem(LAST_ORDER_KEY);

    let deliveredAt =
      Number(localStorage.getItem("lastDeliveredAt"));

    if (
      storedOrderKey !== currentOrderKey ||
      !deliveredAt
    ) {

      deliveredAt = order.updatedAt?.toMillis
        ? order.updatedAt.toMillis()
        : order.updatedAt;

      localStorage.setItem(
        "lastDeliveredAt",
        deliveredAt
      );

      localStorage.setItem(
        LAST_ORDER_KEY,
        currentOrderKey
      );

      console.log("✅ Saved new delivery timestamp");

    } else {

      console.log("📦 Using cached timestamp");

    }

    // =========================
    // CALCULATE DELIVERY TIME
    // =========================
    const createdAt = 
    order.createdAt?.toMillis
    ? order.createdAt.toMillis()
    : new Date(order.createdAt).getTime();

    const updatedAt = 
    order.updatedAt?.toMillis
    ? order.updatedAt.toMillis()
    : new (order.updatedAt).getTime();

    const elapsed = updatedAt - createdAt;

    const totalMinutes = Math.max(
      1,
      Math.floor(elapsed / 60000)
    );

    const days =
      Math.floor(totalMinutes / 1440);

    const hours =
      Math.floor((totalMinutes % 1440) / 60);

    const minutes =
      totalMinutes % 60;

    let deliveryTime = "";

    if (days > 0) {

      deliveryTime =
        `${days}d ${hours}h ${minutes}m`;

    } else if (hours > 0) {

      deliveryTime =
        `${hours}h ${minutes}m`;

    } else {

      deliveryTime =
        `${minutes} min`;

    }


    // =========================
// PLACED AT TIME
// =========================

const createdDate = 
order.createdAt?.toDate
? order.createdAt.toDate()
: new Date(order.createdAt);


// Format Placed At
const placedAtFormatted =
`${createdDate.toLocaleDateString("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric"
})} • ${createdDate.toLocaleTimeString("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true
}).toUpperCase()}`;

  // change text colors when there's slow, fast or normal deliveryTime


const bubble = document.getElementById("deliveryBubble1");

const bubble2 = document.getElementById("deliveryBubble2");

const messageEl = document.getElementById("deliveryMessage");

bubble.className = "delivery-bubble";

bubble2.classList = "delivery-bubble2";

const elapsedMinutes = Math.floor(elapsed / 60000);

if(elapsedMinutes <= 10 ) {
  bubble.classList.add("instant");
  bubble2.classList.add("instant");

   messageEl.textContent =
    "Instant Delivery. Most Orders are completed in under 10 minutes.";
}

if(elapsedMinutes <= 30 ){
  bubble.classList.add("fast");
  bubble2.classList.add("fast");

   
  messageEl.textContent =
    "MTN is delivering Fast like Lightning  right now, let enjoy this moment of fast delivering.";
 

} else if(elapsedMinutes <= 90) {
  bubble.classList.add("normal");
  bubble2.classList.add("normal");

   messageEl.textContent =
    "Orders are processing normally. Please allow up to 90 minutes.";

} else {
  bubble.classList.add("slow");
  bubble2.classList.add("slow");

}






    // =========================
    // UPDATE UI
    // =========================

  
  
    const deliveryTimeEl =
      document.getElementById("deliveryTime");

    const lastDeliveredEl =
      document.getElementById("lastDelivered");

    const actualTimeEl =
      document.getElementById("actualDateWithTime");

    const turnAroundTime =
      document.getElementById("turnAroundTime");

    const placedAtTime =
      document.getElementById("placedAtTime");

    const deliveredAtTime =
      document.getElementById("deliveredAtTime");

    if (deliveryTimeEl)
      deliveryTimeEl.textContent = deliveryTime;

    if (actualTimeEl)
      actualTimeEl.textContent = deliveryTime;

    if (turnAroundTime)
      turnAroundTime.textContent = deliveryTime;

    if (placedAtTime)
      placedAtTime.textContent = placedAtFormatted;

    if (deliveredAtTime)
      deliveredAtTime.textContent = deliveryTime;

    if (lastDeliveredEl) {
     // =========================
// LAST DELIVERED
// =========================
const lastDeliveredFormatted =
`${deliveredDate.toLocaleDateString("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric"
})} • ${deliveredDate.toLocaleTimeString("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true
}).toUpperCase()}`;

if (lastDeliveredEl) {
  lastDeliveredEl.textContent = lastDeliveredFormatted;
}
    }
    // =========================
    // DEBUG
    // =========================
    console.log("Current Order:", currentOrderKey);
    console.log("Stored Order:", storedOrderKey);
    console.log("Delivered At:", new Date(deliveredAt));
    console.log("Current Time:", new Date());
    console.log("Elapsed:", deliveryTime);

  } catch (err) {

    console.error("Delivery indicator error:", err);

  }

}

// =========================
// START
// =========================
const deliveredQuery = query(
  collection(db, "orders"),
  where("status", "==", "delivered"),
  orderBy("updatedAt", "desc"),
  limit(1)
);

onSnapshot(
  deliveredQuery,
  (snapshot) => {
    console.log("Delivery update");
    updateDeliveryIndicator(snapshot);
  },
  (error) => {
    console.error("Snapshot error:", error);
  }
);

setInterval(() => {
  const lastDeliveredEl = document.getElementById("lastDelivered");

  if (!lastDeliveredEl) return;

 // =========================
// LAST DELIVERED
// =========================
const lastDeliveredFormatted =
`${deliveredDate.toLocaleDateString("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric"
})} • ${deliveredDate.toLocaleTimeString("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true
}).toUpperCase()}`;

if (lastDeliveredEl) {
  lastDeliveredEl.textContent = lastDeliveredFormatted;
}

}, 5000);



















