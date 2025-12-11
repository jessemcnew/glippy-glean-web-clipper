#!/bin/bash

# Package Glean Web Clipper Extension for Chrome Web Store Submission
# This script creates a clean zip file excluding development files

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
EXTENSION_DIR="$SCRIPT_DIR"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_FILE="$PARENT_DIR/glean-clipper-v1.0.zip"

echo -e "${GREEN}📦 Packaging Glean Web Clipper Extension...${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "$EXTENSION_DIR/manifest.json" ]; then
    echo -e "${RED}❌ Error: manifest.json not found. Are you in the extension directory?${NC}"
    exit 1
fi

# Remove old zip if it exists
if [ -f "$OUTPUT_FILE" ]; then
    echo -e "${YELLOW}⚠️  Removing old zip file...${NC}"
    rm "$OUTPUT_FILE"
fi

# Create zip file
echo -e "${GREEN}Creating zip file...${NC}"
cd "$EXTENSION_DIR"

zip -r "$OUTPUT_FILE" . \
    -x "*.git*" \
    -x "*.md" \
    -x "archive/*" \
    -x "scripts/*" \
    -x "test*" \
    -x "*.sh" \
    -x "*.py" \
    -x "node_modules/*" \
    -x ".cursor/*" \
    -x ".playwright-mcp/*" \
    -x ".deepagent-desktop/*" \
    -x ".husky/*" \
    -x ".prettierrc" \
    -x ".prettierignore" \
    -x "eslint.config.mjs" \
    -x "package.json" \
    -x "package-lock.json" \
    -x "*.log" \
    -x "*.DS_Store" \
    -x "*.swp" \
    -x "*.swo" \
    -x "*~"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Extension packaged successfully!${NC}"
    echo ""
    echo -e "📁 Output file: ${GREEN}$OUTPUT_FILE${NC}"
    
    # Get file size
    FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo -e "📊 File size: ${GREEN}$FILE_SIZE${NC}"
    
    # List what's included
    echo ""
    echo -e "${YELLOW}📋 Verifying contents...${NC}"
    echo ""
    
    # Check for required files
    REQUIRED_FILES=("manifest.json" "background.js" "content.js" "popup-modern.html" "popup.js" "icon128.png")
    MISSING_FILES=()
    
    for file in "${REQUIRED_FILES[@]}"; do
        if unzip -l "$OUTPUT_FILE" | grep -q "$file"; then
            echo -e "  ✅ $file"
        else
            echo -e "  ${RED}❌ $file (MISSING!)${NC}"
            MISSING_FILES+=("$file")
        fi
    done
    
    echo ""
    
    if [ ${#MISSING_FILES[@]} -eq 0 ]; then
        echo -e "${GREEN}✅ All required files included!${NC}"
        echo ""
        echo -e "${GREEN}🚀 Ready for Chrome Web Store submission!${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Go to: https://chrome.google.com/webstore/devconsole"
        echo "2. Click 'New Item'"
        echo "3. Upload: $OUTPUT_FILE"
        echo "4. Fill out store listing"
        echo "5. Submit for review"
    else
        echo -e "${RED}❌ Warning: Some required files are missing!${NC}"
        echo "Missing files: ${MISSING_FILES[*]}"
        exit 1
    fi
else
    echo ""
    echo -e "${RED}❌ Error: Failed to create zip file${NC}"
    exit 1
fi
