# Current Authentication State

## Extension (glean-clipper-extension)

### Storage
- Uses `chrome.storage.local` for storing configuration
- Config key: `gleanConfig`
- Stores: `apiToken`, `clientToken`, `domain`, `collectionId`, `enabled`, `indexingToken`, `indexingEnabled`

### API Headers
- Collections API: Uses `createCollectionsAPIHeaders()` from `modules/apiFetch.js`
- Currently defaults to `isOAuthToken = false` (Glean-issued tokens)
- Supports OAuth tokens via `isOAuthToken = true` parameter (adds `X-Glean-Auth-Type: OAUTH`)
- Indexing API: Uses `createIndexingAPIHeaders()` (no OAuth header needed)

### Current Implementation
- Token-based authentication only
- No session management
- No token refresh mechanism
- No OAuth flow - tokens are manually entered
- Tokens stored in plain text in Chrome storage (encrypted at rest by Chrome)

### Files
- `modules/storage.js` - Config retrieval (`getGleanConfig()`)
- `modules/gleanApi.js` - API calls with auth headers
- `modules/apiFetch.js` - Header creation and fetch helpers
- `popup.js` - UI for token entry

## Dashboard (glean-dashboard)

### Current State
- **No authentication implemented**
- No auth state management
- No protected routes
- No token storage
- API client (`src/lib/glean-api.ts`) accepts optional `apiKey` but no auth flow

### API Client
- `GleanAPI` class in `src/lib/glean-api.ts`
- Supports MCP endpoint or direct Glean API
- Optional `apiKey` in constructor
- No session management
- No token refresh

### Files
- `src/lib/glean-api.ts` - API client (no auth flow)
- `src/app/page.tsx` - Main dashboard (no auth checks)
- `src/app/layout.tsx` - Basic layout (no auth provider)

## Issues Identified

1. **Extension**: OAuth token support exists but not used (always defaults to Glean-issued tokens)
2. **Dashboard**: No authentication at all
3. **No shared auth state** between extension and dashboard
4. **No token refresh** mechanism
5. **No session management**
6. **Tokens stored in plain text** (though encrypted at rest by Chrome)

## Enhancement Opportunities

1. Add OAuth flow for both extension and dashboard
2. Implement session management
3. Add token refresh mechanism
4. Share auth state between extension and dashboard
5. Add route protection to dashboard
6. Implement auth provider/context for dashboard
7. Add token expiration handling
