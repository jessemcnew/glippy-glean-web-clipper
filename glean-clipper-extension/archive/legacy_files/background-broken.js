// Background service worker for Glean Web Clipper

// Collections API instance
let collectionsAPI = null;

// Keep service worker alive
let keepAliveInterval;

function startKeepAlive() {
  if (keepAliveInterval) clearInterval(keepAliveInterval);
  keepAliveInterval = setInterval(() => {
    // Perform a simple operation to keep service worker alive
    console.log('Service worker keepalive ping');
  }, 25000); // Ping every 25 seconds (Chrome terminates after 30s of inactivity)
}

// Start keepalive when service worker starts
startKeepAlive();

// Initialize Collections API
async function initializeCollectionsAPI() {
  try {
    const result = await chrome.storage.local.get(['gleanConfig']);
    const config = result.gleanConfig;
    
      if (config && config.enabled && config.domain && config.clientToken) {
        collectionsAPI = {
          config: config,
          baseUrl: formatDomain(config.domain),
          
          async addClipToCollection(collectionId, clip) {
            const url = `${this.baseUrl.replace('-be.glean.com', '.glean.com')}/rest/api/v1/addcollectionitems`;
            
            const payload = {
              collectionId: collectionId,
              items: [{
                url: clip.url,
                description: `${clip.title}\n\n${clip.selectedText}`
              }]
            };
            
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${this.config.clientToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Collections API error (${response.status}): ${errorText}`);
          }
          
          return await response.json();
        }
      };
      
      console.log('Collections API initialized');
    }
  } catch (error) {
    console.error('Failed to initialize Collections API:', error);
  }
}

// Helper function to format domain (copied from our domain formatting logic)
function formatDomain(domain) {
  if (!domain) return '';
  
  let cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  if (cleanDomain.includes('-be.glean.com')) {
    return `https://${cleanDomain}`;
  }
  
  if (!cleanDomain.includes('.')) {
    return `https://${cleanDomain}-be.glean.com`;
  }
  
  if (cleanDomain.endsWith('.glean.com') && !cleanDomain.includes('-be')) {
    const company = cleanDomain.replace('.glean.com', '');
    return `https://${company}-be.glean.com`;
  }
  
  return `https://${cleanDomain}`;
}

// Initialize Collections on startup
initializeCollectionsAPI();

// Add clip to collection
async function addClipToCollection(collectionId, clip) {
  if (!collectionsAPI) {
    throw new Error('Collections API not initialized. Please check your Glean configuration.');
  }
  
  try {
    console.log('Adding clip to collection:', { collectionId, clipId: clip.id });
    const result = await collectionsAPI.addClipToCollection(collectionId, clip);
    console.log('Successfully added clip to collection:', result);
    return result;
  } catch (error) {
    console.error('Failed to add clip to collection:', error);
    throw error;
  }
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveClip') {
    saveClip(request.data).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      console.error('Failed to save clip:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Will respond asynchronously
  } else if (request.action === 'testSync') {
    testGleanSync().then((result) => {
      sendResponse({ success: true, result });
    }).catch(error => {
      console.error('Test sync failed:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Will respond asynchronously
  } else if (request.action === 'testConnection') {
    testGleanConnection().then((result) => {
      sendResponse({ success: true, result });
    }).catch(error => {
      console.error('Connection test failed:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Will respond asynchronously
  } else if (request.action === 'ping') {
    // Simple ping to wake up service worker
    sendResponse({ success: true, message: 'Service worker is active' });
    return true; // Will respond immediately
  } else if (request.action === 'addToCollection') {
    // Add clip to collection
    addClipToCollection(request.collectionId, request.clip).then((result) => {
      sendResponse({ success: true, result });
    }).catch(error => {
      console.error('Failed to add clip to collection:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Will respond asynchronously
  } else if (request.action === 'refreshCollections') {
    // Refresh Collections API when settings change
    initializeCollectionsAPI().then(() => {
      sendResponse({ success: true, message: 'Collections API refreshed' });
    }).catch(error => {
      console.error('Failed to refresh Collections API:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Will respond asynchronously
  }
});

// Save clip to storage and optionally sync to Glean
async function saveClip(clipData) {
  try {
    // Get existing clips and Glean config
    const result = await chrome.storage.local.get(['clips', 'gleanConfig']);
    const clips = result.clips || [];
    const gleanConfig = result.gleanConfig || { enabled: false };
    
    // Add new clip with ID
    const newClip = {
      id: Date.now().toString(),
      ...clipData,
      tags: extractTags(clipData.selectedText),
      category: categorizeContent(clipData.url, clipData.selectedText),
      synced: false
    };
    
    // Try to sync to Glean if configured
    if (gleanConfig.enabled && (gleanConfig.clientToken || gleanConfig.apiToken) && gleanConfig.domain) {
      try {
      console.log('Attempting to sync to Glean:', {
        domain: gleanConfig.domain,
        hasToken: !!(gleanConfig.clientToken || gleanConfig.apiToken),
        hasCollectionId: !!gleanConfig.collectionId,
        enabled: gleanConfig.enabled
      });
        await syncToGlean(newClip, gleanConfig);
        newClip.synced = true;
        console.log('SUCCESS: Clip synced to Glean successfully');
      } catch (error) {
        console.error('ERROR: Failed to sync to Glean, saving locally only:');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Domain:', gleanConfig.domain);
        console.error('Full error object:', error);
        newClip.syncError = error.message;
      }
    }
    
    clips.unshift(newClip); // Add to beginning
    
    // Keep only last 1000 clips
    if (clips.length > 1000) {
      clips.splice(1000);
    }
    
    // Save to storage
    await chrome.storage.local.set({ clips });
    
    // Update badge count
    updateBadgeCount(clips.length);
    
    console.log('Clip saved:', newClip);
    
  } catch (error) {
    console.error('Error saving clip:', error);
    throw error;
  }
}

// Sync clip to Glean Collections API
async function syncToGlean(clip, config) {
  // Clean domain - remove protocol and trailing slash
  let domain = config.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  console.log('ORIGINAL DOMAIN:', domain);
  
  // Keep using backend domain for Collections API  
  if (domain.includes('app.')) {
    domain = 'linkedin-be.glean.com';
    console.log('Converted app.glean.com to linkedin-be.glean.com for API');
  } else if (!domain.includes('.')) {
    domain = 'linkedin-be.glean.com';
  } else if (domain.includes('linkedin-be.glean.com')) {
    // Already correct
    console.log('Using linkedin-be.glean.com for Collections API');
  }
  
  console.log('FINAL DOMAIN:', domain);
  
  return await attemptCollectionsSync(clip, config, domain);
}

// Attempt sync with Collections API
async function attemptCollectionsSync(clip, config, domain) {
  
  console.log('USING COLLECTIONS DOMAIN:', domain);
  
  // Use Collections API endpoint (addcollectionitems)
  const collectionsUrl = `https://${domain}/rest/api/v1/addcollectionitems`;
  
  // Prepare payload for Collections API (addcollectionitems format)
  const payload = {
    collectionId: config.collectionId,
    items: [{
      url: clip.url,
      description: `${clip.title}\n\n${clip.selectedText.substring(0, 300)}${clip.selectedText.length > 300 ? '...' : ''}\n\nClipped: ${new Date(clip.timestamp).toLocaleString()}\nTags: ${clip.tags.join(', ')}\nCategory: ${clip.category}`
    }]
  };
  
  // Set up headers for Collections API
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  // Add API key authentication (Collections API uses Client API token, not Indexing API)
  const token = config.clientToken || config.apiToken;
  if (token) {
    const cleanToken = token.trim();
    
    console.log('Client API Token Info:', {
      hasToken: !!cleanToken,
      tokenPrefix: cleanToken.substring(0, 8),
      tokenLength: cleanToken.length
    });
    
    headers['Authorization'] = `Bearer ${cleanToken}`;
    console.log('Using Client API Bearer auth for Collections');
  } else {
    console.error('No Client API token provided for Collections!');
    throw new Error('Collections API requires a Client API token, not Indexing API token');
  }
  
  console.log('🚀 SENDING: Collections API Request');
  console.log('URL:', collectionsUrl);
  console.log('Method: POST');
  console.log('Headers:', {
    ...headers,
    'Authorization': token ? `Bearer ${token.substring(0, 10)}...` : 'No token'
  });
  console.log('Payload size:', JSON.stringify(payload).length);
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
    console.error('FETCH ERROR:', {
      message: fetchError.message,
      name: fetchError.name,
      stack: fetchError.stack,
      url: collectionsUrl
    });
    
    // Provide specific error messages for Collections API issues
    let errorMessage = `Network error connecting to Glean Collections API: ${fetchError.message}.`;
    
    if (fetchError.message.includes('Failed to fetch')) {
      errorMessage += ' This might be due to CORS policy, network connectivity, or invalid domain.';
    }
    if (fetchError.message.includes('WorkerGlobalScope')) {
      errorMessage += ' Extension context issue - try reloading the extension.';
    }
    if (fetchError.message.includes('ISO-8859-1')) {
      errorMessage += ' Client API token contains invalid characters - please check your token.';
    }
    
    errorMessage += ` Check if domain '${domain}' and collection ID are correct.`;
    
    throw new Error(errorMessage);
  }
  
  console.log('RESPONSE: Glean API Response:', {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    contentType: response.headers.get('content-type')
  });
  
  // Get response text first to handle both JSON and HTML errors
  const responseText = await response.text();
  console.log('RESPONSE BODY (first 500 chars):', responseText.substring(0, 500));
  
  if (!response.ok) {
    console.error('ERROR: Glean API Error Response:', responseText);
    
    // If it's HTML, the endpoint or auth is wrong
    if (responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
      throw new Error(`Authentication or endpoint error (${response.status}). Check your API key and domain. Response was HTML instead of JSON.`);
    }
    
    throw new Error(`Glean API error (${response.status}): ${responseText}`);
  }
  
  // Try to parse as JSON
  let result;
  try {
    result = JSON.parse(responseText);
    console.log('SUCCESS: Glean API Success:', result);
    return result;
  } catch (jsonError) {
    console.error('ERROR: Response was not valid JSON:', responseText);
    throw new Error(`Invalid JSON response: ${jsonError.message}`);
  }
}

// Extract tags from content
function extractTags(text) {
  const tags = [];
  
  // Common patterns
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

// Categorize content based on URL and content
function categorizeContent(url, text) {
  // By domain
  if (url.includes('github.com')) return 'code';
  if (url.includes('stackoverflow.com')) return 'qa';
  if (url.includes('docs.') || url.includes('documentation')) return 'documentation';
  if (url.includes('medium.com') || url.includes('blog')) return 'article';
  if (url.includes('slack.com') || url.includes('discord.com')) return 'chat';
  if (url.includes('figma.com') || url.includes('sketch.com')) return 'design';
  if (url.includes('jira') || url.includes('trello')) return 'project';
  
  // By content
  if (text.match(/\b(?:function|class|const|let|var|return)\b/)) return 'code';
  if (text.match(/\b(?:meeting|agenda|action items|next steps)\b/i)) return 'meeting';
  if (text.match(/\b(?:roadmap|timeline|milestone|deadline)\b/i)) return 'planning';
  
  return 'general';
}

// Update badge count
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

// TEST FUNCTION: Manual sync test (can be called from popup)
async function testGleanSync() {
  console.log('🧪 MANUAL SYNC TEST STARTING...');
  
  const result = await chrome.storage.local.get(['gleanConfig']);
  const config = result.gleanConfig;
  
  console.log('🔧 Config loaded:', {
    enabled: config?.enabled,
    hasDomain: !!config?.domain,
    hasToken: !!config?.indexingToken,
    domain: config?.domain,
    datasource: config?.datasource || 'WEBCLIPPER'
  });
  
  if (!config?.enabled) {
    console.log('❌ Sync not enabled');
    return;
  }
  
  const testClip = {
    id: 'test-' + Date.now(),
    title: 'Manual Test Clip',
    selectedText: 'This is a test clip to verify Glean API sync is working. The extension is now correctly configured!',
    url: 'https://test.example.com',
    domain: 'test.example.com',
    timestamp: new Date().toISOString(),
    tags: ['test'],
    category: 'general'
  };
  
  try {
    console.log('🚀 Testing sync with test clip...');
    const result = await syncToGlean(testClip, config);
    console.log('✅ MANUAL SYNC TEST SUCCESS:', result);
    return result;
  } catch (error) {
    console.error('❌ MANUAL SYNC TEST FAILED:', error);
    throw error;
  }
}

// Simple API connectivity test
async function testGleanConnection() {
  console.log('🔍 TESTING: Simple Glean API connection...');
  
  const result = await chrome.storage.local.get(['gleanConfig']);
  const config = result.gleanConfig;
  
  if (!config?.enabled || !(config?.indexingToken || config?.apiToken || config?.clientToken) || !config?.domain) {
    throw new Error('Glean not configured. Please check settings.');
  }
  
  let domain = config.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (domain.includes('app.')) {
    domain = 'linkedin-be.glean.com';
  }
  
  const testUrl = `https://${domain}/rest/api/v1/addcollectionitems`;
  
  console.log('🌐 Testing URL:', testUrl);
  
  const token = config.clientToken || config.apiToken || config.indexingToken;
  
  try {
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.trim()}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        collectionId: config.collectionId || '14191',
        items: [{
          url: 'https://test.example.com',
          description: 'Test connection check'
        }]
      }),
      mode: 'cors',
      credentials: 'omit'
    });
    
    console.log('📊 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.text();
      console.log('✅ SUCCESS: API is accessible!');
      console.log('Response:', data.substring(0, 200) + '...');
      return { success: true, data };
    } else {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    throw error;
  }
}

// Also expose for console testing
self.testGleanSync = testGleanSync;
self.testGleanConnection = testGleanConnection;

// ACTIVATION: Keep service worker responsive
self.addEventListener('message', (event) => {
  console.log('🔥 Service worker received message:', event.data);
  // This helps keep the service worker active
});

// Ensure service worker wakes up for extension events
chrome.runtime.onStartup.addListener(() => {
  console.log('🚀 Service worker starting up');
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('📦 Extension installed/updated');
});

// Keep alive mechanism
setInterval(() => {
  chrome.storage.local.get(['keepAlive'], (result) => {
    // This periodic check keeps the service worker alive
  });
}, 25000); // Every 25 seconds

// Create context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'clip-selection',
    title: 'Clip to Glean',
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
  const mainContent = document.querySelector('main, article, .content, #content') 
                     || document.body;
  
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