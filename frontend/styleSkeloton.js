document.addEventListener("DOMContentLoaded", () => {

  const overlay =
    document.getElementById('skeletonOverlay');

  if (!overlay) return;

  // Prevent scrolling during loading
  document.body.classList.add('sk-loading');

  // =========================
  // REVEAL SINGLE SECTION
  // =========================
  function revealSection(realId, skeletonId, delay = 0) {

    const realSection =
      document.getElementById(realId);

    const skeleton =
      document.getElementById(skeletonId);

    // Stop if missing
    if (!realSection || !skeleton) return;

    setTimeout(() => {

      skeleton.classList.add('fade-out');

      setTimeout(() => {

        skeleton.remove();

        cleanupOverlay();

      }, 450);

    }, delay);

  }

  // =========================
  // REMOVE OVERLAY WHEN EMPTY
  // =========================
  function cleanupOverlay() {

    // Find all remaining skeleton sections
    const remaining =
      overlay.querySelectorAll('[id^="sk-"]');

    // If none left → remove overlay
    if (remaining.length === 0) {

      overlay.classList.add('fade-out');

      setTimeout(() => {

        overlay.remove();

        document.body.classList.remove('sk-loading');

      }, 500);

    }

  }

  // =========================
  // START REVEAL SEQUENCE
  // =========================
  window.addEventListener('load', () => {

    revealSection(
      'NavBar',
      'sk-NavBar',
      100
    );

    revealSection(
      'Welcome',
      'sk-Welcome',
      250
    );

    revealSection(
      'Trusted',
      'sk-Trusted',
      400
    );

    revealSection(
      'Thumbnail',
      'sk-Thumbnail',
      550
    );

    revealSection(
      'Promo',
      'sk-Promo',
      700
    );

    revealSection(
      'Notice',
      'sk-Notice',
      850
    );

    revealSection(
      'analytics',
      'sk-analytics',
      1000
    );

    revealSection(
      'OrderTable',
      'sk-OrderTable',
      1150
    );

    revealSection(
      'cardsBundle',
      'sk-cardsBundle',
      1300
    );

  });

  // =========================
  // SAFETY NET
  // =========================
  setTimeout(() => {

    if (document.body.contains(overlay)) {

      overlay.classList.add('fade-out');

      setTimeout(() => {

        overlay.remove();

        document.body.classList.remove('sk-loading');

      }, 500);

    }

  }, 10000);

});
