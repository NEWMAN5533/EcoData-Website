/* ==========================================
ECODATA STORE PROFILE
========================================== */

const PROFILE_KEY = "ecoStoreProfile";
const CART_KEY = "ecoStoreCart";

// ==========================================
// DEFAULT PROFILE
// ==========================================

const defaultProfile = {

name: "IA Tech",

email: "user@example.com",

phone: "",

country: "Ghana",

bio: "",

avatar: "",

memberSince: "2026"

};

// ==========================================
// DOM
// ==========================================

const profileForm =
document.getElementById(
"profileForm"
);

const fullName =
document.getElementById(
"fullName"
);

const email =
document.getElementById(
"email"
);

const phone =
document.getElementById(
"phone"
);

const country =
document.getElementById(
"country"
);

const bio =
document.getElementById(
"bio"
);

const profileAvatar =
document.getElementById(
"profileAvatar"
);

const avatarInput =
document.getElementById(
"avatarInput"
);

const displayName =
document.getElementById(
"profileDisplayName"
);

const displayEmail =
document.getElementById(
"profileDisplayEmail"
);

const saveMessage =
document.getElementById(
"profileSaveMessage"
);

const cancelBtn =
document.getElementById(
"cancelProfileBtn"
);

const signOutBtn =
document.getElementById(
"signOutBtn"
);

// ==========================================
// LOAD PROFILE
// ==========================================

function loadProfile() {

try {

const saved =
  localStorage.getItem(
    PROFILE_KEY
  );

if (!saved) {

  return {
    ...defaultProfile
  };

}

const parsed =
  JSON.parse(saved);

return {
  ...defaultProfile,
  ...(parsed || {})
};

} catch (error) {

console.error(
  "Unable to load profile:",
  error
);

return {
  ...defaultProfile
};

}

}

// ==========================================
// SAVE PROFILE
// ==========================================

function saveProfile(profile) {

localStorage.setItem(
PROFILE_KEY,
JSON.stringify(profile)
);

}

// ==========================================
// APPLY PROFILE TO UI
// ==========================================

function renderProfile(profile) {

fullName.value =
profile.name || "";

email.value =
profile.email || "";

phone.value =
profile.phone || "";

country.value =
profile.country || "Ghana";

bio.value =
profile.bio || "";

displayName.textContent =
profile.name ||
"Your Name";

displayEmail.textContent =
profile.email ||
"No email added";

renderAvatar(
profile.avatar
);

}

// ==========================================
// AVATAR
// ==========================================

function renderAvatar(
avatar
) {

if (avatar) {

profileAvatar.innerHTML = `

  <img
    src="${avatar}"
    alt="Profile photo"
  >

`;

return;

}

profileAvatar.innerHTML = `

<i class="ri-user-3-line"></i>

`;

}

// ==========================================
// AVATAR UPLOAD
// ==========================================

avatarInput.addEventListener(
"change",
handleAvatarChange
);

function handleAvatarChange(event) {

const file =
event.target.files?.[0];

if (!file) {
return;
}

if (!file.type.startsWith("image/")) {

showSnackbar(
  "Please select an image."
);

return;

}

/*
Frontend demo only.

For production, upload the image
to Firebase Storage instead of
storing a large Base64 string.

*/

const reader =
new FileReader();

reader.onload = () => {

const profile =
  loadProfile();

profile.avatar =
  reader.result;

saveProfile(profile);

renderAvatar(
  profile.avatar
);


showSnackbar(
  "Profile photo updated."
);

};

reader.readAsDataURL(file);

}

// ==========================================
// SAVE FORM
// ==========================================

profileForm.addEventListener(
"submit",
event => {

event.preventDefault();


const name =
  fullName.value.trim();

const userEmail =
  email.value.trim();


if (!name) {

  showSnackbar(
    "Please enter your full name."
  );

  fullName.focus();

  return;
}


if (
  !userEmail ||
  !isValidEmail(userEmail)
) {

  showSnackbar(
    "Please enter a valid email."
  );

  email.focus();

  return;
}


const currentProfile =
  loadProfile();


const updatedProfile = {

  ...currentProfile,

  name,

  email: userEmail,

  phone:
    phone.value.trim(),

  country:
    country.value,

  bio:
    bio.value.trim()

};


saveProfile(
  updatedProfile
);


renderProfile(
  updatedProfile
);


saveMessage.textContent =
  "Changes saved";


setTimeout(() => {

  saveMessage.textContent =
    "";

}, 2500);


showSnackbar(
  "Profile updated successfully."
);

}
);

// ==========================================
// CANCEL
// ==========================================

cancelBtn.addEventListener(
"click",
() => {

const profile =
  loadProfile();

renderProfile(
  profile
);

saveMessage.textContent =
  "";

}
);

// ==========================================
// EMAIL VALIDATION
// ==========================================

function isValidEmail(
value
) {

return /^[^\s@]+@[^\s@]+.[^\s@]+$/
.test(value);

}

// ==========================================
// CART COUNT
// ==========================================

function updateCartCount() {

const cartCount =
document.getElementById(
"navCartCount"
);

if (!cartCount) {
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


cartCount.textContent =
  count;

} catch {

cartCount.textContent =
  "0";

}

}

// ==========================================
// SEARCH
// ==========================================

const profileSearch =
document.getElementById(
"profileSearch"
);

if (profileSearch) {

profileSearch.addEventListener(
"keydown",
event => {

  if (
    event.key === "Enter"
  ) {

    const query =
      profileSearch.value
        .trim();

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
// SIGN OUT
// ==========================================

signOutBtn.addEventListener(
"click",
() => {

const confirmed =
  window.confirm(
    "Are you sure you want to sign out?"
  );


if (!confirmed) {
  return;
}


/*
  Firebase Auth logout will be
  connected here later:

  await signOut(auth);
*/


showSnackbar(
  "Signed out successfully."
);


setTimeout(() => {

  window.location.href =
    "index.html";

}, 700);

}
);

// ==========================================
// SNACKBAR
// ==========================================

function showSnackbar(
message
) {

const snackbar =
document.getElementById(
"profileSnackbar"
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

}, 2500);

}

// ==========================================
// INITIALIZE
// ==========================================

const profile =
loadProfile();

renderProfile(
profile
);

updateCartCount();