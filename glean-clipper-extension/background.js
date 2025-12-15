// Glean Web Clipper - Background Service Worker
// Modular architecture with clean separation of concerns

// Import modules
import { initializeServiceWorker } from './modules/serviceWorker.js';
import { initializeUI } from './modules/uiHelpers.js';
import { saveClip, retryClipSync, getGleanConfig, getClips, deleteClip as deleteClipFromStorage } from './modules/storage.js';
import {
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
} from './modules/gleanApi.js';
import { testCookieAuth } from './modules/apiFetch.js';
import {
  initiateSlackOAuth,
  exchangeSlackToken,
  getSlackChannels,
  postToSlack,
  checkSlackConnection,
} from './modules/slackApi.js';

// Initialize all modules
console.log('Initializing Glean Web Clipper background service worker...');

// Initialize service worker lifecycle management
initializeServiceWorker();

// Initialize UI components (context menus, etc.)
initializeUI();

// PING listener for keepalive (must be top-level, synchronous)
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'PING') {
    sendResponse({ ok: true, ts: Date.now() });
    return false; // synchronous response
  }
  // Return false for messages we don't handle to prevent "receiving end does not exist" errors
  return false;
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  // Handle case where request is null/undefined or malformed
  if (!request || typeof request !== 'object') {
    console.debug('Received null/undefined/invalid message, ignoring');
    return false;
  }

  // Handle case where action is undefined (some code might send empty object)
  if (request.action === undefined && request.type === undefined) {
    console.debug('Received message without action or type, ignoring');
    return false;
  }

  console.log('Received message:', request.action || request.type || 'unknown');

  switch (request.action) {
    case 'saveClip':
      handleSaveClip(request.data)
        .then(() => sendResponse({ success: true }))
        .catch(error => {
          console.error('Failed to save clip:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep message channel open for async response

    case 'testSync':
      testGleanSync()
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'testIndexing':
      testGleanIndexing()
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'testConnection':
      testGleanConnection()
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'testCookieAuth':
      testCookieAuth(request.domain || 'linkedin-be.glean.com')
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'fetchCollections':
      fetchGleanCollections()
        .then(result => {
          // Ensure consistent response format
          if (result.success !== undefined) {
            sendResponse(result);
          } else {
            // Legacy format - wrap it
            sendResponse({
              success: true,
              collections: result.collections || result || [],
              collectionsCount: (result.collections || result || []).length,
            });
          }
        })
        .catch(error => sendResponse({ success: false, collections: [], error: error.message }));
      return true;

    case 'retrySync':
      retryClipSync(request.clipId, syncToGleanCollectionsWithRetry)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'getConfig':
      getGleanConfig()
        .then(config => sendResponse({ success: true, config }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'getClips':
      getClips()
        .then(clips => sendResponse({ success: true, clips }))
        .catch(error => sendResponse({ success: false, error: error.message, clips: [] }));
      return true;

    case 'deleteClip':
      deleteClipFromStorage(request.clipId)
        .then(success => sendResponse({ success }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'getOAuthToken':
    case 'getAuthConfig':
      // Share auth config with dashboard/web pages
      // Works with both OAuth and manual API tokens
      (async () => {
        try {
          const config = await getGleanConfig();

          // If we have a configured token (any auth method), return it
          if (config?.apiToken && config?.domain) {
            sendResponse({
              success: true,
              token: config.apiToken,
              domain: config.domain,
              authMethod: config.authMethod || 'manual',
            });
            return;
          }

          // No token configured - check if OAuth is possible
          if (config?.authMethod === 'oauth' || !config?.apiToken) {
            try {
              const { getOrRefreshOAuthToken } = await import('./modules/oauth.js');
              const token = await getOrRefreshOAuthToken(config || { domain: 'app.glean.com' });
              sendResponse({
                success: true,
                token,
                domain: config?.domain || 'app.glean.com',
                authMethod: 'oauth',
              });
            } catch (oauthError) {
              // OAuth failed or not available
              sendResponse({
                success: false,
                error: 'Not authenticated. Please configure your API token in the extension popup.',
                requiresSetup: true,
              });
            }
          } else {
            sendResponse({
              success: false,
              error: 'Not authenticated. Please configure your API token in the extension popup.',
              requiresSetup: true,
            });
          }
        } catch (error) {
          sendResponse({
            success: false,
            error: error.message,
            requiresSetup: error.message.includes('not configured'),
          });
        }
      })();
      return true; // Keep channel open for async

    case 'refreshCollections':
      // Collections API doesn't support listing, so return empty result
      sendResponse({ success: true, collections: [], collectionsCount: 0 });
      return false;

    case 'addToCollection':
      handleAddToCollection(request.collectionId, request.clip)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'openNotebook':
      // Open reader.html in a new tab (notebook/reader view)
      try {
        const readerUrl = chrome.runtime.getURL('reader.html');
        chrome.tabs.create({ url: readerUrl });
        sendResponse({ success: true });
      } catch (error) {
        console.error('Failed to open notebook:', error);
        sendResponse({ success: false, error: error.message });
      }
      return false; // Synchronous response

    case 'fetchCollectionItems':
      getGleanConfig()
        .then(config => fetchCollectionItems(request.collectionId, config))
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, items: [], error: error.message }));
      return true;

    case 'fetchClipsFromGlean':
      fetchClipsFromGlean(request.options || {})
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, clips: [], error: error.message }));
      return true;

    case 'searchGleanAgents':
      getGleanConfig()
        .then(config => searchGleanAgents(request.query || '', config))
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, agents: [], error: error.message }));
      return true;

    case 'runGleanAgent':
      getGleanConfig()
        .then(config => runGleanAgent(request.agentId, request.input || {}, config))
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, articles: [], error: error.message }));
      return true;

    case 'findSimilarArticles':
      getGleanConfig()
        .then(config => findSimilarArticles(request.article || {}, config))
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, articles: [], error: error.message }));
      return true;

    case 'initiateSlackOAuth':
      initiateSlackOAuth()
        .then(url => {
          // Open OAuth URL in new tab
          chrome.tabs.create({ url });
          sendResponse({ success: true, url });
        })
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'getSlackChannels':
      getSlackChannels()
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, channels: [], error: error.message }));
      return true;

    case 'postToSlack':
      postToSlack(request.channelId, request.text, request.clip || {})
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'checkSlackConnection':
      checkSlackConnection()
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, connected: false, error: error.message }));
      return true;

    case 'searchGlean':
      // Open Glean search with the query text
      handleSearchGlean(request.query)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'executeCommand':
      // Handle commands from command palette
      handleCommandPaletteAction(request.commandId)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'getPreferences':
      // Get preferences from chrome.storage.local
      chrome.storage.local.get(['preferences'], (result) => {
        sendResponse({
          success: true,
          preferences: result.preferences || {},
        });
      });
      return true;

    case 'savePreferences':
      // Save preferences to chrome.storage.local
      if (request.preferences) {
        chrome.storage.local.set({ preferences: request.preferences }, () => {
          sendResponse({ success: true });
        });
      } else {
        sendResponse({ success: false, error: 'No preferences provided' });
      }
      return true;

    default:
      // Ignore messages without action (like PING which uses 'type')
      if (request.action === undefined && request.type !== undefined) {
        return false; // PING is handled separately
      }
      // Silently ignore unknown actions to prevent "receiving end does not exist" errors
      // This can happen when pages try to message the extension
      console.debug('Unknown action ignored:', request.action);
      // Don't send response for unknown actions to prevent errors
      return false;
  }
});

