# End-to-End Testing Guide

This guide helps you verify the complete workflow from clipping content to viewing it in the dashboard and desktop app.

## Prerequisites

1. **Extension Loaded**: Chrome extension installed and configured
2. **Dashboard Running**: `cd glean-dashboard && npm run dev`
3. **Extension Configured**: API token and collection ID set in extension settings
4. **Dashboard Authenticated**: Logged in with same API token

---

## Test 1: Clip Creation → Extension Storage

### Steps:
1. Open any webpage (e.g., Wikipedia article)
2. **Select some text** on the page
3. Click the **Glean Clipper extension icon** in Chrome toolbar
4. Click **"Clip to Glean"** button
5. Verify success message appears: ✅ "Clipped to Glean!"

### Verification:
- Open extension popup → **Clips tab**
- Verify new clip appears in the list
- Check clip has:
  - ✅ Title (page title)
  - ✅ URL
  - ✅ Selected text
  - ✅ Timestamp
  - ✅ Sync status indicator

### Expected Result:
✅ Clip saved to `chrome.storage.local` with sync status "pending" or "synced"

---

## Test 2: Clip Sync → Glean Collections API

### Steps:
1. After creating a clip (Test 1)
2. Wait a few seconds for automatic sync
3. Check sync status in extension popup:
   - ✅ Green checkmark = synced successfully
   - ⏳ No indicator = pending
   - ❌ Red X = failed (check console)

### Verification:
1. Open **Glean** in browser
2. Navigate to **Collections** → Your configured collection
3. Verify clipped item appears in collection
4. Click on item to verify:
   - Title matches
   - Description contains selected text
   - URL is correct
   - "Clipped: [date]" timestamp present

### Expected Result:
✅ Clip successfully synced to Glean Collections API

---

## Test 3: Dashboard → View Clips

### Steps:
1. Open dashboard: http://localhost:3000
2. Navigate to **/clips** route (or use ClipsReader component)
3. Verify clips load from extension

### Verification:
- Clips appear in grid/list view
- Each clip shows:
  - ✅ Title
  - ✅ Source/domain
  - ✅ Preview text
  - ✅ Date
- Search functionality works
- Filter/sort works

### Expected Result:
✅ Dashboard successfully fetches and displays clips from extension

---

## Test 4: Desktop App → View Clips

### Steps:
1. Start dashboard: `npm run dev` (if not running)
2. Navigate to: http://localhost:3000/desktop
3. Verify desktop app loads
4. Check clips appear in sidebar

### Verification:
- Desktop app loads without errors
- Clips appear in left sidebar (article list)
- Clicking a clip shows it in reading pane
- Reader settings work (theme, font, etc.)
- Keyboard shortcuts work:
  - `⌘K` - Command palette
  - `J/K` - Navigate clips
  - `S` - Toggle star
  - `A` - Toggle archive
  - `R` - Mark read/unread

### Expected Result:
✅ Desktop app successfully loads and displays clips from extension

---

## Test 5: Real-Time Updates

### Steps:
1. Have dashboard/desktop app open
2. Create a new clip in extension (Test 1)
3. Wait for sync (Test 2)
4. Check dashboard/desktop app

### Verification:
- New clip appears automatically (within 30 seconds)
- Or click **Refresh** button to manually refresh
- Clip count updates
- No errors in console

### Expected Result:
✅ Dashboard/desktop app updates when new clips are created

---

## Test 6: Search Integration

### Steps:
1. Open dashboard: http://localhost:3000
2. Enter a search query in the search bar
3. Click **Search** or press **Enter**
4. Wait for results

### Verification:
- Loading spinner appears
- Results load from Glean Search API
- Results show:
  - ✅ Title
  - ✅ Snippet/preview
  - ✅ Type (document, person, app, discussion)
  - ✅ Relevance score
  - ✅ Author (if available)
  - ✅ Date (if available)
- Clicking result opens in new tab
- Error handling works (if API fails)

### Expected Result:
✅ Dashboard search successfully queries Glean Search API

---

## Test 7: Delete Clip → Sync

### Steps:
1. Create a clip (Test 1)
2. In dashboard, select a clip
3. Click **Delete** button
4. Verify clip removed

### Verification:
- Clip disappears from dashboard
- Clip removed from extension storage
- No errors in console
- Extension popup updates (if open)

### Expected Result:
✅ Clip deletion works across extension and dashboard

---

## Test 8: Extension ↔ Dashboard Communication

### Steps:
1. Open browser console (F12)
2. Open extension popup
3. Create a clip
4. Check console for messages

### Verification:
- No "Extension not found" errors
- No "Message channel closed" errors
- Communication works via `chrome.runtime.sendMessage`
- Fallback to localStorage works if extension unavailable

### Expected Result:
✅ Extension and dashboard communicate successfully

---

## Troubleshooting

### Issue: Clips not appearing in dashboard
**Solutions:**
1. Check extension is loaded: `chrome://extensions/`
2. Check extension ID matches (if manually configured)
3. Check browser console for errors
4. Try refreshing dashboard
5. Verify `externally_connectable` in manifest allows localhost

### Issue: Search not working
**Solutions:**
1. Check API token is valid
2. Check domain is correct
3. Check browser console for API errors
4. Verify Glean Search API endpoint is accessible
5. Check network tab for failed requests

### Issue: Desktop app not loading clips
**Solutions:**
1. Verify dashboard is running (`npm run dev`)
2. Check authentication (must be logged in)
3. Check browser console for errors
4. Try refreshing page
5. Verify extension is installed and loaded

### Issue: Sync failing
**Solutions:**
1. Check API token has COLLECTIONS scope
2. Verify collection ID is correct
3. Check Glean API endpoint is accessible
4. Check extension console (Service Worker)
5. Verify network connectivity

---

## Success Criteria

All tests should pass:
- ✅ Clips created and stored locally
- ✅ Clips sync to Glean Collections
- ✅ Dashboard displays clips
- ✅ Desktop app displays clips
- ✅ Real-time updates work
- ✅ Search integration works
- ✅ Delete functionality works
- ✅ Extension ↔ Dashboard communication works

---

## Next Steps After Testing

1. **Fix any bugs** found during testing
2. **Document issues** in GitHub issues or project notes
3. **Optimize performance** if clips load slowly
4. **Add features** based on testing feedback
5. **Prepare for production** deployment

---

*Last Updated: Based on current codebase state*
