/*
 * Shared helpers for the content script, popup and background worker.
 * Exposed as globalThis.CRRandom.
 *
 * Crunchyroll removed its /random/anime page, so we pick a series ourselves
 * from Crunchyroll's public series sitemaps (one file per letter) and cache
 * the list in extension storage.
 */
(function (root) {
  "use strict";

  const api = root.browser ?? root.chrome;

  const ORIGIN = "https://www.crunchyroll.com";
  const SITEMAP_INDEX = `${ORIGIN}/sitemap.xml`;
  const CACHE_KEY = "seriesCache";
  const CACHE_TTL_MS = 3 * 24 * 60 * 60 * 1000;
  const FETCH_CONCURRENCY = 6;

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

  function localePrefix(locale) {
    return locale && LOCALES.has(locale) ? `/${locale}` : "";
  }

  /** Where to go when the series list can't be loaded. */
  function fallbackUrl(locale) {
    return `${ORIGIN}${localePrefix(locale)}/videos/alphabetical`;
  }

  function seriesUrl(path, locale) {
    return `${ORIGIN}${localePrefix(locale)}/series/${path}`;
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

  async function fetchText(url) {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.text();
  }

  function locs(xml) {
    return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  }

  /** Downloads every series sitemap and returns ["GRP58JGDR/c3", ...]. */
  async function downloadSeriesList() {
    const sitemaps = locs(await fetchText(SITEMAP_INDEX)).filter((u) =>
      /\/sitemaps\/series\//.test(u)
    );
    if (!sitemaps.length) throw new Error("No series sitemaps found");

    const series = new Set();
    let next = 0;
    async function worker() {
      while (next < sitemaps.length) {
        const url = sitemaps[next++];
        try {
          for (const loc of locs(await fetchText(url))) {
            const m = /\/series\/([A-Z0-9]+\/[^/?#]*)/.exec(loc);
            if (m) series.add(m[1]);
          }
        } catch (err) {
          console.warn("[CR Random] sitemap failed:", url, err);
        }
      }
    }
    await Promise.all(Array.from({ length: FETCH_CONCURRENCY }, worker));
    if (!series.size) throw new Error("Series list is empty");
    return [...series];
  }

  let pending = null;

  /** Returns the cached series list, refreshing it when stale. */
  async function getSeriesList() {
    let cache;
    try {
      cache = (await api.storage.local.get(CACHE_KEY))[CACHE_KEY];
    } catch {
      cache = null;
    }
    const fresh = cache?.series?.length && Date.now() - cache.time < CACHE_TTL_MS;
    if (fresh) return cache.series;

    pending ??= downloadSeriesList()
      .then(async (series) => {
        try {
          await api.storage.local.set({ [CACHE_KEY]: { time: Date.now(), series } });
        } catch {
          // Not fatal: we'll just download again next time.
        }
        return series;
      })
      .finally(() => {
        pending = null;
      });

    try {
      return await pending;
    } catch (err) {
      // A stale list is better than nothing.
      if (cache?.series?.length) return cache.series;
      throw err;
    }
  }

  /** Resolves to the URL of a random series, or the A–Z page on failure. */
  async function randomSeriesUrl(locale) {
    try {
      const series = await getSeriesList();
      const path = series[Math.floor(Math.random() * series.length)];
      return seriesUrl(path, locale);
    } catch (err) {
      console.error("[CR Random] could not load the series list:", err);
      return fallbackUrl(locale);
    }
  }

  /**
   * Opens a random anime from the popup or the keyboard shortcut. Reuses the
   * current tab when it is already on Crunchyroll (unless "new tab" is on).
   */
  async function openRandom() {
    const settings = await getSettings();
    const [tab] = await api.tabs.query({ active: true, currentWindow: true });
    const onCrunchyroll = Boolean(tab?.url && isCrunchyrollUrl(tab.url));
    const locale = (onCrunchyroll && localeFromPath(new URL(tab.url).pathname)) || settings.locale;
    const url = await randomSeriesUrl(locale);

    if (onCrunchyroll && tab.id != null && !settings.openInNewTab) {
      await api.tabs.update(tab.id, { url });
    } else {
      await api.tabs.create({ url, index: tab ? tab.index + 1 : undefined });
    }
  }

  root.CRRandom = {
    api,
    DEFAULTS,
    localeFromPath,
    fallbackUrl,
    randomSeriesUrl,
    getSeriesList,
    isCrunchyrollUrl,
    getSettings,
    setSettings,
    openRandom,
    t,
  };
})(globalThis);
