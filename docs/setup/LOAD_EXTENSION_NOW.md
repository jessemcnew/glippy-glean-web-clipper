# 🚀 LOAD EXTENSION NOW - Step by Step

## ✅ Dashboard Status
Dashboard is starting at: http://localhost:3000

## 📦 Extension Path
```
/Users/jmcnew/glippy/glean-clipper-extension
```

## 🔧 Load Extension in Chrome

### Step 1: Open Chrome Extensions
1. Open Chrome browser
2. Type in address bar: `chrome://extensions/`
3. Press Enter

### Step 2: Enable Developer Mode
1. Toggle **"Developer mode"** ON (top right corner)
2. Should see new buttons appear

### Step 3: Load Extension
1. Click **"Load unpacked"** button
2. Navigate to: `/Users/jmcnew/glippy/glean-clipper-extension`
3. Click **"Select"** or **"Open"**
4. Extension should appear in the list!

### Step 4: Verify Extension Loaded
- ✅ Should see "Glean Web Clipper" in extensions list
- ✅ Should see extension icon in Chrome toolbar
- ✅ No red error messages

## ⚙️ Configure Extension

### Step 5: Open Extension Popup
1. Click the **extension icon** in Chrome toolbar
2. Popup should open showing "Glean Clipper"

### Step 6: Go to Settings
1. Click **"Settings"** tab at top
2. Should see authentication section

### Step 7: Enter API Token
1. Click **"Or Enter Token Manually"** button
2. Token input field should appear
3. Paste this token:
   ```
   WS+MiLxD2tP6nybwZxNNvLhcqox5o5abZZyVJ9FvScA=
   ```
4. Click **"Test Connection"** button
5. Should see: ✅ "Connection successful!"

### Step 8: Select Collection
1. After test succeeds, type in **collection search box**
2. Select a collection from dropdown
3. Click **"Save Settings"**
4. Should see: ✅ "Saved!"

## 🎯 Test Clip Creation

### Step 9: Create a Test Clip
1. Open any webpage (e.g., https://en.wikipedia.org/wiki/Chrome_extension)
2. **Select some text** on the page (highlight it)
3. Click **extension icon** again
4. Click **"Clip to Glean"** button (big button at top)
5. Should see: ✅ "Clipped to Glean!"

### Step 10: Verify Clip Saved
1. In extension popup, click **"Clips"** tab
2. Should see your clip listed!
3. Check sync status (green checkmark = synced)

## 🔍 Verify in Glean

1. Go to Glean: https://app.glean.com
2. Navigate to your collection
3. Should see the clipped item!

## 🎨 Test Dashboard

1. Open: http://localhost:3000
2. Login with same token
3. Go to `/clips` page
4. Should see clips from extension!

## 🐛 If Something Goes Wrong

### Extension Won't Load?
- Check console: chrome://extensions → Service worker → Inspect
- Look for errors in red

### Connection Fails?
- Verify token is correct
- Check domain is `app.glean.com`
- Try "Test Connection" again

### No Collections?
- Make sure "Test Connection" succeeded first
- Collections load after successful connection

### Clip Not Syncing?
- Check collection is selected
- Check sync status in Clips tab
- Look at background worker console for errors

## 📊 What to Check

- [ ] Extension loads without errors
- [ ] Popup opens correctly
- [ ] Settings tab works
- [ ] Token saves successfully
- [ ] Test Connection succeeds
- [ ] Collections load in dropdown
- [ ] Collection can be selected
- [ ] Clip to Glean button works
- [ ] Clip appears in Clips tab
- [ ] Clip syncs to Glean (green checkmark)
- [ ] Dashboard shows clips

## 🎉 Success Indicators

✅ Extension icon visible in toolbar
✅ Popup opens and shows UI
✅ Settings save without errors
✅ Test Connection shows success
✅ Clips appear after clipping
✅ Sync status shows green checkmark
✅ Dashboard displays clips

---

**READY TO GO!** Follow these steps and let me know what happens! 🚀
