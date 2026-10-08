document.addEventListener("DOMContentLoaded", () => {

  /**
   * ==========================================
   * SKELETON CONTROLLER
   * ==========================================
   */

  function fadeSkeleton(id, delay = 0) {
    const skeleton = document.getElementById(id);

    if (!skeleton) return;

    setTimeout(() => {

      skeleton.classList.add("sk-fade-out");

      setTimeout(() => {
        skeleton.remove();
      }, 300);

    }, delay);
  }


  /**
   * ==========================================
   * WAIT FOR DOM ELEMENT
   * ==========================================
   */

  function waitForElement(selector, callback) {

    // Already available
    const element = document.querySelector(selector);

    if (element) {
      callback(element);
      return;
    }

    // Watch DOM changes
    const observer = new MutationObserver(() => {

      const element = document.querySelector(selector);

      if (!element) return;

      observer.disconnect();

      callback(element);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }


  /**
   * ==========================================
   * WAIT UNTIL ELEMENT HAS CONTENT
   * ==========================================
   */

  function waitForContent(selector, callback) {

    waitForElement(selector, (element) => {

      const checkContent = () => {

        const hasContent =
          element.children.length > 0 ||
          element.textContent.trim().length > 0;

        if (!hasContent) return;

        callback(element);
        return true;
      };


      // Check immediately
      if (checkContent()) return;


      // Watch for content being inserted
      const observer = new MutationObserver(() => {

        if (checkContent()) {
          observer.disconnect();
        }

      });

      observer.observe(element, {
        childList: true,
        subtree: true,
        characterData: true
      });

    });
  }


  /**
   * ==========================================
   * REVEAL WHEN SECTION IS READY
   * ==========================================
   */

  function revealWhenReady({
    skeleton,
    target,
    delay = 100
  }) {

    waitForContent(target, () => {

      fadeSkeleton(skeleton, delay);

    });

  }


  /**
   * ==========================================
   * SECTION CONFIGURATION
   * ==========================================
   */

  revealWhenReady({
    skeleton: "sk-NavBar",
    target: "#navbar",
    delay: 100
  });


  revealWhenReady({
    skeleton: "sk-Welcome",
    target: "#welcome",
    delay: 100
  });


  revealWhenReady({
    skeleton: "sk-Trusted",
    target: "#trusted",
    delay: 100
  });


  revealWhenReady({
    skeleton: "sk-info",
    target: "#info",
    delay: 100
  });


  revealWhenReady({
    skeleton: "sk-deliverTracker1",
    target: "#deliverTracker1",
    delay: 100
  });


  revealWhenReady({
    skeleton: "sk-deliverTracker2",
    target: "#deliverTracker2",
    delay: 100
  });


  revealWhenReady({
    skeleton: "offer-sk",
    target: "#offers",
    delay: 100
  });


  revealWhenReady({
    skeleton: "sk-Notice",
    target: "#notice",
    delay: 100
  });


  revealWhenReady({
    skeleton: "sk-gallery",
    target: "#gallery",
    delay: 100
  });


  revealWhenReady({
    skeleton: "sk-follow-share",
    target: "#follow-share",
    delay: 100
  });


  revealWhenReady({
    skeleton: "sk-daily",
    target: "#daily",
    delay: 100
  });


  revealWhenReady({
    skeleton: "sk-totals",
    target: "#totals",
    delay: 100
  });


  revealWhenReady({
    skeleton: "sk-table",
    target: "#table",
    delay: 100
  });


  revealWhenReady({
    skeleton: "sk-mode-btn",
    target: "#mode-btn",
    delay: 100
  });


  revealWhenReady({
    skeleton: "sk-normalView",
    target: "#normalView",
    delay: 100
  });

});