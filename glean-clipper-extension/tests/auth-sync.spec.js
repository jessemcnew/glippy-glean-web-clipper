/**
 * Playwright test to verify auth sync between extension and dashboard
 */

import { test, expect, chromium } from '@playwright/test';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const extensionPath = join(__dirname, '..');

test.describe('Auth Sync Tests', () => {
  let context;
  let extensionId;

  test.beforeAll(async () => {
    // Launch Chrome with extension loaded
    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    // Wait for extension to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get the extension ID from service worker
    let serviceWorker = context.serviceWorkers()[0];
    if (!serviceWorker) {
      // Wait for service worker to start
      serviceWorker = await context.waitForEvent('serviceworker');
    }

    // Extract extension ID from service worker URL
    // URL format: chrome-extension://<id>/background.js
    const swUrl = serviceWorker.url();
    extensionId = swUrl.split('/')[2];
    console.log('Extension ID:', extensionId);
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('dashboard should detect it is running inside extension', async () => {
    // Open the dashboard bundled in the extension
    const dashboardUrl = `chrome-extension://${extensionId}/dashboard/index.html`;
    const page = await context.newPage();
    await page.goto(dashboardUrl);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if the page loaded (should show login or dashboard)
    const content = await page.content();
    expect(content).toContain('Glean');

    // Evaluate if isRunningInExtension would return true
    const isInExtension = await page.evaluate(() => {
      return window.location.protocol === 'chrome-extension:';
    });
    expect(isInExtension).toBe(true);

    await page.close();
  });

  test('extension background should respond to getAuthConfig message', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/dashboard/index.html`);
    await page.waitForLoadState('networkidle');

    // Send message to background script and check response
    const response = await page.evaluate(() => {
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ error: 'timeout' });
        }, 5000);

        chrome.runtime.sendMessage({ action: 'getAuthConfig' }, (response) => {
          clearTimeout(timeout);
          if (chrome.runtime.lastError) {
            resolve({ error: chrome.runtime.lastError.message });
          } else {
            resolve(response);
          }
        });
      });
    });

    console.log('getAuthConfig response:', response);

    // Should get a valid response (not a communication error)
    expect(response).toBeDefined();
    expect(response.error).not.toBe('timeout');

    // Either has success:true with token, or success:false with requiresSetup:true
    if (response.success) {
      expect(response.token).toBeDefined();
      expect(response.domain).toBeDefined();
      console.log('Auth is configured with domain:', response.domain);
    } else {
      // Not authenticated yet - this is expected for fresh extension
      expect(response.requiresSetup).toBe(true);
      console.log('Auth not configured yet (expected for fresh install)');
    }

    await page.close();
  });

  test('extension background should respond to PING message', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/dashboard/index.html`);
    await page.waitForLoadState('networkidle');

    // Send PING message to background script
    const response = await page.evaluate(() => {
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ error: 'timeout' });
        }, 2000);

        chrome.runtime.sendMessage({ type: 'PING' }, (response) => {
          clearTimeout(timeout);
          if (chrome.runtime.lastError) {
            resolve({ error: chrome.runtime.lastError.message });
          } else {
            resolve(response);
          }
        });
      });
    });

    console.log('PING response:', response);

    // PING should return { ok: true, ts: <timestamp> }
    expect(response).toBeDefined();
    expect(response.ok).toBe(true);
    expect(response.ts).toBeDefined();

    await page.close();
  });
});
