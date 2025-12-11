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
  
  // Build item descriptor matching Glean API format
  // Reference: collections_manager.py add_items_to_collection
  const itemDescriptor = {
    url: clip.url,
    name: clip.title || 'Untitled Clip',
    description: description,
    // Optional fields that improve item display
    itemType: 'DOCUMENT', // Standard type for web clips
  };
  
  // Add documentId if available (from previous sync or indexing)
  if (clip.documentId) {
    itemDescriptor.documentId = clip.documentId;
  }
  
  const payload = {
    collectionId: parseInt(config.collectionId),
    addedCollectionItemDescriptors: [itemDescriptor],
  };

  // Create headers - use OAuth header if token is from OAuth flow
  const isOAuthToken = config.authMethod === 'oauth';
  const headers = createCollectionsAPIHeaders(config.apiToken, {}, isOAuthToken);

  console.log('SENDING: Collections API Request');
  console.log('URL:', collectionsUrl);
  console.log('Method: POST');
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const result = await fetchJSON(collectionsUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      mode: 'cors',
      credentials: 'omit',
    });

    // Collections API typically returns an empty response on success
    console.log('SUCCESS: Item added to collection');
    return { success: true, message: 'Successfully added to Glean collection', ...result };
  } catch (error) {
    // Provide more specific error messages
    if (error.status === 401) {
      throw new Error(`Authentication failed (401): Check your API token and ensure it's an OAuth token`);
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
    const result = await fetchJSON(indexingUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      mode: 'cors',
      credentials: 'omit',
    });

    console.log('SUCCESS: Document indexed to Glean');
    return { success: true, message: 'Successfully indexed to Glean', ...result };
  } catch (error) {
    // Provide more specific error messages
    if (error.status === 401) {
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
    if (!config.enabled) {
      console.log('Glean not configured, returning empty collections');
      return { success: false, collections: [], error: 'Glean not enabled' };
    }

    const hasToken = !!(config.apiToken || config.clientToken);
    if (!config.domain || !hasToken) {
      console.log('Missing domain or token');
      return { success: false, collections: [], error: 'Missing domain or token' };
    }

    // Normalize domain and construct API URL
    const baseUrl = normalizeDomain(config.domain);
    const listUrl = `${baseUrl}/rest/api/v1/listcollections`;

    // Use apiToken or clientToken
    const token = config.apiToken || config.clientToken;
    const isOAuthToken = config.authMethod === 'oauth';
    const headers = createCollectionsAPIHeaders(token, {}, isOAuthToken);

    console.log('📡 Calling listCollections API:', listUrl);

    try {
      const result = await fetchJSON(listUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({}), // Empty payload for listing
        mode: 'cors',
        credentials: 'omit',
      });

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
    
    // Debug logging (mask token for security)
    const tokenPreview = token ? `${token.substring(0, 8)}...${token.substring(token.length - 4)}` : 'NO TOKEN';
    console.log('🔍 Connection Test Debug:', {
      domain: config.domain,
      normalizedDomain: baseUrl,
      testUrl,
      tokenLength: token?.length || 0,
      tokenPreview,
      hasToken: !!token,
    });

    // Create headers - use OAuth header if token is from OAuth flow
    const isOAuthToken = config.authMethod === 'oauth';
    const headers = createCollectionsAPIHeaders(token, {}, isOAuthToken);
    console.log('📋 Request Headers:', {
      'Content-Type': headers['Content-Type'],
      'Accept': headers['Accept'],
      'Authorization': headers['Authorization'] ? `Bearer ${tokenPreview}` : 'MISSING',
      'X-Glean-Auth-Type': headers['X-Glean-Auth-Type'],
    });

    try {
      // Test with listCollections - simpler endpoint that just requires auth
      const result = await fetchJSON(testUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({}), // Empty payload for listing
        mode: 'cors',
        credentials: 'omit',
      });

      // Success - we got a response (even if empty collections list)
      console.log('Connection test successful! API is reachable and token is valid.');
      const collectionsCount = result.collections?.length || 0;
      return {
        success: true,
        message: `Successfully connected to Glean Collections API${collectionsCount > 0 ? ` (found ${collectionsCount} collection(s))` : ''}`,
        collectionsCount,
      };
    } catch (error) {
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

/**
 * Fetches items from a specific Glean collection
 * Uses the getcollection endpoint and attempts to extract items
 * @param {string} collectionId - The collection ID
 * @param {Object} config - Glean configuration
 * @returns {Promise<Object>} Collection items result
 */
async function fetchCollectionItems(collectionId, config) {
  if (!collectionId) {
    return { success: false, items: [], error: 'Collection ID is required' };
  }

  try {
    const baseUrl = normalizeDomain(config.domain);
    const getCollectionUrl = `${baseUrl}/rest/api/v1/getcollection`;
    
    const token = config.apiToken || config.clientToken;
    const isOAuthToken = config.authMethod === 'oauth';
    const headers = createCollectionsAPIHeaders(token, {}, isOAuthToken);

    const payload = {
      collectionId: parseInt(collectionId),
    };

    const result = await fetchJSON(getCollectionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      mode: 'cors',
      credentials: 'omit',
    });

    // Extract items from collection response
    // Note: API may return items in different formats
    // The getcollection endpoint may not return items directly
    // We'll try to extract from various possible response structures
    let items = [];
    
    if (result.items && Array.isArray(result.items)) {
      items = result.items;
    } else if (result.collectionItems && Array.isArray(result.collectionItems)) {
      items = result.collectionItems;
    } else if (result.data?.items && Array.isArray(result.data.items)) {
      items = result.data.items;
    } else if (result.collection?.items && Array.isArray(result.collection.items)) {
      items = result.collection.items;
    }
    
    // If no items found, return empty array (API may not support listing items)
    return {
      success: true,
      items: items.map(item => ({
        id: item.id || item.itemId || item.documentId || `item-${Date.now()}-${Math.random()}`,
        title: item.name || item.title || item.itemName || 'Untitled',
        url: item.url || item.viewURL || item.itemURL || '',
        description: item.description || item.itemDescription || '',
        addedAt: item.addedAt || item.createdAt || item.dateAdded || new Date().toISOString(),
        collectionId: collectionId,
      })),
      collectionName: result.name || result.collectionName || result.collection?.name,
    };
  } catch (error) {
    console.error('Error fetching collection items:', error);
    return {
      success: false,
      items: [],
      error: error.message || 'Failed to fetch collection items',
    };
  }
}

/**
 * Fetches all clips from Glean by searching across collections
 * This is a hybrid approach: combines local storage with API data
 * @param {Object} options - Fetch options
 * @param {string} options.collectionId - Optional collection ID to filter by
 * @returns {Promise<Object>} Clips result
 */
async function fetchClipsFromGlean(options = {}) {
  try {
    const config = await getGleanConfig();
    
    if (!config.enabled || (!config.apiToken && !config.clientToken)) {
      // Fallback to local storage if API not configured
      const storageModule = await import('./storage.js');
      const localClips = await storageModule.getClips();
      return {
        success: true,
        clips: localClips,
        source: 'local',
      };
    }

    const { collectionId } = options;
    
    // If specific collection requested, fetch from that collection
    if (collectionId) {
      const result = await fetchCollectionItems(collectionId, config);
      return {
        success: result.success,
        clips: result.items || [],
        collectionName: result.collectionName,
        source: 'api',
      };
    }

    // Otherwise, fetch from all collections user has access to
    const collectionsResult = await fetchGleanCollections();
    if (!collectionsResult.success || !collectionsResult.collections?.length) {
      // Fallback to local storage
      const storageModule = await import('./storage.js');
      const localClips = await storageModule.getClips();
      return {
        success: true,
        clips: localClips,
        source: 'local',
      };
    }

    // Fetch items from all collections (limit to first 10 to avoid timeout)
    const allClips = [];
    const collectionsToFetch = collectionsResult.collections.slice(0, 10);
    for (const collection of collectionsToFetch) {
      try {
        const itemsResult = await fetchCollectionItems(collection.id, config);
        if (itemsResult.success && itemsResult.items) {
          allClips.push(...itemsResult.items);
        }
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`Failed to fetch items from collection ${collection.id}:`, error);
      }
    }

    // Also merge with local clips for completeness
    const storageModule = await import('./storage.js');
    const localClips = await storageModule.getClips();
    
    // Merge and deduplicate by URL
    const clipMap = new Map();
    [...localClips, ...allClips].forEach(clip => {
      const key = clip.url || clip.id;
      if (!clipMap.has(key) || !clipMap.get(key).synced) {
        clipMap.set(key, { ...clip, synced: !!clip.collectionId });
      }
    });

    return {
      success: true,
      clips: Array.from(clipMap.values()),
      source: 'hybrid',
    };
  } catch (error) {
    console.error('Error fetching clips from Glean:', error);
    // Fallback to local storage
    try {
      const storageModule = await import('./storage.js');
      const localClips = await storageModule.getClips();
      return {
        success: true,
        clips: localClips,
        source: 'local',
        error: error.message,
      };
    } catch (storageError) {
      console.error('Error loading from local storage:', storageError);
      return {
        success: false,
        clips: [],
        source: 'error',
        error: error.message,
      };
    }
  }
}

