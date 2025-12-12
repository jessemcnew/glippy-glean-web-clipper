# Glean Web Clipper Extension - Handoff Document

**Last Updated:** Current Session  
**Status:** Functional - Ready for testing and refinement

## 🎯 Current State

The Glean Web Clipper extension is **functional** with modern UI and authentication. Users can:
- ✅ Authenticate with Glean API tokens
- ✅ Select collections via searchable dropdown
- ✅ Clip content from web pages (floating button + context menu)
- ✅ Auto-sync clips to Glean collections
- ✅ View clips and collections in popup

## 📁 Key Files & Architecture

### Core Files
- **`popup-modern.html`** - Modern black/white themed popup UI
- **`popup-modern.css`** - Styling for modern UI
- **`popup.js`** - Main popup logic (settings, clips display, collection management)
- **`background.js`** - Service worker (handles clip saving, API calls)
- **`content.js`** - Content script (floating clip button, text selection)
- **`manifest.json`** - Extension manifest (v3)

### API & Storage
- **`modules/apiFetch.js`** - Unified API fetch helper (retry, error handling, headers)
- **`modules/gleanApi.js`** - Glean API integration (Collections, Indexing)
- **`modules/storage.js`** - Storage operations and sync orchestration
- **`collections-api.js`** - Collections API client

### UI Components
- **`modules/uiHelpers.js`** - Context menus, badge updates
- **`modules/oauth.js`** - OAuth flow (currently simplified to manual token entry)

## 🔐 Authentication Flow

### Token Types (Important!)
The extension supports **Glean-issued tokens** (from Admin console), NOT OAuth tokens:

- **Client API Token** - Used for Collections API
  - Get from: `Admin → Platform → Token Management → Client tab`
  - Required scopes: `COLLECTIONS` (and optionally `ANSWERS` for search)
  - Header: `Authorization: Bearer {token}` (NO `X-Glean-Auth-Type: OAUTH` header!)
  
- **Indexing API Token** - Used for Indexing API (optional)
  - Get from: `Admin → Platform → Token Management → Indexing tab`
  - Header: `Authorization: Bearer {token}`

### Current Implementation
- Token input field is hidden by default (click "Or Enter Token Manually" to show)
- Token is saved to `chrome.storage.local` as `gleanConfig.clientToken`
- Token is automatically loaded from storage if input field is hidden
- Domain normalization: `app.glean.com` → `*-be.glean.com` (backend API domain)

## 🎨 UI Features

### Modern Popup (`popup-modern.html`)
- **Black and white theme** (as requested)
- **Three tabs:** Clips, Collections, Settings
- **Searchable collection selector** - Type to search, click to select
- **Status badges** - "Ready", "Connected", "Disconnected"
- **Sync toggle** - Enable/disable auto-sync to Glean

