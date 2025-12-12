# OAuth Setup Notes

## Current Status

The OAuth flow initiates correctly and redirects to Glean's login page, but after login, Glean redirects to its home page instead of our callback URL.

## Issue

The redirect URI `http://localhost:3000/auth/callback` is likely not registered/whitelisted with Glean's OAuth system.

## Solutions

### Option 1: Register OAuth Application (Recommended for Production)

1. Go to Glean Admin → Platform Settings → OAuth Applications
2. Create a new OAuth application
3. Add redirect URI: `http://localhost:3000/auth/callback` (and production URL when ready)
4. Get the `client_id` from the OAuth app
5. Update `LoginForm.tsx` to include `client_id` in the authorization URL

### Option 2: Use Manual Token Entry (Current Fallback)

The manual token entry flow works without OAuth registration:
1. Get API token from Glean Admin → API Tokens → Client API tokens
2. Enter domain and token in the login form
3. Select "Manual Token" or "OAuth Token" based on how you got the token

### Option 3: Check Glean OAuth Documentation

Glean's OAuth flow for web applications might require:
- Specific OAuth endpoint format
- Different scopes
- Additional parameters

Reference: https://developers.glean.com/api-info/client/authentication/oauth

## Next Steps

1. Check if your Glean instance supports OAuth for web applications
2. Register the redirect URI if OAuth is supported
3. Add `client_id` to the authorization URL once registered
4. Test the callback flow

## Current Workaround

Use manual token entry until OAuth is properly configured.
