// ==========================================
// AFA CONFIG
// ==========================================

const AFA_PRICE_GHS = 20;

const PAYSTACK_PUBLIC_KEY =
  "pk_live_635856447ee14b583349141b7271f64c9b969749";

const AFA_STORAGE_KEY =
  "ecoDataAfaRegistrations";

const AFA_STATUS_INTERVAL =
  40000; // 40 seconds

const AFA_ACTIVE_STATUSES = [
  "pending",
  "processing",
  "in-progress"
];

let selectedRegion = "";


// ==========================================
// DOM ELEMENTS
// ==========================================

const afaForm =
  document.getElementById("afa-Form");

const afaSubmitBtn =
  document.getElementById("afaSubmit");

const regionBtn =
  document.querySelector(
    ".form-wrapperRegions .region"
  );

const regionSheet =
  document.querySelector(".regions-sheet");

const regionOptions =
  document.querySelectorAll(".regionSelect");

const loader =
  document.getElementById("paystackLoader");


// ==========================================
// REGION SELECTOR
// ==========================================

regionBtn?.addEventListener("click", (e) => {

  e.preventDefault();
  e.stopPropagation();

  if (!regionSheet) return;

  const isOpen =
    regionSheet.style.display === "flex";

  regionSheet.style.display =
    isOpen ? "none" : "flex";

});


regionOptions.forEach((option) => {

  option.addEventListener("click", (e) => {

    e.stopPropagation();

    selectedRegion =
      option.dataset.region?.trim() || "";

    if (regionBtn) {

      regionBtn.innerHTML = `
        <span>${escapeAfaHTML(selectedRegion)}</span>
        <img
          src="./css/icons/more.png.png"
          alt=""
        >
      `;

      regionBtn.classList.remove(
        "afa-input-error"
      );
    }

    if (regionSheet) {
      regionSheet.style.display = "none";
    }

  });

});


// ==========================================
// CLOSE REGION SHEET
// ==========================================

document.addEventListener("click", (event) => {

  if (
    regionSheet &&
    regionBtn &&
    !regionSheet.contains(event.target) &&
    !regionBtn.contains(event.target)
  ) {

    regionSheet.style.display = "none";

  }

});


// ==========================================
// LOADING STATE
// ==========================================

function setAfaLoading(
  state,
  text = "Processing..."
) {

  if (!afaSubmitBtn) return;


  if (state) {

    afaSubmitBtn.disabled = true;

    if (!afaSubmitBtn.dataset.originalText) {

      afaSubmitBtn.dataset.originalText =
        afaSubmitBtn.textContent;

    }

    afaSubmitBtn.innerHTML = `
      <span class="afa-submit-spinner"></span>
      ${escapeAfaHTML(text)}
    `;

    afaSubmitBtn.classList.add("loading");

  } else {

    afaSubmitBtn.disabled = false;

    afaSubmitBtn.textContent =
      afaSubmitBtn.dataset.originalText ||
      "Proceed with Registration";

    afaSubmitBtn.classList.remove("loading");

    delete afaSubmitBtn.dataset.originalText;
  }

}


// ==========================================
// LOADER
// ==========================================

function showLoader() {

  if (loader) {
    loader.style.display = "flex";
  }

  document.body.classList.add(
    "no-scroll"
  );

}


function hideLoader() {

  if (loader) {
    loader.style.display = "none";
  }

  document.body.classList.remove(
    "no-scroll"
  );

}


// ==========================================
// VALIDATION
// ==========================================

function isValidFullName(name) {

  return Boolean(
    name &&
    name.trim().split(/\s+/).length >= 2
  );

}


function isValidGhanaPhone(phone) {

  const cleaned =
    String(phone || "")
      .replace(/\s+/g, "")
      .trim();

  return /^(0\d{9}|233\d{9})$/.test(
    cleaned
  );

}


function isValidGhanaCard(card) {

  return /^GHA-\d{9}-\d$/i.test(
    String(card || "").trim()
  );

}


