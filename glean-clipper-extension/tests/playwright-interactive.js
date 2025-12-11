/**
 * Interactive Playwright test - opens browser and waits for user interaction
 * Run with: node tests/playwright-interactive.js
 */

import { chromium } from 'playwright';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const extensionPath = join(__dirname, '..');

async function openPlaywright() {
  console.log('🚀 Launching Playwright with extension loaded...\n');
  
  const browser = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  console.log('✅ Browser opened with extension loaded');
  console.log('📝 Extension path:', extensionPath);
  console.log('\n🔍 Browser is now open - you can:');
  console.log('   - Navigate to chrome://extensions to check errors');
  console.log('   - Test the extension');
  console.log('   - Inspect console logs');
  console.log('\n⏸️  Browser will stay open. Press Ctrl+C to close.\n');

  // Keep browser open
  process.on('SIGINT', async () => {
    console.log('\n\n👋 Closing browser...');
    await browser.close();
    process.exit(0);
  });

  // Keep process alive
  await new Promise(() => {});
}

openPlaywright().catch(console.error);
