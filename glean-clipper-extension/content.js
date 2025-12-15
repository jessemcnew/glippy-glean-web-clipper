// Glippy Radial Command Menu - Content Script
// Appears when user highlights text on a webpage

let radialMenu = null;
let selectedText = '';
let selectedElement = null;
let radialStyleInjected = false;

// SVG icons (lucide-react equivalents)
const ICONS = {
  scissors: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/></svg>`,
  fileText: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>`,
  link: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  search: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
};

// Menu options - 4 buttons at 90-degree intervals
const MENU_OPTIONS = [
  { id: 'clip-text', icon: ICONS.scissors, label: 'Clip Text', angle: 0 },
  { id: 'clip-page', icon: ICONS.fileText, label: 'Clip Page', angle: 90 },
  { id: 'clip-url', icon: ICONS.link, label: 'Clip URL', angle: 180 },
  { id: 'search-glean', icon: ICONS.search, label: 'Search Glean', angle: 270 },
];

const RADIUS = 90; // Distance from center to buttons

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

// Check if user wants to hide the tooltip
function shouldShowTooltip() {
  try {
    return localStorage.getItem('glippy-hide-radial-tooltip') !== 'true';
  } catch {
    return true;
  }
}

// Dismiss tooltip permanently
function dismissTooltip() {
  try {
    localStorage.setItem('glippy-hide-radial-tooltip', 'true');
    const tooltip = document.querySelector('.glippy-radial-tooltip');
    if (tooltip) tooltip.remove();
  } catch {
    // localStorage not available
  }
}

// Inject styles for radial menu once
function ensureRadialStyles() {
  if (radialStyleInjected) return;
  const style = document.createElement('style');
  style.id = 'glippy-radial-styles';
  style.textContent = `
    /* Radial Menu Container */
    .glippy-radial-menu {
      position: fixed;
      z-index: 2147483647;
      pointer-events: none;
    }

    .glippy-radial-inner {
      position: relative;
      pointer-events: auto;
    }

    /* Center Circle with G */
    .glippy-radial-center {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: #18181b;
      border: 2px solid #3f3f46;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(113, 113, 122, 0.1);
      animation: glippy-pulse 3s ease-in-out infinite, glippy-scale-in 0.3s ease-out;
    }

    .glippy-radial-center-icon {
      width: 56px;
      height: 56px;
      color: #fafafa;
    }

    /* Action Buttons */
    .glippy-radial-btn {
      position: absolute;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #27272a 0%, #18181b 100%);
      border: 1px solid rgba(63, 63, 70, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4), 0 0 10px rgba(113, 113, 122, 0.1);
      backdrop-filter: blur(4px);
      transform: translate(-50%, -50%) scale(0);
      opacity: 0;
    }

    .glippy-radial-btn.visible {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }

    .glippy-radial-btn:hover {
      background: linear-gradient(135deg, #3f3f46 0%, #27272a 100%);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(113, 113, 122, 0.3);
      transform: translate(-50%, -50%) scale(1.1);
      border-color: rgba(113, 113, 122, 0.5);
    }

    .glippy-radial-btn:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(113, 113, 122, 0.5), 0 12px 30px rgba(0, 0, 0, 0.5);
    }

    .glippy-radial-btn svg {
      color: #fafafa;
      transition: transform 0.3s ease;
    }

    .glippy-radial-btn:hover svg {
      transform: scale(1.1);
    }

    /* Hover Label */
    .glippy-radial-label {
      position: absolute;
      left: 50%;
      top: calc(50% + 130px);
      transform: translateX(-50%);
      padding: 6px 12px;
      background: #18181b;
      border: 1px solid #3f3f46;
      border-radius: 6px;
      color: #fafafa;
      font-size: 12px;
      font-weight: 500;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.15s ease;
      z-index: 10;
    }

    .glippy-radial-label.visible {
      opacity: 1;
    }

    /* Tooltip */
    .glippy-radial-tooltip {
      position: absolute;
      left: 50%;
      top: calc(50% + 145px);
      transform: translateX(-50%);
      min-width: 280px;
      padding: 10px 16px;
      background: rgba(24, 24, 27, 0.95);
      border: 1px solid #3f3f46;
      border-radius: 8px;
      backdrop-filter: blur(8px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
      text-align: center;
      animation: glippy-fade-in 0.3s ease-out;
    }

    .glippy-radial-tooltip-text {
      color: #a1a1aa;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin-bottom: 6px;
      white-space: nowrap;
    }

    .glippy-radial-tooltip-kbd {
      display: inline-block;
      padding: 2px 6px;
      background: #27272a;
      border-radius: 4px;
      color: #fafafa;
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-size: 10px;
      margin: 0 2px;
    }

    .glippy-radial-tooltip-dismiss {
      color: #71717a;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      text-decoration: underline;
      text-decoration-style: dotted;
      cursor: pointer;
      background: none;
      border: none;
      padding: 0;
      transition: color 0.2s ease;
    }

    .glippy-radial-tooltip-dismiss:hover {
      color: #a1a1aa;
    }

    /* Backdrop */
    .glippy-radial-backdrop {
      position: fixed;
      inset: 0;
      z-index: 2147483646;
    }

    /* Animations */
    @keyframes glippy-pulse {
      0%, 100% { box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(113, 113, 122, 0.1); }
      50% { box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3), 0 0 30px rgba(113, 113, 122, 0.2); }
    }

    @keyframes glippy-scale-in {
      from { transform: translate(-50%, -50%) scale(0); opacity: 0; }
      to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }

    @keyframes glippy-fade-in {
      from { opacity: 0; transform: translateX(-50%) translateY(8px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }

    /* Feedback Toast */
    .glippy-feedback {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 2147483647;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      animation: glippy-slide-in 0.3s ease;
    }

    .glippy-feedback.success { background: #22c55e; }
    .glippy-feedback.error { background: #ef4444; }

    @keyframes glippy-slide-in {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @keyframes glippy-slide-out {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }

    /* Dark mode support - menu is already dark, but ensure consistent rendering */
    @media (prefers-color-scheme: light) {
      .glippy-radial-center {
        background: #18181b;
      }
    }
  `;
  document.head.appendChild(style);
  radialStyleInjected = true;
}

