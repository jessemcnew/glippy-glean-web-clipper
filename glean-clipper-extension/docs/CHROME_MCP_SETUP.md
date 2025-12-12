# Chrome MCP Setup for Automated Debugging

This guide explains how to set up Chrome MCP (Model Context Protocol) to enable automated debugging of the Glean Web Clipper extension.

## 🎯 Purpose

Chrome MCP allows AI assistants (like Claude) to:
- Connect to Chrome's DevTools Protocol
- Inspect extension popups and background pages
- Monitor network requests
- Check console errors
- Take screenshots
- Execute JavaScript
- Debug issues automatically instead of manually

## ✅ WORKING SETUP (Verified)

**IMPORTANT:** Use the `chrome-devtools` MCP, NOT Browser Automation. Browser Automation has connection issues and should be ignored.

## 📋 Prerequisites

1. **Chrome MCP configured** in `~/.cursor/mcp.json` ✅
2. **Chrome browser** installed
3. **Extension code** ready to test

## 🚀 Quick Start (Working Method)

### 1. Launch Chrome with Remote Debugging

```bash
cd glean-clipper-extension
./scripts/launch-chrome-mcp.sh
```

This script:
- Launches Chrome with remote debugging on port 9222
- Uses a separate Chrome profile (`/tmp/chrome-mcp-debug`)
- Opens the extensions page for manual loading

### 2. Load the Extension (One-Time Setup)

**IMPORTANT:** The `--load-extension` flag doesn't work reliably with custom user-data-dir, so you need to load it manually:

1. In the Chrome window that opened, click **"Load unpacked"**
2. Navigate to: `/Users/jmcnew/glippy/glean-clipper-extension`
3. Select the folder and click **"Open"**
4. The extension will be saved in this Chrome profile and persist for future launches

### 3. Verify Connection

```bash
# Test that Chrome is accepting connections
curl http://localhost:9222/json/version
```

You should see Chrome version info.

### 4. Use Chrome DevTools MCP Tools

Once Chrome is running, the `chrome-devtools` MCP automatically connects. You can use these tools in Cursor:

**Available Tools (26 total):**
- `mcp_chrome-devtools_navigate_page` - Navigate to pages
- `mcp_chrome-devtools_take_snapshot` - Get page accessibility tree
- `mcp_chrome-devtools_list_console_messages` - Read console logs
- `mcp_chrome-devtools_list_network_requests` - Monitor network calls
- `mcp_chrome-devtools_evaluate_script` - Execute JavaScript
- `mcp_chrome-devtools_take_screenshot` - Capture screenshots
- `mcp_chrome-devtools_click` - Click elements
- `mcp_chrome-devtools_fill` - Fill form fields
- And 18 more tools...

### 5. Stop Chrome

```bash
./scripts/stop-chrome-mcp.sh
```

Or manually:
```bash
lsof -ti:9222 | xargs kill -9
```

## 📝 MCP Configuration

Your `~/.cursor/mcp.json` is correctly configured:

```json
{
  "chrome-devtools": {
    "command": "npx",
    "args": [
      "-y",
      "chrome-devtools-mcp@latest",
      "--browser-url=http://127.0.0.1:9222"
    ],
    "env": {}
  }
}
```

**Key Points:**
- Uses `--browser-url=http://127.0.0.1:9222` to connect to existing Chrome
- Automatically connects when Chrome is running on port 9222
- Provides 26 tools for browser automation

## ⚠️ Important Notes

### Browser Automation vs Chrome DevTools MCP

- **Browser Automation:** Has connection issues, don't use it
- **Chrome DevTools MCP:** ✅ This is what works - use the `mcp_chrome-devtools_*` tools

### Chrome Profile

- Uses separate profile: `/tmp/chrome-mcp-debug`
- Extension loaded once persists across launches
- Your regular Chrome extensions won't be here

### Extension Loading

- Must be loaded manually the first time
- After that, it persists in the Chrome profile
- Script reuses the same Chrome instance/profile

## 🐛 Debugging Workflow

### Example: Check Extension Status

```javascript
// Navigate to extensions page
mcp_chrome-devtools_navigate_page("chrome://extensions/")

// Take snapshot to see extensions
mcp_chrome-devtools_take_snapshot()

// Evaluate to check extension
mcp_chrome-devtools_evaluate_script(() => {
  // Check if extension is loaded
  return chrome.runtime ? 'Extension loaded' : 'Extension not loaded';
})
```

### Example: Debug Extension Popup

