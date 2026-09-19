/* ==========================================
ECODATA STORE ADDRESSES
========================================== */

const ADDRESSES_KEY =
"ecoStoreAddresses";

const CART_KEY =
"ecoStoreCart";

let addresses = [];
let editingId = null;

// ==========================================
// DOM
// ==========================================

const addressesList =
document.getElementById(
"addressesList"
);

const addressesEmpty =
document.getElementById(
"addressesEmpty"
);

const addressCount =
document.getElementById(
"addressCount"
);

const addressModal =
document.getElementById(
"addressModal"
);

const addressModalTitle =
document.getElementById(
"addressModalTitle"
);

const addressForm =
document.getElementById(
"addressForm"
);

const addAddressBtn =
document.getElementById(
"addAddressBtn"
);

const emptyAddAddressBtn =
document.getElementById(
"emptyAddAddressBtn"
);

const closeAddressModal =
document.getElementById(
"closeAddressModal"
);

const cancelAddressBtn =
document.getElementById(
"cancelAddressBtn"
);

const addressName =
document.getElementById(
"addressName"
);

const addressPhone =
document.getElementById(
"addressPhone"
);

const addressLine =
document.getElementById(
"addressLine"
);

const addressCity =
document.getElementById(
"addressCity"
);

const addressRegion =
document.getElementById(
"addressRegion"
);

const addressLandmark =
document.getElementById(
"addressLandmark"
);

const addressDefault =
document.getElementById(
"addressDefault"
);

// ==========================================
// LOAD
// ==========================================

function loadAddresses() {

try {

const saved =
  localStorage.getItem(
    ADDRESSES_KEY
  );

if (!saved) {
  return [];
}

const parsed =
  JSON.parse(saved);

return Array.isArray(parsed)
  ? parsed
  : [];

} catch (error) {

console.error(
  "Unable to load addresses:",
  error
);

return [];

}

}

// ==========================================
// SAVE
// ==========================================

function saveAddresses() {

localStorage.setItem(
ADDRESSES_KEY,
JSON.stringify(addresses)
);

}

// ==========================================
// ADDRESS TYPE ICON
// ==========================================

function getAddressIcon(type) {

if (type === "Home") {
return "ri-home-4-line";
}

if (type === "Work") {
return "ri-briefcase-4-line";
}

return "ri-map-pin-line";

}

// ==========================================
// RENDER
// ==========================================

function renderAddresses() {

addressesList.innerHTML = "";

if (!addresses.length) {

addressesEmpty.classList.add(
  "visible"
);

addressCount.textContent =
  "0 addresses";

return;

}

addressesEmpty.classList.remove(
"visible"
);

addressCount.textContent =`
"${addresses.length} ${ addresses.length === 1 ? "address" : "addresses" }"`;

addresses.forEach(address => {

const card =
  document.createElement("article");

card.className =
  "address-card" +
  (
    address.isDefault
      ? " default"
      : ""
  );


card.innerHTML = `

  <div class="address-card-top">

    <div class="address-type">

      <div class="address-type-icon">

        <i class="${getAddressIcon(
          address.type
        )}"></i>

      </div>

      <div class="address-type-info">

        <strong>
          ${escapeHTML(address.type)}
        </strong>

        <span>
          Delivery address
        </span>

      </div>

    </div>


    ${
      address.isDefault
        ? `
          <span class="default-badge">
            <i class="ri-checkbox-circle-fill"></i>
            Default
          </span>
        `
        : ""
    }

  </div>


  <div class="address-card-body">

    <div class="address-recipient">

      ${escapeHTML(address.name)}

      <span class="address-phone">
        ${escapeHTML(address.phone)}
      </span>

    </div>


    <div class="address-lines">

      ${escapeHTML(address.line)}

      <br>

      ${escapeHTML(address.city)}

      ${
        address.region
          ? `, ${escapeHTML(address.region)}`
          : ""
      }

    </div>


    ${
      address.landmark
        ? `
          <div class="address-landmark">

            <i class="ri-compass-3-line"></i>

            <span>
              ${escapeHTML(
                address.landmark
              )}
            </span>

          </div>
        `
        : ""
    }

  </div>


  <div class="address-card-actions">

    ${
      !address.isDefault
        ? `
          <button
            type="button"
            class="address-default-btn"
            data-action="default"
            data-id="${address.id}"
          >
            <i class="ri-checkbox-circle-line"></i>
            Set Default
          </button>
        `
        : ""
    }


    <button
      type="button"
      class="address-edit-btn"
      data-action="edit"
      data-id="${address.id}"
    >

      <i class="ri-edit-line"></i>

      Edit

    </button>


    <button
      type="button"
      class="address-delete-btn"
      data-action="delete"
      data-id="${address.id}"
      aria-label="Delete address"
    >

      <i class="ri-delete-bin-line"></i>

    </button>

  </div>

`;


addressesList.appendChild(
  card
);

});

}

