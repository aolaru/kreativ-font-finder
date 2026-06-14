"use strict";

const FAVORITES_KEY = "kreativFontFavorites";
const SEARCH_DESTINATIONS = [
  {
    id: "kreativ",
    label: "Kreativ",
    title: "Search on Kreativ Font",
    url(family) {
      const url = new URL("https://kreativfont.com/");
      url.searchParams.set("s", family);
      return url.toString();
    }
  },
  {
    id: "myfonts",
    label: "MyFonts",
    title: "Search on MyFonts",
    url(family) {
      const url = new URL("https://www.myfonts.com/search");
      url.searchParams.set("query", family);
      return url.toString();
    }
  },
  {
    id: "creative-market",
    label: "Creative Market",
    title: "Search on Creative Market",
    url(family) {
      const url = new URL("https://creativemarket.com/search");
      url.searchParams.set("q", family);
      return url.toString();
    }
  }
];

const state = {
  activeTabId: null,
  fonts: [],
  favorites: [],
  filter: "",
  scannedElements: 0,
  isDemo: false
};

const nodes = {
  clearButton: document.getElementById("clearButton"),
  elementCount: document.getElementById("elementCount"),
  emptyState: document.getElementById("emptyState"),
  favoriteCount: document.getElementById("favoriteCount"),
  favorites: document.getElementById("favorites"),
  filterInput: document.getElementById("filterInput"),
  fontCount: document.getElementById("fontCount"),
  pageLabel: document.getElementById("pageLabel"),
  rescanButton: document.getElementById("rescanButton"),
  results: document.getElementById("results"),
  statusText: document.getElementById("statusText")
};

document.addEventListener("DOMContentLoaded", init);

function init() {
  bindEvents();

  if (!hasExtensionApi()) {
    loadDemo();
    return;
  }

  loadFavorites()
    .then(scanActiveTab)
    .catch((error) => {
      setStatus(error.message || "Unable to start the extension.");
    });
}

function bindEvents() {
  nodes.rescanButton.addEventListener("click", scanActiveTab);
  nodes.clearButton.addEventListener("click", clearHighlights);
  nodes.filterInput.addEventListener("input", (event) => {
    state.filter = event.target.value.trim().toLowerCase();
    render();
  });
}

function hasExtensionApi() {
  return Boolean(window.chrome && chrome.tabs && chrome.scripting && chrome.storage);
}

async function scanActiveTab() {
  if (!hasExtensionApi()) {
    loadDemo();
    return;
  }

  setLoading(true);
  setStatus("Scanning typography on the active tab...");

  try {
    const tab = await getScanTab();
    if (!tab || !tab.id) {
      throw new Error("No active tab found.");
    }

    if (isBlockedUrl(tab.url || "")) {
      throw new Error("Chrome blocks extensions on this page. Try a normal website tab.");
    }

    state.activeTabId = tab.id;
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["src/content.js"]
    });

    const response = await sendTabMessage(tab.id, { type: "KREATIV_SCAN_FONTS" });
    if (!response || !response.ok) {
      throw new Error((response && response.error) || "The page did not return font data.");
    }

    state.fonts = response.fonts || [];
    state.scannedElements = response.scannedElements || 0;
    nodes.pageLabel.textContent = response.hostname || response.pageTitle || "Current tab";
    setStatus(makeScanMessage(state.fonts.length, state.scannedElements));
    render();
  } catch (error) {
    state.fonts = [];
    state.scannedElements = 0;
    nodes.pageLabel.textContent = "Font Finder";
    setStatus(error.message || "Unable to scan this tab.");
    render();
  } finally {
    setLoading(false);
  }
}

