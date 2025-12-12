# Chrome Web Store Privacy Form Answers

## Single Purpose Description (1,000 characters max)

Glean Web Clipper allows users to save web content (text selections and full pages) to their Glean Collections knowledge base. The extension provides a simple interface for clipping articles, notes, and research content, which is then synchronized to the user's configured Glean Collection via API. The extension also includes a notebook viewer for managing and searching all saved clips locally. The single purpose is to enable users to capture web content and organize it in their Glean knowledge base.

---

## Permission Justifications (1,000 characters max each)

### activeTab justification

The `activeTab` permission is required to access the content of the currently active browser tab when the user clicks the extension icon or uses context menu options. This allows the extension to:
- Extract the page title, URL, and selected text when the user clips content
- Capture favicons from the current page
- Access page metadata needed to create meaningful clip entries
- Only activates when the user explicitly interacts with the extension (clicking icon or context menu), ensuring minimal permission usage

### storage justification

The `storage` permission is essential for the extension's core functionality:
- Store user configuration (API tokens, collection IDs, preferences) locally in the browser
- Save clipped content locally before syncing to Glean, enabling offline functionality
- Maintain sync status and retry information for each clip
- Cache collection names and user preferences for better performance
- All data is stored locally in Chrome's encrypted storage and never shared with third parties

### contextMenus justification

The `contextMenus` permission enables right-click menu options for quick clipping:
- "Clip to Glean Collection" option appears when user selects text on any webpage
- "Clip entire page" option allows users to save full page content
- Provides convenient access to clipping functionality without opening the extension popup
- Only appears on user-initiated actions (right-click), ensuring user control

### scripting justification

The `scripting` permission is required to:
- Inject content scripts that detect text selections and page content
- Extract page metadata (title, URL, favicon) from web pages
- Access page content when user initiates a clip action
- Only executes scripts on pages where the user explicitly requests clipping (via icon click or context menu)
- Does not run automatically or invisibly - all script execution is user-initiated

### identity justification

The `identity` permission is used for OAuth authentication with Glean:
- Enables secure OAuth login flow for users who prefer OAuth over manual API token entry
- Provides secure token management through Chrome's identity API
- Allows users to authenticate with their Glean account without manually copying tokens
- Only used when user explicitly chooses OAuth authentication method in settings

### Host permission justification

Host permissions (`http://*/*`, `https://*/*`, `https://linkedin-be.glean.com/*`) are required for:
- **Content access**: Reading page content, titles, URLs, and selected text from any webpage when the user explicitly requests clipping
- **API communication**: Sending clipped content to the user's Glean instance (linkedin-be.glean.com) via the Collections API
- **Favicon retrieval**: Fetching website favicons to display with clips
- All network requests are user-initiated (clipping actions) and only send data to the user's configured Glean instance. No data is sent to third parties.

---

## Remote Code Justification

**Note:** The extension does NOT actually use remote code execution. All JavaScript is bundled in the extension package. However, if you selected "Yes", here's a justification:

The extension makes API calls to Glean's backend servers (linkedin-be.glean.com) using the standard `fetch()` API to:
- Synchronize clipped content to the user's Glean Collections
- Retrieve collection information and user preferences
- Authenticate with OAuth tokens

These are data transfer operations, not remote code execution. All JavaScript code is included in the extension package. No external scripts are loaded, no `eval()` is used, and no dynamic code execution occurs.

**Recommendation:** You may want to change this to "No" since there is no actual remote code execution - only API data calls.

---

## Data Usage

### What user data do you collect?

Check these boxes:
- ✅ **Website content** - The extension collects text content, page titles, URLs, and favicons from web pages that users explicitly choose to clip. This is the core functionality of the extension.

### Do NOT check:
- ❌ Personally identifiable information
- ❌ Health information
- ❌ Financial and payment information
- ❌ Authentication information (OAuth tokens are handled by Chrome's identity API, not stored by extension)
- ❌ Personal communications
- ❌ Location
- ❌ Web history (only clips user explicitly saves)
- ❌ User activity (no tracking or monitoring)

### Certifications (Check all three):

✅ **I do not sell or transfer user data to third parties, outside of the approved use cases**
- All data is only sent to the user's configured Glean instance. No third-party services receive any data.

✅ **I do not use or transfer user data for purposes that are unrelated to my item's single purpose**
- All collected data (clipped content) is used solely for the purpose of saving content to the user's Glean Collections, which is the extension's single purpose.

✅ **I do not use or transfer user data to determine creditworthiness or for lending purposes**
- The extension does not perform any credit or lending-related functions.

---

## Privacy Policy URL

You need to provide a privacy policy URL. Options:

1. **Create a simple privacy policy page** on your company's website
2. **Use a GitHub Pages site** if you have one
3. **Use your company's internal documentation site**

The privacy policy should state:
- What data is collected (clipped web content, API tokens)
- How it's used (synced to user's Glean instance)
- Where it's stored (locally in Chrome storage, user's Glean instance)
- That no data is shared with third parties
- How users can delete their data

**Example URL format:**
- `https://yourcompany.com/glean-clipper-privacy`
- `https://github.com/yourcompany/glean-clipper/blob/main/PRIVACY.md`
- `https://yourcompany.com/docs/glean-clipper/privacy-policy`

---

## Additional Store Listing Requirements

### Screenshots
- Take at least 1 screenshot (1280x800 or 640x400 recommended)
- Show the extension popup with clips
- Show the notebook viewer
- Show the settings page

### Icon
- Make sure `icon128.png` is uploaded (128x128 pixels)

### Category
- Select: **Productivity**

### Language
- Select: **English (United States)** or your primary language

### Detailed Description
- Use the description from `STORE_DESCRIPTION.md` (already provided earlier)

### Contact Email
- Go to Account tab and add your email
- Verify the email address

---

## Quick Checklist

- [ ] Single purpose description filled
- [ ] All 6 permission justifications filled
- [ ] Remote code justification (or change to "No")
- [ ] Website content checkbox checked
- [ ] All 3 certifications checked
- [ ] Privacy policy URL provided
- [ ] At least 1 screenshot uploaded
- [ ] Icon uploaded
- [ ] Category selected (Productivity)
- [ ] Language selected
- [ ] Detailed description added
- [ ] Contact email added and verified

