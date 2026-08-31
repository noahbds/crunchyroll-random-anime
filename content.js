(function () {
  "use strict";

  const iconUrl =
    typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL
      ? chrome.runtime.getURL("icons/randomimg.png")
      : "https://github.com/noahbds/crunchyroll-random-anime/blob/main/icons/randomimg.png?raw=true";

  // Dynamically detect current language from URL (e.g., /fr, /en, /es)
  const pathSegments = window.location.pathname.split('/');
  const locale = (pathSegments.length > 1 && pathSegments[1].length === 2) ? `/${pathSegments[1]}` : '';

  // Lightweight localization dictionary
  const i18n = {
    '/fr': 'Anime Aléatoire',
    default: 'Random Anime'
  };
  const buttonLabel = i18n[locale] || i18n.default;

  function createRandomAnimeButton() {
    if (document.querySelector(".erc-random-header-button")) return;

    // Added multi-language search label targeting
    const searchButton = document.querySelector(
      'a.erc-search-header-button-old, a[aria-label="Search"], a[aria-label="Recherche"]'
    );

    let actionsContainer = null;
    let insertBeforeNode = null;

    if (searchButton) {
      // Avoid targeting the dynamic hash (--KZBne)
      const searchWrapper = searchButton.closest('[class*="nav-horizontal-layout__action-item"]');
      insertBeforeNode = searchWrapper || searchButton.parentElement || searchButton;
      actionsContainer = insertBeforeNode && insertBeforeNode.parentElement;
    }

    if (!actionsContainer) {
      actionsContainer = document.querySelector('[class*="nav-horizontal-layout__actions"], header');
    }

    if (!actionsContainer) {
      const anyAction = document.querySelector('a.erc-header-tile, div.erc-header-svg');
      actionsContainer = anyAction && anyAction.parentElement;
    }

    if (!actionsContainer) return;

    const actionWrapper = document.createElement("div");
    // Use the base class without the hash
    actionWrapper.className = "nav-horizontal-layout__action-item";

    const randomButton = document.createElement("a");
    // Inject the dynamic locale into the href
    randomButton.href = `https://www.crunchyroll.com${locale}/random/anime?random_ref=topbar`;
    randomButton.className = "erc-header-tile state-icon-only erc-random-header-button";
    randomButton.tabIndex = 0;
    randomButton.setAttribute("data-t", "header-tile");
    randomButton.setAttribute("aria-label", buttonLabel);

    const buttonDiv = document.createElement("div");
    buttonDiv.className = "erc-header-svg";

    const buttonIcon = document.createElement("img");
    buttonIcon.src = iconUrl;
    buttonIcon.alt = buttonLabel;
    buttonIcon.style.cssText = "width: 24px; height: 24px; display: inline-block; vertical-align: middle;";

    const buttonText = document.createElement("span");
    buttonText.className = "erc-random-header-text";
    buttonText.textContent = buttonLabel;
    buttonText.style.cssText = "margin-left:8px; font-size:14px;";

    buttonDiv.appendChild(buttonIcon);
    randomButton.appendChild(buttonDiv);
    randomButton.appendChild(buttonText);
    actionWrapper.appendChild(randomButton);

    try {
      if (insertBeforeNode && insertBeforeNode.parentElement === actionsContainer) {
        actionsContainer.insertBefore(actionWrapper, insertBeforeNode);
      } else {
        actionsContainer.appendChild(actionWrapper);
      }
    } catch (e) {
      actionsContainer.appendChild(actionWrapper);
    }
  }

  // Use a debounce timer to prevent the observer from thrashing the CPU on every frame
  let timeout;
  const observer = new MutationObserver(() => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      // Only execute DOM queries if the header is present
      if (document.querySelector('header')) {
        createRandomAnimeButton();
      }
    }, 100);
  });

  observer.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true,
  });
})();