async function getScanTab() {
  const requestedTabId = getRequestedTabId();

  if (requestedTabId) {
    return chrome.tabs.get(requestedTabId);
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function getRequestedTabId() {
  const value = new URLSearchParams(window.location.search).get("tabId");
  const tabId = Number(value);

  return Number.isInteger(tabId) && tabId > 0 ? tabId : null;
}

function isBlockedUrl(url) {
  return /^(chrome|edge|brave|vivaldi|opera|about|devtools|chrome-extension):/i.test(url) ||
    url.startsWith("https://chromewebstore.google.com/") ||
    url.startsWith("https://chrome.google.com/webstore/");
}

function sendTabMessage(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(response);
    });
  });
}

function setLoading(isLoading) {
  nodes.rescanButton.disabled = isLoading;
  nodes.clearButton.disabled = isLoading;
  nodes.filterInput.disabled = isLoading;
}

function setStatus(message) {
  nodes.statusText.textContent = message;
}

function makeScanMessage(fontCount, elementCount) {
  if (!fontCount) {
    return "No readable text styles were found on this page.";
  }

  return `Found ${fontCount} font ${fontCount === 1 ? "family" : "families"} across ${elementCount} text ${elementCount === 1 ? "item" : "items"}.`;
}

function render() {
  const fonts = getFilteredFonts();

  nodes.fontCount.textContent = String(state.fonts.length);
  nodes.elementCount.textContent = String(state.scannedElements);
  nodes.results.innerHTML = "";
  nodes.emptyState.hidden = Boolean(fonts.length);

  fonts.forEach((font) => {
    nodes.results.appendChild(createFontCard(font));
  });

  renderFavorites();
}

function getFilteredFonts() {
  if (!state.filter) {
    return state.fonts;
  }

  return state.fonts.filter((font) => {
    const haystack = [
      font.family,
      font.source,
      font.sample,
      (font.stack || []).join(" ")
    ].join(" ").toLowerCase();

    return haystack.includes(state.filter);
  });
}

function createFontCard(font) {
  const card = document.createElement("article");
  card.className = "font-card";

  const main = document.createElement("div");
  main.className = "font-main";

  const title = document.createElement("div");
  title.className = "font-title";

  const name = document.createElement("h2");
  name.className = "font-name";
  name.textContent = font.family;

  const meta = document.createElement("p");
  meta.className = "font-meta";
  meta.textContent = `${font.count} ${font.count === 1 ? "use" : "uses"} · ${formatTopValues(font.roles, 2) || "Text"}`;

  title.append(name, meta);

  const source = document.createElement("span");
  source.className = "source-pill";
  source.title = font.source || "Unknown source";
  source.textContent = font.source || "Unknown";

  main.append(title, source);
  card.appendChild(main);

  const sample = document.createElement("p");
  sample.className = "sample";
  sample.textContent = font.sample || "Aa Bb Cc 123";
  sample.style.fontFamily = font.cssFontFamily || font.family;
  card.appendChild(sample);

  const details = document.createElement("div");
  details.className = "font-details";
  appendChips(details, "Size", font.sizes, 3);
  appendChips(details, "Weight", font.weights, 3);
  appendColorChips(details, font.colors, 4);
  card.appendChild(details);

  const stack = document.createElement("div");
  stack.className = "font-stack";

  const stackLabel = document.createElement("span");
  stackLabel.textContent = "Stack";

  const stackText = getFontStackText(font);
  const stackValue = document.createElement("code");
  stackValue.textContent = stackText;
  stackValue.title = stackText;

  stack.append(stackLabel, stackValue);
  card.appendChild(stack);

  const searchLinks = document.createElement("div");
  searchLinks.className = "font-search-links";

  const searchLabel = document.createElement("span");
  searchLabel.textContent = "Search";
  searchLinks.appendChild(searchLabel);

  SEARCH_DESTINATIONS.forEach((destination) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = destination.id === "kreativ" ? "primary-search-link" : "";
    button.textContent = destination.label;
    button.title = `${destination.title} for ${font.family}`;
    button.addEventListener("click", () => openFontSearch(destination.id, font.family));
    searchLinks.appendChild(button);
  });

  card.appendChild(searchLinks);

  const actions = document.createElement("div");
  actions.className = "font-actions";

  const highlightButton = document.createElement("button");
  highlightButton.type = "button";
  highlightButton.textContent = "Highlight";
  highlightButton.addEventListener("click", () => highlightFont(font.family));

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.title = `Copy CSS font-family for ${font.family}`;
  copyButton.textContent = "Copy CSS";
  copyButton.addEventListener("click", () => copyFontStack(font));

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.className = isFavorite(font.family) ? "saved-action" : "";
  saveButton.textContent = isFavorite(font.family) ? "Saved" : "Save";
  saveButton.addEventListener("click", () => toggleFavorite(font));

  actions.append(highlightButton, copyButton, saveButton);
  card.appendChild(actions);

  return card;
}