function isValidDOB(dob) {

  if (!dob) return false;

  const birth =
    new Date(dob);

  if (
    Number.isNaN(
      birth.getTime()
    )
  ) {
    return false;
  }

  const today =
    new Date();

  let age =
    today.getFullYear() -
    birth.getFullYear();

  const month =
    today.getMonth() -
    birth.getMonth();

  if (
    month < 0 ||
    (
      month === 0 &&
      today.getDate() <
      birth.getDate()
    )
  ) {
    age--;
  }

  return age >= 18;

}


// ==========================================
// AFA FORM SUBMIT
// ==========================================

afaForm?.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const formData =
      new FormData(afaForm);


    const fullName =
      String(
        formData.get("fullName") || ""
      ).trim();

    const phone =
      String(
        formData.get("phone") || ""
      ).trim();

    const ghanaCard =
      String(
        formData.get("ghanaCard") || ""
      ).trim();

    const occupation =
      String(
        formData.get("occupation") || ""
      ).trim();

    const location =
      String(
        formData.get("location") || ""
      ).trim();

    const dob =
      String(
        formData.get("dob") || ""
      ).trim();


    // ======================================
    // VALIDATE REGION
    // ======================================

    if (!selectedRegion) {

      regionBtn?.classList.add(
        "afa-input-error"
      );

      showSnackBar(
        "Please select your region.",
        "warning"
      );

      return;
    }


    // ======================================
    // VALIDATE NAME
    // ======================================

    if (!isValidFullName(fullName)) {

      showSnackBar(
        "Please enter your full name.",
        "warning"
      );

      return;
    }


    // ======================================
    // VALIDATE PHONE
    // ======================================

    const cleanedPhone =
      phone.replace(/\s+/g, "");


    if (!isValidGhanaPhone(cleanedPhone)) {

      showSnackBar(
        "Please enter a valid Ghana phone number.",
        "warning"
      );

      return;
    }


    // ======================================
    // VALIDATE GHANA CARD
    // ======================================

    const cleanedId =
      ghanaCard
        .toUpperCase()
        .trim();


    if (!isValidGhanaCard(cleanedId)) {

      showSnackBar(
        "Enter a valid Ghana Card number, e.g. GHA-202501234-5.",
        "warning"
      );

      return;
    }


    // ======================================
    // OTHER FIELDS
    // ======================================

    if (!occupation) {

      showSnackBar(
        "Please enter your occupation.",
        "warning"
      );

      return;
    }


    if (!location) {

      showSnackBar(
        "Please enter your location.",
        "warning"
      );

      return;
    }


    if (!isValidDOB(dob)) {

      showSnackBar(
        "You must be 18 years or older.",
        "warning"
      );

      return;
    }


    // ======================================
    // PAYMENT DATA
    // ======================================

    const afaData = {

      fullName,

      phone: cleanedPhone,

      ghanaCard: cleanedId,

      occupation,

      location,

      dob,

      region: selectedRegion

    };


    console.log(
      "AFA payment data:",
      afaData
    );


    // ======================================
    // START PAYMENT
    // ======================================

    setAfaLoading(
      true,
      "Initializing Payment..."
    );


    try {

      await startAfaPayment(
        afaData
      );

    } catch (error) {

      console.error(
        "AFA payment initialization error:",
        error
      );

      hideLoader();

      setAfaLoading(false);

      showSnackBar(
        error.message ||
        "Unable to initialize payment.",
        "error"
      );

    }

  }
);


// ==========================================
// START PAYSTACK PAYMENT
// ==========================================

