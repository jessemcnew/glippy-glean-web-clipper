# Glean Token Types Explained

## Two Types of Tokens Needed

Based on [Glean's documentation](https://developers.glean.com/api-info/client/authentication/glean-issued), you need **two separate tokens**:

### 1. Client API Token (Glean-Issued Token)
**For:** Collections API, Search API, Chat API, etc.
**Location:** Admin → Platform → Token Management → **Client** tab
**Required Scopes:**
- `COLLECTIONS` - for adding items to collections, listing collections
- `ANSWERS` - optional, for search functionality
**Headers:**
```javascript
Authorization: Bearer <client_token>
// NO X-Glean-Auth-Type header for Glean-issued tokens!
```

### 2. Indexing API Token (Separate Token Type)
**For:** Indexing documents into Glean
**Location:** Admin → Platform → Token Management → **Indexing** tab (different from Client tab!)
**Headers:**
```javascript
Authorization: Bearer <indexing_token>
// NO X-Glean-Auth-Type header for Indexing API
```

## Important: Headers Are Different

### Glean-Issued Tokens (What You Created)
According to [Glean's docs](https://developers.glean.com/api-info/client/authentication/glean-issued):
- **User-Scoped Token**: Only needs `Authorization: Bearer <token>`
- **Global Token**: Needs `Authorization: Bearer <token>` + `X-Glean-ActAs: user@company.com`
- **DO NOT** include `X-Glean-Auth-Type: OAUTH` - that's only for OAuth tokens!

### OAuth Tokens (From OAuth Flow)
- Requires `Authorization: Bearer <token>` + `X-Glean-Auth-Type: OAUTH`

## Current Extension Setup

The extension now correctly:
- ✅ Uses `Authorization: Bearer <token>` only (no `X-Glean-Auth-Type` for Glean-issued tokens)
- ✅ Supports Client API token for Collections API
- ✅ Supports Indexing API token separately (if indexing is enabled)

## Token Creation Steps

1. **Create Client API Token:**
   - Go to Admin → Platform → Token Management → **Client** tab
   - Click "Add New Token"
   - Select scopes: `COLLECTIONS` (and `ANSWERS` if you want search)
   - Permissions: "User (self)" ✅
   - Copy the token

2. **Create Indexing API Token (Optional):**
   - Go to Admin → Platform → Token Management → **Indexing** tab
   - Create token for indexing documents
   - Only needed if you want to index clips (not just add to collections)

## Why "Not Allowed" Error?

The 401 "Not allowed" error was likely because:
- We were sending `X-Glean-Auth-Type: OAUTH` header
- Glean-issued tokens DON'T need this header
- The API rejected it because it's not an OAuth token

## Fixed!

The extension now correctly omits `X-Glean-Auth-Type` for Glean-issued tokens.

