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

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  console.log('Command received:', command);
  
  if (command === 'clip-selection' || command === 'clip-page') {
    // Get the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;
      
      const tab = tabs[0];
      
      if (command === 'clip-selection') {
        // Clip selection (or page if no selection)
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: clipSelectionOrPage,
        }).catch(err => console.error('Failed to execute clip-selection:', err));
      } else if (command === 'clip-page') {
        // Clip entire page
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: clipEntirePageFromShortcut,
        }).catch(err => console.error('Failed to execute clip-page:', err));
      }
    });
  }
});

// Function to clip selection or page (injected into page context)
// Must be defined as a separate function that can be serialized
function clipSelectionOrPage() {
  const selection = window.getSelection();
  const hasSelection = selection.rangeCount > 0 && selection.toString().trim();
  
  // Helper functions (defined inline since they can't be imported)
  function getFaviconForClip() {
    const faviconLink = document.querySelector('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
    if (faviconLink && faviconLink.href) {
      if (faviconLink.href.startsWith('/')) {
        return window.location.origin + faviconLink.href;
      }
      if (!faviconLink.href.startsWith('http')) {
        return window.location.origin + '/' + faviconLink.href;
      }
      return faviconLink.href;
    }
    return `https://www.google.com/s2/favicons?domain=${window.location.hostname}&sz=16`;
  }

  function cleanClipTextForClip(text) {
    if (!text) return '';
    const lines = text.split('\n').filter(line => {
      const trimmed = line.trim();
      if (trimmed.match(/^https?:\/\//)) return false;
      if (trimmed.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)) return false;
      if (trimmed.match(/^(Images?|Clipped?|Source?|Domain?):/i)) return false;
      if (trimmed.length > 200) return false;
      return true;
    });
    const meaningfulLines = lines.filter(l => l.trim().length > 10).slice(0, 5);
    if (meaningfulLines.length === 0) {
      return text.substring(0, 200).trim();
    }
    return meaningfulLines.join('\n').substring(0, 500).trim();
  }

  function showClipFeedback(message, type = 'success') {
    // Remove any existing feedback
    const existing = document.getElementById('glean-clip-feedback');
    if (existing) existing.remove();

    const feedback = document.createElement('div');
    feedback.id = 'glean-clip-feedback';
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      background: ${type === 'error' ? '#EF4444' : '#10B981'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      animation: gleanSlideIn 0.3s ease;
      pointer-events: none;
    `;

    feedback.textContent = message;
    document.body.appendChild(feedback);

    // Add animation styles if not already present
    if (!document.getElementById('glean-clip-feedback-styles')) {
      const style = document.createElement('style');
      style.id = 'glean-clip-feedback-styles';
      style.textContent = `
        @keyframes gleanSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes gleanSlideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => {
      feedback.style.animation = 'gleanSlideOut 0.3s ease forwards';
      setTimeout(() => feedback.remove(), 300);
    }, 2000);
  }
  
  if (hasSelection) {
    // Clip selected text
    const selectedText = selection.toString().trim();
    const favicon = getFaviconForClip();
    const cleanedText = cleanClipTextForClip(selectedText);
    
    chrome.runtime.sendMessage({
      action: 'saveClip',
      data: {
        url: window.location.href,
        title: document.title,
        selectedText: cleanedText,
        context: selection.getRangeAt(0).commonAncestorContainer.textContent?.substring(0, 300),
        timestamp: new Date().toISOString(),
        domain: window.location.hostname,
        favicon: favicon,
      },
    }, (response) => {
      if (chrome.runtime.lastError) {
        showClipFeedback('Failed to clip: ' + chrome.runtime.lastError.message, 'error');
        return;
      }
      if (response && response.success) {
        showClipFeedback('✓ Clipped to Glean!');
      } else if (response && response.error) {
        showClipFeedback('Failed: ' + response.error, 'error');
      } else {
        showClipFeedback('✓ Clipped to Glean!');
      }
    });
  } else {
    // No selection, clip entire page
    const mainContent = document.querySelector('main, article, .content, #content') || document.body;
    const favicon = getFaviconForClip();
    const heading = document.querySelector('h1, h2, .headline, .title, article h1')?.textContent?.trim() || document.title;
    const firstParagraph = document.querySelector('article p, .content p, main p')?.textContent?.trim() || '';
    
    let cleanedText = '';
    if (heading && firstParagraph) {
      cleanedText = `${heading}\n\n${cleanClipTextForClip(firstParagraph)}`;
    } else {
      cleanedText = cleanClipTextForClip(mainContent.textContent?.trim() || '');
    }
    
    chrome.runtime.sendMessage({
      action: 'saveClip',
      data: {
        url: window.location.href,
        title: document.title,
        selectedText: cleanedText.substring(0, 1000),
        context: 'Full page clip',
        timestamp: new Date().toISOString(),
        domain: window.location.hostname,
        favicon: favicon,
      },
    }, (response) => {
      if (chrome.runtime.lastError) {
        showClipFeedback('Failed to clip: ' + chrome.runtime.lastError.message, 'error');
        return;
      }
      if (response && response.success) {
        showClipFeedback('✓ Clipped to Glean!');
      } else if (response && response.error) {
        showClipFeedback('Failed: ' + response.error, 'error');
      } else {
        showClipFeedback('✓ Clipped to Glean!');
      }
    });
  }
}

// Function to clip entire page (injected into page context)
function clipEntirePageFromShortcut() {
  // Helper functions (defined inline)
  function getFaviconForClip() {
    const faviconLink = document.querySelector('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
    if (faviconLink && faviconLink.href) {
      if (faviconLink.href.startsWith('/')) {
        return window.location.origin + faviconLink.href;
      }
      if (!faviconLink.href.startsWith('http')) {
        return window.location.origin + '/' + faviconLink.href;
      }
      return faviconLink.href;
    }
    return `https://www.google.com/s2/favicons?domain=${window.location.hostname}&sz=16`;
  }

  function cleanClipTextForClip(text) {
    if (!text) return '';
    const lines = text.split('\n').filter(line => {
      const trimmed = line.trim();
      if (trimmed.match(/^https?:\/\//)) return false;
      if (trimmed.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)) return false;
      if (trimmed.match(/^(Images?|Clipped?|Source?|Domain?):/i)) return false;
      if (trimmed.length > 200) return false;
      return true;
    });
    const meaningfulLines = lines.filter(l => l.trim().length > 10).slice(0, 5);
    if (meaningfulLines.length === 0) {
      return text.substring(0, 200).trim();
    }
    return meaningfulLines.join('\n').substring(0, 500).trim();
  }

  function showClipFeedback(message, type = 'success') {
    // Remove any existing feedback
    const existing = document.getElementById('glean-clip-feedback');
    if (existing) existing.remove();

    const feedback = document.createElement('div');
    feedback.id = 'glean-clip-feedback';
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      background: ${type === 'error' ? '#EF4444' : '#10B981'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      animation: gleanSlideIn 0.3s ease;
      pointer-events: none;
    `;

    feedback.textContent = message;
    document.body.appendChild(feedback);

    // Add animation styles if not already present
    if (!document.getElementById('glean-clip-feedback-styles')) {
      const style = document.createElement('style');
      style.id = 'glean-clip-feedback-styles';
      style.textContent = `
        @keyframes gleanSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes gleanSlideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => {
      feedback.style.animation = 'gleanSlideOut 0.3s ease forwards';
      setTimeout(() => feedback.remove(), 300);
    }, 2000);
  }
  
  const mainContent = document.querySelector('main, article, .content, #content') || document.body;
  const favicon = getFaviconForClip();
  const heading = document.querySelector('h1, h2, .headline, .title, article h1')?.textContent?.trim() || document.title;
  const firstParagraph = document.querySelector('article p, .content p, main p')?.textContent?.trim() || '';
  
  let cleanedText = '';
  if (heading && firstParagraph) {
    cleanedText = `${heading}\n\n${cleanClipTextForClip(firstParagraph)}`;
  } else {
    cleanedText = cleanClipTextForClip(mainContent.textContent?.trim() || '');
  }
  
  chrome.runtime.sendMessage({
    action: 'saveClip',
    data: {
      url: window.location.href,
      title: document.title,
      selectedText: cleanedText.substring(0, 1000),
      context: 'Full page clip',
      timestamp: new Date().toISOString(),
      domain: window.location.hostname,
      favicon: favicon,
    },
  }, (response) => {
    if (chrome.runtime.lastError) {
      showClipFeedback('Failed to clip: ' + chrome.runtime.lastError.message, 'error');
      return;
    }
    if (response && response.success) {
      showClipFeedback('✓ Clipped to Glean!');
    } else if (response && response.error) {
      showClipFeedback('Failed: ' + response.error, 'error');
    } else {
      showClipFeedback('✓ Clipped to Glean!');
    }
  });
}

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