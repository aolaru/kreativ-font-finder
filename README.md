# Kreativ Font Finder

Kreativ Font Finder is a Chrome MV3 extension that scans the active page, lists detected font families, highlights where a font is used, saves discoveries locally, and opens matching searches on Kreativ Font.

## MVP Features

- Scan the current tab for readable text styles.
- Group font usage by family.
- Show usage count, source signal, common sizes, weights, colors, fallback stack, and a sample.
- Highlight all visible elements using a selected font.
- Copy a detected font stack as a CSS `font-family` declaration.
- Open `https://kreativfont.com/?s=FontName` from any detected or saved font.
- Save favorite font discoveries with `chrome.storage.local`.

## Load In Chrome

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this folder:

```text
/Users/andreiolaru/Development/codexcode/kreativ-extensions/kreativ-font-finder
```

The extension needs `activeTab`, `scripting`, `storage`, and `clipboardWrite` so it can scan only the tab you invoke it on, keep saved fonts locally, and copy detected font stacks.

## Notes

The MVP does not send page text or browsing content anywhere. It only opens Kreativ Font search URLs when you click Search or a saved font.

Chrome blocks extensions on internal pages such as `chrome://`, the Chrome Web Store, and extension pages.
