// ==UserScript==
// @name         Crunchyroll Random Anime Button
// @namespace    http://tampermonkey.net/
// @version      1.5.0
// @description  Adds a "Random Anime" button to Crunchyroll's top navigation bar
// @icon         https://github.com/noahbds/crunchyroll-random-anime/blob/main/icons/randomimg.png?raw=true
// @author       Noahbds
// @match        https://www.crunchyroll.com/*
// @grant        none
// @license      MIT
// @downloadURL  https://update.greasyfork.org/scripts/521056/Crunchyroll%20Random%20Anime%20Button.user.js
// @updateURL    https://update.greasyfork.org/scripts/521056/Crunchyroll%20Random%20Anime%20Button.meta.js
// ==/UserScript==

(function () {
  "use strict";

  const ICON_URL =
    "https://github.com/noahbds/crunchyroll-random-anime/blob/main/icons/randomimg.png?raw=true";
  const BUTTON_CLASS = "erc-random-header-button";
  const FALLBACK_WRAPPER_CLASS = "nav-horizontal-layout__action-item--KZBne";
  const LOCALES = new Set([
    "ar", "ca", "de", "es", "es-es", "fr", "hi", "id", "it", "ja", "ko",
    "ms", "pt-br", "pt-pt", "ru", "th", "tr", "vi", "zh-cn", "zh-hk", "zh-tw",
  ]);

  function currentLocale() {
    const m = /^\/([a-z]{2}(?:-[a-z]{2})?)(?=\/|$)/i.exec(location.pathname);
    const locale = m && m[1].toLowerCase();
    return locale && LOCALES.has(locale) ? locale : "";
  }

  function randomUrl() {
    const locale = currentLocale();
    return `https://www.crunchyroll.com${locale ? "/" + locale : ""}/random/anime?random_ref=topbar`;
  }

  function label() {
    return currentLocale() === "fr" ? "Anime aléatoire" : "Random Anime";
  }

  const style = document.createElement("style");
  style.textContent = `
    .${BUTTON_CLASS} { display:flex; align-items:center; gap:8px; text-decoration:none; }
    .${BUTTON_CLASS} .erc-header-svg { display:flex; align-items:center; }
    .erc-random-header-icon { display:block; width:24px; height:24px; transition:transform .25s ease; }
    .${BUTTON_CLASS}:hover .erc-random-header-icon { transform:rotate(-12deg) scale(1.08); }
    .erc-random-header-text { font-size:14px; font-weight:600; white-space:nowrap; }
    @media (max-width: 960px) { .erc-random-header-text { display:none; } }
  `;
  (document.head || document.documentElement).appendChild(style);

  let wrapper = null;

  function findInsertionPoint() {
    const search = document.querySelector(
      'a.erc-search-header-button-old, a[data-t="header-tile"][href$="/search"]'
    );
    if (search) {
      const item = search.closest('[class*="action-item"]') || search.parentElement;
      if (item && item.parentElement) {
        return { container: item.parentElement, before: item, template: item };
      }
    }
    const actions = document.querySelector(
      ".header-actions, div.nav-horizontal-layout__actions, div.nav-horizontal-layout__action-items"
    );
    return actions ? { container: actions, before: actions.firstElementChild, template: null } : null;
  }

  function createButton(template) {
    const item = document.createElement("div");
    item.className = template
      ? [...template.classList].filter((c) => !c.includes("mobile-hidden")).join(" ")
      : FALLBACK_WRAPPER_CLASS;

    const link = document.createElement("a");
    link.className = `erc-header-tile state-icon-only ${BUTTON_CLASS}`;
    link.setAttribute("data-t", "header-tile");

    const iconBox = document.createElement("div");
    iconBox.className = "erc-header-svg";
    const icon = document.createElement("img");
    icon.src = ICON_URL;
    icon.alt = "";
    icon.width = 24;
    icon.height = 24;
    icon.className = "erc-random-header-icon";

    const text = document.createElement("span");
    text.className = "erc-random-header-text";

    iconBox.appendChild(icon);
    link.append(iconBox, text);
    item.appendChild(link);
    return item;
  }

  function ensureButton() {
    if (!wrapper || !wrapper.isConnected) {
      document.querySelectorAll(`.${BUTTON_CLASS}`).forEach((el) => {
        (el.closest('[class*="action-item"]') || el).remove();
      });
      const point = findInsertionPoint();
      if (!point) return;
      wrapper = createButton(point.template);
      point.container.insertBefore(wrapper, point.before || null);
    }
    const link = wrapper.querySelector(`.${BUTTON_CLASS}`);
    const href = randomUrl();
    if (link.href !== href) link.href = href;
    const text = label();
    link.setAttribute("aria-label", text);
    link.title = text;
    wrapper.querySelector(".erc-random-header-text").textContent = text;
  }

  let queued = false;
  let lastPath = location.pathname;
  function scheduleUpdate() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      ensureButton();
    });
  }

  new MutationObserver(() => {
    if (!wrapper || !wrapper.isConnected || location.pathname !== lastPath) {
      lastPath = location.pathname;
      scheduleUpdate();
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener("popstate", scheduleUpdate);
  scheduleUpdate();
})();
