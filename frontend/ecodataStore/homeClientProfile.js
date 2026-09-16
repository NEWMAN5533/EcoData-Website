/* =========================================
   PROFILE PAGE
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  const profileForm =
    document.getElementById("profileForm");

  const fullName =
    document.getElementById("fullName");

  const email =
    document.getElementById("email");

  const phone =
    document.getElementById("phone");

  const country =
    document.getElementById("country");

  const bio =
    document.getElementById("bio");

  const bioCount =
    document.getElementById("bioCount");

  const profileName =
    document.getElementById("profileName");

  const profileEmail =
    document.getElementById("profileEmail");

  const sidebarName =
    document.getElementById("sidebarName");

  const sidebarEmail =
    document.getElementById("sidebarEmail");

  const saveProfileBtn =
    document.getElementById("saveProfileBtn");

  const cancelProfileBtn =
    document.getElementById("cancelProfileBtn");

  const signOutBtn =
    document.getElementById("signOutBtn");

  const avatarInput =
    document.getElementById("avatarInput");

  const profileAvatarImage =
    document.getElementById("profileAvatarImage");

  const profileAvatarIcon =
    document.getElementById("profileAvatarIcon");

  const navAvatar =
    document.getElementById("navAvatar");

  const sidebarAvatar =
    document.getElementById("sidebarAvatar");

  const lastUpdated =
    document.getElementById("lastUpdated");


  /* =========================================
     DEFAULT PROFILE
  ========================================= */

  const defaultProfile = {

    name: "Ilyas Ahmed",

    email: "user@example.com",

    phone: "",

    country: "Ghana",

    bio: "",

    avatar: "",

    updatedAt: "Just now"

  };


  /* =========================================
     LOAD PROFILE
  ========================================= */

  function loadProfile() {

    let savedProfile = null;

    try {

      savedProfile =
        JSON.parse(
          localStorage.getItem("ecoStoreProfile")
        );

    } catch (error) {

      console.warn(
        "Unable to read saved profile."
      );

    }


    const profile = {

      ...defaultProfile,

      ...(savedProfile || {})

    };


    fullName.value =
      profile.name;

    email.value =
      profile.email;

    phone.value =
      profile.phone;

    country.value =
      profile.country;

    bio.value =
      profile.bio;


    updateProfileDisplay(profile);

    updateBioCount();

  }


  /* =========================================
     UPDATE PROFILE DISPLAY
  ========================================= */

  function updateProfileDisplay(profile) {

    profileName.textContent =
      profile.name || "EcoData User";

    profileEmail.textContent =
      profile.email || "No email added";

    sidebarName.textContent =
      profile.name || "EcoData User";

    sidebarEmail.textContent =
      profile.email || "No email added";

    lastUpdated.textContent =
      profile.updatedAt || "Just now";


    if (profile.avatar) {

      profileAvatarImage.src =
        profile.avatar;

      profileAvatarImage.classList.add("show");

      profileAvatarIcon.classList.add("hide");

      setAvatarBackground(
        navAvatar,
        profile.avatar
      );

      setAvatarBackground(
        sidebarAvatar,
        profile.avatar
      );

    } else {

      profileAvatarImage.src = "";

      profileAvatarImage.classList.remove("show");

      profileAvatarIcon.classList.remove("hide");

      clearAvatarBackground(navAvatar);

      clearAvatarBackground(sidebarAvatar);

    }

  }


  /* =========================================
     AVATAR BACKGROUND
  ========================================= */

  function setAvatarBackground(element, image) {

    element.style.backgroundImage =
      `url("${image}")`;

    element.style.backgroundSize =
      "cover";

    element.style.backgroundPosition =
      "center";

    element.innerHTML = "";

  }


  function clearAvatarBackground(element) {

    element.style.backgroundImage = "";

    element.innerHTML =
      '<i class="ri-user-line"></i>';

  }


  /* =========================================
     BIO COUNTER
  ========================================= */

  function updateBioCount() {

    bioCount.textContent =
      bio.value.length;

  }


  bio.addEventListener(
    "input",
    updateBioCount
  );


  /* =========================================
     SAVE PROFILE
  ========================================= */

  profileForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const name =
        fullName.value.trim();

      const userEmail =
        email.value.trim();


      if (!name) {

        fullName.focus();

        alert(
          "Please enter your full name."
        );

        return;

      }


      if (!userEmail) {

        email.focus();

        alert(
          "Please enter your email address."
        );

        return;

      }


      saveProfileBtn.disabled = true;


      const originalHTML =
        saveProfileBtn.innerHTML;


      saveProfileBtn.innerHTML = `
        <i class="ri-loader-4-line ri-spin"></i>
        Saving...
      `;


      await new Promise(resolve =>
        setTimeout(resolve, 700)
      );


      let oldProfile = {};

      try {

        oldProfile =
          JSON.parse(
            localStorage.getItem(
              "ecoStoreProfile"
            )
          ) || {};

      } catch {

        oldProfile = {};

      }


      const profile = {

        ...defaultProfile,

        ...oldProfile,

        name,

        email: userEmail,

        phone:
          phone.value.trim(),

        country:
          country.value,

        bio:
          bio.value.trim(),

        avatar:
          oldProfile.avatar || "",

        updatedAt:
          new Date().toLocaleString(
            "en-GH",
            {
              dateStyle: "medium",
              timeStyle: "short"
            }
          )

      };


      localStorage.setItem(
        "ecoStoreProfile",
        JSON.stringify(profile)
      );


      updateProfileDisplay(profile);


      saveProfileBtn.innerHTML = `
        <i class="ri-check-line"></i>
        Saved
      `;


      setTimeout(() => {

        saveProfileBtn.innerHTML =
          originalHTML;

        saveProfileBtn.disabled =
          false;

      }, 1200);

    }
  );


  /* =========================================
     CANCEL CHANGES
  ========================================= */

  cancelProfileBtn.addEventListener(
    "click",
    () => {

      loadProfile();

    }
  );


  /* =========================================
     PROFILE PHOTO
  ========================================= */

  avatarInput.addEventListener(
    "change",
    () => {

      const file =
        avatarInput.files?.[0];

      if (!file) return;


      if (!file.type.startsWith("image/")) {

        alert(
          "Please select an image file."
        );

        return;

      }


      const reader =
        new FileReader();


      reader.onload = () => {

        const image =
          reader.result;


        profileAvatarImage.src =
          image;

        profileAvatarImage.classList.add(
          "show"
        );

        profileAvatarIcon.classList.add(
          "hide"
        );


        setAvatarBackground(
          navAvatar,
          image
        );

        setAvatarBackground(
          sidebarAvatar,
          image
        );


        let profile = {};

        try {

          profile =
            JSON.parse(
              localStorage.getItem(
                "ecoStoreProfile"
              )
            ) || {};

        } catch {

          profile = {};

        }


        profile.avatar =
          image;


        localStorage.setItem(
          "ecoStoreProfile",
          JSON.stringify(profile)
        );

      };


      reader.readAsDataURL(file);

    }
  );


  /* =========================================
     SIGN OUT
  ========================================= */

  signOutBtn.addEventListener(
    "click",
    () => {

      const confirmLogout =
        confirm(
          "Are you sure you want to sign out?"
        );


      if (!confirmLogout) return;


      console.log(
        "User signed out."
      );


      // Firebase logout will be added later.

      window.location.href =
        "index.html";

    }
  );


  /* =========================================
     INITIALIZE
  ========================================= */

  loadProfile();

});