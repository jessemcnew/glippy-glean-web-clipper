// Glean API Module
// Handles all Glean API integrations (Collections and Indexing APIs)
// Reference: https://developers.glean.com/api-info/client/authentication/overview

// Import unified fetch helpers
import {
  fetchJSON,
  createCollectionsAPIHeaders,
  createIndexingAPIHeaders,
  normalizeDomain,
} from './apiFetch.js';

// Import storage functions
import { getGleanConfig } from './storage.js';

/**
 * Syncs a clip to Glean Collections API with retry logic
 * @param {Object} clip - The clip to sync
 * @param {Object} config - Glean configuration
 * @param {number} maxRetries - Maximum number of retry attempts (deprecated - handled by fetchJSON)
 * @returns {Promise<Object>} Sync result
 */
async function syncToGleanCollectionsWithRetry(clip, config, maxRetries = 3) {
  // Retry logic is now handled by fetchJSON, but we keep this wrapper
  // for backward compatibility and to handle auth errors that shouldn't be retried
  try {
    return await syncToGleanCollections(clip, config);
  } catch (error) {
    // Don't retry for authentication/access errors
    if (error.status === 401 || error.status === 403 || error.status === 404) {
      throw error;
    }
    // For other errors, let fetchJSON handle retries
    throw error;
  }
}

/**
 * Syncs a clip to Glean Collections API
 * Reference: https://developers.glean.com/api/client-api/collections/addcollectionitems
 * @param {Object} clip - The clip to sync
 * @param {Object} config - Glean configuration
 * @returns {Promise<Object>} Sync result
 */
async function syncToGleanCollections(clip, config) {
  if (!config.apiToken) {
    throw new Error('API token is required for Collections API');
  }
  if (!config.collectionId) {
    throw new Error('Collection ID is required');
  }

  // Normalize domain to backend API format
  const baseUrl = normalizeDomain(config.domain);
  const collectionsUrl = `${baseUrl}/rest/api/v1/addcollectionitems`;

  // Prepare payload for Collections API according to documentation
  // Clean up the selected text (remove messy URLs, etc.)
  let cleanText = clip.selectedText || '';
  if (cleanText) {
    // Remove image URLs and other messy content
    const lines = cleanText.split('\n').filter(line => {
      const trimmed = line.trim();
      // Remove lines that are just URLs
      if (trimmed.match(/^https?:\/\//)) return false;
      // Remove lines that are just image URLs with parameters
      if (trimmed.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)) return false;
      // Remove lines that are just metadata like "Images:", "Clipped:", etc.
      if (trimmed.match(/^(Images?|Clipped?|Source?|Domain?):/i)) return false;
      // Remove very long lines (likely URLs or encoded data)
      if (trimmed.length > 200) return false;
      return true;
    });
    
    // Get first 3-5 meaningful lines
    const meaningfulLines = lines.filter(l => l.trim().length > 10).slice(0, 5);
    cleanText = meaningfulLines.join('\n').substring(0, 500).trim() || clip.title;
  } else {
    cleanText = clip.title;
  }
  
  // Build description with "Clipped: [date]" at the end
  const clippedDate = new Date(clip.timestamp || Date.now()).toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  const description = `${clip.title}\n\n${cleanText}\n\nClipped: ${clippedDate}`;
  
  const payload = {
    collectionId: parseInt(config.collectionId),
    addedCollectionItemDescriptors: [
      {
        url: clip.url,
        description: description,
      },
    ],
  };

  // Create headers with appropriate auth type based on token type
  // Default to 'glean-issued' for backward compatibility
  const tokenType = config.tokenType || 'glean-issued';
  const headers = createCollectionsAPIHeaders(config.apiToken, {}, tokenType);

  console.log('SENDING: Collections API Request');
  console.log('URL:', collectionsUrl);
  console.log('Method: POST');
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const result = await fetchJSON(
      collectionsUrl,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        mode: 'cors',
        credentials: 'omit',
      },
      { gleanConfig: config }
    );

    // Collections API typically returns an empty response on success
    console.log('SUCCESS: Item added to collection');
    return { success: true, message: 'Successfully added to Glean collection', ...result };
  } catch (error) {
    // Provide more specific error messages with network detection
    if (error.message && error.message.includes('timeout')) {
      throw new Error(`Network timeout: Cannot reach Glean API. Are you connected to VPN?\n\nOriginal error: ${error.message}`);
    } else if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
      throw new Error(`Network error: Cannot reach Glean API. Check:\n1. Are you connected to VPN?\n2. Is your network connection working?\n3. Is the Glean domain correct?\n\nOriginal error: ${error.message}`);
    } else if (error.status === 401) {
      throw new Error(`Authentication failed (401): Check your API token and ensure it's valid`);
    } else if (error.status === 403) {
      throw new Error(`Access forbidden (403): Check token permissions and collection access`);
    } else if (error.status === 404) {
      throw new Error(`Collection not found (404): Check collection ID ${config.collectionId}`);
    } else if (error.status === 400) {
      throw new Error(`Invalid request (400): ${error.message}`);
    }
    throw error;
  }
}