function startAfaPayment(
  afaData
) {

  return new Promise(
    (resolve, reject) => {

      try {

        // ==================================
        // SHOW OUR LOADER
        // ==================================

        showLoader();


        // ==================================
        // GIVE BROWSER TIME TO PAINT
        // ==================================

        setTimeout(() => {

          try {

            if (
              typeof PaystackPop ===
              "undefined"
            ) {

              throw new Error(
                "Paystack payment service is unavailable."
              );

            }


            const paystack =
              new PaystackPop();


            paystack.newTransaction({

              key:
                PAYSTACK_PUBLIC_KEY,

              email:
                `${afaData.phone}@ecodata.afa-program.com`,

              amount:
                AFA_PRICE_GHS * 100,

              currency:
                "GHS",

              ref:
                "AFA_" +
                Date.now(),

              metadata: {

                custom_fields: [

                  {
                    display_name:
                      "Full Name",

                    value:
                      afaData.fullName
                  },

                  {
                    display_name:
                      "Phone",

                    value:
                      afaData.phone
                  },

                  {
                    display_name:
                      "GhanaCard",

                    value:
                      afaData.ghanaCard
                  },

                  {
                    display_name:
                      "Occupation",

                    value:
                      afaData.occupation
                  },

                  {
                    display_name:
                      "Location",

                    value:
                      afaData.location
                  },

                  {
                    display_name:
                      "Date of Birth",

                    value:
                      afaData.dob
                  },

                  {
                    display_name:
                      "Region",

                    value:
                      afaData.region
                  }

                ]

              },


              // ============================
              // PAYMENT SUCCESS
              // ============================

              onSuccess:
                async (response) => {

                  hideLoader();


                  console.log(
                    "Paystack AFA payment success:",
                    response
                  );


                  setAfaLoading(
                    true,
                    "Verifying Payment..."
                  );


                  try {

                    const savedRegistration =
                      await handleAfaPaymentSuccess(
                        response.reference,
                        afaData
                      );


                    resolve(
                      savedRegistration
                    );

                  } catch (error) {

                    reject(error);

                  }

                },


              // ============================
              // PAYMENT CANCELLED
              // ============================

              onCancel: () => {

                hideLoader();

                setAfaLoading(false);

                showSnackBar(
                  "Payment cancelled.",
                  "error"
                );

                reject(
                  new Error(
                    "Payment cancelled."
                  )
                );

              }

            });

          } catch (error) {

            hideLoader();

            reject(error);

          }

        }, 120);

      } catch (error) {

        hideLoader();

        reject(error);

      }

    }
  );

}


// ==========================================
// PAYMENT SUCCESS → BACKEND REGISTRATION
// ==========================================

async function handleAfaPaymentSuccess(
  paymentReference,
  formPayload
) {

  if (!paymentReference) {

    throw new Error(
      "Payment reference is missing."
    );

  }


  // ========================================
  // SEND PAYMENT REFERENCE + FORM DATA
  // ========================================

  const result =
    await registerAfaCustomer({

      name:
        formPayload.fullName,

      phoneNumber:
        formPayload.phone,

      idNumber:
        formPayload.ghanaCard,

      occupation:
        formPayload.occupation,

      location:
        formPayload.location,

      region:
        formPayload.region,

      dateOfBirth:
        formPayload.dob,

      paymentReference

    });


  const registration =
    result.registration;


  if (!registration) {

    throw new Error(
      "Registration information was not returned."
    );

  }


  // ========================================
  // SAVE
  // ========================================

  const savedRegistration =
    saveNewAfaRegistration(
      registration,
      paymentReference
    );


  // ========================================
  // SUCCESS MESSAGE
  // ========================================

  showSnackBar(
    "Payment confirmed and AFA registration submitted successfully.",
    "success"
  );


  // ========================================
  // RECEIPT
  // ========================================

  showAfaSuccessReceipt(
    savedRegistration,
    paymentReference
  );


  // ========================================
  // RESET FORM
  // ========================================

  afaForm?.reset();

  selectedRegion = "";

  if (regionBtn) {

    regionBtn.innerHTML = `
      <span>Select Your Region</span>
      <img
        src="./css/icons/more.png.png"
        alt=""
      >
    `;

  }


  setAfaLoading(false);


  return savedRegistration;

}