/**
 * Searches for Glean agents by name
 * @param {string} query - Search query for agent name
 * @param {Object} config - Glean configuration
 * @returns {Promise<Object>} Agents search result
 */
async function searchGleanAgents(query, config) {
  try {
    const baseUrl = normalizeDomain(config.domain);
    const searchUrl = `${baseUrl}/rest/api/v1/agents/search`;
    
    const token = config.apiToken || config.clientToken;
    const isOAuthToken = config.authMethod === 'oauth';
    const headers = createCollectionsAPIHeaders(token, {}, isOAuthToken);

    const payload = {
      query: query || '',
    };

    const result = await fetchJSON(searchUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      mode: 'cors',
      credentials: 'omit',
    });

    return {
      success: true,
      agents: result.agents || result.data?.agents || [],
    };
  } catch (error) {
    console.error('Error searching agents:', error);
    return {
      success: false,
      agents: [],
      error: error.message || 'Failed to search agents',
    };
  }
}

/**
 * Runs a Glean agent to find similar articles
 * @param {string} agentId - The agent ID to run
 * @param {Object} input - Agent input parameters (e.g., article title, content)
 * @param {Object} config - Glean configuration
 * @returns {Promise<Object>} Agent run result
 */
async function runGleanAgent(agentId, input, config) {
  try {
    const baseUrl = normalizeDomain(config.domain);
    const runUrl = `${baseUrl}/rest/api/v1/agents/runs/wait`;
    
    const token = config.apiToken || config.clientToken;
    const isOAuthToken = config.authMethod === 'oauth';
    const headers = createCollectionsAPIHeaders(token, {}, isOAuthToken);

    const payload = {
      agentId: agentId,
      input: input,
    };

    const result = await fetchJSON(runUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      mode: 'cors',
      credentials: 'omit',
    });

    return {
      success: true,
      output: result.output || result.data || result,
      articles: result.articles || result.output?.articles || [],
    };
  } catch (error) {
    console.error('Error running agent:', error);
    return {
      success: false,
      articles: [],
      error: error.message || 'Failed to run agent',
    };
  }
}

