(() => {
  "use strict";

  const {
    api,
    localeFromPath,
    fallbackUrl,
    randomSeriesUrl,
    getSeriesList,
    getSettings,
    setSettings,
    t,
  } = globalThis.CRRandom;

  const BUTTON_CLASS = "erc-random-header-button";
  const NO_LABEL_CLASS = "erc-random--no-label";
  // Crunchyroll's hashed class names change between deploys; this is only a
  // fallback when we can't copy the class from the search button's wrapper.
  const FALLBACK_WRAPPER_CLASS = "nav-horizontal-layout__action-item--KZBne";

  const SELECTORS = {
    searchButton: [
      "a.erc-search-header-button-old",
      'a[data-t="header-tile"][href$="/search"]',
      '[data-t="search-header-button"]',
    ].join(", "),
    actionsContainer: [
      ".header-actions",
      "div.nav-horizontal-layout__actions",
      "div.nav-horizontal-layout__action-items",
    ].join(", "),
  };

  let settings = { ...globalThis.CRRandom.DEFAULTS };
  let wrapper = null;

  function currentLocale() {
    return localeFromPath(location.pathname);
  }

  function findInsertionPoint() {
    const search = document.querySelector(SELECTORS.searchButton);
    if (search) {
      const item =
        search.closest('[class*="action-item"]') || search.parentElement;
      if (item?.parentElement) {
        return { container: item.parentElement, before: item, template: item };
      }
    }

    const actions = document.querySelector(SELECTORS.actionsContainer);
    if (actions) {
      return { container: actions, before: actions.firstElementChild, template: null };
    }

    // Logged-out landing pages use a different header with no action bar;
    // don't force the button into it.
    return null;
  }

  function createButton(template) {
    const item = document.createElement("div");
    item.className = template
      ? [...template.classList].filter((c) => !c.includes("mobile-hidden")).join(" ")
      : FALLBACK_WRAPPER_CLASS;

    const label = t("buttonLabel", "Random Anime");

    const link = document.createElement("a");
    link.className = `erc-header-tile state-icon-only ${BUTTON_CLASS}`;
    link.setAttribute("data-t", "header-tile");
    link.setAttribute("aria-label", label);
    link.title = `${label} (Alt+Shift+R)`;

    const iconBox = document.createElement("div");
    iconBox.className = "erc-header-svg";

    const icon = document.createElement("img");
    icon.src = api.runtime.getURL("icons/randomimg.png");
    icon.alt = "";
    icon.width = 24;
    icon.height = 24;
    icon.className = "erc-random-header-icon";
    icon.draggable = false;

    const text = document.createElement("span");
    text.className = "erc-random-header-text";
    text.textContent = label;

    iconBox.append(icon);
    link.append(iconBox, text);
    item.append(link);

    link.addEventListener("click", onActivate);
    link.addEventListener("auxclick", onActivate);
    // Warm the series cache as soon as the user shows intent.
    link.addEventListener("pointerenter", warmCache, { once: true });
    link.addEventListener("focus", warmCache, { once: true });
    return item;
  }

  function warmCache() {
    getSeriesList().catch(() => {});
  }

  let busy = false;
  async function onActivate(event) {
    if (event.button > 1) return; // leave right-click alone
    event.preventDefault();
    if (busy) return;

    const newTab =
      settings.openInNewTab || event.button === 1 || event.ctrlKey || event.metaKey || event.shiftKey;
    // Open the tab synchronously so popup blockers don't eat it.
    const win = newTab ? window.open("about:blank", "_blank") : null;

    busy = true;
    wrapper?.classList.add("erc-random--busy");
    try {
      const url = await randomSeriesUrl(currentLocale() || settings.locale);
      if (win) {
        win.opener = null;
        win.location.href = url;
      } else if (newTab) {
        window.open(url, "_blank", "noopener");
      } else {
        location.assign(url);
      }
    } finally {
      busy = false;
      wrapper?.classList.remove("erc-random--busy");
    }
  }

  /** Syncs href/label with the current page and settings. */
  function applyState() {
    if (!wrapper) return;
    const link = wrapper.querySelector(`.${BUTTON_CLASS}`);
    // The real destination is picked on click; the href is only a fallback.
    const href = fallbackUrl(currentLocale() || settings.locale);
    if (link.href !== href) link.href = href;
    wrapper.classList.toggle(NO_LABEL_CLASS, !settings.showLabel);
  }

  function ensureButton() {
    if (!wrapper?.isConnected) {
      // A stale copy can survive if the header was partially re-rendered.
      document.querySelectorAll(`.${BUTTON_CLASS}`).forEach((el) => {
        (el.closest('[class*="action-item"]') || el).remove();
      });

      const point = findInsertionPoint();
      if (!point) return;

      wrapper = createButton(point.template);
      point.container.insertBefore(wrapper, point.before ?? null);
    }
    applyState();
  }

  let queued = false;
  function scheduleUpdate() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      ensureButton();
      rememberLocale();
    });
  }

  let lastPath = location.pathname;
  function observePage() {
    // Crunchyroll is a SPA: the header can be rebuilt and the URL can change
    // without a page load. Keep the work per mutation batch tiny.
    new MutationObserver(() => {
      if (!wrapper?.isConnected || location.pathname !== lastPath) {
        lastPath = location.pathname;
        scheduleUpdate();
      }
    }).observe(document.documentElement, { childList: true, subtree: true });

    window.addEventListener("popstate", scheduleUpdate);
    window.addEventListener("pageshow", scheduleUpdate);
  }

  /** Remember the site locale so the popup/shortcut open the right one. */
  function rememberLocale() {
    const locale = currentLocale();
    if (locale !== settings.locale) {
      settings.locale = locale;
      setSettings({ locale });
    }
  }

  async function init() {
    settings = await getSettings();
    ensureButton();
    rememberLocale();
    observePage();

    api.storage.onChanged.addListener((changes, area) => {
      if (area !== "sync") return;
      for (const [key, { newValue }] of Object.entries(changes)) {
        if (key in settings) settings[key] = newValue ?? globalThis.CRRandom.DEFAULTS[key];
      }
      applyState();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
