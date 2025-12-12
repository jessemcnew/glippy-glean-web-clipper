# Extension Debugging Guide

## 🔧 Quick Fixes Applied

### ✅ Issues Fixed:

1. **Missing collections-api.js**: Added back to popup.html (popup depends on it)
2. **Missing message handlers**: Added `refreshCollections` and `addToCollection` actions to background.js
3. **ES Module support**: Added `"type": "module"` to manifest.json background configuration
4. **Modular architecture**: Split 720-line background.js into 5 focused modules

### 📁 Current Structure:

```
├── background.js (85 lines) - Main coordinator
├── modules/
│   ├── serviceWorker.js - Lifecycle management
│   ├── gleanApi.js - API integrations
│   ├── contentProcessor.js - Content processing
│   ├── storage.js - Storage operations
│   └── uiHelpers.js - UI helpers
├── popup.html - Extension popup
├── popup.js - Popup functionality
├── collections-api.js - Collections API wrapper
└── manifest.json - Extension manifest
```

## 🐛 If Extension Still Not Working:

### 1. Check Chrome Extension Console:

1. Go to `chrome://extensions/`
2. Find "Glean Web Clipper"
3. Click "Inspect views: background page"
4. Check for errors in console

### 2. Check Popup Console:

1. Right-click extension icon
2. Select "Inspect popup"
3. Check for errors in console

### 3. Common Issues & Solutions:

**Issue**: "Failed to fetch" errors

- **Solution**: Check if all script files exist and are accessible

**Issue**: "Cannot read property of undefined"

- **Solution**: Check if all required functions are exported/imported correctly

**Issue**: Popup not showing

- **Solution**: Check popup.html and popup.js for syntax errors

**Issue**: Context menus not working

- **Solution**: Check if background.js is loading properly

### 4. Test Commands:

```bash
# Validate JSON syntax
python3 -m json.tool manifest.json

# Check file permissions
ls -la *.js *.html *.json

# Test extension structure
./test-extension-ready.sh
```

### 5. Reload Extension:

After any changes:

1. Go to `chrome://extensions/`
2. Click reload button for "Glean Web Clipper"
3. Test functionality

## 📊 Modularization Benefits:

- **Maintainability**: Each module has single responsibility
- **Debugging**: Easier to locate issues in specific modules
- **Testing**: Individual modules can be tested separately
- **Development**: Multiple developers can work on different modules
- **Code Quality**: Better organization and separation of concerns
