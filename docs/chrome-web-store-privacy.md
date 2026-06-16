# Chrome Web Store Privacy Details

Reference copy for the Chrome Web Store Developer Dashboard privacy fields. Keep this wording aligned with `PRIVACY.md`.

## Single Purpose

Kreativ Font Finder helps users inspect typography on the active webpage, save font discoveries locally, and open related font searches or tools.

## Permission Justifications

### `activeTab`

Used to access only the tab where the user invokes the extension. The extension scans the active tab after the user clicks the extension or opens it from the context menu.

### `scripting`

Used to inject the local scanner script into the active tab after user action. The scanner reads computed font styles and visible text samples locally in the browser.

### `storage`

Used to save favorite font discoveries locally in `chrome.storage.local`. Saved favorites are not transmitted to a server.

### `clipboardWrite`

Used only when the user clicks Copy CSS in the popup. The extension copies the detected CSS `font-family` declaration to the user's clipboard.

### `contextMenus`

Used to add right-click actions for opening the font finder, searching selected text on Kreativ Font, and opening the Kreativ Font Identifier page for image-based font identification.

## Remote Code

Answer: No, this extension does not use remote code.

Rationale: All executable JavaScript, HTML, and CSS is packaged in the extension. The extension opens external search/tool URLs only in normal browser tabs after user action.

## Data Usage Disclosure

Disclosure:

- Website content: The extension processes visible text samples and computed typography from the active tab locally so it can show detected font usage. Font names or selected text are sent to an external search destination only when the user explicitly clicks a search or context menu action.

Data types not collected:

- Personally identifiable information
- Health information
- Financial and payment information
- Authentication information
- Personal communications
- Location
- Web history
- User activity

## Limited Use Certification Notes

The extension uses data only to provide font inspection, saved favorites, and user-triggered font search/tool links. It does not sell user data, use data for advertising, use data for creditworthiness or lending, or transfer data except as described in the user-triggered external URL actions.

## Privacy Policy URL

Published privacy policy URL:

https://github.com/aolaru/kreativ-font-finder/blob/main/PRIVACY.md
