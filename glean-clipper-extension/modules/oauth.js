// OAuth Authentication Module for Glean
// Uses Chrome Identity API for seamless OAuth flow
// Reference: https://developers.glean.com/api-info/client/authentication/oauth
// Based on: incoming-files/auth/kimi-auth-discussion.md

/**
 * Gets OAuth token using Chrome Identity API
 * This is the preferred method for Chrome extensions
 * @param {boolean} interactive - Whether to show login UI if not authenticated
 * @returns {Promise<string>} OAuth access token
 */
async function getOAuthToken(interactive = true) {
  return new Promise((resolve, reject) => {
    // Check if OAuth is configured
    const manifest = chrome.runtime.getManifest();
    const clientId = manifest.oauth2?.client_id;
    
    if (!clientId || clientId === '' || clientId.includes('YOUR_')) {
      reject(new Error('OAuth not configured. Please use manual API token entry in settings.'));
      return;
    }
    
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) {
        const error = chrome.runtime.lastError;
        // If user cancelled or not configured, provide helpful message
        if (error.message.includes('OAuth2 not configured') || error.message.includes('client_id')) {
          reject(new Error('OAuth not configured. Please use manual API token entry in settings.'));
        } else {
          reject(new Error(error.message || 'Failed to get OAuth token'));
        }
        return;
      }
      resolve(token);
    });
  });
}

/**
 * Initiates OAuth flow by getting token from Chrome Identity API
 * Falls back to manual token entry if OAuth is not configured
 * @param {Object} config - Glean configuration
 * @param {string} config.domain - Glean domain
 * @returns {Promise<string>} OAuth access token
 */
async function initiateOAuthFlow(config) {
  try {
    // Try to get OAuth token via Chrome Identity API
    const token = await getOAuthToken(true);
    
    // Store token with auth method flag
    const result = await chrome.storage.local.get(['gleanConfig']);
    const currentConfig = result.gleanConfig || {};
    
    await chrome.storage.local.set({
      gleanConfig: {
        ...currentConfig,
        apiToken: token,
        clientToken: token,
        authMethod: 'oauth',
        domain: config.domain || currentConfig.domain || 'app.glean.com',
      }
    });
    
    return token;
  } catch (error) {
    // If OAuth is not configured, fall back to manual token entry
    console.warn('OAuth not available, falling back to manual token entry:', error.message);
    
    // Open Glean's token management page as fallback
    const domain = (config.domain || 'app.glean.com').replace(/^https?:\/\//, '').replace(/\/$/, '');
    const cleanDomain = domain.includes('-be.') ? domain.replace('-be.', '.') : domain;
    const tokenPageUrl = `https://${cleanDomain}/admin/platform/tokenManagement?tab=client`;
    
    chrome.tabs.create({ url: tokenPageUrl });
    
    throw new Error('OAuth not configured. Please either:\n1. Configure OAuth client ID in manifest.json, or\n2. Use manual token entry (page opened)');
  }
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
    const baseUrl = normalizeDomain(config.domain || 'app.glean.com');
    // Use listCollections endpoint for validation (simpler than search)
    const testUrl = `${baseUrl}/rest/api/v1/listcollections`;

    // Use OAuth headers (isOAuthToken = true)
    const headers = createCollectionsAPIHeaders(token, {}, true);

    // Make a lightweight API call to test token
    await fetchJSON(testUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
      mode: 'cors',
      credentials: 'omit',
    });

    return true;
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      return false; // Token expired or invalid
    }
    throw error; // Other errors should be propagated
  }
}

/**
 * Gets or refreshes OAuth token
 * Checks if stored token is valid, initiates OAuth flow if needed
 * @param {Object} config - Glean configuration
 * @param {boolean} forceRefresh - Force refresh even if token exists
 * @returns {Promise<string>} Valid OAuth access token
 */
async function getOrRefreshOAuthToken(config, forceRefresh = false) {
  // Check if we have a stored OAuth token
  const result = await chrome.storage.local.get(['gleanConfig']);
  const storedConfig = result.gleanConfig || {};
  
  if (!forceRefresh && storedConfig.authMethod === 'oauth' && storedConfig.apiToken) {
    // Validate existing token
    const isValid = await validateOAuthToken(storedConfig.apiToken, storedConfig).catch(() => false);
    if (isValid) {
      return storedConfig.apiToken;
    }
    // Token invalid, clear it
    console.log('Stored OAuth token is invalid, refreshing...');
  }

  // Get new token via OAuth flow
  console.log('Getting OAuth token...');
  const newToken = await getOAuthToken(true);
  
  // Store token with OAuth flag
  await chrome.storage.local.set({
    gleanConfig: {
      ...storedConfig,
      apiToken: newToken,
      clientToken: newToken,
      authMethod: 'oauth',
      domain: config.domain || storedConfig.domain || 'app.glean.com',
    }
  });

  return newToken;
}

/**
 * Clears stored OAuth token
 * Also removes Chrome Identity API token cache
 * Useful for logout or re-authentication
 */
async function clearOAuthToken() {
  // Get current token to remove from Chrome Identity cache
  const result = await chrome.storage.local.get(['gleanConfig']);
  const token = result.gleanConfig?.apiToken;
  
  if (token) {
    // Remove from Chrome Identity API cache
    chrome.identity.removeCachedAuthToken({ token }, () => {
      if (chrome.runtime.lastError) {
        console.debug('Error removing cached token:', chrome.runtime.lastError);
      }
    });
  }
  
  // Clear from storage
  const currentConfig = result.gleanConfig || {};
  await chrome.storage.local.set({
    gleanConfig: {
      ...currentConfig,
      apiToken: '',
      clientToken: '',
      authMethod: undefined,
    }
  });
}

export {
  getOAuthToken,
  initiateOAuthFlow,
  validateOAuthToken,
  getOrRefreshOAuthToken,
  clearOAuthToken,
};
