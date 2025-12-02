// UI Helpers Module
// Handles badge updates, context menus, and UI-related functionality

// Note: safeRuntimeSendMessage is not used here because injected functions run in page context
// where the import won't be available. We use chrome.runtime.sendMessage directly with error handling.

/**
 * Updates the extension badge with the current count
 * @param {number} count - The count to display on the badge
 */
function updateBadgeCount(count) {
  const badgeText = count > 99 ? '99+' : count.toString();
  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({ color: '#4F46E5' });
}

/**
 * Clears the extension badge
 */
function clearBadge() {
  chrome.action.setBadgeText({ text: '' });
}

/**
 * Creates context menu items for the extension
 */
function createContextMenus() {
  // Remove existing menus first
  chrome.contextMenus.removeAll(() => {
    // Create context menus
    chrome.contextMenus.create({
      id: 'clip-selection',
      title: 'Clip to Glean Collection',
      contexts: ['selection'],
    });

    chrome.contextMenus.create({
      id: 'clip-page',
      title: 'Clip entire page',
      contexts: ['page'],
    });
  });
}

/**
 * Handles context menu clicks
 * @param {Object} info - Context menu click info
 * @param {Object} tab - The tab where the click occurred
 */
function handleContextMenuClick(info, tab) {
  if (info.menuItemId === 'clip-selection') {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: clipSelection,
    });
  } else if (info.menuItemId === 'clip-page') {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: clipEntirePage,
    });
  }
}

/**
 * Function to inject into page context for clipping selected text
 * This function runs in the page context, not the extension context
 * Note: safeRuntimeSendMessage won't be available in page context, so we use chrome.runtime.sendMessage directly
 */
async function clipSelection() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const selectedText = selection.toString().trim();
    if (selectedText) {
      // Get favicon
      const favicon = getFavicon();
      
      // Clean up selected text - get first few lines or just heading
      const cleanedText = cleanClipText(selectedText);
      
      // Use chrome.runtime.sendMessage directly with error handling
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
          console.debug('runtime.sendMessage error:', chrome.runtime.lastError.message);
          return;
        }
        // Message sent successfully
      });
    }
  }
}

// Get favicon URL
function getFavicon() {
  // Try to find favicon link
  const faviconLink = document.querySelector('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
  if (faviconLink && faviconLink.href) {
    // If relative URL, make it absolute
    if (faviconLink.href.startsWith('/')) {
      return window.location.origin + faviconLink.href;
    }
    if (!faviconLink.href.startsWith('http')) {
      return window.location.origin + '/' + faviconLink.href;
    }
    return faviconLink.href;
  }
  // Fallback to Google favicon service
  return `https://www.google.com/s2/favicons?domain=${window.location.hostname}&sz=16`;
}

// Clean up clip text - get first few lines or just heading
function cleanClipText(text) {
  if (!text) return '';
  
  // Remove image URLs and other messy content
  const lines = text.split('\n').filter(line => {
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
  
  if (meaningfulLines.length === 0) {
    // If no meaningful lines, just return first 200 chars
    return text.substring(0, 200).trim();
  }
  
  return meaningfulLines.join('\n').substring(0, 500).trim();
}

/**
 * Function to inject into page context for clipping entire page
 * This function runs in the page context, not the extension context
 * Note: safeRuntimeSendMessage won't be available in page context, so we use chrome.runtime.sendMessage directly
 */
async function clipEntirePage() {
  const mainContent = document.querySelector('main, article, .content, #content') || document.body;
  
  // Get favicon
  const favicon = getFavicon();
  
  // Try to get article heading or first paragraph
  const heading = document.querySelector('h1, h2, .headline, .title, article h1')?.textContent?.trim() || document.title;
  const firstParagraph = document.querySelector('article p, .content p, main p')?.textContent?.trim() || '';
  
  // Clean up the content
  let cleanedText = '';
  if (heading && firstParagraph) {
    cleanedText = `${heading}\n\n${cleanClipText(firstParagraph)}`;
  } else {
    cleanedText = cleanClipText(mainContent.textContent?.trim() || '');
  }
  
  // Use chrome.runtime.sendMessage directly with error handling
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
      console.debug('runtime.sendMessage error:', chrome.runtime.lastError.message);
      return;
    }
    // Message sent successfully
  });
}

/**
 * Initializes UI-related event listeners
 */
function initializeUI() {
  // Handle extension installation/update for context menus
  chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed/updated - Setting up UI');
    createContextMenus();
  });

  // Handle context menu clicks
  chrome.contextMenus.onClicked.addListener(handleContextMenuClick);
}

/**
 * Shows a notification to the user
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type ('basic', 'image', 'list', 'progress')
 */
function showNotification(title, message, type = 'basic') {
  const notificationOptions = {
    type: type,
    iconUrl: 'icons/icon48.png',
    title: title,
    message: message,
  };

  chrome.notifications.create('', notificationOptions);
}

export {
  updateBadgeCount,
  clearBadge,
  createContextMenus,
  handleContextMenuClick,
  clipSelection,
  clipEntirePage,
  initializeUI,
  showNotification,
};
