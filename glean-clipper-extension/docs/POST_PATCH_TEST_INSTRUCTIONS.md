# Post-Patch Testing Instructions

## Pre-Test Setup

1. **Reload Extension**
   - Go to `chrome://extensions/`
   - Find "Glean Web Clipper"
   - Click the reload button (🔄)
   - Verify no errors in the extension card

2. **Open Service Worker Console**
   - In `chrome://extensions/`, click "service worker" link under the extension
   - Or use: `chrome://serviceworker-internals/` and find the extension's service worker

## Test 1: Service Worker Initialization

**Steps**:
1. Open service worker console
2. Stream logs for 30 seconds
3. Look for initialization messages

**Expected Output**:
```
Initializing Glean Web Clipper background service worker...
Glean Web Clipper background service worker initialized
```

**Check For**:
- ❌ No import errors
- ❌ No syntax errors
- ❌ No "module not found" errors

## Test 2: Collections API - Add Items

**Steps**:
1. Open popup
2. Go to Settings tab
3. Configure:
   - Domain: `app.glean.com` (or your domain)
   - Client Token: Your OAuth token
   - Collection ID: Your collection ID
4. Click "Test Connection"
5. Click "Test Sync"

**Expected Network Request** (from DevTools Network tab):
```
POST https://linkedin-be.glean.com/rest/api/v1/addcollectionitems
Headers:
  Authorization: Bearer <token>
  X-Glean-Auth-Type: OAUTH ✅ (VERIFY THIS EXISTS)
  Content-Type: application/json
  Accept: application/json
Body:
  {
    "collectionId": <number>,
    "addedCollectionItemDescriptors": [...]
  }
```

**Expected Response**:
- Status: 200 OK (or 400 for empty array test)
- Body: Empty or JSON response

**Check For**:
- ✅ `X-Glean-Auth-Type: OAUTH` header present
- ✅ Domain normalized to `*-be.glean.com` format
- ✅ No timeout errors
- ✅ Clear error messages if auth fails

## Test 3: Indexing API

**Steps**:
1. In popup settings, ensure indexing is enabled (if UI exists)
2. Click "Test Indexing"

**Expected Network Request**:
```
POST https://linkedin-be.glean.com/api/index/v1/indexdocument
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json
  Accept: application/json
  (NO X-Glean-Auth-Type header) ✅
Body:
  {
    "datasource": "WEBCLIPPER",
    "document": {
      "id": "...",
      "title": "...",
      "body": {...}
    }
  }
```

**Check For**:
- ✅ NO `X-Glean-Auth-Type` header
- ✅ Payload structure: `{datasource: "...", document: {...}}`
- ✅ Domain normalized correctly

## Test 4: Search API (Notebook Viewer)

**Steps**:
1. Open notebook viewer
2. Enter search query (2+ characters)
3. Wait for results

**Expected Network Request**:
```
POST https://linkedin-be.glean.com/rest/api/v1/search
Headers:
  Authorization: Bearer <token>
  X-Glean-Auth-Type: OAUTH ✅
  Content-Type: application/json
  Accept: application/json
Body:
  {
    "query": "...",
    "pageSize": 10,
    "maxSnippetSize": 200
  }
```

**Check For**:
- ✅ `X-Glean-Auth-Type: OAUTH` header present
- ✅ Config loaded from storage (not hardcoded)
- ✅ Results display correctly

## Test 5: Error Handling

**Test Scenarios**:

1. **Invalid Token**:
   - Use wrong token
   - Expected: Clear error message mentioning "Authentication failed (401)" and "OAuth token"

2. **Invalid Collection ID**:
   - Use non-existent collection ID
   - Expected: Error message mentioning "Collection not found (404)"

3. **Network Timeout**:
   - Disconnect network
   - Make API call
   - Expected: Timeout error after 30s

4. **Rate Limiting (429)**:
   - Make many rapid requests
   - Expected: Automatic retry with exponential backoff

## Test 6: Storage Consistency

**Steps**:
1. Save config in popup
2. Check Chrome storage:
   ```javascript
   chrome.storage.local.get(['gleanConfig'], console.log)
   ```
3. Verify structure:
   ```json
   {
     "gleanConfig": {
       "domain": "...",
       "apiToken": "...",
       "clientToken": "...",
       "collectionId": "...",
       "enabled": true
     }
   }
   ```

**Check For**:
- ✅ Config stored in `chrome.storage.local` (not `sync`)
- ✅ No hardcoded tokens in config object
- ✅ Config readable by `getGleanConfig()` in storage.js

## Common Issues to Watch For

### Issue 1: "Receiving end does not exist"
- **Cause**: Service worker inactive
- **Fix**: Already handled by PING keepalive
- **Verify**: Service worker stays active

### Issue 2: Missing OAuth Header
- **Symptom**: 401 errors even with valid token
- **Check**: Network tab → verify `X-Glean-Auth-Type: OAUTH` present
- **Fix**: Use `createCollectionsAPIHeaders()` helper

### Issue 3: Domain Not Normalized
- **Symptom**: CORS errors or 404s
- **Check**: Network tab → verify domain is `*-be.glean.com`
- **Fix**: Use `normalizeDomain()` helper

### Issue 4: Timeout Errors
- **Symptom**: Requests hang indefinitely
- **Check**: Verify `fetchWithRetry()` with timeout is used
- **Expected**: Timeout after 30s

## Reporting Results

After testing, report:

1. **Service Worker Logs** (first 30s):
   ```
   [Paste logs here]
   ```

2. **Network Errors** (if any):
   ```
   [Paste error details with file:line if available]
   ```

3. **Console Errors** (popup, content, service worker):
   ```
   [Paste errors here]
   ```

4. **Test Results**:
   - ✅ Test 1: Service Worker Initialization
   - ✅ Test 2: Collections API
   - ✅ Test 3: Indexing API
   - ✅ Test 4: Search API
   - ✅ Test 5: Error Handling
   - ✅ Test 6: Storage Consistency

5. **Any Remaining Issues**:
   ```
   [Describe any issues found]
   ```

