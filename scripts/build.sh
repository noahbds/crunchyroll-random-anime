#!/usr/bin/env bash
# Builds unpacked extensions and store-ready zips for Chrome and Firefox.
#   dist/chrome/   dist/crunchyroll-random-anime-chrome-<version>.zip
#   dist/firefox/  dist/crunchyroll-random-anime-firefox-<version>.zip
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
dist="$root/dist"

version_of() { sed -n 's/^  "version": "\(.*\)",$/\1/p' "$1"; }
v_chrome="$(version_of "$root/manifests/chrome.json")"
v_firefox="$(version_of "$root/manifests/firefox.json")"
if [[ "$v_chrome" != "$v_firefox" ]]; then
  echo "Version mismatch: chrome=$v_chrome firefox=$v_firefox" >&2
  exit 1
fi

rm -rf "$dist"
for target in chrome firefox; do
  out="$dist/$target"
  mkdir -p "$out"
  rsync -a --exclude '.DS_Store' "$root/src/" "$out/"
  rsync -a --exclude '.DS_Store' "$root/icons" "$out/"
  cp "$root/manifests/$target.json" "$out/manifest.json"
  (cd "$out" && zip -qrX "$dist/crunchyroll-random-anime-$target-$v_chrome.zip" .)
  echo "Built $target -> dist/$target (zip: crunchyroll-random-anime-$target-$v_chrome.zip)"
done
