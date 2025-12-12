# Token Troubleshooting: "Not allowed" Error

## Error: 401 "Not allowed\nNot allowed\n"

This error typically means one of these issues:

### 1. Token Not Activated
**Most Common Issue**: After creating a token, it may need to be activated/approved.

**Solution:**
1. Go to Glean → Admin → Platform → Token Management
2. Find your token (the one you just created)
3. Check if it shows "Pending" or needs activation
4. Click to activate/approve it
5. Wait a few seconds for activation
6. Try the connection test again

### 2. Token Permissions Issue
**Check:**
- Token permissions should be set to **"User (self)"** (not "Global" or "User (other)")
- If you selected "User (other)", the token won't work for your account

**Solution:**
- Create a new token with "User (self)" selected

### 3. Token Scope Missing
**Check:**
- Token must have **COLLECTIONS** scope selected
- ANSWERS scope is optional (only needed for search)

**Solution:**
- Verify COLLECTIONS scope is checked in token settings
- If missing, create a new token with COLLECTIONS scope

### 4. Token Just Created
**Sometimes tokens need a moment to propagate:**
- Wait 10-30 seconds after creating the token
- Try the connection test again

### 5. Token Format Issue
**Check:**
- Token should be 40+ characters long
- Make sure you copied the ENTIRE token (not truncated)
- No extra spaces before/after

## Quick Fix Steps

1. **Verify token is activated:**
   - Go to Admin → Platform → Token Management
   - Find your token
   - Check status (should be "Active" or similar)

2. **Check token settings:**
   - Permissions: "User (self)" ✅
   - Scopes: COLLECTIONS ✅
   - Expiration: Not expired ✅

3. **Try creating a new token:**
   - Delete the old one
   - Create fresh token with:
     - Description: "Glean Clipper"
     - Scopes: COLLECTIONS (and ANSWERS if you want search)
     - Permissions: "User (self)"
     - Expires: Set to future date

4. **Wait and retry:**
   - Wait 30 seconds after token creation
   - Try connection test again

## Still Not Working?

Check the browser console for more details:
1. Right-click extension icon → "Inspect popup"
2. Go to Console tab
3. Look for error messages
4. Check the "Token preview" in debug logs

