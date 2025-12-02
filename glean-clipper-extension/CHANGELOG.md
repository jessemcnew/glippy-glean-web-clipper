# Changelog

All notable changes to the Glean Web Clipper extension will be documented in this file.

## [1.0.0] - 2025-11-18

### 🎉 Initial Release

**Core Features:**
- ✅ Clip web content (text selections or entire pages) to Glean collections
- ✅ Modern, clean popup UI with Clips and Settings tabs
- ✅ Persistent collection selection with clear button
- ✅ Sync status indicators (green for synced, red for failed with retry)
- ✅ Favicon capture and display for each clip
- ✅ Clickable article titles to open original URLs
- ✅ Clean clip descriptions (removes messy URLs and metadata)
- ✅ "Clipped: [date]" timestamp in Glean collection items

**Notebook Viewer:**
- ✅ Full-featured notebook page for viewing all clips
- ✅ Search and filter clips
- ✅ Sort by date, relevance, title, or domain
- ✅ Dark/light theme toggle with persistence
- ✅ Clean, minimal UI without unnecessary buttons

**Settings & Configuration:**
- ✅ OAuth authentication support
- ✅ Manual API token input
- ✅ Collection selection and persistence
- ✅ Connection testing
- ✅ Sync testing

**Storage & Management:**
- ✅ Local clip storage
- ✅ Clear all synced clips (removes from extension view only, keeps in Glean)
- ✅ Automatic sync to Glean Collections API
- ✅ Error handling and retry functionality

**UI/UX Improvements:**
- ✅ Compact clip cards with essential information only
- ✅ Collection name display (instead of ID)
- ✅ Sync status with collection name
- ✅ Retry button for failed syncs
- ✅ Removed unnecessary UI elements (domain settings, collections tab, test indexing)

**Technical:**
- ✅ Chrome Extension Manifest V3
- ✅ Service worker architecture
- ✅ Modular code structure
- ✅ Error handling and logging
- ✅ Chrome DevTools Protocol (CDP) debugging support

### Known Limitations:
- Indexing API support is available but not actively used in UI
- Collections filtering by user creator was removed due to API limitations

---

## Future Improvements (Planned):
- Enhanced search capabilities
- Tag management
- Bulk operations
- Export functionality
- Keyboard shortcuts
- More customization options