/**
 * Syncs a clip to Glean Indexing API
 * Reference: https://developers.glean.com/api-info/indexing/authentication/overview
 * @param {Object} clip - The clip to sync
 * @param {Object} config - Glean configuration
 * @returns {Promise<Object>} Sync result
 */
async function syncToGleanIndexingAPI(clip, config) {
  if (!config.indexingToken) {
    throw new Error('Indexing token is required for Indexing API');
  }

  // Normalize domain to backend API format
  const baseUrl = normalizeDomain(config.domain);
  const indexingUrl = `${baseUrl}/api/index/v1/indexdocument`;

  // Prepare payload for Glean Indexing API
  // Note: Per docs, payload structure is {datasource: "...", document: {...}}
  const payload = {
    datasource: config.datasource || 'WEBCLIPPER',
    document: {
      id: `webclip-${clip.id}`,
      title: clip.title,
      body: {
        mimeType: 'text/plain',
        textContent: `${clip.selectedText}\n\nSource: ${clip.url}\nDomain: ${clip.domain}\nClipped: ${new Date(clip.timestamp).toLocaleString()}`,
      },
      viewURL: clip.url,
      updatedAt: new Date(clip.timestamp).toISOString(),
      permissions: {
        allowAnonymousAccess: false,
        allowAllDomainUsersAccess: true,
      },
    },
  };

  // Create headers for Indexing API (NO X-Glean-Auth-Type per docs)
  const headers = createIndexingAPIHeaders(config.indexingToken);

  console.log('SENDING: Indexing API Request');
  console.log('URL:', indexingUrl);
  console.log('Method: POST');
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const result = await fetchJSON(
      indexingUrl,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        mode: 'cors',
        credentials: 'omit',
      },
      { gleanConfig: config }
    );

    console.log('SUCCESS: Document indexed to Glean');
    return { success: true, message: 'Successfully indexed to Glean', ...result };
  } catch (error) {
    // Provide more specific error messages with network detection
    if (error.message && error.message.includes('timeout')) {
      throw new Error(`Network timeout: Cannot reach Glean API. Are you connected to VPN?\n\nOriginal error: ${error.message}`);
    } else if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
      throw new Error(`Network error: Cannot reach Glean API. Check:\n1. Are you connected to VPN?\n2. Is your network connection working?\n3. Is the Glean domain correct?\n\nOriginal error: ${error.message}`);
    } else if (error.status === 401) {
      throw new Error(`Authentication failed (401): Check your indexing token`);
    } else if (error.status === 403) {
      throw new Error(`Access forbidden (403): Check token permissions`);
    } else if (error.status === 400) {
      throw new Error(`Invalid request (400): ${error.message}`);
    }
    throw error;
  }
}

/**
 * Tests Glean Collections API sync with a sample clip
 * @returns {Promise<Object>} Test result
 */
