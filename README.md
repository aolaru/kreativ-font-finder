# Kreativ Font Finder

Kreativ Font Finder is a Chrome extension for inspecting fonts on the current page, highlighting where each family appears, saving favorites, and opening matching searches on Kreativ Font, MyFonts, or Creative Market.

## Features

- Scan the current tab for readable text styles.
- Group font usage by family.
- Show usage count, source signal, common sizes, weights, colors, fallback stack, and a sample.
- Highlight all visible elements using a selected font.
- Copy a detected font stack as a CSS `font-family` declaration.
- Search detected fonts on Kreativ Font, MyFonts, or Creative Market.
- Use the page context menu to open the popup, search selected text, or open the image font identifier.
- Save favorite font discoveries with `chrome.storage.local`.

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this folder:

```text
/Users/andreiolaru/Development/codexcode/kreativ-extensions/kreativ-font-finder
```

The extension needs `activeTab`, `scripting`, `storage`, `clipboardWrite`, and `contextMenus` so it can scan only the tab you invoke it on, keep saved fonts locally, copy detected CSS font stacks, and add right-click actions.

## Context Menu

- Right-click a normal webpage and choose **Open Kreativ Font Finder** to open the popup.
- Select text, right-click, and choose **Search Kreativ Font for "..."** to search that selected text on Kreativ Font.
- Right-click an image and choose **Identify font in this image** to open the Kreativ Font Identifier upload tool.

## Privacy Notes

Kreativ Font Finder does not send page text, images, or browsing content anywhere. It only opens external search URLs when you click a search button, a saved font, or a context menu action.

External search links are direct, non-affiliate links.

Chrome blocks extensions on internal pages such as `chrome://`, the Chrome Web Store, and extension pages.

## Release Package

Create a Chrome Web Store ZIP from the repository root:

```sh
scripts/package-extension.sh
```

The script validates the JavaScript files and manifest, then writes a package to `dist/`.
