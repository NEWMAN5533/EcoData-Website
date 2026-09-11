/* ==========================================
   ECODATA STORE
   NOTIFICATIONS & MESSAGES
   Frontend-only for now
========================================== */


/* ==========================================
   ELEMENTS
========================================== */

const tabs =
  document.querySelectorAll(".notification-tab");

const panels = {
  notifications:
    document.getElementById("notificationsPanel"),

  messages:
    document.getElementById("messagesPanel")
};


const notificationItems =
  document.querySelectorAll(".notification-item");

const messageItems =
  document.querySelectorAll(".message-item");


const notificationFilters =
  document.querySelectorAll(".notification-filter");


const notificationEmpty =
  document.getElementById("notificationEmpty");

const messageEmpty =
  document.getElementById("messageEmpty");


const messageSearch =
  document.getElementById("messageSearch");


const unreadTotal =
  document.getElementById("unreadTotal");

const orderNotificationTotal =
  document.getElementById(
    "orderNotificationTotal"
  );

const messageTotal =
  document.getElementById("messageTotal");

const notificationTabCount =
  document.getElementById(
    "notificationTabCount"
  );

const messageTabCount =
  document.getElementById(
    "messageTabCount"
  );

const sidebarUnreadCount =
  document.getElementById(
    "sidebarUnreadCount"
  );

const markAllReadBtn =
  document.getElementById(
    "markAllReadBtn"
  );

const newMessageBtn =
  document.getElementById(
    "newMessageBtn"
  );

const signOutBtn =
  document.getElementById(
    "signOutBtn"
  );


/* ==========================================
   STORAGE
========================================== */

const NOTIFICATION_KEY =
  "ecoStoreNotifications";

const MESSAGE_KEY =
  "ecoStoreMessages";


/* ==========================================
   SAVE / LOAD STATE
========================================== */

function loadReadState() {

  try {

    return JSON.parse(
      localStorage.getItem(
        NOTIFICATION_KEY
      )
    ) || {};

  } catch {

    return {};

  }

}


function saveReadState(state) {

  localStorage.setItem(
    NOTIFICATION_KEY,
    JSON.stringify(state)
  );

}


function loadMessageState() {

  try {

    return JSON.parse(
      localStorage.getItem(
        MESSAGE_KEY
      )
    ) || {};

  } catch {

    return {};

  }

}


function saveMessageState(state) {

  localStorage.setItem(
    MESSAGE_KEY,
    JSON.stringify(state)
  );

}


/* ==========================================
   APPLY SAVED STATE
========================================== */

function applySavedState() {

  const readState =
    loadReadState();

  notificationItems.forEach(item => {

    const id =
      item.dataset.id;

    if (readState[id]) {

      item.classList.remove(
        "unread"
      );

    }

  });


  const messageState =
    loadMessageState();

  messageItems.forEach(item => {

    const id =
      item.dataset.messageId;

    if (messageState[id]) {

      item.classList.remove(
        "unread"
      );

    }

  });

}


applySavedState();


/* ==========================================
   UPDATE COUNTS
========================================== */

function updateCounts() {

  const unreadNotifications =
    document.querySelectorAll(
      ".notification-item.unread"
    ).length;


  const unreadMessages =
    document.querySelectorAll(
      ".message-item.unread"
    ).length;


  const unread =
    unreadNotifications +
    unreadMessages;


  const orderUnread =
    [
      ...document.querySelectorAll(
        ".notification-item.unread"
      )
    ]
      .filter(item =>
        item.dataset.type === "orders"
      )
      .length;


  unreadTotal.textContent =
    unread;

  orderNotificationTotal.textContent =
    orderUnread;

  messageTotal.textContent =
    unreadMessages;


  notificationTabCount.textContent =
    unreadNotifications;

  messageTabCount.textContent =
    unreadMessages;


  if (unread > 0) {

    sidebarUnreadCount.textContent =
      unread;

    sidebarUnreadCount.style.display =
      "inline-flex";

  } else {

    sidebarUnreadCount.style.display =
      "none";

  }

}


updateCounts();


/* ==========================================
   TAB SWITCHING
========================================== */

tabs.forEach(tab => {

  tab.addEventListener(
    "click",
    () => {

      const target =
        tab.dataset.tab;


      tabs.forEach(item => {

        item.classList.remove(
          "active"
        );

      });


      tab.classList.add(
        "active"
      );


      Object.values(panels)
        .forEach(panel => {

          panel.classList.remove(
            "active"
          );

        });


      panels[target]
        .classList.add(
          "active"
        );

    }
  );

});


