# Glean API Call Audit Report

## Inventory of All API Calls

### 1. Collections API - Add Items to Collection
**File**: `modules/gleanApi.js:97`
- **Method**: POST
- **URL**: `https://${domain}/rest/api/v1/addcollectionitems`
- **Headers**: 
  - `Content-Type: application/json`
  - `Accept: application/json`
  - `Authorization: Bearer ${config.apiToken.trim()}` ❌ MISSING `X-Glean-Auth-Type: OAUTH`
- **Payload**: 
  ```json
  {
    "collectionId": <number>,
    "addedCollectionItemDescriptors": [{"url": "...", "description": "..."}]
  }
  ```
- **Issues**:
  - ❌ Missing `X-Glean-Auth-Type: OAUTH` header (required for OAuth tokens)
  - ❌ No timeout handling
  - ❌ No retry for 429/5xx errors
  - ❌ Domain conversion hardcoded to `linkedin-be.glean.com` instead of using config

### 2. Indexing API - Index Document
**File**: `modules/gleanApi.js:215`
- **Method**: POST
- **URL**: `https://${domain}/api/index/v1/indexdocument`
- **Headers**: 
  - `Content-Type: application/json`
  - `Accept: application/json`
  - `Authorization: Bearer ${config.indexingToken.trim()}` ✅ Correct
- **Payload**: 
  ```json
  {
    "document": {
      "datasource": "WEBCLIPPER",
      "objectType": "WEBCLIP",
      "id": "...",
      "title": "...",
      "body": {"mimeType": "text/plain", "textContent": "..."},
      "viewURL": "...",
      "permissions": {...}
    }
  }
  ```
- **Issues**:
  - ❌ Payload structure incorrect - should be `{"datasource": "...", "document": {...}}` not nested under `document`
  - ❌ No timeout handling
  - ❌ No retry for 429/5xx errors
  - ⚠️ Domain conversion logic is complex and may be incorrect

### 3. Collections API - Test Connection
**File**: `modules/gleanApi.js:360`
- **Method**: POST
- **URL**: `https://${config.domain}/rest/api/v1/addcollectionitems`
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer ${config.apiToken}` ❌ MISSING `X-Glean-Auth-Type: OAUTH`
- **Payload**: Empty array for connection test
- **Issues**:
  - ❌ Missing `X-Glean-Auth-Type: OAUTH` header
  - ❌ Uses `config.domain` directly without domain conversion
  - ❌ No timeout handling

### 4. Collections API - List Collections
**File**: `collections-api.js:65`
- **Method**: POST
- **URL**: `${this.baseUrl}/rest/api/v1/listcollections`
- **Headers**: 
  - `Authorization: Bearer ${this.config.apiToken}` ❌ MISSING `X-Glean-Auth-Type: OAUTH`
  - `Content-Type: application/json`
- **Payload**: Filter object (optional)
- **Issues**:
  - ❌ Missing `X-Glean-Auth-Type: OAUTH` header
  - ❌ No timeout handling
  - ❌ No retry for 429/5xx errors

### 5. Collections API - Create Collection
**File**: `collections-api.js:110`
- **Method**: POST
- **URL**: `${this.baseUrl}/rest/api/v1/createcollection`
- **Headers**: Same as above
- **Issues**: Same as above

### 6. Collections API - Get Collection
**File**: `collections-api.js:115`
- **Method**: POST
- **URL**: `${this.baseUrl}/rest/api/v1/getcollection`
- **Issues**: Same as above

### 7. Collections API - Edit Collection
**File**: `collections-api.js:127`
- **Method**: POST
- **URL**: `${this.baseUrl}/rest/api/v1/editcollection`
- **Issues**: Same as above

### 8. Collections API - Delete Collection
**File**: `collections-api.js:132`
- **Method**: POST
- **URL**: `${this.baseUrl}/rest/api/v1/deletecollection`
- **Issues**: Same as above

### 9. Collections API - Add Items (via collections-api.js)
**File**: `collections-api.js:152`
- **Method**: POST
- **URL**: `${this.baseUrl}/rest/api/v1/addcollectionitems`
- **Issues**: Same as above

### 10. Collections API - Delete Item
**File**: `collections-api.js:157`
- **Method**: POST
- **URL**: `${this.baseUrl}/rest/api/v1/deletecollectionitem`
- **Issues**: Same as above

### 11. Collections API - Edit Item
**File**: `collections-api.js:171`
- **Method**: POST
- **URL**: `${this.baseUrl}/rest/api/v1/editcollectionitem`
- **Issues**: Same as above

### 12. Search API - Search Glean
**File**: `notebook-viewer.js:729`
- **Method**: POST
- **URL**: `https://${gleanConfig.domain}/rest/api/v1/search`
- **Headers**: 
  - `Authorization: Bearer ${gleanConfig.clientToken}` ❌ MISSING `X-Glean-Auth-Type: OAUTH`
  - `Content-Type: application/json`
  - `Accept: application/json`
- **Payload**: 
  ```json
  {
    "query": "...",
    "pageSize": 10,
    "maxSnippetSize": 200
  }
  ```
- **Issues**:
  - ❌ Missing `X-Glean-Auth-Type: OAUTH` header
  - ❌ Hardcoded config (not from storage)
  - ❌ No timeout handling
  - ❌ No retry for 429/5xx errors

## Critical Configuration Issues

### 1. Storage Mismatch
- **File**: `modules/storage.js:184` uses `chrome.storage.sync.get`
- **File**: `popup.js:219` uses `chrome.storage.local.get(['gleanConfig'])`
- **Issue**: Config retrieval uses different storage APIs - should be consistent

### 2. Token Storage
- Hardcoded tokens in `popup.js:290-292`:
  - Search API token: `[REDACTED]`
  - Indexing API token: `[REDACTED]`
- **Issue**: Should come from storage only, never hardcoded

### 3. Domain Conversion
- Multiple inconsistent domain conversion strategies:
  - `gleanApi.js:52-62` - converts `app.glean.com` to `linkedin-be.glean.com`
  - `gleanApi.js:157-172` - complex conversion for Indexing API
  - `collections-api.js:10-33` - different conversion logic
- **Issue**: Should use a single unified domain conversion function

## Required Fixes Summary

### Headers
1. ✅ Add `X-Glean-Auth-Type: OAUTH` to all Collections API calls
2. ✅ Keep Indexing API without `X-Glean-Auth-Type` (correct per docs)
3. ✅ Add `Accept: application/json` where missing

### Payload Structure
1. ❌ Fix Indexing API payload: should be `{datasource: "...", document: {...}}` not `{document: {datasource: "...", ...}}`

### Error Handling
1. ✅ Add timeout handling (30s default)
2. ✅ Add retry logic for 429/5xx with exponential backoff
3. ✅ Better error messages with response details

### Configuration
1. ✅ Fix storage API mismatch (use `chrome.storage.local` consistently)
2. ✅ Remove hardcoded tokens
3. ✅ Create unified domain conversion function
4. ✅ Get tokens from storage keys: `GLEAN_API_TOKEN`, `GLEAN_INDEXING_TOKEN`, `GLEAN_API_BASE_URL`

### Code Organization
1. ✅ Create unified fetch helper with timeout, retry, and error handling
2. ✅ Centralize header construction
3. ✅ Add TODO comments with doc links

