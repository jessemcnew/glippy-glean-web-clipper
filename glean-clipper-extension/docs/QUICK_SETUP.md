# Quick Setup for jmcnew

Your extension is now **PRE-CONFIGURED** with your test data! 🎉

## What's Already Set Up:

- **Domain**: `app.glean.com` ✅
- **Collection ID**: `14191` (your hello-world collection) ✅
- **API Token**: `Tl0+Go7VQn3EPQzhhlwq7xNz0zPj+l0xIa2yZJrQaPo=` ✅
- **Sync Enabled**: `true` ✅

## READY TO TEST IMMEDIATELY!

Everything is pre-configured with your working API token!

## Test It Right Now:

1. **Load Extension**:

   ```bash
   # Open Chrome and go to:
   chrome://extensions/
   # Enable Developer mode, click "Load unpacked"
   # Select this folder: glean-clipper-extension
   ```

2. **Test It Works**:
   - Click the extension icon
   - Go to "Settings" tab
   - Everything is already filled in!
   - Click "Test Connection" - should show your collections count
   - Click "Save Settings" to load collections

3. **Test Clipping**:
   - Go to "Clip" tab
   - Should see your "hello-world" collection and others
   - Navigate to any webpage, select text
   - Click extension → choose collection → click "Clip"
   - Check your Glean collection - new item should appear!

## Expected Results:

- **Test Connection**: "Connection successful! Collections: X"
- **Collections Tab**: Shows your real Glean collections
- **Clipping**: Adds items to your hello-world collection in Glean

That's it! Everything else is pre-configured for you. 🚀
