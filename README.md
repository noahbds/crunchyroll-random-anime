# crunchyroll-random-anime

Adds a **Random Anime** button to the Crunchyroll header, next to the search button. Available for **Chrome** (and other Chromium browsers: Edge, Brave, Opera) and **Firefox**.

## Features

- Header button that opens a random series from the whole Crunchyroll catalogue, in your site language (`/fr/`, `/de/`, `/pt-br/`, …).
  Crunchyroll removed its own `/random/anime` page, so the extension reads Crunchyroll's public series sitemaps and caches the list for 3 days.
- Toolbar popup with a "Surprise me" button, usable from any tab.
- Keyboard shortcut: **Alt+Shift+R** (change it at `chrome://extensions/shortcuts` or in Firefox's *Manage Extension Shortcuts*).
- Options: hide the text label (icon only), open random anime in a new tab.
- English and French UI.
- Survives Crunchyroll's single-page navigation and header re-renders.

## Project layout

```
src/               shared extension code (content script, popup, background, _locales)
icons/             extension icons
manifests/         chrome.json and firefox.json (the only per-browser difference)
scripts/build.sh   builds dist/chrome, dist/firefox and store-ready zips
```

## Build

```bash
./scripts/build.sh
```

This creates `dist/chrome/`, `dist/firefox/` and a zip of each for the Chrome Web Store and addons.mozilla.org. Bump `version` in both manifests before a release (the script refuses to build if they differ).

## Install locally

**Chrome / Edge / Brave:** open `chrome://extensions`, turn on *Developer mode*, click *Load unpacked*, and pick `dist/chrome`.

**Firefox:** open `about:debugging#/runtime/this-firefox`, click *Load Temporary Add-on…*, and pick `dist/firefox/manifest.json`.
