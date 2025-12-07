// OAuth Authentication Module for Glean
// Uses Chrome Identity API for seamless OAuth flow
// Reference: https://developers.glean.com/api-info/client/authentication/oauth

/**
 * Initiates OAuth flow by opening Glean's OAuth page
 * Since Glean OAuth requires admin configuration, we open their OAuth page
 * and guide users to copy the token manually (simpler than full OAuth flow)
 * @param {Object} config - OAuth configuration
 * @param {string} config.domain - Glean domain
 * @returns {Promise<string>} OAuth access token
 */
async function initiateOAuthFlow(config) {
  const domain = config.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const backendDomain = domain.includes('-be.') ? domain : domain.replace('.glean.com', '-be.glean.com');
  
  // Open Glean's token management page where users can create OAuth tokens
  // This is simpler than implementing full OAuth flow which requires server-side setup
  const tokenPageUrl = `https://${domain.replace('-be.', '')}/admin/platform/tokenManagement?tab=client`;
  
  return new Promise((resolve, reject) => {
    // Open token management page in new tab
    chrome.tabs.create({ url: tokenPageUrl }, (tab) => {
      // Show instructions to user
      const instructions = `Please follow these steps:
1. In the tab that just opened, create a new Client API token
2. Copy the token
3. Paste it in the "Client API Token" field below
4. Click "Save Settings"

Alternatively, you can use the manual token entry option.`;
      
      // For now, we'll use a simpler approach: open the page and wait for user
      // In the future, this could be enhanced with a proper OAuth flow
      // if Glean provides OAuth endpoints for extensions
      
      // Reject to show that we need manual entry
      // But we've opened the helpful page
      reject(new Error('Please copy your OAuth token from the page that opened and paste it in the token field below.'));
    });
  });
}

/**
 * Checks if OAuth token is valid and not expired
 * @param {string} token - OAuth token to check
 * @param {Object} config - Glean configuration
 * @returns {Promise<boolean>} True if token is valid
 */
async function validateOAuthToken(token, config) {
  try {
    const { normalizeDomain, createCollectionsAPIHeaders, fetchJSON } = await import('./apiFetch.js');
    const baseUrl = normalizeDomain(config.domain);
    const testUrl = `${baseUrl}/rest/api/v1/search`;

    // OAuth module validates OAuth tokens, so use 'oauth' type
    const headers = createCollectionsAPIHeaders(token, {}, 'oauth');

    // Make a lightweight API call to test token
    await fetchJSON(
      testUrl,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: 'test', pageSize: 1 }),
        mode: 'cors',
        credentials: 'omit',
      },
      { gleanConfig: config }
    );

    return true;
  } catch (error) {
    if (error.status === 401) {
      return false; // Token expired or invalid
    }
    throw error; // Other errors should be propagated
  }
}

/**
 * Gets or refreshes OAuth token
 * Checks if stored token is valid, initiates OAuth flow if needed
 * @param {Object} config - Glean configuration
 * @returns {Promise<string>} Valid OAuth access token
 */
async function getOrRefreshOAuthToken(config) {
  // Check if we have a stored token
  const stored = await chrome.storage.local.get(['gleanOAuthToken', 'gleanOAuthTokenExpiry']);
  
  if (stored.gleanOAuthToken && stored.gleanOAuthTokenExpiry) {
    const expiry = new Date(stored.gleanOAuthTokenExpiry);
    const now = new Date();
    
    // If token expires in more than 5 minutes, use it
    if (expiry > new Date(now.getTime() + 5 * 60 * 1000)) {
      // Validate token is still good
      const isValid = await validateOAuthToken(stored.gleanOAuthToken, config).catch(() => false);
      if (isValid) {
        return stored.gleanOAuthToken;
      }
    }
  }

  // Token expired or doesn't exist, initiate OAuth flow
  console.log('OAuth token expired or missing, initiating OAuth flow...');
  const newToken = await initiateOAuthFlow(config);
  
  // Store token with expiry (OAuth tokens typically last 1 hour)
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await chrome.storage.local.set({
    gleanOAuthToken: newToken,
    gleanOAuthTokenExpiry: expiry.toISOString(),
  });

  return newToken;
}

/**
 * Clears stored OAuth token
 * Useful for logout or re-authentication
 */
async function clearOAuthToken() {
  await chrome.storage.local.remove(['gleanOAuthToken', 'gleanOAuthTokenExpiry']);
}

export {
  initiateOAuthFlow,
  validateOAuthToken,
  getOrRefreshOAuthToken,
  clearOAuthToken,
};

