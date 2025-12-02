// Background service worker for Glean Web Clipper
// Uses Collections API for adding items to Glean collections

// Keep service worker alive and handle lifecycle better
let keepAliveInterval;
let isServiceWorkerActive = true;

function startKeepAlive() {
  if (keepAliveInterval) clearInterval(keepAliveInterval);
  keepAliveInterval = setInterval(() => {
    console.log('🟢 Service worker keepalive ping - Active:', isServiceWorkerActive);
    // Ping Chrome storage to keep worker active
    chrome.storage.local.get(['ping'], () => {
      if (chrome.runtime.lastError) {
        console.log('⚠️ Service worker context may be invalidated');
        isServiceWorkerActive = false;
      } else {
        isServiceWorkerActive = true;
      }
    });
  }, 25000);
}

// Handle service worker startup
chrome.runtime.onStartup.addListener(() => {
  console.log('🚀 Service worker startup');
  isServiceWorkerActive = true;
  startKeepAlive();
});

// Handle extension installation/update
chrome.runtime.onInstalled.addListener(() => {
  console.log('📦 Extension installed/updated');
  isServiceWorkerActive = true;
  startKeepAlive();
});

startKeepAlive();

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveClip') {
    saveClip(request.data).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      console.error('Failed to save clip:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  } else if (request.action === 'testSync') {
    testGleanSync().then((result) => {
      sendResponse({ success: true, result });
    }).catch(error => {
      console.error('Test sync failed:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  } else if (request.action === 'testConnection') {
    testGleanConnection().then((result) => {
      sendResponse({ success: true, result });
    }).catch(error => {
      console.error('Connection test failed:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  } else if (request.action === 'fetchCollections') {
    fetchGleanCollections().then((result) => {
      sendResponse({ success: true, result });
    }).catch(error => {
      console.error('Fetch collections failed:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  } else if (request.action === 'retrySync') {
    retryClipSync(request.data.clipId).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      console.error('Retry sync failed:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  } else if (request.action === 'testIndexing') {
    testGleanIndexing().then((result) => {
      sendResponse({ success: true, result });
    }).catch(error => {
      console.error('Indexing test failed:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  } else if (request.action === 'ping') {
    sendResponse({ success: true, message: 'Service worker is active' });
    return true;
  }
});

// Save clip to storage and optionally sync to Glean
async function saveClip(clipData) {
  try {
    const result = await chrome.storage.local.get(['clips', 'gleanConfig']);
    const clips = result.clips || [];
    const gleanConfig = result.gleanConfig || { enabled: false };
    
    const newClip = {
      id: Date.now().toString(),
      ...clipData,
      tags: extractTags(clipData.selectedText),
      category: categorizeContent(clipData.url, clipData.selectedText),
      images: clipData.images || [], // Add scraped images
      synced: false
    };
    
    // Try to sync to Glean using both Collections and Indexing APIs if configured
    if (gleanConfig.enabled && gleanConfig.domain) {
      let syncResults = [];
      
      // Try Collections API if configured
      if (gleanConfig.clientToken && gleanConfig.collectionId) {
        try {
          console.log('🔄 Attempting to sync to Glean Collections:', {
            domain: gleanConfig.domain,
            hasClientToken: !!gleanConfig.clientToken,
            collectionId: gleanConfig.collectionId
          });
          await syncToGleanCollectionsWithRetry(newClip, gleanConfig);
          syncResults.push('collections');
          console.log('✅ SUCCESS: Clip added to Glean collection successfully');
        } catch (error) {
          console.error('❌ Collections API failed:', error.message);
        }
      }
      
      // Try Indexing API if configured
      if (gleanConfig.indexingToken) {
        try {
          console.log('🔄 Attempting to sync to Glean Indexing API:', {
            domain: gleanConfig.domain,
            hasIndexingToken: !!gleanConfig.indexingToken
          });
          await syncToGleanIndexingAPI(newClip, gleanConfig);
          syncResults.push('indexing');
          console.log('✅ SUCCESS: Clip indexed to Glean successfully');
        } catch (error) {
          console.error('❌ Indexing API failed:', error.message);
        }
      }
      
      if (syncResults.length > 0) {
        newClip.synced = true;
        newClip.syncMethods = syncResults;
        console.log(`✅ OVERALL SUCCESS: Synced via ${syncResults.join(', ')}`);
      } else {
        console.error('❌ ERROR: All sync methods failed, saving locally only');
        newClip.syncError = 'All sync methods failed';
      }
    }
    
    clips.unshift(newClip);
    if (clips.length > 1000) {
      clips.splice(1000);
    }
    
    await chrome.storage.local.set({ clips });
    updateBadgeCount(clips.length);
    console.log('Clip saved:', newClip);
    
  } catch (error) {
    console.error('Error saving clip:', error);
    throw error;
  }
}

// Retry wrapper for Glean Collections API
async function syncToGleanCollectionsWithRetry(clip, config, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Sync attempt ${attempt}/${maxRetries}`);
      const result = await syncToGleanCollections(clip, config);
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);
      
      // Don't retry for authentication errors or invalid collection IDs
      if (error.message.includes('401') || error.message.includes('403') || error.message.includes('404')) {
        console.log('🚫 Not retrying - authentication/access error');
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Sync clip to Glean Collections API
async function syncToGleanCollections(clip, config) {
  let domain = config.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  console.log('ORIGINAL DOMAIN:', domain);
  
  // Convert app.glean.com to backend domain
  if (domain === 'app.glean.com' || domain.startsWith('app.')) {
    domain = 'linkedin-be.glean.com';
    console.log('Converted to linkedin-be.glean.com for Collections API');
  }
  
  console.log('FINAL DOMAIN:', domain);
  
  // Use Collections API endpoint
  const collectionsUrl = `https://${domain}/rest/api/v1/addcollectionitems`;
  
  // Prepare payload for Collections API according to documentation
  // Collections API only needs collectionId and item descriptors
  const payload = {
    collectionId: parseInt(config.collectionId), // Ensure collection ID is a number
    addedCollectionItemDescriptors: [
      {
        url: clip.url,
        description: `${clip.title}\n\n${clip.selectedText}\n\nClipped: ${new Date(clip.timestamp).toLocaleString()}${
          clip.images && clip.images.length > 0 ? 
          `\n\nImages: ${clip.images.join(', ')}` : 
          ''
        }`
      }
    ]
  };
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${config.apiToken.trim()}`
  };
  
  console.log('🚀 SENDING: Collections API Request');
  console.log('URL:', collectionsUrl);
  console.log('Method: POST');
  console.log('Headers:', {
    ...headers,
    'Authorization': `Bearer ${config.apiToken.substring(0, 10)}...`
  });
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
  let response;
  try {
    response = await fetch(collectionsUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
      mode: 'cors',
      credentials: 'omit'
    });
  } catch (fetchError) {
    console.error('FETCH ERROR:', fetchError);
    throw new Error(`Network error: ${fetchError.message}`);
  }
  
  console.log('📡 RESPONSE:', {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    contentType: response.headers.get('content-type')
  });
  
  const responseText = await response.text();
  console.log('📄 RESPONSE BODY (first 500 chars):', responseText.substring(0, 500));
  
  if (!response.ok) {
    console.log('❌ ERROR: Collections API Error Response:', responseText);
    if (response.status === 400) {
      throw new Error(`Collections API error (400): ${responseText}`);
    } else if (response.status === 401) {
      throw new Error(`Authentication failed (401): Check your API token`);
    } else if (response.status === 403) {
      throw new Error(`Access forbidden (403): Check token permissions and collection access`);
    } else if (response.status === 404) {
      throw new Error(`Collection not found (404): Check collection ID ${config.collectionId}`);
    }
    throw new Error(`Collections API error (${response.status}): ${responseText}`);
  }
  
  // Collections API typically returns an empty response on success
  if (!responseText || responseText.trim() === '') {
    console.log('✅ SUCCESS: Item added to collection (empty response is normal)');
    return { success: true, message: 'Successfully added to Glean collection' };
  }
  
  try {
    const result = JSON.parse(responseText);
    console.log('✅ SUCCESS: Collections API responded:', result);
    return result;
  } catch (e) {
    // Empty or non-JSON response is actually success for Collections API
    console.log('✅ SUCCESS: Item added to collection');
    return { success: true, message: 'Successfully added to Glean collection' };
  }
}

// Sync clip to Glean Indexing API (for adding documents to search index)
async function syncToGleanIndexingAPI(clip, config) {
  let domain = config.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  console.log('🌐 Original domain:', domain);
  
  // Fix domain format for Indexing API (convert to customer-be format)
  if (!domain.includes('-be.')) {
    if (domain.includes('linkedin')) {
      domain = 'linkedin-be.glean.com';
    } else if (domain.startsWith('app.')) {
      domain = domain.replace('app.', 'customer-be.');
    } else if (domain.includes('.glean.com')) {
      domain = domain.replace('.glean.com', '-be.glean.com');
    } else if (!domain.includes('.')) {
      domain = `${domain}-be.glean.com`;
    }
  }
  
  console.log('🔧 Converted domain for Indexing API:', domain);
  
  // Correct API endpoint for single document indexing (per official docs)
  const indexingUrl = `https://${domain}/api/index/v1/indexdocument`;
  
  // Prepare document for Glean Indexing API (correct structure per official docs)
  const payload = {
    document: {
      datasource: 'WEBCLIPPER',
      objectType: 'WEBCLIP',
      id: `webclip-${clip.id}`,
      title: clip.title,
      body: {
        mimeType: 'text/plain',
        textContent: `${clip.selectedText}\n\nSource: ${clip.url}\nDomain: ${clip.domain}\nClipped: ${new Date(clip.timestamp).toLocaleString()}`
      },
      viewURL: clip.url,
      permissions: {
        allowAnonymousAccess: false,
        allowAllDomainUsersAccess: true
      }
    }
  };
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${config.indexingToken.trim()}`
  };
  
  console.log('🚀 SENDING: Indexing API Request');
  console.log('URL:', indexingUrl);
  console.log('Method: POST');
  console.log('Headers:', {
    ...headers,
    'Authorization': `Bearer ${config.indexingToken.substring(0, 10)}...`
  });
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
  let response;
  try {
    response = await fetch(indexingUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
      mode: 'cors',
      credentials: 'omit'
    });
  } catch (fetchError) {
    console.error('📡 FETCH ERROR:', fetchError);
    throw new Error(`Network error connecting to Indexing API: ${fetchError.message}`);
  }
  
  console.log('📡 INDEXING API RESPONSE:', {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries())
  });
  
  const responseText = await response.text();
  console.log('📄 INDEXING RESPONSE BODY:', responseText.substring(0, 500));
  
  if (!response.ok) {
    console.log('❌ INDEXING API ERROR:', responseText);
    if (response.status === 400) {
      throw new Error(`Indexing API error (400): ${responseText}`);
    } else if (response.status === 401) {
      throw new Error(`Indexing authentication failed (401): Check your indexing API token`);
    } else if (response.status === 403) {
      throw new Error(`Indexing access forbidden (403): Check token permissions`);
    }
    throw new Error(`Indexing API error (${response.status}): ${responseText}`);
  }
  
  console.log('✅ SUCCESS: Document indexed to Glean');
  return { success: true, message: 'Successfully indexed to Glean' };
}

// Test Glean sync
async function testGleanSync() {
  console.log('🧪 TESTING GLEAN COLLECTIONS SYNC...');
  
  const result = await chrome.storage.local.get(['gleanConfig']);
  const config = result.gleanConfig;
  
  if (!config?.enabled || !config?.apiToken || !config?.collectionId) {
    throw new Error('Missing configuration. Need API token and collection ID.');
  }
  
  const testClip = {
    id: 'test-' + Date.now(),
    title: 'Test Clip',
    selectedText: 'This is a test clip to verify Glean Collections API is working.',
    url: 'https://example.com',
    domain: 'example.com',
    timestamp: new Date().toISOString()
  };
  
  try {
    await syncToGleanCollections(testClip, config);
    console.log('✅ TEST SUCCESS: Clip added to collection!');
    return { success: true };
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
    throw error;
  }
}

// Test Glean Indexing API
async function testGleanIndexing() {
  console.log('🧪 TESTING GLEAN INDEXING API...');
  
  const result = await chrome.storage.local.get(['gleanConfig']);
  const config = result.gleanConfig;
  
  if (!config?.enabled || !config?.indexingToken || !config?.domain) {
    throw new Error('Missing configuration. Need domain and indexing token.');
  }
  
  const testClip = {
    id: 'indexing-test-' + Date.now(),
    title: 'Test Indexing Clip',
    selectedText: 'This is a test clip to verify Glean Indexing API is working with token: bEdS6GTiDeQe2k0MBPsj7Edb6FCyzUmk5gg7tXVfvrg=',
    url: 'https://test-indexing.example.com',
    domain: 'test-indexing.example.com',
    timestamp: new Date().toISOString()
  };
  
  try {
    const result = await syncToGleanIndexingAPI(testClip, config);
    console.log('✅ INDEXING TEST SUCCESS: Document indexed to Glean!');
    return { 
      success: true, 
      message: 'Test document successfully indexed to Glean',
      clip: testClip,
      result: result
    };
  } catch (error) {
    console.error('❌ INDEXING TEST FAILED:', error);
    throw error;
  }
}

// Fetch Glean Collections
async function fetchGleanCollections() {
  console.log('📋 FETCHING: Glean Collections...');
  
  const result = await chrome.storage.local.get(['gleanConfig']);
  const config = result.gleanConfig;
  
  if (!config?.enabled || !config?.apiToken || !config?.domain) {
    console.log('⚠️ Glean not configured, returning empty collections');
    return { collections: [], collectionsCount: 0 };
  }
  
  // Since the Glean Collections API doesn't support listing collections,
  // return empty array - users need to manually add collections from URLs
  console.log('📝 Collections API does not support listing - users must add manually from URLs');
  return { collections: [], collectionsCount: 0 };
}

// Test connection
async function testGleanConnection() {
  console.log('🔍 TESTING: Glean Collections API connection...');
  
  const result = await chrome.storage.local.get(['gleanConfig']);
  const config = result.gleanConfig;
  
  if (!config?.enabled || !config?.apiToken || !config?.domain) {
    throw new Error('Glean not configured. Please check settings.');
  }
  
  let domain = config.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (domain === 'app.glean.com' || domain.startsWith('app.')) {
    domain = 'linkedin-be.glean.com';
  }
  
  // Test by making a request to addcollectionitems endpoint with a dry-run approach
  // We'll use the HEAD method or check the endpoint availability
  const testUrl = `https://${domain}/rest/api/v1/addcollectionitems`;
  
  try {
    console.log('Testing connection to:', testUrl);
    
    // Test with a minimal request to see if we get proper auth response
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiToken.trim()}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        collectionId: parseInt(config.collectionId || 14191),
        addedCollectionItemDescriptors: [] // Empty array - shouldn't add anything
      }),
      mode: 'cors',
      credentials: 'omit'
    });
    
    console.log('Test response status:', response.status);
    
    // 400 or 200 means the API is reachable and authentication worked
    // 401/403 means auth issues
    if (response.status === 400 || response.status === 200) {
      console.log('✅ Connection test successful! API is reachable and token is valid.');
      return { 
        success: true, 
        collectionsCount: 0,
        message: 'API connection successful. Collections API does not support listing.' 
      };
    } else if (response.status === 401) {
      throw new Error('Authentication failed. Check your API token.');
    } else if (response.status === 403) {
      throw new Error('Access forbidden. Check token permissions.');
    } else {
      throw new Error(`Unexpected response: HTTP ${response.status}`);
    }
    
  } catch (error) {
    console.error('Connection test failed:', error);
    if (error.message.includes('fetch')) {
      throw new Error('Network error. Check your domain and internet connection.');
    }
    throw error;
  }
}

// Retry sync for a specific clip
async function retryClipSync(clipId) {
  const result = await chrome.storage.local.get(['clips', 'gleanConfig']);
  const clips = result.clips || [];
  const gleanConfig = result.gleanConfig || { enabled: false };
  
  const clipIndex = clips.findIndex(c => c.id === clipId);
  if (clipIndex === -1) {
    throw new Error('Clip not found');
  }
  
  const clip = clips[clipIndex];
  
  if (!gleanConfig.enabled || !gleanConfig.apiToken || !gleanConfig.domain || !gleanConfig.collectionId) {
    throw new Error('Glean not configured properly');
  }
  
  try {
    await syncToGleanCollectionsWithRetry(clip, gleanConfig);
    
    // Update clip status
    clips[clipIndex].synced = true;
    clips[clipIndex].syncError = null;
    
    await chrome.storage.local.set({ clips });
    console.log('✅ Retry sync successful for clip:', clipId);
    
  } catch (error) {
    console.error('❌ Retry sync failed for clip:', clipId, error);
    clips[clipIndex].syncError = error.message;
    await chrome.storage.local.set({ clips });
    throw error;
  }
}

// Helper functions
function extractTags(text) {
  const tags = [];
  if (text.match(/\b(?:API|REST|GraphQL|SDK)\b/i)) tags.push('api');
  if (text.match(/\b(?:React|Vue|Angular|JavaScript|TypeScript)\b/i)) tags.push('frontend');
  if (text.match(/\b(?:Node|Python|Java|Go|Rust)\b/i)) tags.push('backend');
  if (text.match(/\b(?:database|SQL|MongoDB|PostgreSQL)\b/i)) tags.push('database');
  if (text.match(/\b(?:deploy|docker|kubernetes|aws|cloud)\b/i)) tags.push('devops');
  if (text.match(/\b(?:design|UI|UX|figma|sketch)\b/i)) tags.push('design');
  if (text.match(/\b(?:bug|error|fix|debug)\b/i)) tags.push('debugging');
  if (text.match(/\b(?:meeting|standup|review|planning)\b/i)) tags.push('meetings');
  return tags;
}

function categorizeContent(url, text) {
  if (url.includes('github.com')) return 'code';
  if (url.includes('stackoverflow.com')) return 'qa';
  if (url.includes('docs.') || url.includes('documentation')) return 'documentation';
  if (url.includes('medium.com') || url.includes('blog')) return 'article';
  if (url.includes('slack.com') || url.includes('discord.com')) return 'chat';
  if (url.includes('figma.com') || url.includes('sketch.com')) return 'design';
  if (url.includes('jira') || url.includes('trello')) return 'project';
  
  if (text.match(/\b(?:function|class|const|let|var|return)\b/)) return 'code';
  if (text.match(/\b(?:meeting|agenda|action items|next steps)\b/i)) return 'meeting';
  if (text.match(/\b(?:roadmap|timeline|milestone|deadline)\b/i)) return 'planning';
  
  return 'general';
}

function updateBadgeCount(count) {
  const badgeText = count > 99 ? '99+' : count.toString();
  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({ color: '#4F46E5' });
}

// Initialize badge on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('Extension starting up...');
  startKeepAlive();
  const result = await chrome.storage.local.get(['clips']);
  const clips = result.clips || [];
  updateBadgeCount(clips.length);
});

// Initialize when service worker is activated
self.addEventListener('activate', (event) => {
  console.log('Service worker activated');
  startKeepAlive();
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('Service worker installing');
  self.skipWaiting();
});

// Expose for console testing
self.testGleanSync = testGleanSync;
self.testGleanConnection = testGleanConnection;

// Keep service worker responsive
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data);
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated');
  
  // Create context menus
  chrome.contextMenus.create({
    id: 'clip-selection',
    title: 'Clip to Glean Collection',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'clip-page',
    title: 'Clip entire page',
    contexts: ['page']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'clip-selection') {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: clipSelection
    });
  } else if (info.menuItemId === 'clip-page') {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: clipEntirePage
    });
  }
});

// Functions to inject into page context
function clipSelection() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const selectedText = selection.toString().trim();
    if (selectedText) {
      chrome.runtime.sendMessage({
        action: 'saveClip',
        data: {
          url: window.location.href,
          title: document.title,
          selectedText: selectedText,
          context: selection.getRangeAt(0).commonAncestorContainer.textContent?.substring(0, 300),
          timestamp: new Date().toISOString(),
          domain: window.location.hostname
        }
      });
    }
  }
}

function clipEntirePage() {
  const mainContent = document.querySelector('main, article, .content, #content') || document.body;
  chrome.runtime.sendMessage({
    action: 'saveClip',
    data: {
      url: window.location.href,
      title: document.title,
      selectedText: mainContent.textContent?.trim().substring(0, 2000) || '',
      context: 'Full page clip',
      timestamp: new Date().toISOString(),
      domain: window.location.hostname
    }
  });
}