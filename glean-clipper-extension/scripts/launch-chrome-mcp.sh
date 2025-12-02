#!/bin/bash
# Launch Chrome with remote debugging enabled and extension loaded
# Reuses existing Chrome instance if already running on port 9222

EXTENSION_PATH="$(cd "$(dirname "$0")/.." && pwd)"
CHROME_USER_DATA_DIR="/tmp/chrome-mcp-debug"
DEBUG_PORT=9222

echo "🔍 Checking for existing Chrome instance on port $DEBUG_PORT..."

# Check if Chrome is already running on port 9222
if curl -s http://localhost:$DEBUG_PORT/json/version > /dev/null 2>&1; then
    echo "✅ Chrome is already running with remote debugging on port $DEBUG_PORT"
    echo "📋 Using existing instance"
    echo ""
    echo "🔍 To verify connection:"
    echo "   curl http://localhost:$DEBUG_PORT/json/version"
    echo ""
    echo "💡 To restart with a fresh instance, run:"
    echo "   ./scripts/stop-chrome-mcp.sh"
    echo "   ./scripts/launch-chrome-mcp.sh"
    exit 0
fi

echo "🚀 Launching Chrome with remote debugging..."
echo "📁 Extension path: $EXTENSION_PATH"
echo "🔌 Remote debugging port: $DEBUG_PORT"
echo "📂 User data dir: $CHROME_USER_DATA_DIR"
echo ""
echo "⚠️  IMPORTANT: This uses a SEPARATE Chrome profile for testing."
echo "   Your regular Chrome extensions won't be here."
echo "   You'll need to load the extension ONCE in this Chrome instance."
echo "   It will then persist for future launches."
echo ""

# Launch Chrome with remote debugging and extension loaded
# Using the same user-data-dir ensures the same profile/instance each time
# Note: --load-extension may not work with custom user-data-dir, so we open extensions page for manual load
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=$DEBUG_PORT \
  --user-data-dir="$CHROME_USER_DATA_DIR" \
  --load-extension="$EXTENSION_PATH" \
  --disable-web-security \
  --new-window \
  "chrome://extensions" \
  > /dev/null 2>&1 &

CHROME_PID=$!

# Wait a moment for Chrome to start
sleep 2

# Verify Chrome started successfully
if curl -s http://localhost:$DEBUG_PORT/json/version > /dev/null 2>&1; then
    echo "✅ Chrome launched successfully with PID: $CHROME_PID"
    echo ""
    echo "📋 Next steps:"
    echo "1. In the Chrome window that opened, click 'Load unpacked'"
    echo "2. Navigate to: $EXTENSION_PATH"
    echo "3. Select the folder and click 'Open'"
    echo "4. The extension will be saved in this Chrome profile"
    echo ""
    echo "📋 After loading the extension:"
    echo "1. Chrome MCP can connect to http://localhost:$DEBUG_PORT"
    echo "2. You can use MCP tools to debug the extension"
    echo "3. Future launches will reuse this profile (extension stays loaded)"
    echo ""
    echo "🔍 To test connection:"
    echo "   curl http://localhost:$DEBUG_PORT/json/version"
    echo ""
    echo "💡 This script will reuse this Chrome instance on subsequent runs"
    echo "🛑 To stop:"
    echo "   ./scripts/stop-chrome-mcp.sh"
else
    echo "❌ Failed to start Chrome or remote debugging not available"
    echo "🛑 Attempting to clean up..."
    kill $CHROME_PID 2>/dev/null || true
    exit 1
fi

# Save PID for later cleanup
echo $CHROME_PID > /tmp/chrome-mcp.pid