/* ==========================================
   NOTIFICATION FILTERS
========================================== */

notificationFilters.forEach(filter => {

  filter.addEventListener(
    "click",
    () => {

      notificationFilters
        .forEach(button => {

          button.classList.remove(
            "active"
          );

        });


      filter.classList.add(
        "active"
      );


      const selected =
        filter.dataset.filter;


      let visible = 0;


      notificationItems.forEach(item => {

        const type =
          item.dataset.type;

        const unread =
          item.classList.contains(
            "unread"
          );


        let show = true;


        if (selected === "unread") {

          show = unread;

        } else if (
          selected !== "all"
        ) {

          show =
            type === selected;

        }


        item.style.display =
          show ? "flex" : "none";


        if (show) {
          visible++;
        }

      });


      notificationEmpty.classList.toggle(
        "show",
        visible === 0
      );

    }
  );

});


/* ==========================================
   MARK SINGLE NOTIFICATION READ
========================================== */

notificationItems.forEach(item => {

  item.addEventListener(
    "click",
    event => {

      if (
        event.target.closest(
          ".notification-more"
        )
      ) {
        return;
      }


      markNotificationRead(item);

    }
  );

});


function markNotificationRead(item) {

  const id =
    item.dataset.id;

  item.classList.remove(
    "unread"
  );


  const state =
    loadReadState();

  state[id] = true;

  saveReadState(state);

  updateCounts();

}


/* ==========================================
   MORE BUTTON
========================================== */

document
  .querySelectorAll(".notification-more")
  .forEach(button => {

    button.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        const item =
          button.closest(
            ".notification-item"
          );

        if (!item) return;


        markNotificationRead(
          item
        );


        alert(
          "Notification marked as read."
        );

      }
    );

  });


/* ==========================================
   MARK ALL READ
========================================== */

markAllReadBtn.addEventListener(
  "click",
  () => {

    const state =
      loadReadState();


    notificationItems.forEach(item => {

      const id =
        item.dataset.id;

      item.classList.remove(
        "unread"
      );

      state[id] = true;

    });


    saveReadState(state);

    updateCounts();


    markAllReadBtn.innerHTML =
      `<i class="ri-check-double-line"></i>
       All read`;


    setTimeout(() => {

      markAllReadBtn.innerHTML =
        `<i class="ri-check-double-line"></i>
         Mark all read`;

    }, 1400);

  }
);


/* ==========================================
   MESSAGE SEARCH
========================================== */

messageSearch.addEventListener(
  "input",
  () => {

    const query =
      messageSearch.value
        .trim()
        .toLowerCase();


    let visible = 0;


    messageItems.forEach(item => {

      const searchable =
        (
          item.dataset.search ||
          ""
        ).toLowerCase();


      const show =
        !query ||
        searchable.includes(query);


      item.style.display =
        show ? "flex" : "none";


      if (show) {
        visible++;
      }

    });


    messageEmpty.classList.toggle(
      "show",
      visible === 0
    );

  }
);


/* ==========================================
   MESSAGE CLICK
========================================== */

messageItems.forEach(item => {

  item.addEventListener(
    "click",
    () => {

      const id =
        item.dataset.messageId;


      item.classList.remove(
        "unread"
      );


      const state =
        loadMessageState();

      state[id] = true;

      saveMessageState(state);

      updateCounts();


      /*
        Later this will open a real
        conversation/message page.
      */

      const sender =
        item.querySelector(
          ".message-top strong"
        )?.textContent ||
        "Message";


      alert(
        `Opening conversation with ${sender}...`
      );

    }
  );

});


/* ==========================================
   NEW MESSAGE
========================================== */

newMessageBtn.addEventListener(
  "click",
  () => {

    alert(
      "The messaging system will be connected to EcoData Support and sellers later."
    );

  }
);


/* ==========================================
   SIGN OUT
========================================== */

signOutBtn.addEventListener(
  "click",
  () => {

    const confirmed =
      confirm(
        "Are you sure you want to sign out?"
      );

    if (!confirmed) return;


    /*
      Firebase logout will be connected later.

      Example:

      await signOut(auth);

    */

    window.location.href =
      "index.html";

  }
);