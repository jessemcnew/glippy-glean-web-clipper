# Quick Start - Load & Test Extension 🚀

## Step 1: Load Extension in Chrome

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the folder: `/Users/jmcnew/glippy/glean-clipper-extension`
6. Extension should appear with icon in toolbar

## Step 2: Configure Extension

1. **Click extension icon** in Chrome toolbar
2. Go to **Settings** tab
3. Click **"Or Enter Token Manually"**
4. Paste API token: `WS+MiLxD2tP6nybwZxNNvLhcqox5o5abZZyVJ9FvScA=`
5. Click **"Test Connection"** (should show success ✅)
6. **Select a collection** from dropdown (type to search)
7. Click **"Save Settings"**

## Step 3: Test Clip Creation

1. Open any webpage (e.g., Wikipedia article)
2. **Select some text** on the page
3. Click **extension icon**
4. Click **"Clip to Glean"** button
5. Should see: ✅ "Clipped to Glean!"
6. Check **Clips tab** - should show new clip

## Step 4: Verify Sync

1. In extension popup, check clip sync status:
   - ✅ Green checkmark = synced successfully
   - ⏳ No indicator = pending
   - ❌ Red X = failed (check console)
2. Open Glean → Collections → Your collection
3. Should see the clipped item!

## Step 5: Test Dashboard

1. Open dashboard: http://localhost:3000
2. Login with same token
3. Go to `/clips` page
4. Should see clips from extension!

## Troubleshooting

- **Extension not loading?** Check console for errors
- **Connection failed?** Verify token and domain
- **No collections?** Click "Test Connection" first
- **Sync failed?** Check collection ID is selected
- **Dashboard empty?** Make sure extension is loaded and clips exist

## Debug Console

- **Extension popup**: Right-click icon → Inspect popup
- **Background worker**: chrome://extensions → Service worker link
- **Dashboard**: Browser DevTools → Console tab
