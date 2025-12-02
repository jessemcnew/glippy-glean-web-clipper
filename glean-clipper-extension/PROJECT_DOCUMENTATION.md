# Glean Web Clipper Extension - Project Documentation

## Project Overview

**Date Created**: September 24, 2025  
**Purpose**: Build a Chrome extension that clips web content to Glean, creating a personal searchable knowledge base  
**Status**: Extension built and functional for local storage, Glean API sync partially working

## Key Project Information

### Glean Configuration

- **Domain**: `linkedin-be.glean.com`
- **API Token**: `mMvLpMf7Csn1g4cTxsJvxkZfsfx3GexK+q4kCVOzR30=`
- **Datasource Created**: `WEBCLIPPER`
- **Object Type**: `WebClip`

### Project Structure

```
/Users/jmcnew/claude/projects/sidebar-sam/llm-log-analyzer/llm-log-analyzer/glean-clipper-extension/
├── manifest.json          # Chrome extension manifest
├── background.js          # Service worker for API sync & storage
├── content.js            # Content script for clip button
├── content.css           # Styles for content script
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── test-datasources.html # Datasource testing tool
├── datasource-checker.html # Advanced datasource debugger
├── test-glean.sh         # CLI tool for testing Glean API
├── create-datasource.sh  # Script to create WEBCLIPPER datasource
├── test-page.html        # Test page for clipper functionality
└── icon*.png             # Extension icons
```

## Development Journey

### Phase 1: Initial Extension Creation

**Goal**: Create a Chrome extension that can capture selected text from web pages

**What We Built**:

- Chrome extension with Manifest V3 configuration
- Content script that creates a floating "Clip" button when text is selected
- Background service worker to handle storage and API calls
- Popup interface to view and search saved clips

**Key Features Implemented**:

- Smart text selection detection
- Auto-categorization (code, docs, articles, meetings)
- Auto-tagging based on content (React, API, database, etc.)
- Local storage with Chrome storage API
- Badge count showing number of clips

### Phase 2: Glean API Integration Challenges

**Challenge 1: CORS Issues**

- **Problem**: Browser blocking API calls due to Cross-Origin Resource Sharing policies
- **Solution**: Added proper host_permissions in manifest.json and used Chrome extension context

**Challenge 2: Finding the Right API Endpoint**

- **Iterations**:
  1. Started with `/api/index/v1/indexdocument` - returned empty responses
  2. Tried `/api/index/v1/bulkindexdocuments` - returned 500 errors
  3. Reverted to `/indexdocument` with proper payload structure
- **Learning**: Different endpoints expect different payload formats

**Challenge 3: Authentication**

- **Problem**: Initial attempts with token encoding caused "ISO-8859-1" errors
- **Solution**: Use direct Bearer token without encoding

**Challenge 4: Datasource Configuration**

- **Problem**: "Object definitions not found for object types: WEB_CLIP"
- **Process**:
  1. Discovered datasource didn't exist
  2. Created `WEBCLIPPER` datasource using API
  3. Fixed object type mismatch (`WEB_CLIP` vs `WebClip`)
- **Solution**: Created datasource with matching object type

**Challenge 5: Payload Structure**

- **Iterations**:
  1. Started with flat document structure - got "unrecognized field: datasource" error
  2. Wrapped in `document` object - got "Permissions are not specified" error
  3. Added permissions field - still having issues
- **Current Structure**:

```javascript
{
  document: {
    datasource: "WEBCLIPPER",
    objectType: "WebClip",
    id: "web-clip-{timestamp}",
    title: "Page Title",
    body: {
      mimeType: "text/plain",
      textContent: "selected text"
    },
    viewURL: "source URL",
    permissions: {
      allowAnonymousAccess: false,
      allowedUsers: []
    }
  }
}
```

### Phase 3: Debugging Tools Created

**Tools Built**:

1. **test-datasources.html** - Simple HTML tool to test datasource availability
2. **datasource-checker.html** - Advanced debugger with datasource discovery
3. **test-glean.sh** - Command-line tool for testing API connectivity
4. **create-datasource.sh** - Script to create WEBCLIPPER datasource

