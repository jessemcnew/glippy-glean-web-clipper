// Floating clip button that appears on text selection
let radialMenu = null;
let selectedText = '';
let selectedElement = null;
let radialStyleInjected = false;

// Safe messaging wrapper for content script
function safeRuntimeSendMessage(message) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(message, (res) => {
        const err = chrome.runtime.lastError;
        if (err) {
          console.debug('runtime.sendMessage no receiver:', err.message);
          return resolve(null);
        }
        resolve(res ?? null);
      });
    } catch (e) {
      console.debug('runtime.sendMessage threw:', e?.message || e);
      resolve(null);
    }
  });
}

// Inject styles for radial menu once
function ensureRadialStyles() {
  if (radialStyleInjected) return;
  const style = document.createElement('style');
  style.textContent = `
    .glean-radial-menu {
      position: absolute;
      z-index: 10000;
      width: 220px;
      height: 220px;
      display: none;
      pointer-events: none;
    }
    .glean-radial-menu .center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 60px;
      height: 60px;
      border-radius: 999px;
      background: #0f172a;
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 10px 30px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #e5e7eb;
      font-weight: 700;
      pointer-events: auto;
      cursor: pointer;
    }
    .glean-radial-menu .item {
      position: absolute;
      width: 52px;
      height: 52px;
      border-radius: 999px;
      background: #111827;
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 8px 20px rgba(0,0,0,0.28);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #e5e7eb;
      font-size: 12px;
      pointer-events: auto;
      cursor: pointer;
      transition: transform 120ms ease, background 120ms ease, color 120ms ease;
    }
    .glean-radial-menu .item:hover {
      background: #2563eb;
      color: #fff;
      transform: scale(1.06);
    }
    .glean-radial-menu .label {
      position: absolute;
      top: 58px;
      left: 50%;
      transform: translateX(-50%);
      white-space: nowrap;
      font-size: 11px;
      color: #cbd5e1;
    }
  `;
  document.head.appendChild(style);
  radialStyleInjected = true;
}

// Create radial menu
function createRadialMenu() {
  if (radialMenu) return radialMenu;
  ensureRadialStyles();

  radialMenu = document.createElement('div');
  radialMenu.className = 'glean-radial-menu';
  radialMenu.innerHTML = `
    <div class="center" data-action="clip">G</div>
    ${[
      { action: 'clip', icon: '📌', label: 'Clip' },
      { action: 'copy', icon: '📋', label: 'Copy' },
      { action: 'saveUrl', icon: '🔗', label: 'URL' },
      { action: 'capture', icon: '📸', label: 'Page' },
      { action: 'notebook', icon: '📓', label: 'Notebook' },
      { action: 'close', icon: '✕', label: 'Close' },
    ]
      .map((item, idx) => {
        const angle = (Math.PI * 2 * idx) / 6;
        const radius = 80;
        const x = 110 + Math.cos(angle) * radius - 26;
        const y = 110 + Math.sin(angle) * radius - 26;
        return `
          <div class="item" data-action="${item.action}" style="left:${x}px; top:${y}px;">
            <span>${item.icon}</span>
            <div class="label">${item.label}</div>
          </div>
        `;
      })
      .join('')}
  `;

  radialMenu.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.getAttribute('data-action');
    handleRadialAction(action);
  });

  document.body.appendChild(radialMenu);
  return radialMenu;
}

function handleRadialAction(action) {
  switch (action) {
    case 'clip':
      handleClip();
      break;
    case 'copy':
      if (selectedText) navigator.clipboard.writeText(selectedText);
      break;
    case 'saveUrl':
      safeRuntimeSendMessage({
        action: 'saveClip',
        data: {
          url: window.location.href,
          title: document.title || '',
          selectedText: '',
          domain: window.location.hostname,
          timestamp: Date.now(),
        },
      });
      break;
    case 'capture':
      alert('Capture Page coming soon.');
      break;
    case 'notebook':
      safeRuntimeSendMessage({ action: 'openNotebook' });
      break;
    default:
      break;
  }
  hideRadialMenu();
}

// Show radial menu near selection
function showRadialMenu(selection) {
  const menu = createRadialMenu();
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  menu.style.display = 'block';
  menu.style.left = `${rect.left + window.scrollX - 70}px`;
  menu.style.top = `${rect.top + window.scrollY - 70}px`;

  selectedText = selection.toString().trim();
  selectedElement = range.commonAncestorContainer;
}

// Hide radial menu
function hideRadialMenu() {
  if (radialMenu) {
    radialMenu.style.display = 'none';
  }
}

// Handle text selection
document.addEventListener('mouseup', e => {
  setTimeout(() => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && selection.toString().trim()) {
      showRadialMenu(selection);
    } else {
      hideRadialMenu();
    }
  }, 10);
});

