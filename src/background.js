"use strict";

const KREATIV_SEARCH_ORIGIN = "https://kreativfont.com/";
const KREATIV_IDENTIFIER_URL = "https://kreativfont.com/tools/kreativ-font-identifier";
const MENU_OPEN_POPUP = "kreativ-open-popup";
const MENU_SEARCH_SELECTION = "kreativ-search-selection";
const MENU_IDENTIFY_IMAGE = "kreativ-identify-image";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_OPEN_POPUP,
      title: "Open Kreativ Font Finder",
      contexts: ["page", "selection"]
    });

    chrome.contextMenus.create({
      id: MENU_SEARCH_SELECTION,
      title: "Search Kreativ Font for \"%s\"",
      contexts: ["selection"]
    });

    chrome.contextMenus.create({
      id: MENU_IDENTIFY_IMAGE,
      title: "Identify font in this image",
      contexts: ["image"]
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_OPEN_POPUP) {
    openPopup(tab);
    return;
  }

  if (info.menuItemId === MENU_SEARCH_SELECTION) {
    openKreativSearch(info.selectionText);
    return;
  }

  if (info.menuItemId === MENU_IDENTIFY_IMAGE) {
    openFontIdentifier();
  }
});

async function openPopup(tab) {
  if (!chrome.action.openPopup) {
    return;
  }

  try {
    const options = tab && Number.isInteger(tab.windowId) ? { windowId: tab.windowId } : undefined;
    await chrome.action.openPopup(options);
  } catch {
    // Chrome rejects this on older versions or if the target window cannot host the popup.
  }
}

function openKreativSearch(selectionText) {
  const query = normalizeSelection(selectionText);

  if (!query) {
    return;
  }

  const url = new URL(KREATIV_SEARCH_ORIGIN);
  url.searchParams.set("s", query);
  chrome.tabs.create({ url: url.toString() });
}

function openFontIdentifier() {
  chrome.tabs.create({ url: KREATIV_IDENTIFIER_URL });
}

function normalizeSelection(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}
