(async () => {
  "use strict";

  const { api, getSettings, setSettings, openRandom, t } = globalThis.CRRandom;

  for (const el of document.querySelectorAll("[data-i18n]")) {
    el.textContent = t(el.dataset.i18n, el.textContent);
  }
  document.documentElement.lang = api.i18n?.getUILanguage?.() || "en";
  document.getElementById("version").textContent = `v${api.runtime.getManifest().version}`;

  // Show the shortcut the user actually has bound (it can be changed or unset).
  try {
    const commands = await api.commands.getAll();
    const cmd = commands.find((c) => c.name === "open-random-anime");
    const kbd = document.getElementById("shortcut");
    if (cmd?.shortcut) kbd.textContent = cmd.shortcut;
    else kbd.parentElement.hidden = true;
  } catch {
    // commands API unavailable; keep the default text.
  }

  const settings = await getSettings();
  for (const key of ["showLabel", "openInNewTab"]) {
    const input = document.getElementById(key);
    input.checked = Boolean(settings[key]);
    input.addEventListener("change", () => setSettings({ [key]: input.checked }));
  }

  const button = document.getElementById("random");
  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      await openRandom("extension_popup");
      window.close();
    } catch (err) {
      console.error("[CR Random]", err);
      button.disabled = false;
    }
  });
  button.focus();
})();