/**
 * Finds similar articles using a Glean agent
 * Creates or uses an agent to find articles similar to the given article
 * @param {Object} article - Article to find similar ones for
 * @param {Object} config - Glean configuration
 * @returns {Promise<Object>} Similar articles result
 */
async function findSimilarArticles(article, config) {
  try {
    // First, search for a "similar articles" agent
    const agentsResult = await searchGleanAgents('similar articles', config);
    
    let agentId = null;
    if (agentsResult.success && agentsResult.agents.length > 0) {
      // Use first matching agent
      agentId = agentsResult.agents[0].id;
    } else {
      // If no agent found, we could create one or use a default
      // For now, return error suggesting to create agent in Glean UI
      return {
        success: false,
        articles: [],
        error: 'No "similar articles" agent found. Please create one in Glean Agent Builder.',
      };
    }

    // Run the agent with article context
    const input = {
      title: article.title || '',
      content: article.excerpt || article.description || '',
      url: article.url || '',
    };

    return await runGleanAgent(agentId, input, config);
  } catch (error) {
    console.error('Error finding similar articles:', error);
    return {
      success: false,
      articles: [],
      error: error.message || 'Failed to find similar articles',
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
  fetchCollectionItems,
  fetchClipsFromGlean,
  searchGleanAgents,
  runGleanAgent,
  findSimilarArticles,
};