function appendChips(parent, label, values, limit) {
  (values || []).slice(0, limit).forEach((item) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = `${label} ${item.value}`;
    parent.appendChild(chip);
  });
}

function appendColorChips(parent, colors, limit) {
  (colors || []).slice(0, limit).forEach((item) => {
    const chip = document.createElement("span");
    chip.className = "color-chip";
    chip.title = item.value;
    chip.style.backgroundColor = item.value;
    parent.appendChild(chip);
  });
}

function formatTopValues(values, limit) {
  return (values || [])
    .slice(0, limit)
    .map((item) => item.value)
    .join(", ");
}

async function highlightFont(family) {
  if (state.isDemo) {
    setStatus(`Preview mode: ${family} would be highlighted on the page.`);
    return;
  }

  try {
    const response = await sendTabMessage(state.activeTabId, {
      type: "KREATIV_HIGHLIGHT_FONT",
      family
    });

    if (!response || !response.ok) {
      throw new Error((response && response.error) || "Highlight failed.");
    }

    setStatus(`Highlighted ${response.count} ${response.count === 1 ? "element" : "elements"} using ${family}.`);
  } catch (error) {
    setStatus(error.message || "Unable to highlight this font.");
  }
}

async function clearHighlights() {
  if (state.isDemo || !state.activeTabId) {
    setStatus("Highlights cleared.");
    return;
  }

  try {
    await sendTabMessage(state.activeTabId, { type: "KREATIV_CLEAR_HIGHLIGHTS" });
    setStatus("Highlights cleared.");
  } catch (error) {
    setStatus(error.message || "Unable to clear highlights.");
  }
}

function openFontSearch(destinationId, family) {
  const destination = SEARCH_DESTINATIONS.find((item) => item.id === destinationId) || SEARCH_DESTINATIONS[0];
  const url = destination.url(family);

  if (hasExtensionApi()) {
    chrome.tabs.create({ url });
    return;
  }

  window.open(url, "_blank", "noopener");
}

function openKreativSearch(family) {
  openFontSearch("kreativ", family);
}

async function copyFontStack(font) {
  const cssStack = `font-family: ${getFontStackText(font)};`;

  try {
    await writeClipboard(cssStack);
    setStatus(`Copied CSS font-family for ${font.family}.`);
  } catch (error) {
    setStatus(error.message || "Unable to copy this font stack.");
  }
}

async function writeClipboard(text) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to the legacy copy path for extension/web preview contexts.
    }
  }

  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.left = "-9999px";
  input.style.top = "0";
  document.body.appendChild(input);
  input.focus({ preventScroll: true });
  input.select();
  input.setSelectionRange(0, input.value.length);

  try {
    if (!document.execCommand("copy")) {
      throw new Error("Copy was not allowed by this browser.");
    }
  } finally {
    input.remove();
  }
}

function getFontStackText(font) {
  if (font.cssFontFamily) {
    return font.cssFontFamily;
  }

  if (Array.isArray(font.stack) && font.stack.length) {
    return font.stack.map(formatCssFamily).join(", ");
  }

  return formatCssFamily(font.family);
}

