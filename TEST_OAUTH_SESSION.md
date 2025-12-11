# Testing: Using Existing Glean Session Without API Token

## What We're Testing

Can you use the dashboard without manually entering an API token if you're already signed into Glean in your browser?

## Test Steps

### 1. **Test Existing Session Button**
   - Open http://localhost:3000
   - Make sure you're **already logged into Glean** in this browser (open https://app.glean.com or your Glean domain in another tab and verify you're signed in)
   - On the login form, click **"Test Existing Glean Session"** button
   - **Expected Results:**
     - ✅ **If it works**: You'll see a success message and can proceed
     - ❌ **If it doesn't work**: You'll see an error explaining why (CORS, no session, etc.)

### 2. **What This Tests**
   - Whether Glean API accepts cookie-based authentication from a web app
   - Whether CORS allows credentials to be sent cross-origin
   - Whether your browser session can be detected

### 3. **Likely Outcomes**

**Scenario A: Cookie-based auth works**
- The test succeeds
- You can use the dashboard without entering a token
- We'll need to modify the API client to use `credentials: 'include'` for all requests

**Scenario B: CORS blocks it (most likely)**
- The test fails with a CORS error
- This means Glean API doesn't allow cookie-based auth from external domains
- You'll need to use OAuth redirect flow or manual token entry

**Scenario C: No active session**
- The test fails with 401/403
- You need to sign into Glean first, then retry

## Next Steps Based on Results

### If Session Test Works:
1. Modify `glean-api.ts` to use `credentials: 'include'` for all fetch requests
2. Remove requirement for API token when session is detected
3. Update auth context to handle session-based auth

### If Session Test Fails (CORS):
1. Implement proper OAuth redirect flow:
   - Get OAuth client ID from Glean
   - Add redirect URI to OAuth app config
   - Implement OAuth authorization URL redirect
   - Handle OAuth callback with token exchange
2. Add "Sign in with Glean" button that initiates OAuth flow

### If No Session:
- User needs to sign into Glean first
- Then retry the test, or use manual token entry

## Current Implementation

The "Test Existing Glean Session" button:
- Makes a test API call to Glean search endpoint
- Uses `credentials: 'include'` to send browser cookies
- Checks if the request succeeds without an Authorization header
- Reports the result

## Manual Token Entry (Fallback)

If session-based auth doesn't work, you can always:
1. Enter your Glean domain
2. Get an API token from Glean Admin → API Tokens → Client API tokens
3. Paste the token and select "Manual Token" or "OAuth Token" (if token came from OAuth)
4. Click "Sign In"