**Key Debugging Findings**:

- API returns 400 errors for missing required fields
- API returns 500 errors for malformed payloads
- Empty responses indicate endpoint mismatches
- CORS errors only occur outside extension context

## Current Status

### What Works ✅

- Text selection and clipping UI
- Local storage of clips
- Search and filtering in popup
- Auto-categorization and tagging
- Chrome extension properly loads and runs
- API connection established (Test Connection succeeds)
- WEBCLIPPER datasource created in Glean

### What Doesn't Work Yet ❌

- Full document sync to Glean (permissions/payload issues)
- Real-time sync verification
- Bulk operations

## How to Use

### Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the extension folder: `/Users/jmcnew/claude/projects/sidebar-sam/llm-log-analyzer/llm-log-analyzer/glean-clipper-extension`

### Basic Usage

1. Navigate to any webpage
2. Select text you want to clip
3. Click the blue "Clip" button that appears
4. View clips by clicking the extension icon in toolbar

### Testing & Debugging

1. **Test Connection**: Click extension icon → Settings → Test Connection
2. **Check Console**: chrome://extensions → "Inspect views: background"
3. **Test Datasources**: Open `datasource-checker.html` in browser
4. **CLI Test**: Run `./test-glean.sh YOUR_API_TOKEN`

## Key Code Locations

### Main Extension Files

- **background.js:60-68** - Main sync error handling
- **background.js:133-148** - Document payload structure
- **background.js:115-130** - API endpoint configuration
- **popup.js:163-195** - Settings management
- **content.js:93-154** - Clip button and text selection

### Configuration

- **manifest.json:14-17** - CORS permissions
- **manifest.json:19-21** - Background service worker
- **manifest.json:23-27** - Content script injection

## Lessons Learned

1. **API Documentation Gaps**: Glean's API error messages are helpful but documentation on exact payload structure is limited
2. **CORS Complexity**: Browser extensions have special CORS handling that differs from regular web pages
3. **Service Worker Lifecycle**: Chrome service workers go inactive after 30 seconds, requiring retry mechanisms
4. **Incremental Development**: Building debugging tools alongside the main feature saved significant time
5. **Token Format Matters**: API tokens must be passed exactly as provided, without encoding

## Future Improvements

1. **Fix Remaining Sync Issues**: Resolve the permissions/payload format to get full sync working
2. **Add Batch Sync**: Sync multiple clips at once for better performance
3. **Implement Retry Logic**: Handle temporary API failures gracefully
4. **Add Settings UI**: Let users configure datasource names and sync options
5. **Create Sync Status Dashboard**: Show which clips are synced vs local-only
6. **Add Export/Import**: Backup clips to JSON for portability

## Troubleshooting Guide

### "Failed to sync to Glean, saving locally only"

- Check console for specific error message
- Verify API token is still valid
- Ensure datasource exists (run `./test-glean.sh`)

### "Extension context invalidated"

- Reload extension in chrome://extensions
- Refresh the page where you're trying to clip

### "Network error: Failed to fetch"

- Check if running in extension context (not standalone HTML)
- Verify domain is accessible
- Check for CORS issues in console

### Service worker inactive

- Normal behavior after 30 seconds
- Extension has retry mechanism built in
- Can manually wake up by clicking extension icon

## Commands Reference

```bash
# Test API connection
./test-glean.sh mMvLpMf7Csn1g4cTxsJvxkZfsfx3GexK+q4kCVOzR30=

# Create datasource (if needed)
./create-datasource.sh mMvLpMf7Csn1g4cTxsJvxkZfsfx3GexK+q4kCVOzR30=

# Open test page
open test-page.html

# Open datasource checker
open datasource-checker.html

# Check background console for errors
# Go to chrome://extensions → "Inspect views: background"
```

## Contact & Support

Project created as part of Glean integration exploration. The extension successfully demonstrates:

- Web content capture and organization
- Chrome extension development best practices
- API integration patterns
- Local-first architecture with sync capabilities

While full Glean sync isn't working yet due to API payload requirements, the extension provides immediate value as a personal knowledge management tool with the foundation for future Glean integration.

---

_Last Updated: September 24, 2025_
