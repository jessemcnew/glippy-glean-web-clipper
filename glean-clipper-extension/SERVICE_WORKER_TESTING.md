# Service Worker Log Testing Guide

This guide helps you quickly resume testing the Glean Clipper extension and viewing service worker logs.

## Quick Start

When you want to test the extension and view service worker logs, just tell me:
- **"Let's test the extension with service worker logs"** or
- **"Check service worker logs"** or
- **"Test clipping and show me the logs"**

I'll handle the rest!

## What We Have Set Up

1. **Chrome with Remote Debugging**: Chrome is running with remote debugging on port 9222
2. **WebSocket Client Script**: A script that connects to the service worker and streams console logs in real-time
3. **Automated Testing**: I can navigate to pages, select text, click the "Clip to Glean" button, and monitor logs

## Files Created

- **`scripts/get-service-worker-logs.js`**: WebSocket client that connects to the service worker and displays console logs in real-time

## How to Use

### Option 1: Tell Me to Test
Just say something like:
- "Test clipping on a news site and show me the logs"
- "Navigate to a page, clip something, and check the service worker logs"
- "Let's test the extension"

I'll:
1. Navigate to a news site (or you can tell me which one)
2. Select text on the page
3. Click the "Clip to Glean" popup button
4. Run the service worker log script to show you the logs

### Option 2: Manual Testing
If you want to test manually:

1. **Start Chrome with debugging** (if not already running):
   ```bash
   cd glean-clipper-extension
   bash scripts/launch-chrome-mcp.sh
   ```

2. **Navigate to a page** in the browser

3. **Select text** and click "Clip to Glean" button

4. **View logs** by running:
   ```bash
   cd glean-clipper-extension
   node scripts/get-service-worker-logs.js
   ```

## What the Logs Show

When you clip content, you'll see logs like:

```
📝 Received message: saveClip
📝 💾 Saving clip: { url: ..., title: ..., textLength: ... }
📝 Attempting to sync to Glean Collections: { clipId: ..., collectionId: ... }
📝 SENDING: Collections API Request
📝 SUCCESS: Item added to collection
📝 ✅ Clip saved successfully
```

## Service Worker Details

- **Extension ID**: `ehajhplmdepljmlmfkpccfkbcjgcfgib`
- **Service Worker ID**: `62E95B11F712FCFA5EB4565F83049578` (may change if service worker restarts)
- **WebSocket URL**: `ws://localhost:9222/devtools/page/[SW_ID]`
- **Debug Port**: `9222`

## Troubleshooting

### Service Worker Not Found
If the script can't find the service worker:
1. Make sure Chrome is running with remote debugging: `bash scripts/launch-chrome-mcp.sh`
2. Check that the extension is loaded: Open `chrome://extensions` and verify "Glean Web Clipper" is enabled
3. The service worker may have restarted - the script will find the new one automatically

### No Logs Appearing
- Make sure you've actually triggered a clip (selected text and clicked "Clip to Glean")
- The service worker might be idle - try clipping something to wake it up
- Check that the extension is properly configured with API token and collection ID

### Connection Issues
- Verify Chrome is running on port 9222: `curl http://localhost:9222/json`
- Check that no firewall is blocking the connection
- Try restarting Chrome with the launch script

## What to Tell Me When You Come Back

Just say one of these:
- **"Let's test the extension"** - I'll do a full test with logs
- **"Check service worker logs"** - I'll run the log script
- **"Test clipping on [website]"** - I'll navigate there and test
- **"Show me recent service worker activity"** - I'll check what's been happening

I'll remember this workflow and can pick up where we left off!

## Example Session

**You**: "Let's test the extension with service worker logs"

**Me**: 
1. Navigates to a news site
2. Selects text
3. Clicks "Clip to Glean" button  
4. Runs the service worker log script
5. Shows you the logs in real-time

**You**: "Perfect! I see the clip was saved successfully"

---

**Last Updated**: 2025-12-10
**Status**: ✅ Working - WebSocket client functional, can monitor logs in real-time