### Collection Selection
- Search input with autocomplete dropdown
- Shows up to 20 results
- Click to select (doesn't auto-save - user must click "Save Settings")
- Hidden `<select>` element stores the actual collection ID

### Clipping Interface
- **Floating button** - Appears when text is selected on any webpage
- **Context menu** - Right-click options for "Clip selection" and "Clip entire page"
- Success feedback shown after clipping

## 🔧 API Integration

### Domain Normalization
The `normalizeDomain()` function in `apiFetch.js` converts:
- `app.glean.com` → `linkedin-be.glean.com` (or customer-specific backend)
- `company.glean.com` → `company-be.glean.com`
- Backend domains are used for all API calls

### API Endpoints Used
- **Collections API:**
  - `POST /rest/api/v1/addcollectionitems` - Add clips to collection
  - `GET /rest/api/v1/listcollections` - List available collections
- **Indexing API:**
  - `POST /rest/api/v1/index` - Index documents (optional, if enabled)

### Error Handling
- 401/403 errors show specific troubleshooting steps
- Retry logic with exponential backoff for transient failures
- Token validation (warns if token is too short)

## 🐛 Known Issues & Fixes Applied

### Fixed Issues
1. ✅ **Token field visibility** - Auto-shows token input if missing when saving
2. ✅ **Collection ID not saving** - Fixed click handler to properly set collection ID
3. ✅ **Stats variable scope** - Fixed `ReferenceError` in `renderClips()`
4. ✅ **Missing element errors** - Added safe element checks (stats, filters, search-input don't exist in new UI)
5. ✅ **PING message errors** - Added try/catch to handle service worker inactive state
6. ✅ **Token header issue** - Removed `X-Glean-Auth-Type: OAUTH` header for Glean-issued tokens

### Current Behavior
- Collection selection works (searchable dropdown)
- Token is saved to storage and auto-loaded
- Clips sync to Glean when collection is selected and sync is enabled
- All UI elements are safely checked before use

## 🧪 Testing Checklist

### Setup
1. Reload extension in Chrome
2. Open popup → Settings tab
3. Enter domain: `app.glean.com` (or your domain)
4. Click "Or Enter Token Manually"
5. Paste Client API token
6. Click "Test Connection" → Should load collections
7. Search and select a collection
8. Toggle "Sync clips to Glean" ON
9. Click "Save Settings"

### Clipping Test
1. Go to any webpage
2. Select some text
3. Click floating "Clip to Glean" button
4. Verify "Clipped to Glean!" message appears
5. Open extension popup → Clips tab
6. Verify clip appears
7. Check console for sync status

### API Test
1. Click "Test Connection" - Should show "✅ Connected"
2. Click "Test Sync" - Should add test item to collection
3. Check Glean collection to verify items appear

## 📝 Code Patterns & Conventions

### Safe Element Access
```javascript
function getElement(id) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`Element not found: ${id}`);
  }
  return el;
}
```

### Safe Message Sending
```javascript
async function safeRuntimeSendMessage(message) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(message, (res) => {
        const err = chrome.runtime.lastError;
        if (err) {
          console.debug('runtime.sendMessage no receiver:', err.message);
          return resolve(null);
        }
        resolve(res ?? null);
      });
    } catch (e) {
      console.debug('runtime.sendMessage threw:', e?.message || e);
      resolve(null);
    }
  });
}
```

### API Headers for Glean-Issued Tokens
```javascript
// Collections API - NO X-Glean-Auth-Type header for Glean-issued tokens
createCollectionsAPIHeaders(token, {}, false) // isOAuthToken = false

// Indexing API - Just Authorization header
createIndexingAPIHeaders(token)
```

## ✅ Task List

### Immediate Next Steps (When Resuming)
- [ ] **Set up Chrome MCP for automated debugging** (P1 - see `CHROME_MCP_SETUP.md`)
  - [ ] Launch Chrome with remote debugging: `./scripts/launch-chrome-mcp.sh`
  - [ ] Verify MCP connection works
  - [ ] Test using MCP tools to debug extension
- [ ] Test complete clipping flow end-to-end with real Glean instance
- [ ] Verify clips actually appear in Glean collection after sync
- [ ] Test with multiple collections
- [ ] Verify error handling for edge cases (invalid token, network errors, etc.)

### High Priority Tasks
- [ ] Add visual indicator when clip is syncing vs. synced
- [ ] Show sync errors in popup (not just console)
- [ ] Add "Filter my collections" functionality (currently placeholder)
- [ ] Improve collection search (fuzzy matching, recent collections first)
- [ ] Add loading states for API calls (Test Connection, Test Sync buttons)

### Medium Priority Tasks
- [ ] Add keyboard shortcuts for clipping
- [ ] Add batch sync retry for failed clips
- [ ] Add clip preview/edit before syncing
- [ ] Add collection creation from extension
- [ ] Add clip deletion functionality
- [ ] Improve error messages for users (less technical)

### Low Priority Tasks
- [ ] Full OAuth flow (requires backend server)
- [ ] Add analytics/tracking
- [ ] Add export/import clips functionality
- [ ] Add dark mode toggle
- [ ] Add clip tagging/categorization
- [ ] Add search functionality for saved clips

## 🔍 Debugging

### Console Logs
- Look for `🚀 FETCH:`, `✅ FETCH SUCCESS:`, `❌ FETCH ERROR:` for API calls
- Look for `SAVE SETTINGS -` logs for configuration issues
- Look for `Collection clicked:` logs for collection selection

### Common Issues
1. **"Not allowed" (401)** - Token might not be activated, check permissions are "User (self)"
2. **"Collection ID is required"** - User didn't click collection from dropdown, only typed
3. **Service worker inactive** - Reload extension, then try again
4. **Token not found** - Click "Or Enter Token Manually" to show input field

### Storage Inspection
```javascript
// In extension console
chrome.storage.local.get(['gleanConfig'], (result) => {
  console.log('Config:', result.gleanConfig);
});
```

## 📚 Documentation Files

- **`AUTH_STEPS.md`** - Detailed authentication instructions
- **`TOKEN_TYPES.md`** - Explanation of different token types
- **`TOKEN_TROUBLESHOOTING.md`** - Common token issues and fixes
- **`CHROME_MCP_SETUP.md`** - **NEW:** Guide for setting up Chrome MCP for automated debugging
- **`README.md`** - General project documentation

## 🔧 Chrome MCP for Automated Debugging

**Status:** ✅ Setup scripts created, documentation added

**Purpose:** Enable AI assistants to automatically debug the extension instead of manual debugging.

**Files:**
- `scripts/launch-chrome-mcp.sh` - Launch Chrome with remote debugging + extension loaded
- `scripts/stop-chrome-mcp.sh` - Stop Chrome MCP instance
- `CHROME_MCP_SETUP.md` - Complete setup and usage guide

**Quick Start:**
```bash
./scripts/launch-chrome-mcp.sh  # Launch Chrome with extension
# Then use MCP browser_* tools in Cursor to debug
```

**MCP Configuration:** Already set up in `~/.cursor/mcp.json` ✅

## 🎯 Key Decisions Made

1. **Manual token entry over full OAuth** - Simpler for Chrome extension, no backend needed
2. **Searchable dropdown over card-based UI** - Better UX for large collections
3. **Black/white theme** - Matches user's design requirements
4. **Backend domain normalization** - Automatic conversion for API calls
5. **Glean-issued tokens only** - No OAuth header needed (simpler implementation)

## 🔗 Important URLs & References

- **Glean API Docs:** https://developers.glean.com/api-info/
- **Token Management:** `{domain}/admin/platform/tokenManagement?tab=client`
- **Collections API:** `{backend-domain}/rest/api/v1/addcollectionitems`
- **List Collections:** `{backend-domain}/rest/api/v1/listcollections`

## 📞 Quick Reference

### To Resume Work
1. Read this document
2. Check `AUTH_STEPS.md` for current auth flow
3. Review `popup.js` for UI logic
4. Check `modules/apiFetch.js` for API patterns
5. Test with real Glean instance

### To Add Features
1. Follow existing patterns (safe element access, error handling)
2. Use `apiFetch.js` for all API calls
3. Update `popup-modern.html` for UI changes
4. Test in extension context (not just standalone)

---

**Status:** ✅ Ready for continued development  
**Next Session Goal:** TBD - Check user requirements