/**
 * Handles saving a clip with proper error handling and logging
 * @param {Object} clipData - The clip data to save
 * @returns {Promise<void>}
 */
async function handleSaveClip(clipData) {
  try {
    console.log('💾 Saving clip:', {
      url: clipData.url,
      title: clipData.title?.substring(0, 50) + '...',
      textLength: clipData.selectedText?.length || 0,
    });

    await saveClip(clipData, syncToGleanCollectionsWithRetry, syncToGleanIndexingAPI);

    console.log('✅ Clip saved successfully');
  } catch (error) {
    console.error('Error saving clip:', error);
    throw error;
  }
}

/**
 * Handles adding a clip to a specific Glean Collection.
 * This is triggered from the popup when a user selects a collection.
 * @param {string} collectionId - The ID of the collection to add to.
 * @param {Object} clip - The clip data to add.
 * @returns {Promise<void>}
 */
async function handleAddToCollection(collectionId, clip) {
  try {
    console.log(`Adding clip to collection ${collectionId}:`, clip.title);
    const config = await getGleanConfig();

    // Temporarily override the default collection ID with the specified one
    const tempConfig = { ...config, collectionId };

    await syncToGleanCollectionsWithRetry(clip, tempConfig);
    console.log(`Successfully added clip to collection ${collectionId}`);
  } catch (error) {
    console.error(`Error adding clip to collection ${collectionId}:`, error);
    throw error; // Re-throw to be caught by the message listener
  }
}

/**
 * Handles command palette actions
 * Opens appropriate pages based on the command ID
 * @param {string} commandId - The command to execute
 * @returns {Promise<Object>} - Result object
 */
async function handleCommandPaletteAction(commandId) {
  console.log('Executing command palette action:', commandId);

  // Dashboard URLs (bundled into extension)
  const DASHBOARD_BASE = chrome.runtime.getURL('dashboard');
  const dashboardUrl = `${DASHBOARD_BASE}/index.html`;
  const libraryUrl = `${DASHBOARD_BASE}/library/index.html`;
  const promptsUrl = `${DASHBOARD_BASE}/prompts/index.html`;

  switch (commandId) {
    case 'recent-clips':
      await chrome.tabs.create({ url: dashboardUrl });
      return { success: true };

    case 'library':
      await chrome.tabs.create({ url: libraryUrl });
      return { success: true };

    case 'prompts':
      await chrome.tabs.create({ url: promptsUrl });
      return { success: true };

    case 'preferences':
    case 'configuration':
      // These should open the popup - but we can't programmatically open popup
      // Instead, show a notification or open a settings page
      console.log('Settings commands should be handled in popup');
      return { success: true, message: 'Click extension icon to access settings' };

    case 'capture-area':
    case 'capture-visible':
    case 'capture-full-page':
      // Screenshot capture - not yet implemented
      return { success: false, message: 'Capture actions coming soon' };

    default:
      console.debug('Unknown command:', commandId);
      return { success: false, error: 'Unknown command' };
  }
}

/**
 * Handles opening Glean search with a query
 * @param {string} query - The search query text
 * @returns {Promise<Object>} - Result object
 */
async function handleSearchGlean(query) {
  try {
    const config = await getGleanConfig();

    if (!config?.domain) {
      return { success: false, error: 'Glean domain not configured' };
    }

    // Build Glean search URL
    const searchQuery = encodeURIComponent(query || '');
    const searchUrl = `https://${config.domain}/search?q=${searchQuery}`;

    // Open in new tab
    await chrome.tabs.create({ url: searchUrl });

    return { success: true };
  } catch (error) {
    console.error('Error opening Glean search:', error);
    return { success: false, error: error.message };
  }
}

console.log('Glean Web Clipper background service worker initialized');