# 🔐 Authentication Steps for Glean Clipper

## Quick Start (3 Steps)

### Step 1: Get Your Client API Token
1. Go to your Glean instance (e.g., `https://app.glean.com` or your company's Glean URL)
2. Navigate to: **Admin → Platform → Token Management**
3. Click the **"Client"** tab
4. Click **"Create Token"** or use an existing Client API token
5. **Copy the token** (you'll only see it once!)

**Note**: Even if you're already signed into Glean in your browser, you still need a Client API token. Glean's API requires tokens (not browser cookies) for security. The extension can't use your existing session automatically.

### Step 2: Enter Token & Domain
1. Open the Glean Clipper extension popup
2. Go to the **Settings** tab
3. Click **"Or Enter Token Manually"** to show the token input field
4. Paste your **Client API token** in the "Client API Token" field
5. Enter your **Glean domain** (e.g., `app.glean.com` or `your-company.glean.com`)
   - **Note**: Enter your frontend domain (what you see in the browser)
   - The extension automatically converts it to the backend API domain (`*-be.glean.com`) for API calls
   - Example: `app.glean.com` → API calls go to `linkedin-be.glean.com`
   - Example: `company.glean.com` → API calls go to `company-be.glean.com`
6. Toggle **"Sync clips to Glean"** to ON
7. Click **"Save Settings"**

### Step 3: Test Connection & Select Collection
1. Click **"Test Connection"** 
   - This verifies your token works
   - **Automatically loads your collections** and populates the dropdown
2. Select a collection from the **"Collection"** dropdown
3. Click **"Save Settings"** again to save the collection selection
4. Click **"Test Sync"** - should succeed ✅

**That's it!** Once you see "Ready" status, you can start clipping!

## That's It! You're Ready

Once you see "Ready" status, you can start clipping! The extension will automatically sync your clips to Glean.

## Troubleshooting

### "Disconnected" Status
- Check that your token is correct
- Verify your domain is correct (just the domain, no `https://`)
- Make sure "Sync clips to Glean" toggle is ON

### "Test Connection" Fails
- Verify your token has the right permissions
- Check that your domain is accessible
- Try refreshing the extension

### No Collections in Dropdown
- Click "Test Connection" first - this loads collections
- Make sure you have collections in your Glean instance
- Check that your token has access to collections

### "Test Sync" Fails
- Make sure you've selected a collection
- Verify your collection ID is correct
- Check the browser console for error details

## Token Types

- **Client API Token**: Use this! (what we're using)
- **Indexing API Token**: Only needed for advanced indexing features
- **Search API Token**: Not needed for basic clipping

## Need Help?

Check the browser console (right-click extension icon → "Inspect popup") for detailed error messages.