// Hide when clicking elsewhere
document.addEventListener('mousedown', e => {
  if (!radialMenu?.contains(e.target)) {
    hideRadialMenu();
  }
});

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

// Handle clip action
async function handleClip() {
  if (!selectedText) {return;}

  // Get favicon
  const favicon = getFavicon();
  
  // Clean up selected text
  const cleanedText = cleanClipText(selectedText);

  const pageInfo = {
    url: window.location.href,
    title: document.title,
    selectedText: cleanedText,
    context: getTextContext(selectedElement),
    timestamp: new Date().toISOString(),
    domain: window.location.hostname,
    favicon: favicon,
    // Don't include images array - it creates messy content
  };

  try {
    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      throw new Error('Extension context invalidated');
    }

    // First, try to ping the service worker to wake it up
    await safeRuntimeSendMessage({ action: 'ping' });

    // Add retry mechanism for inactive service worker
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        // Save to extension storage
        const response = await safeRuntimeSendMessage({
          action: 'saveClip',
          data: pageInfo,
        });

        if (response && response.success) {
          // Show success feedback
          showClipFeedback('Clipped to Glean!');
          hideClipButton();
          return; // Success, exit the function
        } else if (response && response.error) {
          throw new Error(response.error);
        } else {
          throw new Error('Unknown response from extension');
        }
      } catch (msgError) {
        retryCount++;
        console.log(`Retry ${retryCount}/${maxRetries}:`, msgError.message);

        if (retryCount >= maxRetries) {
          throw msgError; // Final attempt failed
        }

        // Wait progressively longer between retries
        await new Promise(resolve => setTimeout(resolve, retryCount * 200));
      }
    }
  } catch (error) {
    console.error('Clip failed after retries:', error);
    if (error.message.includes('Extension context invalidated')) {
      showClipFeedback('Extension context lost - reload the page and extension', 'error');
    } else if (error.message.includes('receiving end does not exist')) {
      showClipFeedback('Service worker inactive - try clipping again', 'error');
    } else if (error.message.includes('service worker')) {
      showClipFeedback('Extension service unavailable - please reload extension', 'error');
    } else if (error.message.includes('Could not establish connection')) {
      showClipFeedback('Extension connection failed - reload page and try again', 'error');
    } else {
      showClipFeedback('Clip failed: ' + error.message, 'error');
    }
  }
}

// Scrape images from the current page
function scrapePageImages() {
  const images = [];

  // Look for various image sources
  const selectors = [
    'img[src]', // Regular images
    '[data-src]', // Lazy loaded images
    '.hero-image img', // Hero images
    'article img', // Article images
    '.content img', // Content images
    '.featured-image img', // Featured images
    'meta[property="og:image"]', // Open Graph images
    'meta[name="twitter:image"]', // Twitter card images
  ];

  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      let src = el.src || el.getAttribute('data-src') || el.content;
      if (src) {
        // Convert relative URLs to absolute
        if (src.startsWith('/')) {
          src = window.location.origin + src;
        } else if (!src.startsWith('http')) {
          src = new URL(src, window.location.href).href;
        }

        // Filter out small/icon images and duplicates
        if (
          (!images.includes(src) &&
            !src.includes('icon') &&
            !src.includes('logo') &&
            !src.includes('avatar') &&
            !src.match(/\d+x\d+/)) ||
          (src.match(/\d+x(\d+)/) && parseInt(RegExp.$1) > 200)
        ) {
          images.push(src);
        }
      }
    });
  });

  // Limit to first 5 images to avoid bloat
  return images.slice(0, 5);
}

// Get surrounding text context
function getTextContext(element, maxLength = 200) {
  let contextElement = element;
  while (contextElement && contextElement.nodeType !== Node.ELEMENT_NODE) {
    contextElement = contextElement.parentNode;
  }

  if (!contextElement) {return '';}

  const fullText = contextElement.textContent || '';
  if (fullText.length <= maxLength) {return fullText;}

  // Find selected text position and get context around it
  const selectedIndex = fullText.indexOf(selectedText);
  if (selectedIndex === -1) {return fullText.substring(0, maxLength);}

  const start = Math.max(0, selectedIndex - maxLength / 2);
  const end = Math.min(fullText.length, start + maxLength);

  return (
    (start > 0 ? '...' : '') + fullText.substring(start, end) + (end < fullText.length ? '...' : '')
  );
}

// Show feedback message
function showClipFeedback(message, type = 'success') {
  const feedback = document.createElement('div');
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10001;
    background: ${type === 'error' ? '#EF4444' : '#10B981'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    animation: slideIn 0.3s ease;
  `;

  feedback.textContent = message;
  document.body.appendChild(feedback);

  setTimeout(() => {
    feedback.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => feedback.remove(), 300);
  }, 2000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);