// ==========================================
// OPEN MODAL
// ==========================================

function openModal(
address = null
) {

editingId =
address?.id || null;

addressModalTitle.textContent =
address
? "Edit Address"
: "Add Address";

addressForm.reset();

// Reset address type.

document
.querySelectorAll(
".address-type-option"
)
.forEach(option => {

  option.classList.remove(
    "active"
  );

});

const homeOption =
document.querySelector(
'.address-type-option input[value="Home"]'
);

if (homeOption) {

homeOption.checked =
  true;

homeOption
  .closest(
    ".address-type-option"
  )
  .classList.add(
    "active"
  );

}

if (address) {

addressName.value =
  address.name || "";

addressPhone.value =
  address.phone || "";

addressLine.value =
  address.line || "";

addressCity.value =
  address.city || "";

addressRegion.value =
  address.region || "";

addressLandmark.value =
  address.landmark || "";

addressDefault.checked =
  Boolean(
    address.isDefault
  );


const typeInput =
  document.querySelector(
    `.address-type-option input[value="${CSS.escape(
      address.type
    )}"]`
  );


if (typeInput) {

  typeInput.checked =
    true;

  document
    .querySelectorAll(
      ".address-type-option"
    )
    .forEach(option => {

      option.classList.remove(
        "active"
      );

    });

  typeInput
    .closest(
      ".address-type-option"
    )
    .classList.add(
      "active"
    );

}

}

addressModal.classList.add(
"open"
);

addressModal.setAttribute(
"aria-hidden",
"false"
);

document.body.style.overflow =
"hidden";

setTimeout(() => {

addressName.focus();

}, 100);

}

// ==========================================
// CLOSE MODAL
// ==========================================

function closeModal() {

addressModal.classList.remove(
"open"
);

addressModal.setAttribute(
"aria-hidden",
"true"
);

document.body.style.overflow =
"";

editingId = null;

}

// ==========================================
// ADDRESS TYPE
// ==========================================

document
.querySelectorAll(
".address-type-option"
)
.forEach(option => {

option.addEventListener(
  "click",
  () => {

    document
      .querySelectorAll(
        ".address-type-option"
      )
      .forEach(item => {

        item.classList.remove(
          "active"
        );

      });


    option.classList.add(
      "active"
    );


    const input =
      option.querySelector(
        "input"
      );

    if (input) {
      input.checked =
        true;
    }

  }
);

});

// ==========================================
// SAVE ADDRESS
// ==========================================

addressForm.addEventListener(
"submit",
event => {

event.preventDefault();


if (!validateAddress()) {
  return;
}


const selectedType =
  document.querySelector(
    'input[name="addressType"]:checked'
  );


const address = {

  id:
    editingId ||
    createAddressId(),

  type:
    selectedType?.value ||
    "Home",

  name:
    addressName.value.trim(),

  phone:
    addressPhone.value.trim(),

  line:
    addressLine.value.trim(),

  city:
    addressCity.value.trim(),

  region:
    addressRegion.value,

  landmark:
    addressLandmark.value.trim(),

  isDefault:
    addressDefault.checked,

  updatedAt:
    new Date().toISOString()

};


if (address.isDefault) {

  addresses =
    addresses.map(item => ({
      ...item,
      isDefault: false
    }));

}


if (editingId) {

  const index =
    addresses.findIndex(
      item =>
        item.id === editingId
    );


  if (index !== -1) {

    addresses[index] =
      address;

  }

} else {

  addresses.unshift(
    address
  );

}


/*
  If this is the first address,
  automatically make it default.
*/

if (addresses.length === 1) {

  addresses[0].isDefault =
    true;

}


saveAddresses();

renderAddresses();

closeModal();


showSnackbar(
  editingId
    ? "Address updated."
    : "Address saved."
);

}
);

// ==========================================
// VALIDATION
// ==========================================

function validateAddress() {

clearErrors();

let valid = true;

if (!addressName.value.trim()) {

showError(
  "addressNameError",
  "Enter the recipient name."
);

valid = false;

}

const phone =
addressPhone.value.trim();

if (!phone) {

showError(
  "addressPhoneError",
  "Enter a phone number."
);

valid = false;

} else if (
!/^(0\d{9}|233\d{9})$/.test(phone)
) {

showError(
  "addressPhoneError",
  "Enter a valid Ghana phone number."
);

valid = false;

}

if (!addressLine.value.trim()) {

showError(
  "addressLineError",
  "Enter the delivery address."
);

valid = false;

}

return valid;

}

