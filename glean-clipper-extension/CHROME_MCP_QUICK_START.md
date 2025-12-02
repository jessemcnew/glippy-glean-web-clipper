# Chrome MCP Quick Start Guide

## 🚀 3-Step Setup

### 1. Launch Chrome
```bash
cd glean-clipper-extension
./scripts/launch-chrome-mcp.sh
```

### 2. Load Extension (First Time Only)
- In Chrome window, click **"Load unpacked"**
- Navigate to: `/Users/jmcnew/glean-clipper-extension`
- Click **"Open"**
- Extension persists for future launches ✅

### 3. Use MCP Tools
The `chrome-devtools` MCP automatically connects. Use these tools:
- `mcp_chrome-devtools_navigate_page` - Go to pages
- `mcp_chrome-devtools_take_snapshot` - See page structure
- `mcp_chrome-devtools_evaluate_script` - Run JavaScript
- `mcp_chrome-devtools_list_console_messages` - Check errors
- `mcp_chrome-devtools_take_screenshot` - Capture screenshots

## ⚠️ Important

- ✅ **USE:** `chrome-devtools` MCP (26 tools available)
- ❌ **DON'T USE:** Browser Automation (has connection bugs)
- ✅ **Works:** Manual extension loading (one-time, then persists)
- ❌ **Doesn't work:** `--load-extension` flag with custom user-data-dir

## 🔍 Verify It's Working

```bash
# Check Chrome is running
curl http://localhost:9222/json/version

# Check extension is loaded
curl -s http://localhost:9222/json | python3 -c "import sys, json; tabs = json.load(sys.stdin); ext = [t for t in tabs if 'chrome-extension://ehajhplmdepljmlmfkpccfkbcjgcfgib' in t.get('url', '')]; print('Extension loaded!' if ext else 'Extension not found')"
```

## 🛑 Stop Chrome

```bash
./scripts/stop-chrome-mcp.sh
```

## 📝 MCP Config

Already configured in `~/.cursor/mcp.json`:
```json
{
  "chrome-devtools": {
    "command": "npx",
    "args": [
      "-y",
      "chrome-devtools-mcp@latest",
      "--browser-url=http://127.0.0.1:9222"
    ]
  }
}
```

**That's it!** The chrome-devtools MCP connects automatically when Chrome is running on port 9222.

