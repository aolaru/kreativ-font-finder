# Chrome Web Store Privacy Field Draft

Use this as a working draft for the Chrome Web Store Developer Dashboard privacy fields. Keep this wording aligned with `PRIVACY.md`.

## Single Purpose

Kreativ Font Finder helps users inspect typography on the active webpage, save font discoveries locally, and open related searches or tools on Kreativ Font.

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

Select: No, this extension does not use remote code.

Rationale: All executable JavaScript, HTML, and CSS is packaged in the extension. The extension opens Kreativ Font URLs only in normal browser tabs after user action.

## Data Usage Disclosure

Suggested conservative disclosure:

- Website content: The extension processes visible text samples and computed typography from the active tab locally so it can show detected font usage. Selected text is sent to Kreativ Font only when the user explicitly chooses the selected-text search context menu action.

Do not select:

- Personally identifiable information
- Health information
- Financial and payment information
- Authentication information
- Personal communications
- Location
- Web history
- User activity

## Limited Use Certification Notes

The extension uses data only to provide font inspection, saved favorites, and user-triggered Kreativ Font searches/tools. It does not sell user data, use data for advertising, use data for creditworthiness or lending, or transfer data except as described in the user-triggered Kreativ Font URL actions.

## Privacy Policy URL

Use a published URL for `PRIVACY.md`, for example:

https://github.com/aolaru/kreativ-font-finder/blob/main/PRIVACY.md
