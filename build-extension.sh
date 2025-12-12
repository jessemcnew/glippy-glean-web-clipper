#!/bin/bash
# Build script for Glippy - bundles dashboard into extension

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DASHBOARD_DIR="$SCRIPT_DIR/glean-dashboard"
EXTENSION_DIR="$SCRIPT_DIR/glean-clipper-extension"

# Add homebrew to PATH for npm/node
export PATH="/opt/homebrew/bin:$PATH"

echo "Building Glippy Dashboard..."
echo "============================"

# Build the Next.js dashboard
cd "$DASHBOARD_DIR"
echo "Running Next.js build..."
npm run build

# Check if build succeeded
if [ ! -d "out" ]; then
    echo "ERROR: Build failed - no 'out' directory found"
    exit 1
fi

# Fix CSP issues by extracting inline scripts
echo "Fixing CSP issues (extracting inline scripts)..."
node scripts/fix-csp.js

# Fix asset paths for chrome-extension:// context
echo "Fixing asset paths..."
# Convert absolute /_next/ paths to relative ./_next/
find out -name "*.html" -exec sed -i '' 's|href="/_next/|href="./_next/|g' {} \;
find out -name "*.html" -exec sed -i '' 's|src="/_next/|src="./_next/|g' {} \;
# Also fix favicon and other root paths
find out -name "*.html" -exec sed -i '' 's|href="/favicon|href="./favicon|g' {} \;

# Remove old dashboard from extension
echo "Removing old dashboard bundle..."
rm -rf "$EXTENSION_DIR/dashboard"

# Copy new build to extension
echo "Copying new dashboard bundle..."
cp -r out "$EXTENSION_DIR/dashboard"

echo ""
echo "Build complete!"
echo "Dashboard bundled into: $EXTENSION_DIR/dashboard/"
echo ""
echo "Next steps:"
echo "1. Go to chrome://extensions"
echo "2. Click 'Reload' on Glean Web Clipper"
echo "3. Test the extension"
