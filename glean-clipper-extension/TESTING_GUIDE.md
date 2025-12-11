# Extension Testing Guide

## Quick Setup Test

1. **Load Extension**
   - Open Chrome → Extensions → Developer mode → Load unpacked
   - Select `glean-clipper-extension` folder
   - Extension icon should appear in toolbar

2. **Configure API Token**
   - Click extension icon
   - Go to Settings tab
   - Click "Or Enter Token Manually"
   - Paste API token: `WS+MiLxD2tP6nybwZxNNvLhcqox5o5abZZyVJ9FvScA=`
   - Click "Test Connection" (should succeed)
   - Select a collection from dropdown
   - Click "Save Settings"

3. **Test Clip Creation**
   - Open any webpage (e.g., Wikipedia)
   - Select some text on the page
   - Click extension icon
   - Click "Clip to Glean" button
   - Should see success message
   - Check Clips tab - should show new clip

4. **Test Glean Sync**
   - After clipping, check sync status
   - Green checkmark = synced successfully
   - Red X = sync failed (check console for errors)

5. **Test Dashboard Integration**
   - Open dashboard: http://localhost:3000
   - Login with same API token
   - Go to /clips page
   - Should see clips from extension

## Known Issues to Fix

- [ ] OAuth requires client_id in manifest.json (not configured yet)
- [ ] Extension ID needed for dashboard communication
- [ ] Verify domain normalization works correctly