// ==========================================
// SEND AFA REGISTRATION TO BACKEND
// ==========================================

async function registerAfaCustomer(
  payload
) {

  const response =
    await fetch(
      "/api/afa/register",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(payload)
      }
    );


  let result;

  try {

    result =
      await response.json();


  } catch {

    throw new Error(
      "Invalid server response."
    );

  }


  if (
    !response.ok ||
    !result.success
  ) {

    throw new Error(
      result.message ||
      "AFA registration failed."
    );

  }


  return result;

}


// ==========================================
// SAVE AFA REGISTRATION
// ==========================================

let afaRegistrations = loadAfaRegistrations();


// ==========================================
// LOAD AFA REGISTRATIONS
// ==========================================

function loadAfaRegistrations() {

  try {

    const saved =
      localStorage.getItem(
        AFA_STORAGE_KEY
      );

    if (!saved) return [];

    const parsed =
      JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch (error) {

    console.error(
      "Load AFA history error:",
      error
    );

    return [];

  }

}


// ==========================================
// SAVE ALL AFA REGISTRATIONS
// ==========================================

function saveAfaRegistrations() {

  try {

    localStorage.setItem(
      AFA_STORAGE_KEY,
      JSON.stringify(
        afaRegistrations
      )
    );

  } catch (error) {

    console.error(
      "Failed to save AFA registration:",
      error
    );

  }

}


// ==========================================
// SAVE NEW AFA REGISTRATION
// ==========================================

function saveNewAfaRegistration(
  registration,
  paymentReference
) {

  const newRegistration = {

    ...registration,

    paymentReference:
      paymentReference || null,

    // Always keep EcoData's customer price
    ecoDataPrice:
      registration.ecoDataPrice ??
      AFA_PRICE_GHS

  };


  // ========================================
  // CHECK IF REGISTRATION ALREADY EXISTS
  // ========================================

  const existingIndex =
    afaRegistrations.findIndex(
      item =>
        item.registrationId ===
        newRegistration.registrationId
    );


  // ========================================
  // UPDATE EXISTING REGISTRATION
  // ========================================

  if (existingIndex !== -1) {

    afaRegistrations[
      existingIndex
    ] = {

      ...afaRegistrations[
        existingIndex
      ],

      ...newRegistration

    };


  } else {

    // ======================================
    // ADD NEW REGISTRATION TO TOP
    // ======================================

    afaRegistrations.unshift(
      newRegistration
    );

  }


  // ========================================
  // MAXIMUM LOCAL HISTORY
  // ========================================

  if (
    afaRegistrations.length > 50
  ) {

    afaRegistrations =
      afaRegistrations.slice(
        0,
        50
      );

  }


  // ========================================
  // SAVE TO LOCAL STORAGE
  // ========================================

  saveAfaRegistrations();


  // ========================================
  // UPDATE ONLY THIS TABLE ROW
  // ========================================

  renderAfaHistoryRow(
    newRegistration
  );


  // Make sure history container is visible
  const container =
    document.getElementById(
      "afaHistoryTrack"
    );

  if (container) {
    container.style.display = "flex";
  }


  return newRegistration;

}


// ==========================================
// INITIALIZE AFA HISTORY
// ==========================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    // Render saved registrations
    renderAfaHistory();

    // Start status checking
    startAfaPolling();

  }
);


// ==========================================
// AFA SUCCESS RECEIPT
// ==========================================