// Calculate button position on the circle
function getButtonPosition(angle) {
  const radian = (angle * Math.PI) / 180;
  return {
    x: Math.cos(radian) * RADIUS,
    y: Math.sin(radian) * RADIUS,
  };
}

// Create radial menu
function createRadialMenu() {
  if (radialMenu) return radialMenu;
  ensureRadialStyles();

  // Backdrop for click-outside detection
  const backdrop = document.createElement('div');
  backdrop.className = 'glippy-radial-backdrop';
  backdrop.addEventListener('click', hideRadialMenu);

  // Main menu container
  radialMenu = document.createElement('div');
  radialMenu.className = 'glippy-radial-menu';

  const inner = document.createElement('div');
  inner.className = 'glippy-radial-inner';

  // Center circle with Glippy paperclip icon
  const center = document.createElement('div');
  center.className = 'glippy-radial-center';
  center.innerHTML = `<svg class="glippy-radial-center-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 14L18 28C16.3431 29.6569 16.3431 32.3431 18 34C19.6569 35.6569 22.3431 35.6569 24 34L36 22C39.3137 18.6863 39.3137 13.3137 36 10C32.6863 6.68629 27.3137 6.68629 24 10L12 22C7.02944 26.9706 7.02944 34.0294 12 39C16.9706 43.9706 24.0294 43.9706 29 39L41 27" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  inner.appendChild(center);

  // Hover label (hidden by default)
  const label = document.createElement('div');
  label.className = 'glippy-radial-label';
  label.id = 'glippy-hover-label';
  inner.appendChild(label);

  // Action buttons
  MENU_OPTIONS.forEach((option, index) => {
    const pos = getButtonPosition(option.angle);
    const btn = document.createElement('button');
    btn.className = 'glippy-radial-btn';
    btn.setAttribute('data-action', option.id);
    btn.setAttribute('aria-label', option.label);
    btn.setAttribute('title', option.label);
    btn.innerHTML = option.icon;
    btn.style.left = `calc(50% + ${pos.x}px)`;
    btn.style.top = `calc(50% + ${pos.y}px)`;
    btn.style.transitionDelay = `${index * 50}ms`;

    // Hover events for label
    btn.addEventListener('mouseenter', () => {
      label.textContent = option.label;
      label.classList.add('visible');
    });
    btn.addEventListener('mouseleave', () => {
      label.classList.remove('visible');
    });

    // Click handler
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleRadialAction(option.id);
    });

    inner.appendChild(btn);
  });

  // Tooltip (if not dismissed)
  if (shouldShowTooltip()) {
    const tooltip = document.createElement('div');
    tooltip.className = 'glippy-radial-tooltip';
    tooltip.innerHTML = `
      <p class="glippy-radial-tooltip-text">
        Press <span class="glippy-radial-tooltip-kbd">Esc</span> or click anywhere to close
      </p>
      <button class="glippy-radial-tooltip-dismiss">Don't show again</button>
    `;
    tooltip.querySelector('.glippy-radial-tooltip-dismiss').addEventListener('click', (e) => {
      e.stopPropagation();
      dismissTooltip();
    });
    inner.appendChild(tooltip);
  }

  radialMenu.appendChild(inner);
  radialMenu._backdrop = backdrop;

  return radialMenu;
}

// Handle actions
function handleRadialAction(action) {
  switch (action) {
    case 'clip-text':
      handleClipText();
      break;
    case 'clip-page':
      handleClipPage();
      break;
    case 'clip-url':
      handleClipUrl();
      break;
    case 'search-glean':
      handleSearchGlean();
      break;
  }
  hideRadialMenu();
}

// Clip selected text
async function handleClipText() {
  if (!selectedText) return;

  const pageInfo = {
    url: window.location.href,
    title: document.title,
    selectedText: cleanClipText(selectedText),
    context: getTextContext(selectedElement),
    timestamp: new Date().toISOString(),
    domain: window.location.hostname,
    favicon: getFavicon(),
    type: 'text',
  };

  try {
    if (!chrome.runtime?.id) {
      throw new Error('Extension context invalidated');
    }

    await safeRuntimeSendMessage({ action: 'ping' });

    const response = await safeRuntimeSendMessage({
      action: 'saveClip',
      data: pageInfo,
    });

    if (response?.success) {
      showClipFeedback('Text clipped!');
    } else {
      throw new Error(response?.error || 'Failed to save clip');
    }
  } catch (error) {
    console.error('Clip failed:', error);
    showClipFeedback('Clip failed: ' + error.message, 'error');
  }
}

// Clip full page
async function handleClipPage() {
  const pageInfo = {
    url: window.location.href,
    title: document.title,
    selectedText: document.body.innerText.substring(0, 5000),
    timestamp: new Date().toISOString(),
    domain: window.location.hostname,
    favicon: getFavicon(),
    type: 'page',
  };

  try {
    if (!chrome.runtime?.id) {
      throw new Error('Extension context invalidated');
    }

    const response = await safeRuntimeSendMessage({
      action: 'saveClip',
      data: pageInfo,
    });

    if (response?.success) {
      showClipFeedback('Page clipped!');
    } else {
      throw new Error(response?.error || 'Failed to save clip');
    }
  } catch (error) {
    console.error('Clip failed:', error);
    showClipFeedback('Clip failed: ' + error.message, 'error');
  }
}

// Clip URL only
async function handleClipUrl() {
  const pageInfo = {
    url: window.location.href,
    title: document.title,
    selectedText: '',
    timestamp: new Date().toISOString(),
    domain: window.location.hostname,
    favicon: getFavicon(),
    type: 'url',
  };

  try {
    if (!chrome.runtime?.id) {
      throw new Error('Extension context invalidated');
    }

    const response = await safeRuntimeSendMessage({
      action: 'saveClip',
      data: pageInfo,
    });

    if (response?.success) {
      showClipFeedback('URL saved!');
    } else {
      throw new Error(response?.error || 'Failed to save URL');
    }
  } catch (error) {
    console.error('Save URL failed:', error);
    showClipFeedback('Save failed: ' + error.message, 'error');
  }
}

// Search in Glean
function handleSearchGlean() {
  const searchText = selectedText || '';
  if (!searchText) {
    showClipFeedback('Select text to search', 'error');
    return;
  }

  // Send message to open Glean search
  safeRuntimeSendMessage({
    action: 'searchGlean',
    query: searchText,
  }).then((response) => {
    if (!response?.success) {
      // Fallback: open Glean search directly (domain will need to be configured)
      showClipFeedback('Configure Glean domain in settings', 'error');
    }
  });
}

// Show radial menu near selection
function showRadialMenu(selection) {
  const menu = createRadialMenu();
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // Position menu centered on selection
  const x = rect.left + rect.width / 2 + window.scrollX;
  const y = rect.top + rect.height / 2 + window.scrollY;

  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  menu.style.transform = 'translate(-50%, -50%)';

  selectedText = selection.toString().trim();
  selectedElement = range.commonAncestorContainer;

  // Add backdrop and menu to DOM
  if (!menu._backdrop.parentNode) {
    document.body.appendChild(menu._backdrop);
  }
  if (!menu.parentNode) {
    document.body.appendChild(menu);
  }

  // Animate buttons in
  requestAnimationFrame(() => {
    menu.querySelectorAll('.glippy-radial-btn').forEach((btn) => {
      btn.classList.add('visible');
    });
  });
}

// Hide radial menu
function hideRadialMenu() {
  if (radialMenu) {
    radialMenu.querySelectorAll('.glippy-radial-btn').forEach((btn) => {
      btn.classList.remove('visible');
    });
    setTimeout(() => {
      if (radialMenu.parentNode) {
        radialMenu.parentNode.removeChild(radialMenu);
      }
      if (radialMenu._backdrop?.parentNode) {
        radialMenu._backdrop.parentNode.removeChild(radialMenu._backdrop);
      }
    }, 150);
  }
}

// Handle text selection
document.addEventListener('mouseup', (e) => {
  // Ignore if clicking inside the menu
  if (radialMenu?.contains(e.target)) return;

  setTimeout(() => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && selection.toString().trim().length > 0) {
      showRadialMenu(selection);
    }
  }, 10);
});

// Hide on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && radialMenu?.parentNode) {
    hideRadialMenu();
  }
});

// Hide when clicking elsewhere (handled by backdrop)

// Get favicon URL
function getFavicon() {
  const faviconLink = document.querySelector(
    'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
  );
  if (faviconLink?.href) {
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

// Clean up clip text
function cleanClipText(text) {
  if (!text) return '';

  const lines = text.split('\n').filter((line) => {
    const trimmed = line.trim();
    if (trimmed.match(/^https?:\/\//)) return false;
    if (trimmed.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)) return false;
    if (trimmed.match(/^(Images?|Clipped?|Source?|Domain?):/i)) return false;
    if (trimmed.length > 200) return false;
    return true;
  });

  const meaningfulLines = lines.filter((l) => l.trim().length > 10).slice(0, 5);

  if (meaningfulLines.length === 0) {
    return text.substring(0, 200).trim();
  }

  return meaningfulLines.join('\n').substring(0, 500).trim();
}

// Get surrounding text context
function getTextContext(element, maxLength = 200) {
  let contextElement = element;
  while (contextElement && contextElement.nodeType !== Node.ELEMENT_NODE) {
    contextElement = contextElement.parentNode;
  }

  if (!contextElement) return '';

  const fullText = contextElement.textContent || '';
  if (fullText.length <= maxLength) return fullText;

  const selectedIndex = fullText.indexOf(selectedText);
  if (selectedIndex === -1) return fullText.substring(0, maxLength);

  const start = Math.max(0, selectedIndex - maxLength / 2);
  const end = Math.min(fullText.length, start + maxLength);

  return (start > 0 ? '...' : '') + fullText.substring(start, end) + (end < fullText.length ? '...' : '');
}

// Show feedback message
function showClipFeedback(message, type = 'success') {
  const feedback = document.createElement('div');
  feedback.className = `glippy-feedback ${type}`;
  feedback.textContent = message;
  document.body.appendChild(feedback);

  setTimeout(() => {
    feedback.style.animation = 'glippy-slide-out 0.3s ease forwards';
    setTimeout(() => feedback.remove(), 300);
  }, 2000);
}
