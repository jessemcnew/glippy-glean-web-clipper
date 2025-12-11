/**
 * Playwright test to verify extension loads correctly in Chrome
 */

import { test, expect, chromium } from '@playwright/test';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const extensionPath = join(__dirname, '..');

test.describe('Extension Loading Tests', () => {
  test('extension should load in Chrome without errors', async () => {
    // Launch Chrome with extension loaded
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    try {
      // Wait a bit for extension to initialize
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get extension pages
      const pages = context.pages();
      
      // Check that we can access extension pages
      expect(pages.length).toBeGreaterThan(0);

      // Try to open extension popup
      const extensionId = await context.backgroundPages()[0]?.evaluate(() => {
        return chrome.runtime.id;
      }).catch(() => null);

      if (extensionId) {
        console.log(`✅ Extension loaded with ID: ${extensionId}`);
      }

      // Verify extension is loaded
      const backgroundPage = context.backgroundPages().find(
        page => page.url().includes('chrome-extension://')
      );

      if (backgroundPage) {
        // Check for console errors
        const errors = [];
        backgroundPage.on('console', msg => {
          if (msg.type() === 'error') {
            errors.push(msg.text());
          }
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Should have no critical errors
        const criticalErrors = errors.filter(e => 
          !e.includes('favicon') && 
          !e.includes('extension') &&
          !e.includes('DevTools')
        );

        expect(criticalErrors.length).toBe(0);
      }

    } finally {
      await context.close();
    }
  });

  test('manifest.json should be valid and loadable', async () => {
    const manifestPath = join(extensionPath, 'manifest.json');
    
    // File should exist
    expect(existsSync(manifestPath)).toBe(true);
    
    // Should be valid JSON
    const manifestContent = readFileSync(manifestPath, 'utf-8');
    expect(() => JSON.parse(manifestContent)).not.toThrow();
    
    const manifest = JSON.parse(manifestContent);
    
    // Required fields
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe('Glean Web Clipper');
    expect(manifest.version).toBeDefined();
    expect(manifest.description).toBeDefined();
    
    // Should not have empty oauth2.client_id
    if (manifest.oauth2) {
      expect(manifest.oauth2.client_id).toBeTruthy();
      expect(manifest.oauth2.client_id).not.toBe('');
    }
  });

  test('all required files should exist', () => {
    const requiredFiles = [
      'manifest.json',
      'background.js',
      'content.js',
      'popup-modern.html',
      'popup.js',
      'icon16.png',
      'icon48.png',
      'icon128.png'
    ];

    requiredFiles.forEach(file => {
      const filePath = join(extensionPath, file);
      expect(existsSync(filePath)).toBe(true);
    });
  });
});