function showAfaSuccessReceipt(
  registration,
  paymentRef = null
) {

  if (!registration) {

    console.error(
      "Missing AFA registration data."
    );

    return;
  }


  const setText = (
    id,
    value
  ) => {

    const element =
      document.getElementById(id);

    if (element) {

      element.textContent =
        value || "—";

    }

  };


  setText(
    "rName",
    registration.name
  );

  setText(
    "rPhone",
    registration.phoneNumber
  );

  setText(
    "rGhanaCard",
    registration.idNumber
  );

  setText(
    "rRegion",
    registration.region
  );

  setText(
    "rRegistrationId",
    registration.registrationId
  );

  setText(
    "rStatus",
    formatAfaStatus(
      registration.status
    )
  );


  const ecoDataPrice =
    Number(
      registration.ecoDataPrice ??
      AFA_PRICE_GHS
    );


  setText(
    "rAmount",
    `GHS ${ecoDataPrice.toFixed(2)}`
  );


  setText(
    "rRef",
    paymentRef ||
    registration.paymentReference
  );


  const receipt =
    document.getElementById(
      "afaReceipt"
    );


  if (receipt) {

    receipt.classList.add(
      "show"
    );

  }

}


// ==========================================
// CLOSE RECEIPT
// ==========================================

function closeReceipt() {

  const receipt =
    document.getElementById(
      "afaReceipt"
    );

  if (!receipt) return;

  receipt.classList.remove(
    "show"
  );

}


// ==========================================
// FORMAT STATUS
// ==========================================

function formatAfaStatus(
  status
) {

  const normalized =
    String(status || "")
      .toLowerCase()
      .trim();


  const map = {

    pending:
      "Pending",

    processing:
      "Processing",

    "in-progress":
      "Processing",

    completed:
      "Completed",

    delivered:
      "Completed",

    successful:
      "Successful",

    success:
      "Successful",

    failed:
      "Failed",

    cancelled:
      "Cancelled",

    canceled:
      "Cancelled"

  };


  return (
    map[normalized] ||
    (
      normalized.charAt(0)
        .toUpperCase() +
      normalized.slice(1)
    ) ||
    "Pending"
  );

}



// ==========================================
// RENDER AFA HISTORY ROW
// ==========================================

function renderAfaHistoryRow(registration) {

  const tableBody =
    document.getElementById("afaRowWrapper");

  if (!tableBody) return;


  // Remove empty placeholder
  const empty =
    document.getElementById("afaEmpty-body");

  if (empty) {
    empty.hidden = true;
  }


  // ==========================================
  // FIND EXISTING ROW
  // ==========================================

  let row =
    tableBody.querySelector(
      `[data-id="${registration.registrationId}"]`
    );


  // ==========================================
  // CREATE ROW IF IT DOESN'T EXIST
  // ==========================================

  if (!row) {

    row = document.createElement("div");

    row.className =
      "afa-history-row";

    row.dataset.id =
      registration.registrationId || "";

    tableBody.appendChild(row);
  }


  // ==========================================
  // STATUS
  // ==========================================

  const status =
    registration.status || "pending";


  // ==========================================
  // DATE
  // ==========================================

  const date =
    registration.submittedAt
      ? (() => {

          const d =
            new Date(
              registration.submittedAt
            );

          const datePart =
            d.toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "2-digit",
                year: "numeric"
              }
            );

          const timePart =
            d.toLocaleTimeString(
              "en-US",
              {
                hour: "numeric",
                minute: "2-digit",
                hour12: true
              }
            ).toUpperCase();

          return `${datePart} ${timePart}`;

        })()
      : "N/A";


  // ==========================================
  // UPDATE ROW
  // ==========================================

  row.innerHTML = `

    <span class="afa-history-cell afa-name-cell">
      ${escapeAfaHTML(
        registration.name || "—"
      )}
    </span>


    <span class="afa-history-cell afa-phone-cell">
      ${escapeAfaHTML(
        registration.phoneNumber || "—"
      )}
    </span>


    <span class="afa-history-cell afa-card-cell">
      ${escapeAfaHTML(
        registration.idNumber || "—"
      )}
    </span>


    <span class="afa-history-cell afa-status-cell">

      <span class="afa-status-badge ${getAfaStatusClass(status)}">

        ${createAfaStatusPill(status)}

      </span>

    </span>


    <span class="afa-history-cell afa-region-cell">
      ${escapeAfaHTML(
        registration.region || "—"
      )}
    </span>


    <span class="afa-history-cell afa-amount-cell">
      GHS ${Number(
        registration.ecoDataPrice ??
        AFA_PRICE_GHS
      ).toFixed(2)}
    </span>


    <span class="afa-history-cell afa-payment-cell">
      ${escapeAfaHTML(
        registration.paymentReference ||
        "—"
      )}
    </span>


    <span class="afa-history-cell afa-date-cell">
      ${date}
    </span>

  `;
}


