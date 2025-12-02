// Background service worker for Glean Web Clipper
// Uses Collections API for adding items to Glean collections

// Keep service worker alive
let keepAliveInterval;

function startKeepAlive() {
  if (keepAliveInterval) clearInterval(keepAliveInterval);
  keepAliveInterval = setInterval(() => {
    console.log('Service worker keepalive ping');
  }, 25000);
}

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
      synced: false
    };
    
    // Try to sync to Glean Collections if configured
    if (gleanConfig.enabled && gleanConfig.apiToken && gleanConfig.domain && gleanConfig.collectionId) {
      try {
        console.log('Attempting to sync to Glean Collections:', {
          domain: gleanConfig.domain,
          hasToken: !!gleanConfig.apiToken,
          collectionId: gleanConfig.collectionId,
          enabled: gleanConfig.enabled
        });
        await syncToGleanCollections(newClip, gleanConfig);
        newClip.synced = true;
        console.log('SUCCESS: Clip added to Glean collection successfully');
      } catch (error) {
        console.error('ERROR: Failed to sync to Glean, saving locally only:');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        newClip.syncError = error.message;
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
  const payload = {
    collectionId: parseInt(config.collectionId), // Ensure collection ID is a number
    addedCollectionItemDescriptors: [
      {
        url: clip.url,
        description: `${clip.title}\n\n${clip.selectedText}\n\nClipped: ${new Date(clip.timestamp).toLocaleString()}`
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
  
  console.log('RESPONSE:', {
    status: response.status,
    statusText: response.statusText
  });
  
  const responseText = await response.text();
  console.log('RESPONSE BODY:', responseText);
  
  if (!response.ok) {
    if (response.status === 400 && responseText.includes('Error')) {
      // The exact error message from the Collections API
      throw new Error(`Collections API error: ${responseText}`);
    }
    throw new Error(`API error (${response.status}): ${responseText}`);
  }
  
  // Collections API typically returns an empty response on success
  if (!responseText || responseText.trim() === '') {
    console.log('SUCCESS: Item added to collection (empty response is normal)');
    return { success: true };
  }
  
  try {
    const result = JSON.parse(responseText);
    console.log('SUCCESS: Collections API responded:', result);
    return result;
  } catch (e) {
    // Empty response is actually success for Collections API
    console.log('SUCCESS: Item added to collection');
    return { success: true };
  }
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
  
  // Test with a simple Collections API request
  const testUrl = `https://${domain}/rest/api/v1/collections`;
  
  console.log('Testing URL:', testUrl);
  
  try {
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiToken.trim()}`,
        'Accept': 'application/json'
      },
      mode: 'cors',
      credentials: 'omit'
    });
    
    console.log('Response status:', response.status);
    
    // 404 or 403 on collections list is okay - means API is reachable
    if (response.status === 404 || response.status === 403) {
      console.log('API is reachable (restricted endpoint is normal)');
      return { success: true, message: 'API is reachable' };
    }
    
    if (response.ok) {
      console.log('✅ Collections API is accessible!');
      return { success: true };
    }
    
    throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    console.error('Connection test failed:', error);
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