# Testing Guide - Phase 1 Updates

## Quick Test Checklist

### 1. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `glean-clipper-extension` folder
5. Verify the extension loads without errors (check for red error messages)

### 2. Test Mock API Mode

**Enable Mock Mode:**
1. Click the extension icon in toolbar
2. Go to "Settings" tab
3. Scroll to "Developer Options" section (yellow highlighted box)
4. Toggle "Mock API Mode" ON
5. Verify connection status shows "Mock Mode" (green badge)

**Test Mock Collections:**
1. Click "Test Connection" button
2. Should show: "🎭 Mock API Mode is enabled!" alert
3. Or if it proceeds, should load 3 mock collections
4. Verify collections dropdown shows:
   - Mock Collection 1
   - Mock Collection 2
   - Web Clips

**Test Mock Sync:**
1. Select a collection from dropdown
2. Click "Test Sync" button
3. Should show mock mode warning or success message
4. Should simulate successful sync

**Test Mock Clipping:**
1. Navigate to any webpage
2. Select some text
3. Click the "Clip to Glean" button that appears
4. Open extension popup → Clips tab
5. Verify clip shows as "Synced" (mock mode simulates success)
6. Check console for "🎭 MOCK API" messages

### 3. Test Token Type (Glean-Issued - Default)

**Verify Default Behavior:**
1. Disable Mock API Mode
2. Open Chrome DevTools → Extensions → Service Worker (for this extension)
3. Check console logs
4. Make a test connection
5. Verify in Network tab (if accessible) that requests do NOT include `X-Glean-Auth-Type: OAUTH` header
6. This is correct for Glean-issued tokens

### 4. Test Error Messages

**Network Error Test:**
1. Disable Mock API Mode
2. Disconnect from VPN (or block network)
3. Click "Test Connection"
4. Should show error: "Network error: Cannot reach Glean API. Are you on VPN?"
5. Error should suggest enabling Mock API Mode

**Auth Error Test:**
1. Enter an invalid token
2. Click "Test Connection"
3. Should show: "Authentication failed (401)" with specific guidance

### 5. Test Clip Queueing (Network Errors)

1. Disable Mock API Mode
2. Disconnect from VPN
3. Create a clip (select text, click clip button)
4. Open extension popup
5. Clip should show status: "pending" (not "failed")
6. Error message should indicate it will retry when connection restored

### 6. Verify Code Structure

**Check Console for Errors:**
1. Open extension popup
2. Right-click → Inspect (or F12)
3. Check Console tab for any errors
4. Should see no red errors

**Check Service Worker:**
1. Go to `chrome://extensions/`
2. Find "Glean Web Clipper"
3. Click "Service Worker" link
4. Check console for errors
5. Should see initialization messages

## Expected Behavior

### Mock Mode Enabled
- ✅ Connection status: "Mock Mode"
- ✅ All API calls return simulated responses
- ✅ Test buttons show mock mode warnings
- ✅ Clips show as "Synced" (simulated)
- ✅ Console shows "🎭 MOCK API" messages

### Mock Mode Disabled (Real API)
- ✅ Connection status: "Ready" or "Disconnected"
- ✅ Real API calls are made
- ✅ Network errors show helpful messages
- ✅ Auth errors show specific guidance
- ✅ Clips queue for retry on network errors

## Troubleshooting

### Extension Won't Load
- Check `manifest.json` syntax
- Verify all imported files exist
- Check Service Worker console for errors

### Mock Mode Not Working
- Verify `devMode: true` in storage (check with `chrome.storage.local.get(['gleanConfig'])`)
- Check console for "🎭 MOCK MODE" messages
- Verify `modules/mockApi.js` exists and is imported

### Token Type Issues
- Check console for header logs
- Verify `tokenType` in config (should be 'glean-issued' by default)
- For OAuth tokens, manually set `tokenType: 'oauth'` in storage

### Error Messages Not Showing
- Check network tab for actual error responses
- Verify error handling in `modules/gleanApi.js`
- Check console for error logs

## Manual Storage Check

To verify config is saved correctly:

```javascript
// In Service Worker console or popup console:
chrome.storage.local.get(['gleanConfig'], (result) => {
  console.log('Config:', result.gleanConfig);
  // Should show:
  // {
  //   tokenType: 'glean-issued',
  //   devMode: true/false,
  //   ...other fields
  // }
});
```

## Next Steps After Testing

If all tests pass:
- ✅ Mock mode works for offline development
- ✅ Token type defaults correctly
- ✅ Error messages are helpful
- Ready for Phase 2 improvements

If issues found:
- Check console errors
- Verify file paths and imports
- Check manifest.json permissions
- Review PHASE1_IMPLEMENTATION.md for details