function formatCssFamily(family) {
  const name = String(family || "").trim();

  if (/^[a-z0-9_-]+$/i.test(name)) {
    return name;
  }

  return `"${name.replace(/"/g, "\\\"")}"`;
}

async function toggleFavorite(font) {
  const key = favoriteKey(font.family);

  if (isFavorite(font.family)) {
    state.favorites = state.favorites.filter((item) => favoriteKey(item.family) !== key);
  } else {
    state.favorites.unshift({
      family: font.family,
      stack: font.stack || [],
      source: font.source || "Unknown",
      savedAt: new Date().toISOString()
    });
  }

  state.favorites = dedupeFavorites(state.favorites).slice(0, 24);
  await saveFavorites();
  render();
}

function isFavorite(family) {
  const key = favoriteKey(family);
  return state.favorites.some((item) => favoriteKey(item.family) === key);
}

function favoriteKey(family) {
  return String(family || "").trim().toLowerCase();
}

function dedupeFavorites(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = favoriteKey(item.family);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function loadFavorites() {
  if (!hasExtensionApi()) {
    state.favorites = readLocalFavorites();
    renderFavorites();
    return;
  }

  const result = await chrome.storage.local.get(FAVORITES_KEY);
  state.favorites = Array.isArray(result[FAVORITES_KEY]) ? result[FAVORITES_KEY] : [];
  renderFavorites();
}

async function saveFavorites() {
  if (!hasExtensionApi()) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(state.favorites));
    return;
  }

  await chrome.storage.local.set({ [FAVORITES_KEY]: state.favorites });
}

function readLocalFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function renderFavorites() {
  nodes.favoriteCount.textContent = String(state.favorites.length);
  nodes.favorites.innerHTML = "";

  state.favorites.forEach((favorite) => {
    const pill = document.createElement("span");
    pill.className = "favorite-pill";

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.textContent = favorite.family;
    openButton.title = `Search ${favorite.family} on Kreativ Font`;
    openButton.addEventListener("click", () => openKreativSearch(favorite.family));

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-favorite";
    removeButton.textContent = "x";
    removeButton.title = `Remove ${favorite.family}`;
    removeButton.addEventListener("click", async () => {
      state.favorites = state.favorites.filter((item) => favoriteKey(item.family) !== favoriteKey(favorite.family));
      await saveFavorites();
      render();
    });

    pill.append(openButton, removeButton);
    nodes.favorites.appendChild(pill);
  });
}

function loadDemo() {
  state.isDemo = true;
  state.fonts = [
    {
      family: "Inter",
      stack: ["Inter", "system-ui", "sans-serif"],
      cssFontFamily: "Inter, system-ui, sans-serif",
      source: "Loaded web font",
      count: 18,
      sample: "Curated typography for practical creative work.",
      roles: [{ value: "Body", count: 12 }, { value: "Action", count: 6 }],
      sizes: [{ value: "16px", count: 12 }, { value: "14px", count: 6 }],
      weights: [{ value: "400", count: 10 }, { value: "700", count: 8 }],
      colors: [{ value: "rgb(23, 23, 23)", count: 14 }, { value: "rgb(102, 106, 112)", count: 4 }]
    },
    {
      family: "Georgia",
      stack: ["Georgia", "serif"],
      cssFontFamily: "Georgia, serif",
      source: "System/fallback",
      count: 5,
      sample: "A more editorial font sample.",
      roles: [{ value: "Heading", count: 5 }],
      sizes: [{ value: "32px", count: 3 }, { value: "24px", count: 2 }],
      weights: [{ value: "700", count: 5 }],
      colors: [{ value: "rgb(11, 111, 97)", count: 5 }]
    }
  ];
  state.scannedElements = 23;
  nodes.pageLabel.textContent = "Preview";
  loadFavorites().then(() => {
    setStatus("Preview mode is running because Chrome extension APIs are unavailable.");
    render();
  });
}
