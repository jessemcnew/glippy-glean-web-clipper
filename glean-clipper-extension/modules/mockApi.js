// Mock API Module
// Provides mock responses for Glean API calls when devMode is enabled
// Allows full UI/UX testing without VPN or actual API access

/**
 * Mock delay to simulate network latency
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
function mockDelay(ms = 200) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock Collections API - Add Items to Collection
 * @param {Object} payload - Request payload
 * @returns {Promise<Object>} Mock response
 */
async function mockAddCollectionItems(payload) {
  await mockDelay(150);
  console.log('🎭 MOCK API: addCollectionItems', payload);
  return {
    success: true,
    message: 'Mock: Item added to collection successfully',
    collectionId: payload.collectionId,
    itemsAdded: payload.addedCollectionItemDescriptors?.length || 0,
  };
}

/**
 * Mock Collections API - List Collections
 * @param {Object} payload - Request payload
 * @returns {Promise<Object>} Mock response
 */
async function mockListCollections(payload) {
  await mockDelay(200);
  console.log('🎭 MOCK API: listCollections', payload);
  
  // Return mock collections
  return {
    success: true,
    collections: [
      {
        id: 1,
        name: 'Mock Collection 1',
        description: 'A mock collection for testing',
        itemCount: 5,
        isPublic: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        name: 'Mock Collection 2',
        description: 'Another mock collection',
        itemCount: 12,
        isPublic: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        name: 'Web Clips',
        description: 'Collection for web clippings',
        itemCount: 23,
        isPublic: true,
        createdAt: new Date().toISOString(),
      },
    ],
    collectionsCount: 3,
  };
}

/**
 * Mock Collections API - Get Collection
 * @param {Object} payload - Request payload
 * @returns {Promise<Object>} Mock response
 */
async function mockGetCollection(payload) {
  await mockDelay(150);
  console.log('🎭 MOCK API: getCollection', payload);
  return {
    success: true,
    collection: {
      id: payload.collectionId,
      name: 'Mock Collection',
      description: 'A mock collection',
      itemCount: 10,
      isPublic: true,
    },
  };
}

/**
 * Mock Collections API - Create Collection
 * @param {Object} payload - Request payload
 * @returns {Promise<Object>} Mock response
 */
async function mockCreateCollection(payload) {
  await mockDelay(200);
  console.log('🎭 MOCK API: createCollection', payload);
  return {
    success: true,
    collection: {
      id: Math.floor(Math.random() * 10000),
      name: payload.name,
      description: payload.description || '',
      isPublic: payload.isPublic !== false,
      itemCount: 0,
      createdAt: new Date().toISOString(),
    },
  };
}

/**
 * Mock Collections API - Edit Collection
 * @param {Object} payload - Request payload
 * @returns {Promise<Object>} Mock response
 */
async function mockEditCollection(payload) {
  await mockDelay(150);
  console.log('🎭 MOCK API: editCollection', payload);
  return {
    success: true,
    message: 'Mock: Collection updated successfully',
  };
}

/**
 * Mock Collections API - Delete Collection
 * @param {Object} payload - Request payload
 * @returns {Promise<Object>} Mock response
 */
async function mockDeleteCollection(payload) {
  await mockDelay(150);
  console.log('🎭 MOCK API: deleteCollection', payload);
  return {
    success: true,
    message: 'Mock: Collection deleted successfully',
  };
}

/**
 * Mock Collections API - Delete Collection Item
 * @param {Object} payload - Request payload
 * @returns {Promise<Object>} Mock response
 */
async function mockDeleteCollectionItem(payload) {
  await mockDelay(150);
  console.log('🎭 MOCK API: deleteCollectionItem', payload);
  return {
    success: true,
    message: 'Mock: Item deleted successfully',
  };
}

/**
 * Mock Collections API - Edit Collection Item
 * @param {Object} payload - Request payload
 * @returns {Promise<Object>} Mock response
 */
async function mockEditCollectionItem(payload) {
  await mockDelay(150);
  console.log('🎭 MOCK API: editCollectionItem', payload);
  return {
    success: true,
    message: 'Mock: Item updated successfully',
  };
}

/**
 * Mock Search API
 * @param {Object} payload - Request payload
 * @returns {Promise<Object>} Mock response
 */
async function mockSearch(payload) {
  await mockDelay(300);
  console.log('🎭 MOCK API: search', payload);
  return {
    success: true,
    results: [
      {
        title: 'Mock Search Result 1',
        snippet: 'This is a mock search result for testing purposes.',
        url: 'https://example.com/result1',
        score: 0.95,
      },
      {
        title: 'Mock Search Result 2',
        snippet: 'Another mock result to demonstrate search functionality.',
        url: 'https://example.com/result2',
        score: 0.87,
      },
    ],
    totalResults: 2,
    query: payload.query,
  };
}

/**
 * Mock Indexing API - Index Document
 * @param {Object} payload - Request payload
 * @returns {Promise<Object>} Mock response
 */
async function mockIndexDocument(payload) {
  await mockDelay(200);
  console.log('🎭 MOCK API: indexDocument', payload);
  return {
    success: true,
    message: 'Mock: Document indexed successfully',
    documentId: payload.document?.id || `mock-doc-${Date.now()}`,
  };
}

/**
 * Intercepts API calls and returns mock responses when devMode is enabled
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @param {Object} config - Glean configuration
 * @returns {Promise<Object>} Mock response or null if not in dev mode
 */
async function interceptMockAPI(url, options, config) {
  // Only intercept if devMode is enabled
  if (!config.devMode) {
    return null;
  }

  console.log('🎭 MOCK MODE: Intercepting API call to', url);

  // Parse the endpoint from URL
  const urlObj = new URL(url);
  const path = urlObj.pathname;

  // Parse request body if present
  let payload = {};
  if (options.body) {
    try {
      payload = JSON.parse(options.body);
    } catch (e) {
      // Not JSON, ignore
    }
  }

  // Route to appropriate mock handler
  if (path.includes('/rest/api/v1/addcollectionitems')) {
    return await mockAddCollectionItems(payload);
  } else if (path.includes('/rest/api/v1/listcollections')) {
    return await mockListCollections(payload);
  } else if (path.includes('/rest/api/v1/getcollection')) {
    return await mockGetCollection(payload);
  } else if (path.includes('/rest/api/v1/createcollection')) {
    return await mockCreateCollection(payload);
  } else if (path.includes('/rest/api/v1/editcollection')) {
    return await mockEditCollection(payload);
  } else if (path.includes('/rest/api/v1/deletecollection')) {
    return await mockDeleteCollection(payload);
  } else if (path.includes('/rest/api/v1/deletecollectionitem')) {
    return await mockDeleteCollectionItem(payload);
  } else if (path.includes('/rest/api/v1/editcollectionitem')) {
    return await mockEditCollectionItem(payload);
  } else if (path.includes('/rest/api/v1/search')) {
    return await mockSearch(payload);
  } else if (path.includes('/api/index/v1/indexdocument')) {
    return await mockIndexDocument(payload);
  }

  // Unknown endpoint - return null to proceed with real API call
  console.warn('🎭 MOCK MODE: Unknown endpoint, proceeding with real API call:', path);
  return null;
}

export {
  interceptMockAPI,
  mockAddCollectionItems,
  mockListCollections,
  mockGetCollection,
  mockCreateCollection,
  mockSearch,
  mockIndexDocument,
};