function renderAfaHistory() {

  const container =
    document.getElementById("afaHistoryTrack");

  const tableBody =
    document.getElementById("afaRowWrapper");

  const empty =
    document.getElementById("afaEmpty-body");

  if (
    !container ||
    !tableBody ||
    !empty
  ) return;


  // ==========================================
  // NO REGISTRATIONS
  // ==========================================

  if (
    !afaRegistrations ||
    afaRegistrations.length === 0
  ) {

    empty.hidden = false;

    container.style.display = "flex";

    return;
  }


  // ==========================================
  // REGISTRATIONS EXIST
  // ==========================================

  empty.hidden = true;


  afaRegistrations.forEach(
    registration => {

      renderAfaHistoryRow(
        registration
      );

    }
  );


  container.style.display = "flex";
}



// ==========================================
// STATUS PILL
// ==========================================

function createAfaStatusPill(
  status
) {

  const normalized =
    String(status || "pending")
      .toLowerCase()
      .trim();


  let statusClass =
    "afa-status-unknown";


  if (
    normalized === "pending"
  ) {

    statusClass =
      "afa-status-pending";

  }

  else if (
    [
      "processing",
      "in-progress"
    ].includes(normalized)
  ) {

    statusClass =
      "afa-status-processing";

  }

  else if (
    [
      "completed",
      "delivered",
      "successful",
      "success"
    ].includes(normalized)
  ) {

    statusClass =
      "afa-status-success";

  }

  else if (
    [
      "failed",
      "cancelled",
      "canceled"
    ].includes(normalized)
  ) {

    statusClass =
      "afa-status-failed";

  }


  return `
    <span class="afa-status-pill ${statusClass}">
      <span class="afa-status-dot"></span>
      ${escapeAfaHTML(
        formatAfaStatus(
          normalized
        )
      )}
    </span>
  `;

}


// ==========================================
// DATE
// ==========================================

