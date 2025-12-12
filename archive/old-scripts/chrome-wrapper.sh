#!/bin/bash

# Chrome wrapper for Cursor browser tool
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Ensure the script is executable
chmod +x "$CHROME_PATH" 2>/dev/null

# Launch Chrome with provided arguments
exec "$CHROME_PATH" "$@"
