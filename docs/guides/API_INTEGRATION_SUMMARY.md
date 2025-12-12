# API Integration Summary

## Overview
All API integrations have been built for Library, Recent Clips, and Collections functionality.

## New API Functions

### 1. `fetchCollectionItems(collectionId, config)`
- **Location**: `modules/gleanApi.js`
- **Purpose**: Fetches items from a specific Glean collection
- **Endpoint**: `POST /rest/api/v1/getcollection`
- **Returns**: Collection items with metadata
- **Error Handling**: Falls back gracefully if API doesn't support item listing

### 2. `fetchClipsFromGlean(options)`
- **Location**: `modules/gleanApi.js`
- **Purpose**: Fetches clips from Glean API with hybrid approach
- **Strategy**:
  1. Tries to fetch from Glean API (all collections or specific collection)
  2. Merges with local storage clips
  3. Deduplicates by URL
  4. Falls back to local-only if API unavailable
- **Options**:
  - `collectionId`: Optional collection ID to filter by
- **Returns**: Clips array with source indicator ('api', 'local', 'hybrid')

## Background Script Handlers

### New Message Handlers
1. **`fetchCollectionItems`**: Fetches items from a specific collection
2. **`fetchClipsFromGlean`**: Fetches clips with hybrid approach

## Updated Pages

### 1. `reader.html` (Recent Clips)
- **Changes**:
  - Now fetches clips from Glean API first
  - Falls back to local storage if API unavailable
  - Maps API response format to local clip format
  - Handles timestamps, descriptions, and metadata

### 2. `library.html` (Library)
- **Changes**:
  - Fetches articles from Glean API
  - Fetches collections from API
  - Supports collection filtering
  - Auto-refreshes every 30 seconds
  - Falls back to local storage gracefully

## Data Flow

### Reader.html Flow
```
User opens reader.html
  ↓
Send message: fetchClipsFromGlean
  ↓
Background script calls fetchClipsFromGlean()
  ↓
API tries to fetch from all collections
  ↓
Merges with local clips
  ↓
Returns to reader.html
  ↓
Renders clips in grid/list view
```

### Library.html Flow
```
User opens library.html
  ↓
Send message: fetchClipsFromGlean
  ↓
Send message: fetchCollections
  ↓
Background script fetches from API
  ↓
Renders articles and collections
  ↓
Auto-refreshes every 30s
```

## Error Handling

### Graceful Degradation
1. **API Unavailable**: Falls back to local storage
2. **No Collections**: Shows empty state with helpful message
3. **Network Errors**: Logs error, uses local data
4. **Invalid Response**: Handles various API response formats

### Error States
- API not configured → Local storage only
- API authentication failed → Local storage with warning
- Network timeout → Local storage with retry option
- Invalid collection ID → Empty results

## Features

### Hybrid Data Approach
- Combines API data with local storage
- Deduplicates by URL
- Preserves local-only clips
- Shows sync status

### Collection Filtering
- Filter by specific collection
- "All collections" view
- Collection name display
- Active collection highlighting

### Auto-Refresh
- Library page refreshes every 30 seconds
- Keeps data up-to-date
- Cleans up on page unload

## API Response Mapping

### Collection Items → Clip Format
```javascript
{
  id: item.id || item.itemId,
  title: item.name || item.title,
  url: item.url || item.viewURL,
  description: item.description,
  timestamp: item.addedAt || item.createdAt,
  collectionId: collectionId,
  synced: true
}
```

### Local Clip → Article Format
```javascript
{
  id: clip.id,
  title: clip.title,
  url: clip.url,
  excerpt: clip.selectedText || clip.description,
  date: formatted date,
  readTime: calculated,
  tags: clip.tags,
  collectionId: clip.collectionId
}
```

## Testing Checklist

- [x] Reader.html loads clips from API
- [x] Reader.html falls back to local storage
- [x] Library.html loads articles from API
- [x] Library.html loads collections from API
- [x] Collection filtering works
- [x] Error handling works
- [x] Auto-refresh works
- [x] Data deduplication works
- [x] Format mapping works correctly

## Notes

1. **API Limitations**: The Glean API `getcollection` endpoint may not return items directly. The implementation handles various response formats and gracefully falls back if items aren't available.

2. **Rate Limiting**: Added small delays between collection fetches to avoid rate limiting.

3. **Performance**: Limited to first 10 collections when fetching all items to avoid timeouts.

4. **Caching**: Consider adding caching layer in future for better performance.

5. **Real-time Updates**: Auto-refresh ensures data stays current, but could be optimized with WebSocket or polling.

## Future Enhancements

- [ ] Add caching layer for API responses
- [ ] Implement WebSocket for real-time updates
- [ ] Add pagination for large collections
- [ ] Add search API integration
- [ ] Add filtering by date range
- [ ] Add sorting options
- [ ] Add export functionality

