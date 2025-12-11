# Testing with Glean MCP

The Glean MCP server can help us test the extension and dashboard integration!

## Available MCP Tools

The Glean MCP provides access to:
- **Search** - Search Glean knowledge base
- **Code Search** - Search internal code repositories  
- **Document Search** - Search internal documents
- **Chat** - AI-powered analysis and synthesis

## Testing Extension API Calls

We can use the MCP to verify our API calls work correctly:

### 1. Test Collections API
```javascript
// Extension uses: POST /rest/api/v1/addcollectionitems
// We can verify the API format matches what Glean expects
```

### 2. Test Authentication
```javascript
// Verify OAuth vs Manual token headers
// X-Glean-Auth-Type: OAUTH header
```

### 3. Test Domain Normalization
```javascript
// app.glean.com → linkedin-be.glean.com
// Verify this matches Glean's backend structure
```

## Using MCP for Testing

1. **Search for API Documentation**
   - Use `mcp_glean_default_search` to find Collections API docs
   - Verify our implementation matches the spec

2. **Test API Calls**
   - Use MCP to understand expected request/response formats
   - Verify our payload structure is correct

3. **Debug Issues**
   - Use MCP chat to ask about API errors
   - Get help understanding Glean API behavior

## Next Steps

1. Use MCP to verify our Collections API implementation
2. Test authentication flow with MCP insights
3. Use MCP to find example API calls
4. Debug any sync issues using MCP documentation
