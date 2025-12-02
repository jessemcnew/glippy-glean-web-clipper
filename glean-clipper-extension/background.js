// Glean Web Clipper - Background Service Worker
// Modular architecture with clean separation of concerns

// Import modules
import { initializeServiceWorker } from './modules/serviceWorker.js';
import { initializeUI } from './modules/uiHelpers.js';
import { saveClip, retryClipSync, getGleanConfig } from './modules/storage.js';
import {
  syncToGleanCollectionsWithRetry,
  syncToGleanIndexingAPI,
  testGleanSync,
  testGleanIndexing,
  fetchGleanCollections,
  testGleanConnection,
} from './modules/gleanApi.js';

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

    case 'refreshCollections':
      // Collections API doesn't support listing, so return empty result
      sendResponse({ success: true, collections: [], collectionsCount: 0 });
      return false;

    case 'addToCollection':
      handleAddToCollection(request.collectionId, request.clip)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
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

console.log('Glean Web Clipper background service worker initialized');