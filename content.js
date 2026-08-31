(() => {
  "use strict";

  const CONFIG = {
    buttonClass: "erc-random-header-button",
    wrapperClass: "nav-horizontal-layout__action-item--KZBne",
    randomUrl:
      "https://www.crunchyroll.com/fr/random/anime?random_ref=topbar",
    iconPath: "icons/randomimg.png",
  };

  const SELECTORS = {
    existingButton: `.${CONFIG.buttonClass}`,

    searchButton: [
      'a.erc-search-header-button-old',
      'a[aria-label="Search"]',
      '[data-t="search-header-button"]',
    ].join(", "),

    actionsContainer: [
      "div.nav-horizontal-layout__actions",
      "div.nav-horizontal-layout__action-items",
    ].join(", "),

    header: "header",
  };

  /**
   * Gets the extension icon URL.
   */
  function getIconUrl() {
    if (
      typeof chrome !== "undefined" &&
      chrome.runtime?.getURL
    ) {
      return chrome.runtime.getURL(CONFIG.iconPath);
    }

    return "https://raw.githubusercontent.com/noahbds/crunchyroll-random-anime/main/icons/randomimg.png";
  }

  /**
   * Finds the best location to insert the button.
   */
  function findInsertionPoint() {
    const searchButton = document.querySelector(
      SELECTORS.searchButton
    );

    if (searchButton) {
      const wrapper = searchButton.closest(
        ".nav-horizontal-layout__action-item--KZBne"
      );

      if (wrapper?.parentElement) {
        return {
          container: wrapper.parentElement,
          before: wrapper,
        };
      }

      if (searchButton.parentElement) {
        return {
          container: searchButton.parentElement,
          before: null,
        };
      }
    }

    const actionsContainer = document.querySelector(
      SELECTORS.actionsContainer
    );

    if (actionsContainer) {
      return {
        container: actionsContainer,
        before: null,
      };
    }

    const header = document.querySelector(SELECTORS.header);

    if (header) {
      return {
        container: header,
        before: null,
      };
    }

    return null;
  }

  /**
   * Creates the random anime button.
   */
  function createButton() {
    const wrapper = document.createElement("div");
    wrapper.className = CONFIG.wrapperClass;

    const button = document.createElement("a");

    button.className =
      `erc-header-tile state-icon-only ${CONFIG.buttonClass}`;

    button.href = CONFIG.randomUrl;
    button.tabIndex = 0;

    button.setAttribute("data-t", "header-tile");
    button.setAttribute("aria-label", "Random Anime");
    button.title = "Random Anime";

    const iconContainer = document.createElement("div");
    iconContainer.className = "erc-header-svg";

    const icon = document.createElement("img");

    icon.src = getIconUrl();
    icon.alt = "";
    icon.width = 24;
    icon.height = 24;

    icon.className = "erc-random-header-icon";

    const text = document.createElement("span");

    text.className = "erc-random-header-text";
    text.textContent = "Random Anime";

    iconContainer.appendChild(icon);

    button.append(
      iconContainer,
      text
    );

    wrapper.appendChild(button);

    return wrapper;
  }

  /**
   * Ensures the button exists in the header.
   */
  function ensureButton() {
    const existingButton = document.querySelector(
      SELECTORS.existingButton
    );

    if (existingButton?.isConnected) {
      return;
    }

    const insertionPoint = findInsertionPoint();

    if (!insertionPoint) {
      return;
    }

    const button = createButton();

    const {
      container,
      before,
    } = insertionPoint;

    if (before) {
      container.insertBefore(
        button,
        before
      );
    } else {
      container.appendChild(button);
    }
  }

  /**
   * Debounce DOM updates.
   *
   * Crunchyroll is a SPA and can trigger many mutations
   * while rebuilding the navigation.
   */
  let updateQueued = false;

  function scheduleUpdate() {
    if (updateQueued) {
      return;
    }

    updateQueued = true;

    requestAnimationFrame(() => {
      updateQueued = false;
      ensureButton();
    });
  }

  /**
   * Watch for SPA navigation and header rebuilds.
   */
  function observePage() {
    const observer = new MutationObserver(() => {
      const button = document.querySelector(
        SELECTORS.existingButton
      );

      if (!button) {
        scheduleUpdate();
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    return observer;
  }

  /**
   * Initialize extension.
   */
  function init() {
    ensureButton();
    observePage();

    window.addEventListener(
      "popstate",
      scheduleUpdate
    );

    window.addEventListener(
      "pageshow",
      scheduleUpdate
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }
})();