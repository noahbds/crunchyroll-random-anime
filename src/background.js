// Chrome runs this as a service worker (needs importScripts); Firefox loads
// common.js first via the manifest's background.scripts.
if (!globalThis.CRRandom && typeof importScripts === "function") {
  importScripts("common.js");
}

const { api, openRandom } = globalThis.CRRandom;

api.commands.onCommand.addListener((command) => {
  if (command === "open-random-anime") {
    openRandom().catch((err) => console.error("[CR Random]", err));
  }
});
