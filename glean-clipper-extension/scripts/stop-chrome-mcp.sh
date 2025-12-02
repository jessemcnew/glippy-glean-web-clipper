#!/bin/bash
# Stop Chrome instance launched for MCP debugging

echo "🛑 Stopping Chrome MCP instance..."

# Kill Chrome on port 9222
lsof -ti:9222 | xargs kill -9 2>/dev/null

# Kill from saved PID
if [ -f /tmp/chrome-mcp.pid ]; then
  PID=$(cat /tmp/chrome-mcp.pid)
  kill -9 $PID 2>/dev/null || true
  rm /tmp/chrome-mcp.pid
fi

echo "✅ Chrome MCP instance stopped"
echo "🧹 Cleaning up user data directory..."
rm -rf /tmp/chrome-mcp-debug 2>/dev/null || true

