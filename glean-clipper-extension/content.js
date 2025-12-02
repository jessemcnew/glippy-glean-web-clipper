// Floating clip button that appears on text selection
let clipButton = null;
let selectedText = '';
let selectedElement = null;

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

// Create floating clip button
function createClipButton() {
  if (clipButton) {return clipButton;}

  clipButton = document.createElement('div');
  clipButton.id = 'glean-clip-button';
  clipButton.innerHTML = `
    <div class="glean-clip-btn">
      <div class="clip-logo">G</div>
      <span class="clip-text">Clip to Glean</span>
      <div class="clip-arrow">→</div>
    </div>
  `;

  clipButton.style.cssText = `
    position: absolute;
    z-index: 10000;
    background: linear-gradient(135deg, #4F46E5, #6366F1);
    color: white;
    padding: 0;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    cursor: pointer;
    box-shadow: 0 8px 32px rgba(79, 70, 229, 0.3), 0 4px 16px rgba(0, 0, 0, 0.1);
    display: none;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  `;

  // Add inner styling for the button content
  const btnContent = clipButton.querySelector('.glean-clip-btn');
  btnContent.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    position: relative;
  `;

  // Style the G logo
  const logo = clipButton.querySelector('.clip-logo');
  logo.style.cssText = `
    width: 24px;
    height: 24px;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(4px);
  `;

  // Style the text
  const text = clipButton.querySelector('.clip-text');
  text.style.cssText = `
    font-size: 14px;
    font-weight: 600;
    color: white;
  `;

  // Style the arrow
  const arrow = clipButton.querySelector('.clip-arrow');
  arrow.style.cssText = `
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    transition: transform 0.2s ease;
  `;

  clipButton.addEventListener('mouseenter', () => {
    clipButton.style.background = 'linear-gradient(135deg, #3730A3, #4338CA)';
    clipButton.style.transform = 'scale(1.05) translateY(-2px)';
    clipButton.style.boxShadow =
      '0 12px 48px rgba(79, 70, 229, 0.4), 0 8px 24px rgba(0, 0, 0, 0.15)';

    // Animate arrow on hover
    const arrow = clipButton.querySelector('.clip-arrow');
    if (arrow) {
      arrow.style.transform = 'translateX(2px)';
      arrow.style.color = 'white';
    }

    // Enhance logo on hover
    const logo = clipButton.querySelector('.clip-logo');
    if (logo) {
      logo.style.background = 'rgba(255, 255, 255, 0.3)';
    }
  });

  clipButton.addEventListener('mouseleave', () => {
    clipButton.style.background = 'linear-gradient(135deg, #4F46E5, #6366F1)';
    clipButton.style.transform = 'scale(1) translateY(0)';
    clipButton.style.boxShadow = '0 8px 32px rgba(79, 70, 229, 0.3), 0 4px 16px rgba(0, 0, 0, 0.1)';

    // Reset arrow
    const arrow = clipButton.querySelector('.clip-arrow');
    if (arrow) {
      arrow.style.transform = 'translateX(0)';
      arrow.style.color = 'rgba(255, 255, 255, 0.8)';
    }

    // Reset logo
    const logo = clipButton.querySelector('.clip-logo');
    if (logo) {
      logo.style.background = 'rgba(255, 255, 255, 0.2)';
    }
  });

  clipButton.addEventListener('click', handleClip);
  document.body.appendChild(clipButton);

  return clipButton;
}

// Show clip button near selection
function showClipButton(selection) {
  const button = createClipButton();
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  button.style.display = 'flex';
  button.style.left = `${rect.left + window.scrollX}px`;
  button.style.top = `${rect.top + window.scrollY - 45}px`;

  selectedText = selection.toString().trim();
  selectedElement = range.commonAncestorContainer;
}

// Hide clip button
function hideClipButton() {
  if (clipButton) {
    clipButton.style.display = 'none';
  }
}

// Handle text selection
document.addEventListener('mouseup', e => {
  setTimeout(() => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && selection.toString().trim()) {
      showClipButton(selection);
    } else {
      hideClipButton();
    }
  }, 10);
});

// Hide button when clicking elsewhere
document.addEventListener('mousedown', e => {
  if (!clipButton?.contains(e.target)) {
    hideClipButton();
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
