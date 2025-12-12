/**
 * Playwright test to check all extension errors and verify UI components
 */

import { test, expect, chromium } from '@playwright/test';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const extensionPath = join(__dirname, '..');

test.describe('Extension Error Review', () => {
  test('check all extension errors and UI components', async () => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    try {
      // Wait for extension to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Navigate to extensions page to check errors
      const extensionsPage = await context.newPage();
      await extensionsPage.goto('chrome://extensions');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check for errors
      const errors = [];
      const backgroundPages = context.backgroundPages();
      
      for (const page of backgroundPages) {
        page.on('console', msg => {
          if (msg.type() === 'error') {
            const text = msg.text();
            if (!text.includes('favicon') && 
                !text.includes('DevTools') &&
                !text.includes('Extension context invalidated')) {
              errors.push({
                type: 'console',
                page: page.url(),
                message: text
              });
            }
          }
        });
      }

      // Wait a bit to collect errors
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('\n📋 Error Summary:');
      if (errors.length === 0) {
        console.log('✅ No console errors found');
      } else {
        console.log(`❌ Found ${errors.length} errors:`);
        errors.forEach((err, i) => {
          console.log(`  ${i + 1}. ${err.message}`);
        });
      }

      // Verify UI files exist
      console.log('\n📁 UI Component Check:');
      const uiFiles = [
        { name: 'reader.html', description: 'Recent Clips/Reader page' },
        { name: 'library.html', description: 'Library/Notebook page' },
        { name: 'prompts.html', description: 'Saved Prompts page' },
        { name: 'popup-modern.html', description: 'Main popup' },
      ];

      uiFiles.forEach(file => {
        const path = join(extensionPath, file.name);
        if (existsSync(path)) {
          console.log(`  ✅ ${file.name} - ${file.description}`);
        } else {
          console.log(`  ❌ ${file.name} - MISSING!`);
        }
      });

      // Verify CSS files
      console.log('\n🎨 CSS Files Check:');
      const cssFiles = ['reader.css', 'library.css', 'prompts.css', 'popup-modern.css'];
      cssFiles.forEach(file => {
        const path = join(extensionPath, file);
        if (existsSync(path)) {
          console.log(`  ✅ ${file}`);
        } else {
          console.log(`  ❌ ${file} - MISSING!`);
        }
      });

      // Check manifest includes all web accessible resources
      console.log('\n📦 Manifest Resources Check:');
      const manifestPath = join(extensionPath, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
      const webAccessible = manifest.web_accessible_resources?.[0]?.resources || [];
      
      const requiredResources = ['reader.html', 'library.html', 'prompts.html', 'reader.css', 'library.css', 'prompts.css'];
      requiredResources.forEach(resource => {
        if (webAccessible.includes(resource)) {
          console.log(`  ✅ ${resource} is web accessible`);
        } else {
          console.log(`  ❌ ${resource} NOT in web_accessible_resources!`);
        }
      });

      // Keep browser open for manual inspection
      console.log('\n🔍 Browser is open for manual inspection');
      console.log('   - Go to chrome://extensions to see errors');
      console.log('   - Click extension icon to test popup');
      console.log('   - Test "Recent Clips" button');
      console.log('   - Test "Library" button');
      console.log('\n⏸️  Browser will stay open. Press Ctrl+C to close.\n');

      // Keep process alive
      await new Promise(() => {});

    } catch (error) {
      console.error('Test error:', error);
      throw error;
    } finally {
      // Don't close - keep open for inspection
    }
  });
});






