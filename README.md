# Kreativ Font Finder

Kreativ Font Finder is a Chrome MV3 extension that scans the active page, lists detected font families, highlights where a font is used, saves discoveries locally, and opens matching searches on Kreativ Font.

## MVP Features

- Scan the current tab for readable text styles.
- Group font usage by family.
- Show usage count, source signal, common sizes, weights, colors, fallback stack, and a sample.
- Highlight all visible elements using a selected font.
- Copy a detected font stack as a CSS `font-family` declaration.
- Open `https://kreativfont.com/?s=FontName` from any detected or saved font.
- Use the page context menu to open the popup, search selected text, or open the image font identifier.
- Save favorite font discoveries with `chrome.storage.local`.

## Load In Chrome

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this folder:

```text
/Users/andreiolaru/Development/codexcode/kreativ-extensions/kreativ-font-finder
```

The extension needs `activeTab`, `scripting`, `storage`, `clipboardWrite`, and `contextMenus` so it can scan only the tab you invoke it on, keep saved fonts locally, copy detected font stacks, and add right-click actions.

## Context Menu

- Right-click a normal webpage and choose **Open Kreativ Font Finder** to open the popup.
- Select text, right-click, and choose **Search Kreativ Font for "..."** to search that selected text on Kreativ Font.
- Right-click an image and choose **Identify font in this image** to open the Kreativ Font Identifier upload tool.

## Notes

The MVP does not send page text, images, or browsing content anywhere. It only opens Kreativ Font URLs when you click Search, a saved font, or a context menu action.

Chrome blocks extensions on internal pages such as `chrome://`, the Chrome Web Store, and extension pages.
