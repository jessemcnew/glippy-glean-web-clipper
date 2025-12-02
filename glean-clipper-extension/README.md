# Glean Web Clipper Chrome Extension

A Chrome extension that allows you to clip web content directly to your Glean Collections.

## Features

- **Quick Clipping**: Select text on any webpage and save it to Glean
- **Context Menu Integration**: Right-click to clip selected text or entire pages
- **Smart Categorization**: Automatically categorizes content based on URL and content type
- **Tag Extraction**: Automatically identifies relevant tags from clipped content
- **Local Storage**: Works offline with local storage, syncs when connected
- **Glean Collections API**: Direct integration with Glean's Collections API

## Prerequisites

1. **Glean Account**: You need an active Glean account with access to Collections
2. **API Token**: A Client API token with COLLECTIONS scope (NOT an Indexing API token)
3. **Collection ID**: The numeric ID of the collection you want to clip to
4. **Chrome Browser**: Version 88 or higher for Manifest V3 support

## Installation

### 1. Get Your Glean API Token

1. Log into Glean at https://app.glean.com
2. Navigate to **Settings** → **API Tokens**
3. Create a new **Client API Token** with the following scope:
   - ✅ COLLECTIONS (required for writing to collections)
4. Copy the token - you'll need it for configuration

### 2. Find Your Collection ID

You have two options:

**Option A: Use an Existing Collection**

1. Go to your Glean Collections
2. Open the collection you want to use
3. The ID is in the URL: `https://app.glean.com/collection/14191` (14191 is the ID)

**Option B: Create a New Collection**

1. Run the test script to create a new collection:
   ```bash
   export GLEAN_API_TOKEN='your-token-here'
   python test_glean_api.py
   ```
2. When prompted, choose to create a test collection
3. Note the new collection ID

### 3. Install the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `glean-clipper-extension` folder
5. The extension icon should appear in your toolbar

### 4. Configure the Extension

1. Click the extension icon in the toolbar
2. Click the **Settings** tab
3. Enter your configuration:
   - **Domain**: `app.glean.com` (will auto-convert to backend domain)
   - **API Token**: Your Client API token from step 1
   - **Collection ID**: The numeric ID from step 2
4. Toggle **Enable Glean Sync** to ON
5. Click **Save Configuration**

## Usage

### Method 1: Toolbar Button

1. Select text on any webpage
2. Click the Glean Clipper extension icon
3. The selected text is automatically clipped

### Method 2: Context Menu

1. Select text on a webpage
2. Right-click and choose **"Clip to Glean Collection"**

### Method 3: Full Page Clip

1. Right-click anywhere on a page (without selecting text)
2. Choose **"Clip entire page"**

## Testing & Troubleshooting

### Test the API Connection

Use the provided Python test script:

```bash
# Set your API token
export GLEAN_API_TOKEN='your-token-here'

# Run the test suite
python test_glean_api.py
```

This will:

- Verify API connectivity
- Check token permissions
- List your collections
- Test adding items to collections

### Test from Extension Console

1. Open `chrome://extensions/`
2. Find "Glean Web Clipper" and click **Service Worker**
3. In the console, run:

```javascript
// Test connection
await testGleanConnection();

// Test sync
await testGleanSync();
```

### Common Issues

#### "Error getting request body"

- **Cause**: Incorrect payload format or API endpoint
- **Fix**: Ensure you're using the latest extension code with Collections API

#### 401 Unauthorized

- **Cause**: Invalid or expired API token
- **Fix**: Generate a new Client API token with COLLECTIONS scope

#### 403 Forbidden

- **Cause**: Token lacks required permissions
- **Fix**: Ensure token has COLLECTIONS scope, not just read permissions

#### 404 Not Found

- **Cause**: Collection doesn't exist or wrong endpoint
- **Fix**: Verify collection ID exists and is accessible

#### Network Errors

- **Cause**: CORS issues or network connectivity
- **Fix**: Check that `linkedin-be.glean.com` is accessible from your network

### Debug Mode

Enable debug logging:

1. Open the Service Worker console
2. All API requests and responses are logged
3. Look for lines starting with:
   - `🚀 SENDING:` - Outgoing requests
   - `RESPONSE:` - API responses
   - `✅ SUCCESS:` - Successful operations
   - `❌ ERROR:` - Failed operations

## API Details

### Endpoints Used

- **Add Items**: `POST /rest/api/v1/addcollectionitems`
- **List Collections**: `GET /rest/api/v1/listcollections`
- **Get Collection**: `GET /rest/api/v1/getcollection`
- **Create Collection**: `POST /rest/api/v1/createcollection`

### Domain Mapping

The extension automatically converts frontend domains to API domains:

- `app.glean.com` → `linkedin-be.glean.com`

### Payload Format

```json
{
  "collectionId": 14191,
  "addedCollectionItemDescriptors": [
    {
      "url": "https://example.com/page",
      "description": "Title\n\nClipped text content\n\nClipped: timestamp"
    }
  ]
}
```

## Development

### Project Structure

```
glean-clipper-extension/
├── manifest.json         # Extension manifest
├── background.js         # Service worker with API logic
├── content.js           # Content script for page interaction
├── popup.html           # Extension popup interface
├── popup.js            # Popup logic and settings
├── test_glean_api.py   # Python test script
└── README.md           # This file
```

### Key Functions

**background.js**:

- `syncToGleanCollections()` - Syncs clips to Glean API
- `saveClip()` - Saves clips locally and syncs if enabled
- `testGleanSync()` - Tests API sync functionality
- `testGleanConnection()` - Tests API connectivity

**popup.js**:

- Configuration management
- UI updates and status display
- Settings persistence

### Modifying the Extension

1. Edit the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

## Security Notes

- API tokens are stored in Chrome's local storage (encrypted at rest on disk)
- Never commit API tokens to version control
- Use environment variables for the test script
- Tokens are only sent to Glean's API endpoints

## Support

For issues with:

- **The Extension**: Check this README and test scripts
- **Glean API**: Consult Glean's API documentation
- **Collections**: Contact your Glean administrator

## Version History

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history.

- **1.0.0** (Current) - Initial stable release
  - Modern popup UI with Clips and Settings tabs
  - Persistent collection selection
  - Sync status indicators with retry functionality
  - Notebook viewer with search, filter, and theme toggle
  - Clean clip descriptions with timestamps
  - Favicon capture and display
  - Full Collections API integration

## License

This extension is for internal use. Modify and distribute according to your organization's policies.
