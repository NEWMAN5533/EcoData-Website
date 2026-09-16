/* ==========================================
   ECODATA STORE
   MY DOWNLOADS
   Frontend-only for now
========================================== */


/* ==========================================
   ELEMENTS
========================================== */

const downloadItems =
  document.querySelectorAll(
    ".download-item"
  );

const filters =
  document.querySelectorAll(
    ".download-filter"
  );

const librarySearch =
  document.getElementById(
    "librarySearch"
  );

const downloadSort =
  document.getElementById(
    "downloadSort"
  );

const refreshBtn =
  document.getElementById(
    "refreshDownloads"
  );

const downloadList =
  document.getElementById(
    "downloadList"
  );

const downloadsEmpty =
  document.getElementById(
    "downloadsEmpty"
  );

const signOutBtn =
  document.getElementById(
    "signOutBtn"
  );


let currentFilter = "all";
let currentSearch = "";


/* ==========================================
   FILTER + SEARCH
========================================== */

function updateDownloads() {

  const query =
    currentSearch
      .trim()
      .toLowerCase();

  let visibleItems = [];


  downloadItems.forEach(item => {

    const type =
      item.dataset.type;

    const name =
      (
        item.dataset.name || ""
      ).toLowerCase();


    const matchesFilter =
      currentFilter === "all" ||
      type === currentFilter;


    const matchesSearch =
      !query ||
      name.includes(query);


    const visible =
      matchesFilter &&
      matchesSearch;


    item.style.display =
      visible ? "flex" : "none";


    if (visible) {
      visibleItems.push(item);
    }

  });


  downloadsEmpty.classList.toggle(
    "show",
    visibleItems.length === 0
  );

}


/* ==========================================
   FILTER BUTTONS
========================================== */

filters.forEach(filter => {

  filter.addEventListener(
    "click",
    () => {

      filters.forEach(button => {

        button.classList.remove(
          "active"
        );

      });


      filter.classList.add(
        "active"
      );


      currentFilter =
        filter.dataset.filter;


      updateDownloads();

    }
  );

});


/* ==========================================
   SEARCH
========================================== */

librarySearch.addEventListener(
  "input",
  () => {

    currentSearch =
      librarySearch.value;

    updateDownloads();

  }
);


/* ==========================================
   SORT
========================================== */

downloadSort.addEventListener(
  "change",
  () => {

    const value =
      downloadSort.value;


    const items =
      [...downloadItems];


    items.sort(
      (a, b) => {

        if (value === "recent") {

          return (
            new Date(
              b.dataset.date
            ) -
            new Date(
              a.dataset.date
            )
          );

        }


        if (value === "oldest") {

          return (
            new Date(
              a.dataset.date
            ) -
            new Date(
              b.dataset.date
            )
          );

        }


        if (value === "name") {

          return (
            a.dataset.name
              .localeCompare(
                b.dataset.name
              )
          );

        }


        if (value === "size") {

          return (
            Number(
              b.dataset.size
            ) -
            Number(
              a.dataset.size
            )
          );

        }


        return 0;

      }
    );


    items.forEach(item => {

      downloadList.appendChild(
        item
      );

    });


    updateDownloads();

  }
);


/* ==========================================
   DOWNLOAD
========================================== */

document
  .querySelectorAll(".download-btn")
  .forEach(button => {

    button.addEventListener(
      "click",
      async () => {

        const product =
          button.dataset.product;


        const originalHTML =
          button.innerHTML;


        button.disabled = true;

        button.innerHTML =
          `<i class="ri-loader-4-line ri-spin"></i>
           Preparing...`;


        /*
          Frontend simulation.

          Later replace this with something like:

          GET /api/downloads/:productId

          The backend should verify that
          the authenticated user purchased
          the product before returning a
          secure download URL.
        */

        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              900
            )
        );


        button.innerHTML =
          `<i class="ri-check-line"></i>
           Ready`;


        /*
          Demo only.
          No real file is downloaded yet.
        */

        console.log(
          "Download requested:",
          product
        );


        setTimeout(() => {

          button.disabled = false;

          button.innerHTML =
            originalHTML;

        }, 1400);

      }
    );

  });


/* ==========================================
   VIEW PRODUCT
========================================== */

document
  .querySelectorAll(".download-view-btn")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const product =
          button.dataset.product;


        /*
          Later:

          window.location.href =
            `product.html?id=${productId}`;
        */


        alert(
          `Opening "${product}"...`
        );

      }
    );

  });


/* ==========================================
   REFRESH
========================================== */

refreshBtn.addEventListener(
  "click",
  async () => {

    const icon =
      refreshBtn.querySelector("i");


    refreshBtn.disabled = true;

    icon.classList.add(
      "ri-spin"
    );


    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          700
        )
    );


    icon.classList.remove(
      "ri-spin"
    );


    refreshBtn.disabled = false;


    updateDownloads();

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
      Firebase logout will be
      connected later.
    */


    window.location.href =
      "index.html";

  }
);


/* ==========================================
   INITIALIZE
========================================== */

updateDownloads();