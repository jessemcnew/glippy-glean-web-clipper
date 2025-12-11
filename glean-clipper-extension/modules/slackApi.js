// Slack API Integration Module
// Handles Slack OAuth and message posting

import { getGleanConfig } from './storage.js';

/**
 * Initiates Slack OAuth flow
 * @returns {Promise<string>} OAuth URL to redirect to
 */
async function initiateSlackOAuth() {
  // In a real implementation, you would:
  // 1. Generate state token
  // 2. Redirect to Slack OAuth URL
  // 3. Handle callback with code exchange
  
  const clientId = 'YOUR_SLACK_CLIENT_ID'; // Should be in config
  const redirectUri = chrome.identity.getRedirectURL() + 'slack-oauth.html';
  const scopes = ['chat:write', 'channels:read', 'groups:read', 'im:read'];
  const state = Math.random().toString(36).substring(7);
  
  // Store state for verification
  try {
    await chrome.storage.local.set({ slackOAuthState: state });
  } catch (e) {
    console.error('Error storing OAuth state:', e);
  }
  
  const authUrl = `https://slack.com/oauth/v2/authorize?` +
    `client_id=${clientId}&` +
    `scope=${scopes.join(',')}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${state}`;
  
  return authUrl;
}

/**
 * Exchanges OAuth code for access token
 * @param {string} code - OAuth authorization code
 * @param {string} state - OAuth state for verification
 * @returns {Promise<Object>} Token result
 */
async function exchangeSlackToken(code, state) {
  // Verify state
  try {
    const stored = await chrome.storage.local.get(['slackOAuthState']);
    if (stored.slackOAuthState !== state) {
      throw new Error('Invalid OAuth state');
    }
    await chrome.storage.local.remove(['slackOAuthState']);
  } catch (e) {
    throw new Error('State verification failed');
  }

  // In production, this should call your backend server
  // which exchanges the code for a token
  // For now, return mock structure
  return {
    success: true,
    access_token: 'mock_token',
    team_id: 'mock_team',
    team_name: 'Mock Team',
  };
}

/**
 * Gets list of Slack channels
 * @returns {Promise<Array>} List of channels
 */
async function getSlackChannels() {
  try {
    const config = await chrome.storage.local.get(['slackConfig']);
    const token = config.slackConfig?.accessToken;
    
    if (!token) {
      return { success: false, channels: [], error: 'Not connected to Slack' };
    }

    // In production, call Slack API
    // const response = await fetch('https://slack.com/api/conversations.list', {
    //   headers: { 'Authorization': `Bearer ${token}` }
    // });
    
    // Mock channels for now
    return {
      success: true,
      channels: [
        { id: 'C123', name: 'general' },
        { id: 'C456', name: 'random' },
        { id: 'C789', name: 'team-updates' },
      ],
    };
  } catch (error) {
    return {
      success: false,
      channels: [],
      error: error.message,
    };
  }
}

/**
 * Posts a message to a Slack channel
 * @param {string} channelId - Channel ID
 * @param {string} text - Message text
 * @param {Object} clip - Clip data to include
 * @returns {Promise<Object>} Post result
 */
async function postToSlack(channelId, text, clip) {
  try {
    const config = await chrome.storage.local.get(['slackConfig']);
    const token = config.slackConfig?.accessToken;
    
    if (!token) {
      return { success: false, error: 'Not connected to Slack' };
    }

    // Format message with clip info
    const message = {
      channel: channelId,
      text: text || '',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${clip.title || 'Untitled Clip'}*\n${clip.selectedText || clip.description || ''}\n\n<${clip.url}|View original>`,
          },
        },
      ],
    };

    // In production, call Slack API
    // const response = await fetch('https://slack.com/api/chat.postMessage', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${token}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(message),
    // });

    // Mock success for now
    return {
      success: true,
      message: 'Posted to Slack successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to post to Slack',
    };
  }
}

/**
 * Checks Slack connection status
 * @returns {Promise<Object>} Connection status
 */
async function checkSlackConnection() {
  try {
    const config = await chrome.storage.local.get(['slackConfig']);
    const isConnected = !!(config.slackConfig?.accessToken);
    
    return {
      success: true,
      connected: isConnected,
      teamName: config.slackConfig?.teamName || null,
    };
  } catch (error) {
    return {
      success: false,
      connected: false,
      error: error.message,
    };
  }
}

export {
  initiateSlackOAuth,
  exchangeSlackToken,
  getSlackChannels,
  postToSlack,
  checkSlackConnection,
};

