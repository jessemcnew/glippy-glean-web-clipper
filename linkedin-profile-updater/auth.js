#!/usr/bin/env node

/**
 * LinkedIn OAuth 2.0 Authentication Helper
 */

import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || `http://localhost:${PORT}/callback`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET required in .env');
  process.exit(1);
}

// Scopes needed for profile editing
const SCOPES = [
  'openid',
  'profile',
  'email',
  'w_member_social', // For profile editing
  'r_liteprofile',
  'r_basicprofile'
].join(' ');

const AUTH_URL = `https://www.linkedin.com/oauth/v2/authorization?` +
  `response_type=code&` +
  `client_id=${CLIENT_ID}&` +
  `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
  `scope=${encodeURIComponent(SCOPES)}&` +
  `state=random_state_string`;

app.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    res.send(`<h1>Error</h1><p>${error}</p>`);
    return;
  }

  if (!code) {
    res.send('<h1>Error</h1><p>No authorization code received</p>');
    return;
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, expires_in } = tokenResponse.data;

    res.send(`
      <h1>✅ Authentication Successful!</h1>
      <p>Access Token:</p>
      <pre style="background: #f0f0f0; padding: 10px; word-break: break-all;">${access_token}</pre>
      <p>Expires in: ${expires_in} seconds</p>
      <p><strong>Add this to your .env file:</strong></p>
      <pre style="background: #f0f0f0; padding: 10px;">LINKEDIN_ACCESS_TOKEN=${access_token}</pre>
    `);

    console.log('\n✅ Access token received!');
    console.log(`\nAdd this to your .env file:\nLINKEDIN_ACCESS_TOKEN=${access_token}\n`);

    // Close server after 10 seconds
    setTimeout(() => {
      process.exit(0);
    }, 10000);
  } catch (error) {
    res.send(`<h1>Error</h1><pre>${error.response?.data || error.message}</pre>`);
    console.error('Error:', error.response?.data || error.message);
  }
});

app.listen(PORT, () => {
  console.log(`\n🔐 Starting OAuth flow...`);
  console.log(`\n📋 Visit this URL in your browser to authenticate:`);
  console.log(`\n${AUTH_URL}\n`);
  console.log(`\n✅ Server running on http://localhost:${PORT}`);
  console.log('Waiting for callback...\n');
});

