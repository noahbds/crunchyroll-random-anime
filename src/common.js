/*
 * Shared helpers for the content script, popup and background worker.
 * Exposed as globalThis.CRRandom.
 */
(function (root) {
  "use strict";

  const api = root.browser ?? root.chrome;

  const ORIGIN = "https://www.crunchyroll.com";

  // Locale prefixes Crunchyroll uses in its URLs (English has no prefix).
  const LOCALES = new Set([
    "ar", "ca", "de", "es", "es-es", "fr", "hi", "id", "it", "ja", "ko",
    "ms", "pt-br", "pt-pt", "ru", "th", "tr", "vi", "zh-cn", "zh-hk", "zh-tw",
  ]);

  const DEFAULTS = Object.freeze({
    showLabel: true,
    openInNewTab: false,
    locale: "",
  });

  function localeFromPath(pathname) {
    const match = /^\/([a-z]{2}(?:-[a-z]{2})?)(?=\/|$)/i.exec(pathname || "");
    const locale = match?.[1].toLowerCase();
    return locale && LOCALES.has(locale) ? locale : "";
  }

  function randomUrl(locale, ref = "topbar") {
    const prefix = locale && LOCALES.has(locale) ? `/${locale}` : "";
    return `${ORIGIN}${prefix}/random/anime?random_ref=${encodeURIComponent(ref)}`;
  }

  function isCrunchyrollUrl(url) {
    try {
      const { protocol, hostname } = new URL(url);
      return (
        protocol === "https:" &&
        (hostname === "crunchyroll.com" || hostname.endsWith(".crunchyroll.com"))
      );
    } catch {
      return false;
    }
  }

  async function getSettings() {
    try {
      return { ...DEFAULTS, ...(await api.storage.sync.get(DEFAULTS)) };
    } catch {
      return { ...DEFAULTS };
    }
  }

  async function setSettings(patch) {
    try {
      await api.storage.sync.set(patch);
    } catch {
      // Storage can be unavailable (e.g. sync disabled); settings just won't persist.
    }
  }

  function t(key, fallback) {
    try {
      return api.i18n.getMessage(key) || fallback;
    } catch {
      return fallback;
    }
  }

  /**
   * Opens a random anime. Reuses the current tab when it is already on
   * Crunchyroll, otherwise opens a new one. Only usable where the tabs API
   * exists (popup, background).
   */
  async function openRandom(ref) {
    const settings = await getSettings();
    const [tab] = await api.tabs.query({ active: true, currentWindow: true });
    const locale =
      (tab?.url && isCrunchyrollUrl(tab.url) && localeFromPath(new URL(tab.url).pathname)) ||
      settings.locale;
    const url = randomUrl(locale, ref);

    if (tab?.id != null && tab.url && isCrunchyrollUrl(tab.url) && !settings.openInNewTab) {
      await api.tabs.update(tab.id, { url });
    } else {
      await api.tabs.create({ url, index: tab ? tab.index + 1 : undefined });
    }
  }

  root.CRRandom = {
    api,
    DEFAULTS,
    localeFromPath,
    randomUrl,
    isCrunchyrollUrl,
    getSettings,
    setSettings,
    openRandom,
    t,
  };
})(globalThis);
