#!/bin/bash
echo "=== EXTENSION DEBUG ==="
echo "1. Check manifest syntax:"
node -pe "JSON.stringify(JSON.parse(require('fs').readFileSync('manifest.json', 'utf8')), null, 2)"

echo -e "\n2. Check content script syntax:"
node -c content.js && echo "✅ content.js syntax OK" || echo "❌ content.js syntax ERROR"

echo -e "\n3. Check background script syntax:"
node -c background.js && echo "✅ background.js syntax OK" || echo "❌ background.js syntax ERROR"

echo -e "\n4. Extension files present:"
ls -la *.js *.json *.html *.css | grep -E '\.(js|json|html|css)$'

echo -e "\n=== NEXT STEPS ==="
echo "🔧 Manual testing required:"
echo "1. Open Chrome (not automated browser)"
echo "2. Go to chrome://extensions/"
echo "3. Reload the 'Glean Web Clipper' extension"
echo "4. Go to any webpage and select text"
echo "5. Look for blue 'Clip' button"
echo ""
echo "📧 If still no clip button, the issue is:"
echo "   - Content script not injecting"
echo "   - Check Chrome console for errors"
echo "   - Extension may need complete reinstall"
