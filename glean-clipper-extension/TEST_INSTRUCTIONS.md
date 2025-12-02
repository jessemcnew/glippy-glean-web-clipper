# Glean Web Clipper - Testing Instructions

## Setup

1. **Load Extension in Chrome**:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `glean-clipper-extension` folder

2. **Configure Glean Settings**:
   - Click the extension icon in the toolbar
   - Go to the "Settings" tab
   - Enter your configuration:
     - **Domain**: `app.glean.com` (or your custom domain)
     - **API Token**: Your Glean API token
     - **Collection ID**: The ID of your target collection (e.g., `14191`)
     - **Enable Sync**: Check this box

3. **Test Connection**:
   - Click "Test Connection" button
   - This should show success and display your collections count

4. **Save Settings**:
   - Click "Save Settings" button
   - This should fetch and display your real Glean collections

## Testing Features

### 1. View Collections

- Go to the "Clip" tab
- You should see your real Glean collections loaded
- Collections should have proper names and item counts

### 2. Test Clipping

- Navigate to any webpage
- Select some text
- Click the extension icon
- Choose a collection
- Click "Clip" button
- The item should be added to your Glean collection

### 3. View Clipped Items

- Go to the "Clips" tab
- View previously clipped items
- Click on items to open their original URLs

### 4. Collection Redirect

- In the header, click on "Glean Clipper" title
- This should open your Glean collections page

## Expected Behavior

### Collections Loading

- Real collections from your Glean account should appear
- Each collection shows name and item count
- Collections are searchable
- Colors are automatically assigned

### Clipping Process

- Selection text is captured
- Clips are saved both locally and to Glean
- Success feedback is provided
- Clips appear in the "Clips" tab

### Error Handling

- Network errors are displayed to user
- Authentication failures show clear messages
- Local fallback if Glean sync fails

## Debugging

### Console Logs

Check browser console (F12) for:

- API request/response details
- Authentication status
- Collection fetching progress
- Error messages

### Extension Console

Go to `chrome://extensions/` > "Inspect views: service worker" for background script logs.

### Common Issues

1. **No Collections Loading**:
   - Check API token is valid
   - Verify domain is correct
   - Ensure "Enable Sync" is checked

2. **Connection Test Fails**:
   - Verify network connectivity
   - Check if domain converts properly (app.glean.com → linkedin-be.glean.com)
   - Confirm API token has proper permissions

3. **Clipping Fails**:
   - Check collection ID is valid
   - Verify you have write access to the collection
   - Look for CORS or network errors

## API Endpoints Used

- **Collections List**: `https://linkedin-be.glean.com/rest/api/v1/collections`
- **Add Items**: `https://linkedin-be.glean.com/rest/api/v1/addcollectionitems`

## Settings Format

The extension expects:

```json
{
  "domain": "app.glean.com",
  "apiToken": "your-api-token-here",
  "collectionId": "14191",
  "enabled": true
}
```
