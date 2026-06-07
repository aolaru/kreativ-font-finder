#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: node is required for validation." >&2
  exit 1
fi

if ! command -v zip >/dev/null 2>&1; then
  echo "Error: zip is required to create the Chrome Web Store package." >&2
  exit 1
fi

if ! command -v unzip >/dev/null 2>&1; then
  echo "Error: unzip is required to verify the package." >&2
  exit 1
fi

required_files=(
  "manifest.json"
  "popup.html"
  "src/background.js"
  "src/content.js"
  "src/popup.css"
  "src/popup.js"
  "README.md"
  "PRIVACY.md"
)

for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "Error: missing required file: $file" >&2
    exit 1
  fi
done

for script in src/*.js; do
  node --check "$script"
done

version="$(node <<'NODE'
const fs = require("fs");
const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

if (manifest.manifest_version !== 3) {
  fail("manifest_version must be 3.");
}

if (!/^\d+\.\d+\.\d+$/.test(manifest.version || "")) {
  fail("manifest.version must use x.y.z format.");
}

if (!manifest.action || !manifest.action.default_popup) {
  fail("manifest.action.default_popup is required.");
}

if (!fs.existsSync(manifest.action.default_popup)) {
  fail(`missing popup file: ${manifest.action.default_popup}`);
}

if (!manifest.background || !manifest.background.service_worker) {
  fail("manifest.background.service_worker is required.");
}

if (!fs.existsSync(manifest.background.service_worker)) {
  fail(`missing service worker: ${manifest.background.service_worker}`);
}

const permissions = new Set(manifest.permissions || []);
const expectedPermissions = ["activeTab", "clipboardWrite", "contextMenus", "scripting", "storage"];
for (const permission of expectedPermissions) {
  if (!permissions.has(permission)) {
    fail(`missing required permission: ${permission}`);
  }
}

if (permissions.has("clipboardWrite")) {
  const popupSource = fs.readFileSync("src/popup.js", "utf8");
  if (!popupSource.includes("execCommand(\"copy\")")) {
    fail("clipboardWrite is declared but the popup does not use the legacy copy fallback.");
  }
}

const iconPaths = [
  ...Object.values(manifest.icons || {}),
  ...Object.values((manifest.action && manifest.action.default_icon) || {})
];

for (const iconPath of iconPaths) {
  if (!fs.existsSync(iconPath)) {
    fail(`manifest references missing icon: ${iconPath}`);
  }
}

if (!manifest.icons || !manifest.icons["128"]) {
  console.warn("Warning: manifest has no 128px icon yet. Add icons before Chrome Web Store submission.");
}

console.log(manifest.version);
NODE
)"

package_dir="dist"
package_path="$package_dir/kreativ-font-finder-$version.zip"
package_paths=(
  "manifest.json"
  "popup.html"
  "src"
  "README.md"
  "PRIVACY.md"
)

[[ -d "docs" ]] && package_paths+=("docs")
[[ -d "icons" ]] && package_paths+=("icons")
[[ -f "LICENSE" ]] && package_paths+=("LICENSE")

mkdir -p "$package_dir"
rm -f "$package_path"

zip -qr "$package_path" "${package_paths[@]}" \
  -x "*.DS_Store" \
  -x "__MACOSX/*" \
  -x "dist/*" \
  -x ".git/*"

unzip -tq "$package_path" >/dev/null

echo "Created $package_path"
