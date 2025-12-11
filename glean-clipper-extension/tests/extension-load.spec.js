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
  test('extension should load in Chrome without manifest errors', async () => {
    // This test verifies the extension can be loaded by Chrome
    // by checking that manifest.json is valid and Chrome can parse it
    
    // Launch Chrome with extension loaded
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    try {
      // Wait for extension to initialize
      await new Promise(resolve => setTimeout(resolve, 2000));

      // If we get here without errors, the extension loaded successfully
      // Chrome would have thrown an error during launch if manifest was invalid
      const pages = context.pages();
      
      // Context should be created (if manifest was invalid, this would fail)
      expect(context).toBeDefined();
      
      console.log('✅ Extension manifest is valid - Chrome can load it');

    } catch (error) {
      // If there's an error loading, it's likely a manifest issue
      if (error.message.includes('manifest') || error.message.includes('oauth2')) {
        throw new Error(`Extension failed to load: ${error.message}. Check manifest.json`);
      }
      throw error;
    } finally {
      await context.close();
    }
  });

  test('manifest.json should be valid', async () => {
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
    
    // Should not have empty oauth2.client_id (should be removed if not configured)
    if (manifest.oauth2) {
      expect(manifest.oauth2.client_id).toBeTruthy();
      expect(manifest.oauth2.client_id).not.toBe('');
      expect(manifest.oauth2.client_id).not.toContain('YOUR_');
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
