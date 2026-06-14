# Kreativ Font Finder Privacy Policy

Last updated: June 7, 2026

Kreativ Font Finder is a Chrome extension that helps users inspect typography on the active webpage, save favorite font discoveries locally, and open related font searches.

## Data Processed Locally

When you click the extension button or use the context menu to open the font finder, the extension scans visible text on the active tab. It reads computed typography information such as font family, font size, font weight, color, page hostname, and short visible text samples so it can group and display font usage.

This scan happens locally in your browser. Kreativ Font Finder does not send scanned page content, detected font data, browsing history, or saved favorites to a server.

## Data Stored Locally

If you save a font, the extension stores the saved font name, source hint, fallback stack, and saved date in `chrome.storage.local` on your device. This data stays in your browser profile and is used only to show the Saved list in the extension.

You can remove saved fonts from the extension popup at any time.

## Data Sent Only After User Action

Kreativ Font Finder opens external URLs only after explicit user action:

- Clicking a search button for a detected font opens the chosen search provider for that font name. Current destinations are Kreativ Font, MyFonts, and Creative Market.
- Clicking a saved font opens a Kreativ Font search URL for that font name.
- Selecting text, right-clicking, and choosing the search context menu item opens a Kreativ Font search URL for the selected text.
- Right-clicking an image and choosing the image identifier context menu item opens the Kreativ Font Identifier page.

The extension does not automatically upload images. The image identifier context menu item only opens the identifier tool; any image upload must be performed by the user on that page.

## Remote Code, Analytics, and Tracking

Kreativ Font Finder does not load or execute remotely hosted code. It does not include analytics, ads, tracking scripts, or third-party telemetry.

## Permissions

Kreativ Font Finder uses the following Chrome extension permissions:

- `activeTab`: to scan only the tab where the user invokes the extension.
- `scripting`: to inject the local scanner script into the active tab after user action.
- `storage`: to save favorite fonts locally in the browser.
- `clipboardWrite`: to copy a detected CSS `font-family` declaration to the clipboard after the user clicks Copy CSS.
- `contextMenus`: to add right-click actions for opening the finder, searching selected text, and opening the image font identifier.

The extension does not request broad host permissions.

## Contact

For privacy questions or deletion requests related to this extension, open an issue at:

https://github.com/aolaru/kreativ-font-finder/issues