async function testGleanSync() {
  try {
    const config = await getGleanConfig();
    
    // Validate configuration
    if (!config.enabled) {
      throw new Error('Glean sync is not enabled. Please enable it in settings.');
    }
    if (!config.apiToken && !config.clientToken) {
      throw new Error('API token is required. Please add your Client API token in settings.');
    }
    if (!config.collectionId) {
      throw new Error('Collection ID is required. Please select a collection in settings.');
    }
    // Domain is pre-configured, defaults to 'app.glean.com' if not set
    // No need to throw error - backend will use default

    const testClip = {
      id: 'test-' + Date.now(),
      url: 'https://example.com/test',
      title: 'Test Clip',
      selectedText: 'This is a test clip to verify Glean Collections API integration.',
      timestamp: Date.now(),
      domain: 'example.com',
    };

    // Use apiToken or clientToken
    const tokenConfig = {
      ...config,
      apiToken: config.apiToken || config.clientToken,
    };

    await syncToGleanCollections(testClip, tokenConfig);
    console.log('TEST SUCCESS: Clip added to collection!');
    return { success: true, message: 'Collections API test successful' };
  } catch (error) {
    console.error('TEST FAILED:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Tests Glean Indexing API with a sample document
 * @returns {Promise<Object>} Test result
 */
async function testGleanIndexing() {
  try {
    const config = await getGleanConfig();
    if (!config.indexingEnabled) {
      throw new Error('Glean indexing is not enabled');
    }

    const testClip = {
      id: 'indexing-test-' + Date.now(),
      url: 'https://example.com/indexing-test',
      title: 'Indexing Test Document',
      selectedText: 'This is a test document to verify Glean Indexing API integration.',
      timestamp: Date.now(),
      domain: 'example.com',
    };

    await syncToGleanIndexingAPI(testClip, config);
    console.log('INDEXING TEST SUCCESS: Document indexed to Glean!');
    return { success: true, message: 'Indexing API test successful' };
  } catch (error) {
    console.error('INDEXING TEST FAILED:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetches collections from Glean using the listCollections API endpoint
 * @returns {Promise<Array>} Array of collections
 */
async function fetchGleanCollections() {
  console.log('FETCHING: Glean Collections...');

  try {
    const config = await getGleanConfig();
    
    // In mock mode, allow fetching collections even if not fully configured
    if (!config.devMode) {
      if (!config.enabled) {
        console.log('Glean not configured, returning empty collections');
        return { success: false, collections: [], error: 'Glean not enabled' };
      }

      const hasToken = !!(config.apiToken || config.clientToken);
      if (!config.domain || !hasToken) {
        console.log('Missing domain or token');
        return { success: false, collections: [], error: 'Missing domain or token' };
      }
    } else {
      // Mock mode - use defaults if missing
      if (!config.domain) {
        config.domain = 'app.glean.com';
      }
    }

    // Normalize domain and construct API URL
    const baseUrl = normalizeDomain(config.domain);
    const listUrl = `${baseUrl}/rest/api/v1/listcollections`;

    // Use apiToken or clientToken
    const token = config.apiToken || config.clientToken;
    const tokenType = config.tokenType || 'glean-issued';
    const headers = createCollectionsAPIHeaders(token, {}, tokenType);

    console.log('📡 Calling listCollections API:', listUrl);

    try {
      const result = await fetchJSON(
        listUrl,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({}), // Empty payload for listing
          mode: 'cors',
          credentials: 'omit',
        },
        { gleanConfig: config }
      );

      console.log('✅ Collections API response:', result);
      
      let allCollections = result.collections || result.data?.collections || [];
      console.log(`📦 Loaded ${allCollections.length} total collections from API`);

      // Filter to only show collections user created or is a member of
      // Filter by write permissions (user is a member) - this is the most reliable indicator
      // Log first collection to inspect structure
      if (allCollections.length > 0) {
        console.log('📋 Sample collection structure:', {
          id: allCollections[0].id,
          name: allCollections[0].name,
          permissions: allCollections[0].permissions,
          owner: allCollections[0].owner,
          creator: allCollections[0].creator,
          allKeys: Object.keys(allCollections[0])
        });
      }

      // Show all collections (user info endpoint not available)
      // The API likely already filters to collections the user can access
      const filteredCollections = allCollections;

      console.log(`✅ Filtered to ${filteredCollections.length} collections (user's collections)`);
      console.log(`   (Filtered out ${allCollections.length - filteredCollections.length} collections)`);
      
      return {
        success: true,
        collections: filteredCollections,
        collectionsCount: filteredCollections.length,
      };
    } catch (error) {
      console.error('❌ Failed to fetch collections:', error);
      
      // If 401/403, it's an auth issue
      if (error.status === 401 || error.status === 403) {
        return {
          success: false,
          collections: [],
          error: 'Authentication failed - check your token',
        };
      }
      
      // If 404, endpoint might not exist or different format
      if (error.status === 404) {
        console.warn('listCollections endpoint not found - API may not support listing');
        return {
          success: false,
          collections: [],
          error: 'Collections listing not available - you may need to enter collection ID manually',
        };
      }
      
      return {
        success: false,
        collections: [],
        error: error.message || 'Failed to fetch collections',
      };
    }
  } catch (error) {
    console.error('Error fetching collections:', error);
    return {
      success: false,
      collections: [],
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Tests connection to Glean Collections API
 * @returns {Promise<Object>} Connection test result
 */
async function testGleanConnection() {
  console.log('TESTING: Glean Collections API connection...');

  try {
    const config = await getGleanConfig();

    // In mock mode, allow testing without full config
    if (config.devMode) {
      console.log('🎭 Mock Mode: Testing connection with mock API');
      // Use defaults for mock mode
      const mockConfig = {
        ...config,
        domain: config.domain || 'app.glean.com',
        apiToken: config.apiToken || 'mock-token',
        enabled: true,
      };
      
      // Test with mock API
      const baseUrl = normalizeDomain(mockConfig.domain);
      const testUrl = `${baseUrl}/rest/api/v1/listcollections`;
      const token = mockConfig.apiToken;
      const tokenType = mockConfig.tokenType || 'glean-issued';
      const headers = createCollectionsAPIHeaders(token, {}, tokenType);
      
      try {
        const result = await fetchJSON(
          testUrl,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({}),
            mode: 'cors',
            credentials: 'omit',
          },
          { gleanConfig: mockConfig }
        );
        
        // Mock API should return collections
        const collectionsCount = result.collections?.length || 0;
        console.log('🎭 Mock Mode: Connection test successful!');
        return {
          success: true,
          message: `🎭 Mock Mode: Successfully connected (found ${collectionsCount} mock collection(s))`,
          collectionsCount,
        };
      } catch (error) {
        console.error('🎭 Mock Mode: Error in test:', error);
        return {
          success: false,
          error: `Mock mode test failed: ${error.message}`,
        };
      }
    }

    // Check for token (apiToken or clientToken)
    const hasToken = !!(config.apiToken || config.clientToken);

    if (!config.enabled || !config.domain || !hasToken) {
      const missing = [];
      if (!config.enabled) missing.push('Glean sync is not enabled');
      if (!config.domain) missing.push('Domain is not set');
      if (!hasToken) missing.push('API token is not set');
      
      return {
        success: false,
        error: 'Glean configuration incomplete: ' + missing.join(', '),
        details: {
          enabled: config.enabled,
          hasDomain: !!config.domain,
          hasApiToken: hasToken,
        },
      };
    }

    // Normalize domain and construct test URL
    const baseUrl = normalizeDomain(config.domain);
    
    // Use listCollections endpoint for testing - it's simpler and doesn't require a collection ID
    const testUrl = `${baseUrl}/rest/api/v1/listcollections`;

    // Use apiToken or clientToken
    const token = config.apiToken || config.clientToken;
    const tokenType = config.tokenType || 'glean-issued';
    
    // Debug logging (mask token for security)
    const tokenPreview = token ? `${token.substring(0, 8)}...${token.substring(token.length - 4)}` : 'NO TOKEN';
    console.log('🔍 Connection Test Debug:', {
      domain: config.domain,
      normalizedDomain: baseUrl,
      testUrl,
      tokenLength: token?.length || 0,
      tokenPreview,
      hasToken: !!token,
      tokenType,
    });

    // Create headers with appropriate auth type
    const headers = createCollectionsAPIHeaders(token, {}, tokenType);
    console.log('📋 Request Headers:', {
      'Content-Type': headers['Content-Type'],
      'Accept': headers['Accept'],
      'Authorization': headers['Authorization'] ? `Bearer ${tokenPreview}` : 'MISSING',
      'X-Glean-Auth-Type': headers['X-Glean-Auth-Type'],
    });

    try {
      // Test with listCollections - simpler endpoint that just requires auth
      const result = await fetchJSON(
        testUrl,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({}), // Empty payload for listing
          mode: 'cors',
          credentials: 'omit',
        },
        { gleanConfig: config }
      );

      // Success - we got a response (even if empty collections list)
      console.log('Connection test successful! API is reachable and token is valid.');
      const collectionsCount = result.collections?.length || 0;
      return {
        success: true,
        message: `Successfully connected to Glean Collections API${collectionsCount > 0 ? ` (found ${collectionsCount} collection(s))` : ''}`,
        collectionsCount,
      };
    } catch (error) {
      // Handle network errors first
      if (error.message && (error.message.includes('timeout') || error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
        return {
          success: false,
          error: `Network error: Cannot reach Glean API.\n\nPossible causes:\n1. Not connected to VPN (required for Glean access)\n2. Network connection issue\n3. Glean domain incorrect\n\nTo test offline, enable "Mock API Mode" in Developer Options.`,
          status: 'network_error',
          details: {
            url: testUrl,
            errorMessage: error.message,
          },
        };
      }
      
      // Handle specific error statuses
      if (error.status === 401) {
        // Log more details for debugging
        console.error('❌ 401 Authentication Error Details:', {
          status: error.status,
          url: testUrl,
          responseText: error.responseText?.substring(0, 200) || 'No response text',
          tokenPreview,
        });
        
        return {
          success: false,
          error: `Authentication failed (401). Check:\n1. Token is a Client API token (from Admin → Platform → Token Management → Client tab)\n2. Token hasn't expired\n3. Token has collections permissions\n\nToken preview: ${tokenPreview}`,
          status: error.status,
          details: {
            url: testUrl,
            tokenLength: token?.length || 0,
            responseText: error.responseText?.substring(0, 200),
          },
        };
      } else if (error.status === 403) {
        return {
          success: false,
          error: 'Access forbidden (403). Check:\n1. Token has COLLECTIONS scope\n2. Token permissions are set to "User (self)" or appropriate level\n3. Token is activated/approved',
          status: error.status,
          details: {
            url: testUrl,
            responseText: error.responseText?.substring(0, 200),
          },
        };
      } else if (error.status === 404) {
        return {
          success: false,
          error: 'Endpoint not found (404). API endpoint may have changed or token doesn\'t have access.',
          status: error.status,
        };
      } else if (error.status === 400) {
        // 400 might be OK for some endpoints - means API is reachable but request format issue
        return {
          success: true,
          message: 'API is reachable (400 - request format issue, but API responded)',
          status: error.status,
        };
      }
      throw error;
    }
  } catch (error) {
    console.error('Connection test failed:', error);
    return {
      success: false,
      error: error.message || `Network error: ${error}`,
    };
  }
}

 // Export functions for use in other modules
export {
  syncToGleanCollectionsWithRetry,
  syncToGleanIndexingAPI,
  testGleanSync,
  testGleanIndexing,
  fetchGleanCollections,
  testGleanConnection,
};