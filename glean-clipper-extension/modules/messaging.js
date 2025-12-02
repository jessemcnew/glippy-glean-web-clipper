// modules/messaging.js

function isHttpUrl(url) {
  return /^https?:\/\//i.test(url || '');
}

export function safeRuntimeSendMessage(message) {
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

// Sometimes useful if you add tab messaging later
export function safeTabsSendMessage(tabId, message) {
  return new Promise((resolve) => {
    try {
      chrome.tabs.sendMessage(tabId, message, (res) => {
        const err = chrome.runtime.lastError;
        if (err) {
          console.debug('tabs.sendMessage no receiver:', err.message);
          return resolve(null);
        }
        resolve(res ?? null);
      });
    } catch (e) {
      console.debug('tabs.sendMessage threw:', e?.message || e);
      resolve(null);
    }
  });
}

export async function sendToActiveTab(message) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !isHttpUrl(tab.url)) {
      console.debug('Skip messaging: unsupported or missing tab URL', tab?.url);
      return null;
    }
    return await safeTabsSendMessage(tab.id, message);
  } catch (e) {
    console.debug('sendToActiveTab failed:', e?.message || e);
    return null;
  }
}

