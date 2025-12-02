# OAuth Implementation Guide

## Overview

The extension now supports OAuth authentication as an alternative to manual token entry. However, due to Glean's OAuth architecture, we've implemented a hybrid approach that makes it easier for users while maintaining flexibility.

## Current Implementation

### How It Works

1. **OAuth Button**: Users click "Authenticate with OAuth" button
2. **Token Management Page**: Opens Glean's token management page where users can create OAuth tokens
3. **Manual Copy**: Users copy the token and paste it (still requires one manual step)
4. **Auto-storage**: Token is stored with `authMethod: 'oauth'` flag

### Why Not Full OAuth Flow?

Glean's OAuth requires:
- Server-side configuration
- Registered redirect URIs
- Admin setup in Glean
- OAuth client ID/secret configuration

For a Chrome extension, implementing full OAuth flow would require:
- A backend server to handle OAuth callbacks
- PKCE flow implementation
- Token refresh logic

The current approach is simpler and works immediately without server setup.

## Future Enhancement: Full OAuth Flow

If you want to implement full OAuth flow, you would need:

1. **Backend Server**: Handle OAuth callbacks
2. **Chrome Identity API**: Use `chrome.identity.launchWebAuthFlow()`
3. **PKCE Flow**: For secure OAuth without client secret
4. **Token Refresh**: Automatic token refresh when expired

### Example Full OAuth Flow (Future)

```javascript
// This would require Glean to support extension OAuth redirect URIs
const redirectUri = chrome.identity.getRedirectURL('oauth/callback');
const authUrl = `https://${domain}/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=...`;

chrome.identity.launchWebAuthFlow({ url: authUrl }, async (redirectUrl) => {
  // Extract code from redirect
  // Exchange code for token via backend
  // Store token
});
```

## Current Benefits

✅ **Easier UX**: One-click button opens the right page  
✅ **No server required**: Works immediately  
✅ **Clear labeling**: Users know they're using OAuth tokens  
✅ **Fallback support**: Manual token entry still available  

## User Flow

1. User clicks "🔐 Authenticate with OAuth"
2. Extension opens Glean token management page
3. User creates OAuth token in Glean UI
4. User copies token and pastes it in extension
5. Extension stores token with `authMethod: 'oauth'`
6. Future requests use OAuth headers automatically

## Token Storage

OAuth tokens are stored the same way as manual tokens:
```json
{
  "gleanConfig": {
    "domain": "app.glean.com",
    "apiToken": "oauth_token_here",
    "clientToken": "oauth_token_here",
    "authMethod": "oauth",
    "enabled": true
  }
}
```

## API Calls

All API calls automatically use the correct headers based on token type:
- OAuth tokens: Include `X-Glean-Auth-Type: OAUTH` header
- Manual tokens: Same header (both are OAuth tokens from Glean)

The distinction is mainly for UX - users know they're using OAuth vs manually created tokens.

