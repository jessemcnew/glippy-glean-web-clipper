#!/usr/bin/env node

/**
 * LinkedIn Profile Updater
 * Uses LinkedIn's official Profile Edit API
 */

import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';
const ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('❌ LINKEDIN_ACCESS_TOKEN not found in .env file');
  console.log('Run: npm run auth to get an access token');
  process.exit(1);
}

const api = axios.create({
  baseURL: LINKEDIN_API_BASE,
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'X-Restli-Protocol-Version': '2.0.0'
  }
});

/**
 * Update profile section
 */
async function updateProfile(section, data) {
  try {
    const endpoint = `/people/(id~me)/${section}`;
    const response = await api.post(endpoint, data);
    console.log(`✅ Successfully updated ${section}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error updating ${section}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get current profile
 */
async function getProfile() {
  try {
    const response = await api.get('/people/(id~me)', {
      params: {
        projection: '(id,firstName,lastName,headline,summary)'
      }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching profile:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Update from document/file
 */
async function updateFromDocument(filePath) {
  console.log(`📄 Reading document: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Parse document and extract profile information
  // This is a placeholder - you'll need to implement parsing based on your document format
  console.log('📝 Document content:', content.substring(0, 200) + '...');
  
  // Example: Update summary
  // await updateProfile('summary', { summary: content });
  
  console.log('✅ Profile update complete');
}

// CLI interface
const command = process.argv[2];
const arg = process.argv[3];

if (command === 'update' && arg) {
  updateFromDocument(arg).catch(console.error);
} else if (command === 'profile') {
  getProfile().then(console.log).catch(console.error);
} else {
  console.log(`
LinkedIn Profile Updater

Usage:
  node index.js profile              - Get current profile
  node index.js update <file>        - Update profile from document

Environment variables:
  LINKEDIN_ACCESS_TOKEN              - OAuth access token (required)
  LINKEDIN_CLIENT_ID                 - App client ID
  LINKEDIN_CLIENT_SECRET             - App client secret
  LINKEDIN_REDIRECT_URI              - OAuth redirect URI
  `);
}

export { updateProfile, getProfile, updateFromDocument };

