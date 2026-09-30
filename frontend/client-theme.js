// =========================================================
// ECODATA ADMIN THEME MANAGER
// =========================================================

(() => {

  const ADMIN_THEME_KEY =
    "ecoDataAdminTheme";


  // =======================================================
  // SYSTEM THEME
  // =======================================================

  const adminThemeMedia =
    window.matchMedia
      ? window.matchMedia(
          "(prefers-color-scheme: dark)"
        )
      : null;


  // =======================================================
  // GET SAVED THEME
  // =======================================================

  function getAdminTheme() {

    return (
      localStorage.getItem(
        ADMIN_THEME_KEY
      ) || "system"
    );

  }


  // =======================================================
  // DETERMINE DARK MODE
  // =======================================================

  function shouldUseAdminDark(theme) {

    if (theme === "dark") {
      return true;
    }

    if (theme === "light") {
      return false;
    }

    return (
      adminThemeMedia &&
      adminThemeMedia.matches
    );

  }


  // =======================================================
  // APPLY THEME
  // =======================================================

  function applyAdminTheme(
    theme,
    animate = true
  ) {

    const root =
      document.documentElement;

    const useDark =
      shouldUseAdminDark(theme);


    if (animate) {

      root.classList.add(
        "admin-theme-transition"
      );

    }


    root.dataset.adminTheme =
      theme;


    root.classList.toggle(
      "admin-dark",
      useDark
    );


    localStorage.setItem(
      ADMIN_THEME_KEY,
      theme
    );


    updateAdminThemeButtons(
      theme
    );


    if (animate) {

      window.setTimeout(() => {

        root.classList.remove(
          "admin-theme-transition"
        );

      }, 250);

    }

  }


  // =======================================================
  // UPDATE THEME BUTTONS
  // =======================================================

  function updateAdminThemeButtons(
    currentTheme
  ) {

    document
      .querySelectorAll(
        ".admin-theme-option"
      )
      .forEach(button => {

        const theme =
          button.dataset.theme;

        button.classList.toggle(
          "active",
          theme === currentTheme
        );

      });

  }


  // =======================================================
  // INITIALIZE SETTINGS THEME BUTTONS
  // =======================================================

  function initAdminThemeSettings() {

    const currentTheme =
      getAdminTheme();


    // Apply the saved theme

    applyAdminTheme(
      currentTheme,
      false
    );


    // Theme buttons

    document
      .querySelectorAll(
        ".admin-theme-option"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const theme =
              button.dataset.theme;


            if (
              ![
                "light",
                "dark",
                "system"
              ].includes(theme)
            ) {
              return;
            }


            applyAdminTheme(
              theme,
              true
            );

          }
        );

      });

  }


  // =======================================================
  // SYSTEM THEME CHANGES
  // =======================================================

  if (adminThemeMedia) {

    const handleSystemThemeChange =
      () => {

        const currentTheme =
          getAdminTheme();


        if (
          currentTheme === "system"
        ) {

          applyAdminTheme(
            "system",
            true
          );

        }

      };


    if (
      adminThemeMedia.addEventListener
    ) {

      adminThemeMedia.addEventListener(
        "change",
        handleSystemThemeChange
      );

    } else {

      adminThemeMedia.addListener(
        handleSystemThemeChange
      );

    }

  }


  // =======================================================
  // PAGE READY
  // =======================================================

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initAdminThemeSettings
    );

  } else {

    initAdminThemeSettings();

  }


})();