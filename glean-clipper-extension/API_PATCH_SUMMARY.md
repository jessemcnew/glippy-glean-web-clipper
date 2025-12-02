# Glean API Unified Patch Summary

## Overview
This patch standardizes all Glean API calls across the extension to match official documentation and implements consistent error handling, retry logic, and configuration management.

## Changes Applied

### 1. Created Unified Fetch Helper (`modules/apiFetch.js`)
- **Purpose**: Centralized fetch utility with timeout, retry, and error handling
- **Features**:
  - `fetchWithRetry()`: Handles timeouts (30s default) and retries for 429/5xx errors
  - `fetchJSON()`: Automatic JSON parsing with error handling
  - `createCollectionsAPIHeaders()`: Proper OAuth headers for Collections API
  - `createIndexingAPIHeaders()`: Headers for Indexing API (no OAuth header)
  - `normalizeDomain()`: Unified domain conversion logic

### 2. Updated `modules/gleanApi.js`
- **Added**: Import of unified fetch helpers
- **Fixed**: 
  - Collections API now includes `X-Glean-Auth-Type: OAUTH` header
  - Indexing API payload structure corrected: `{datasource: "...", document: {...}}`
  - Domain normalization using unified function
  - Error handling with proper status codes
  - Timeout and retry logic via fetchJSON

### 3. Updated `collections-api.js`
- **Fixed**: All Collections API calls now use unified fetch helpers
- **Added**: `X-Glean-Auth-Type: OAUTH` header to all requests
- **Improved**: Error handling and logging

### 4. Updated `modules/storage.js`
- **Fixed**: Changed from `chrome.storage.sync` to `chrome.storage.local` for consistency
- **Fixed**: Now reads from `gleanConfig` object (matches popup.js usage)
- **Added**: Support for both `apiToken` and `clientToken` aliases

### 5. Updated `notebook-viewer.js`
- **Fixed**: Search API now uses unified fetch helpers
- **Fixed**: Removed hardcoded config, now reads from storage
- **Added**: `X-Glean-Auth-Type: OAUTH` header for search requests

### 6. Updated `popup.js`
- **Removed**: Hardcoded tokens (Search API and Indexing API tokens)
- **Fixed**: Config now only uses tokens from UI/storage

## API Compliance Fixes

### Headers
- ✅ Added `X-Glean-Auth-Type: OAUTH` to all Collections API calls
- ✅ Indexing API correctly does NOT include `X-Glean-Auth-Type`
- ✅ All requests include `Accept: application/json`

### Payload Structure
- ✅ Indexing API payload: `{datasource: "...", document: {...}}` (was incorrectly nested)

### Error Handling
- ✅ Timeout handling (30s default)
- ✅ Retry logic for 429/5xx with exponential backoff
- ✅ Better error messages with status codes
- ✅ No retry for auth errors (401/403/404)

### Configuration
- ✅ Unified storage API (`chrome.storage.local`)
- ✅ No hardcoded tokens
- ✅ Unified domain normalization
- ✅ Config keys: `gleanConfig` object with `apiToken`, `clientToken`, `domain`, `collectionId`, etc.

## Manifest Verification

### ✅ Permissions
- `activeTab`: Required for content script interaction
- `storage`: Required for storing clips and config
- `contextMenus`: Required for context menu functionality
- `scripting`: Required for content script injection

### ✅ Host Permissions
- `http://*/*`, `https://*/*`: Required for API calls
- `https://linkedin-be.glean.com/*`: Specific Glean domain

### ✅ Background Service Worker
- `service_worker: "background.js"`
- `type: "module"`: Required for ES6 imports

## Testing Checklist

1. **Extension Reload**
   - [ ] Reload extension in `chrome://extensions`
   - [ ] Verify no console errors in service worker

2. **Service Worker Console**
   - [ ] Open service worker console
   - [ ] Stream logs for 30s
   - [ ] Check for errors/warnings

3. **API Flows**
   - [ ] Test Collections API sync from popup
   - [ ] Test Indexing API sync (if enabled)
   - [ ] Test search in notebook viewer
   - [ ] Test connection test button

4. **Network Tests**
   - [ ] Verify all requests include `X-Glean-Auth-Type: OAUTH` for Collections API
   - [ ] Verify Indexing API requests do NOT include `X-Glean-Auth-Type`
   - [ ] Check for timeout/retry behavior on slow networks
   - [ ] Verify error messages are clear and actionable

## Known Issues / TODOs

1. **TODO**: Add configuration UI for Indexing API token (currently not in popup UI)
2. **TODO**: Consider adding retry UI feedback for failed syncs
3. **TODO**: Add unit tests for domain normalization edge cases

## Documentation References

- Collections API: https://developers.glean.com/api/client-api/collections/overview
- Indexing API: https://developers.glean.com/api-info/indexing/authentication/overview
- Authentication: https://developers.glean.com/api-info/client/authentication/overview