function formatAfaDate(
  timestamp
) {

  if (!timestamp) return "—";


  const date =
    new Date(timestamp);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

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


// ==========================================
// ACTIVE STATUS
// ==========================================

function isAfaActiveStatus(
  status
) {

  return AFA_ACTIVE_STATUSES.includes(
    String(status || "")
      .toLowerCase()
      .trim()
  );

}


// ==========================================
// LIVE STATUS POLLING
// ==========================================

let afaPollingRunning =
  false;


async function refreshAfaStatuses() {

  if (afaPollingRunning) return;


  afaPollingRunning = true;


  try {

    const activeRegistrations =
      afaRegistrations.filter(
        registration =>
          registration.registrationId &&
          isAfaActiveStatus(
            registration.status
          )
      );


    if (
      !activeRegistrations.length
    ) {

      return;

    }


    for (
      const registration
      of activeRegistrations
    ) {

      try {

        const response =
          await fetch(
            `/api/afa/status/${encodeURIComponent(
              registration.registrationId
            )}`
          );


        let result;

        try {

          result =
            await response.json();

        } catch {

          console.warn(
            "Invalid AFA status response:",
            registration.registrationId
          );

          continue;

        }


        if (
          !response.ok ||
          !result.success ||
          !result.registration
        ) {

          console.warn(
            "AFA status check failed:",
            registration.registrationId,
            result.message
          );

          continue;

        }


        const updated =
          result.registration;


        const index =
          afaRegistrations.findIndex(
            item =>
              item.registrationId ===
              registration.registrationId
          );


        if (index === -1) {
          continue;
        }


        const previousStatus =
          afaRegistrations[index].status;


        afaRegistrations[index] = {

          ...afaRegistrations[index],

          ...updated,

          // NEVER allow Swift vendor
          // price to replace EcoData price
          ecoDataPrice:
            afaRegistrations[index]
              .ecoDataPrice ??
            AFA_PRICE_GHS,

          // Preserve Paystack reference
          paymentReference:
            afaRegistrations[index]
              .paymentReference ??
            null

        };


        const newStatus =
          updated.status;


        // ==================================
        // STATUS CHANGED
        // ==================================

        if (
          String(previousStatus)
            .toLowerCase() !==
          String(newStatus)
            .toLowerCase()
        ) {

          const normalized =
            String(newStatus || "")
              .toLowerCase();


          if (
            [
              "completed",
              "delivered",
              "successful",
              "success"
            ].includes(normalized)
          ) {

            showSnackBar(
              "Your AFA registration has been completed.",
              "success"
            );

          }

          else if (
            [
              "failed",
              "cancelled",
              "canceled"
            ].includes(normalized)
          ) {

            showSnackBar(
              `AFA registration ${formatAfaStatus(newStatus)}.`,
              "error"
            );

          }

          else {

            showSnackBar(
              `AFA registration ${formatAfaStatus(newStatus)}.`,
              "info"
            );

          }

        }


        console.log(
          "AFA status updated:",
          registration.registrationId,
          "→",
          newStatus
        );


      } catch (error) {

        console.error(
          "AFA status check error:",
          registration.registrationId,
          error
        );

      }

    }


    saveAfaRegistrations();

    renderAfaHistory();


  } finally {

    afaPollingRunning =
      false;

  }

}


// ==========================================
// START AFA POLLING
// ==========================================

async function startAfaPolling() {

  while (true) {

    try {

      await refreshAfaStatuses();

    } catch (error) {

      console.error(
        "AFA polling error:",
        error
      );

    }


    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          AFA_STATUS_INTERVAL
        )
    );

  }

}


// ==========================================
// INITIAL RENDER + POLLING
// ==========================================

renderAfaHistory();

startAfaPolling();


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeAfaHTML(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


// ==========================================
// SNACKBAR
// ==========================================

let snackbarTimeout;


function showSnackBar(
  message,
  type = "info",
  duration = 4000
) {

  let snackbar =
    document.querySelector(
      ".snackbar"
    );


  if (!snackbar) {

    snackbar =
      document.createElement(
        "div"
      );


    snackbar.className =
      "snackbar";


    snackbar.innerHTML = `
      <span class="snackbar-text"></span>
      <div class="snackbar-progress"></div>
    `;


    document.body.appendChild(
      snackbar
    );

  }


  snackbar.querySelector(
    ".snackbar-text"
  ).textContent =
    message;


  const colors = {

    success:
      "#071d1a",

    error:
      "#071d1a",

    warning:
      "#071d1a",

    info:
      "#071d1a"

  };


  snackbar.style.background =
    colors[type] ||
    colors.info;


  snackbar.classList.add(
    "show"
  );


  clearTimeout(
    snackbarTimeout
  );


  snackbarTimeout =
    setTimeout(
      () => {

        snackbar.classList.remove(
          "show"
        );

      },
      duration
    );

}


// ==========================================
// REAL TIME CLOCK
// ==========================================

function updateClock() {

  const clock =
    document.getElementById(
      "clock"
    );


  if (!clock) return;


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
      ? "0" + minutes
      : minutes;


  seconds =
    seconds < 10
      ? "0" + seconds
      : seconds;


  clock.innerHTML =
    `${dayName} ${hours}:${minutes}:${seconds} ${ampm}`;

}


setInterval(
  updateClock,
  1000
);

updateClock();