# Testing Before Submission

## Step 1: Load Extension (Unpacked)

1. **Open Chrome Extensions Page**
   - Go to: `chrome://extensions/`
   - Or: Chrome menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load Unpacked Extension**
   - Click **"Load unpacked"** button
   - Navigate to: `/Users/jmcnew/glippy/glean-clipper-extension`
   - Click **"Select"** or **"Open"**

4. **Verify Extension Loaded**
   - You should see "Glean Web Clipper" in your extensions list
   - Extension icon should appear in Chrome toolbar
   - Status should show "Enabled"

---

## Step 2: Configure Extension

1. **Click Extension Icon** in Chrome toolbar
2. **Go to Settings Tab** (if not already there)
3. **Configure:**
   - Click "Or Enter Token Manually"
   - Enter your Glean domain: `app.glean.com` (or your domain)
   - Enter your API token
   - Click **"Test Connection"** - should show ✅ success
   - **Select a collection** from dropdown (or enter collection ID)
   - Click **"Save Settings"**

---

## Step 3: Test Core Features

### Test 1: Clip Creation
1. Open any webpage (e.g., Wikipedia article)
2. **Select some text** on the page
3. Click **extension icon**
4. Click **"Clip to Glean"** button
5. Should see: ✅ "Clipped to Glean!"
6. Check **Clips tab** - new clip should appear

### Test 2: Context Menu
1. Select text on any webpage
2. **Right-click** → Choose "Clip to Glean Collection"
3. Verify clip is created

### Test 3: Library View
1. Click extension icon
2. Click **"Library"** menu item
3. Verify library/notebook opens
4. Check clips are displayed
5. Test search functionality

### Test 4: Settings
1. Click **"Configuration"** menu item
2. Verify settings panel opens
3. Check all options are accessible
4. Verify connection status

### Test 5: Sync Status
1. After creating a clip, wait a few seconds
2. Check sync status indicator:
   - ✅ Green checkmark = synced
   - ⏳ No indicator = pending
   - ❌ Red X = failed (check console)

---

## Step 4: Check for Errors

1. **Extension Popup Console**
   - Right-click extension icon → **"Inspect popup"**
   - Check Console tab for errors
   - Should see no red errors

2. **Background Service Worker**
   - Go to `chrome://extensions/`
   - Find "Glean Web Clipper"
   - Click **"Service worker"** link (or "Inspect views: Service worker")
   - Check Console for errors
   - Should see initialization messages, no errors

3. **Page Console**
   - Open any webpage
   - Press F12 → Console tab
   - Create a clip
   - Check for any errors

---

## Step 5: Test Edge Cases

### Test with No Token
1. Clear extension storage
2. Try to clip - should show error or prompt for configuration

### Test with Invalid Token
1. Enter invalid token
2. Try to sync - should show error message

### Test Offline
1. Disable network
2. Create clip - should work (saved locally)
3. Enable network - should sync automatically

### Test Multiple Clips
1. Create 3-5 clips from different websites
2. Verify all appear in Clips tab
3. Verify all sync successfully

---

## Step 6: Visual Check

- [ ] Extension popup looks good (dark theme)
- [ ] All menu items visible and clickable
- [ ] Icons display correctly
- [ ] Text is readable
- [ ] Buttons work and have hover states
- [ ] No layout issues
- [ ] Responsive (if applicable)

---

## Step 7: Take Screenshots

While testing, take screenshots for Chrome Store:

1. **Screenshot 1: Extension Popup (Main)**
   - Click extension icon
   - Show Clips tab with some clips visible
   - Take screenshot (1280x800 or larger)

2. **Screenshot 2: Library View (Optional)**
   - Click "Library" menu item
   - Show notebook/library interface
   - Take screenshot

3. **Screenshot 3: Settings (Optional)**
   - Click "Configuration" menu item
   - Show settings panel
   - Take screenshot

**Save as:**
- `screenshot-1-popup.png`
- `screenshot-2-library.png` (optional)
- `screenshot-3-settings.png` (optional)

---

## Common Issues & Fixes

### Extension Won't Load
- **Fix**: Check `manifest.json` is valid JSON
- **Fix**: Check all required files exist
- **Fix**: Check console for specific errors

### Popup Won't Open
- **Fix**: Check `popup-modern.html` exists
- **Fix**: Check manifest.json has correct popup path
- **Fix**: Reload extension

### Clips Not Syncing
- **Fix**: Verify API token is correct
- **Fix**: Verify collection ID is selected
- **Fix**: Check service worker console for API errors
- **Fix**: Verify network connectivity

### Settings Not Saving
- **Fix**: Check Chrome storage permissions
- **Fix**: Check service worker is running
- **Fix**: Reload extension

---

## Quick Test Checklist

- [ ] Extension loads without errors
- [ ] Popup opens and displays correctly
- [ ] Can configure API token and collection
- [ ] Test connection works
- [ ] Can create clips (toolbar button)
- [ ] Can create clips (context menu)
- [ ] Clips appear in Clips tab
- [ ] Clips sync to Glean
- [ ] Library view works
- [ ] Settings panel works
- [ ] No console errors
- [ ] Screenshots taken

---

## After Testing

If everything works:
1. ✅ You're ready to submit!
2. Package extension: `./package-extension.sh`
3. Submit to Chrome Store

If issues found:
1. Fix the issues
2. Test again
3. Then submit

---

*Ready to test! Load the extension unpacked and verify everything works.*
