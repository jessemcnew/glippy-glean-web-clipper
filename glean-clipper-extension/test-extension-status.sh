#!/bin/bash

echo "=== Glean Web Clipper Extension Diagnostic ==="
echo

# Check if all required files exist
echo "1. Checking extension files..."
required_files=("manifest.json" "background.js" "content.js" "popup.html" "popup.js")
missing_files=()

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    echo
    echo "Missing files found. Extension will not load properly."
    exit 1
fi

echo
echo "2. Validating JavaScript syntax..."

# Check background.js
if node -c background.js 2>/dev/null; then
    echo "✅ background.js syntax OK"
else
    echo "❌ background.js has syntax errors:"
    node -c background.js
    exit 1
fi

# Check content.js
if node -c content.js 2>/dev/null; then
    echo "✅ content.js syntax OK"
else
    echo "❌ content.js has syntax errors:"
    node -c content.js
    exit 1
fi

# Check popup.js
if node -c popup.js 2>/dev/null; then
    echo "✅ popup.js syntax OK"
else
    echo "❌ popup.js has syntax errors:"
    node -c popup.js
    exit 1
fi

echo
echo "3. Checking manifest.json..."
if python3 -m json.tool manifest.json >/dev/null 2>&1; then
    echo "✅ manifest.json is valid JSON"
else
    echo "❌ manifest.json has JSON errors:"
    python3 -m json.tool manifest.json
    exit 1
fi

echo
echo "4. Checking icon files..."
for size in 16 48 128; do
    icon="icon${size}.png"
    if [ -f "$icon" ]; then
        echo "✅ $icon exists"
    else
        echo "⚠️  $icon missing (extension will still work)"
    fi
done

echo
echo "=== Diagnostic Complete ==="
echo
echo "✅ Extension files appear to be in good condition!"
echo
echo "Next steps to resolve 'Extension context invalidated' error:"
echo
echo "1. 🔄 Reload the extension:"
echo "   - Go to chrome://extensions/"
echo "   - Find 'Glean Web Clipper'"
echo "   - Click the reload button (🔄)"
echo
echo "2. 📱 Reload the webpage where you're trying to clip"
echo
echo "3. 🧪 Test clipping:"
echo "   - Select some text on any webpage"
echo "   - Click the blue 'Clip' button that appears"
echo
echo "4. 🔍 Check the extension logs:"
echo "   - Go to chrome://extensions/"
echo "   - Click 'service worker' link under Glean Clipper"
echo "   - Look for any error messages in the console"
echo
echo "5. ⚙️ Check your Glean settings:"
echo "   - Click the extension icon in the toolbar"
echo "   - Click the ⚙️ settings button"
echo "   - Verify your domain and API token are correct"
echo
echo "If issues persist, the OAuth token may have expired (they last ~1 hour)."