1. **Navigate to extension popup:**
   ```
   chrome-extension://ehajhplmdepljmlmfkpccfkbcjgcfgib/popup-modern.html
   ```
   (Extension ID may vary - check in chrome://extensions/)

2. **Take snapshot:**
   - Use `mcp_chrome-devtools_take_snapshot` to see the current state

3. **Check console:**
   - Use `mcp_chrome-devtools_list_console_messages` to see errors

4. **Test interactions:**
   - Use `mcp_chrome-devtools_click` to click buttons
   - Use `mcp_chrome-devtools_fill` to fill forms
   - Use `mcp_chrome-devtools_evaluate_script` to run test code

### Example: Test Clipping Flow

1. **Navigate to a test page:**
   ```
   mcp_chrome-devtools_navigate_page("https://example.com")
   ```

2. **Check for extension functionality:**
   ```
   mcp_chrome-devtools_evaluate_script(() => {
     // Check if extension content script is active
     return window.chrome?.runtime?.id;
   })
   ```

3. **Monitor network requests:**
   ```
   mcp_chrome-devtools_list_network_requests()
   ```

4. **Check console for errors:**
   ```
   mcp_chrome-devtools_list_console_messages()
   ```

## 🎨 Common Debugging Tasks

### Check Extension Loaded
```javascript
mcp_chrome-devtools_evaluate_script(() => {
  return chrome.runtime ? 'Extension loaded' : 'Extension not loaded';
})
```

### Check Storage
```javascript
mcp_chrome-devtools_evaluate_script(async () => {
  const result = await chrome.storage.local.get(['gleanConfig']);
  return result.gleanConfig;
})
```

### Monitor Network Requests
```javascript
mcp_chrome-devtools_list_network_requests()
```

### Check Console Messages
```javascript
mcp_chrome-devtools_list_console_messages()
```

## ⚠️ Troubleshooting

### Chrome MCP Can't Connect

1. **Check Chrome is running:**
   ```bash
   curl http://localhost:9222/json/version
   ```

2. **Check port isn't blocked:**
   ```bash
   lsof -i :9222
   ```

3. **Restart Chrome:**
   ```bash
   ./scripts/stop-chrome-mcp.sh
   ./scripts/launch-chrome-mcp.sh
   ```

4. **Verify MCP is connected:**
   - Check Cursor's MCP panel - should show "chrome-devtools" with "26 tools enabled"
   - Restart Cursor if MCP isn't showing

### Extension Not Loading

1. **Load manually:**
   - Go to `chrome://extensions/`
   - Enable Developer mode (toggle in top right)
   - Click "Load unpacked"
   - Select the extension folder: `/Users/jmcnew/glean-clipper-extension`

2. **Verify extension is loaded:**
   ```bash
   curl -s http://localhost:9222/json | python3 -c "import sys, json; tabs = json.load(sys.stdin); ext_workers = [t for t in tabs if 'chrome-extension://ehajhplmdepljmlmfkpccfkbcjgcfgib' in t.get('url', '')]; print(f'Extension loaded: {len(ext_workers) > 0}')"
   ```

### MCP Tools Not Available

1. **Restart Cursor** after updating `mcp.json`
2. **Check MCP server is running:**
   - Look for "chrome-devtools" in Cursor's MCP panel
   - Should show "26 tools enabled"
3. **Verify Chrome is on port 9222:**
   ```bash
   curl http://localhost:9222/json/version
   ```

### Browser Automation Issues

**DON'T USE BROWSER AUTOMATION** - It has connection issues. Use the `chrome-devtools` MCP tools instead:
- `mcp_chrome-devtools_*` tools work reliably
- Browser Automation's CDP connection doesn't work properly
- Ignore Browser Automation settings in Cursor

## 📚 Resources

- **Chrome DevTools Protocol:** https://chromedevtools.github.io/devtools-protocol/
- **Chrome MCP Server:** https://github.com/ChromeDevTools/chrome-devtools-mcp
- **MCP Documentation:** https://modelcontextprotocol.io/

## ✅ Checklist for Using Chrome MCP

- [x] Chrome launched with `--remote-debugging-port=9222`
- [x] Extension loaded in Chrome (manually, one time)
- [x] MCP server connected (check in Cursor - should show "26 tools enabled")
- [x] Test connection with `curl http://localhost:9222/json/version`
- [x] Can use `mcp_chrome-devtools_*` tools in Cursor

## 🎯 Summary

**What Works:**
- ✅ `chrome-devtools` MCP with `--browser-url=http://127.0.0.1:9222`
- ✅ Launch script: `./scripts/launch-chrome-mcp.sh`
- ✅ Manual extension loading (one-time, then persists)
- ✅ 26 chrome-devtools MCP tools available

**What Doesn't Work:**
- ❌ Browser Automation CDP connection (has bugs)
- ❌ `--load-extension` flag with custom user-data-dir
- ❌ Automatic extension loading

**Next Steps:** Use the chrome-devtools MCP tools to debug your extension!