function showError(
id,
message
) {

const element =
document.getElementById(id);

if (element) {

element.textContent =
  message;

}

}

function clearErrors() {

document
.querySelectorAll(
".address-field small"
)
.forEach(element => {

  element.textContent =
    "";

});

}

// ==========================================
// CARD ACTIONS
// ==========================================

addressesList.addEventListener(
"click",
event => {

const button =
  event.target.closest(
    "button[data-action]"
  );


if (!button) {
  return;
}


const action =
  button.dataset.action;

const id =
  button.dataset.id;


if (action === "edit") {

  const address =
    addresses.find(
      item =>
        item.id === id
    );

  if (address) {
    openModal(address);
  }

  return;

}


if (action === "default") {

  setDefaultAddress(id);

  return;

}


if (action === "delete") {

  deleteAddress(id);

}

}
);

// ==========================================
// SET DEFAULT
// ==========================================

function setDefaultAddress(id) {

addresses =
addresses.map(address => ({

  ...address,

  isDefault:
    address.id === id

}));

saveAddresses();

renderAddresses();

showSnackbar(
"Default address updated."
);

}

// ==========================================
// DELETE
// ==========================================

function deleteAddress(id) {

const address =
addresses.find(
item =>
item.id === id
);

if (!address) {
return;
}

const confirmed =
window.confirm(
"Delete your ${address.type.toLowerCase()} address?"
);

if (!confirmed) {
return;
}

const wasDefault =
address.isDefault;

addresses =
addresses.filter(
item =>
item.id !== id
);

/*
If the default address was deleted,
automatically promote another address.
*/

if (
wasDefault &&
addresses.length
) {

addresses[0].isDefault =
  true;

}

saveAddresses();

renderAddresses();

showSnackbar(
"Address deleted."
);

}

// ==========================================
// ID
// ==========================================

function createAddressId() {

return (
"ADDR-" +
Date.now() +
"-" +
Math.floor(
Math.random() * 1000
)
);

}

// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

const element =
document.createElement("div");

element.textContent =
String(value ?? "");

return element.innerHTML;

}

// ==========================================
// BUTTON EVENTS
// ==========================================

addAddressBtn.addEventListener(
"click",
() => openModal()
);

emptyAddAddressBtn.addEventListener(
"click",
() => openModal()
);

closeAddressModal.addEventListener(
"click",
closeModal
);

cancelAddressBtn.addEventListener(
"click",
closeModal
);

document
.querySelector(
".address-modal-overlay"
)
.addEventListener(
"click",
closeModal
);

// ==========================================
// ESC KEY
// ==========================================

document.addEventListener(
"keydown",
event => {

if (
  event.key === "Escape" &&
  addressModal.classList.contains(
    "open"
  )
) {

  closeModal();

}

}
);

// ==========================================
// CART COUNT
// ==========================================

function updateCartCount() {

const element =
document.getElementById(
"navCartCount"
);

if (!element) {
return;
}

try {

const saved =
  localStorage.getItem(
    CART_KEY
  );

const cart =
  saved
    ? JSON.parse(saved)
    : [];


const count =
  Array.isArray(cart)
    ? cart.reduce(
        (total, item) =>
          total +
          Number(
            item.quantity || 1
          ),
        0
      )
    : 0;


element.textContent =
  count;

} catch {

element.textContent =
  "0";

}

}

// ==========================================
// SEARCH
// ==========================================

const addressSearch =
document.getElementById(
"addressSearch"
);

if (addressSearch) {

addressSearch.addEventListener(
"keydown",
event => {

  if (
    event.key === "Enter"
  ) {

    const query =
      addressSearch.value.trim();

    if (!query) {
      return;
    }

    window.location.href =
      `index.html?search=${encodeURIComponent(
        query
      )}`;

  }

}

);

}

// ==========================================
// SNACKBAR
// ==========================================

function showSnackbar(
message
) {

const snackbar =
document.getElementById(
"addressSnackbar"
);

snackbar.textContent =
message;

snackbar.classList.add(
"show"
);

clearTimeout(
showSnackbar.timer
);

showSnackbar.timer =
setTimeout(() => {

  snackbar.classList.remove(
    "show"
  );

}, 2400);

}

// ==========================================
// INITIALIZE
// ==========================================

addresses =
loadAddresses();

renderAddresses();

updateCartCount();