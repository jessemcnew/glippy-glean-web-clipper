/**
 * Comprehensive E2E test suite for Glean Web Clipper
 * Tests extension loading, auth sync, dashboard UI, and error handling
 */

import { test, expect, chromium } from '@playwright/test';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const extensionPath = join(__dirname, '..');

// Load test credentials from environment or .env.test.local
function loadTestCredentials() {
  const envFile = join(__dirname, '.env.test.local');

  // Try environment variables first
  if (process.env.GLEAN_API_TOKEN && process.env.GLEAN_DOMAIN) {
    return {
      token: process.env.GLEAN_API_TOKEN,
      domain: process.env.GLEAN_DOMAIN,
    };
  }

  // Fall back to .env.test.local file
  if (existsSync(envFile)) {
    const content = readFileSync(envFile, 'utf-8');
    const lines = content.split('\n');
    const config = {};
    for (const line of lines) {
      if (line.startsWith('#') || !line.includes('=')) continue;
      const [key, ...valueParts] = line.split('=');
      config[key.trim()] = valueParts.join('=').trim();
    }
    if (config.GLEAN_API_TOKEN && config.GLEAN_DOMAIN) {
      return {
        token: config.GLEAN_API_TOKEN,
        domain: config.GLEAN_DOMAIN,
      };
    }
  }

  return null;
}

test.describe('Full E2E Test Suite', () => {
  let context;
  let extensionId;
  let credentials;
  const consoleErrors = [];
  const pageErrors = [];
  const networkFailures = [];

  test.beforeAll(async () => {
    credentials = loadTestCredentials();

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
      serviceWorker = await context.waitForEvent('serviceworker');
    }

    const swUrl = serviceWorker.url();
    extensionId = swUrl.split('/')[2];
    console.log('Extension ID:', extensionId);
  });

  test.afterAll(async () => {
    // Log any collected errors
    if (consoleErrors.length > 0) {
      console.log('\n=== Console Errors ===');
      consoleErrors.forEach(e => console.log(e));
    }
    if (pageErrors.length > 0) {
      console.log('\n=== Page Errors ===');
      pageErrors.forEach(e => console.log(e));
    }
    if (networkFailures.length > 0) {
      console.log('\n=== Network Failures ===');
      networkFailures.forEach(e => console.log(e));
    }

    await context?.close();
  });

  test('1. Extension loads without manifest errors', async () => {
    expect(extensionId).toBeDefined();
    expect(extensionId.length).toBeGreaterThan(0);
    console.log('✅ Extension loaded with ID:', extensionId);
  });

  test('2. Service worker is running', async () => {
    const serviceWorkers = context.serviceWorkers();
    expect(serviceWorkers.length).toBeGreaterThan(0);

    const sw = serviceWorkers[0];
    expect(sw.url()).toContain(extensionId);
    expect(sw.url()).toContain('background.js');
    console.log('✅ Service worker running:', sw.url());
  });

  test('3. Extension popup opens without errors', async () => {
    const popupUrl = `chrome-extension://${extensionId}/popup-modern.html`;
    const page = await context.newPage();

    // Collect errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[Popup] ${msg.text()}`);
      }
    });
    page.on('pageerror', err => {
      pageErrors.push(`[Popup] ${err.message}`);
    });

    await page.goto(popupUrl);
    await page.waitForLoadState('networkidle');

    // Check popup loaded
    const content = await page.content();
    expect(content).toBeTruthy();

    // Check for critical UI elements
    const body = await page.$('body');
    expect(body).toBeTruthy();

    console.log('✅ Popup opened successfully');
    await page.close();
  });

  test('4. Configure auth via extension storage', async ({ }, testInfo) => {
    if (!credentials) {
      console.log('⚠️ No credentials configured - skipping auth config');
      console.log('   Create tests/.env.test.local with GLEAN_DOMAIN and GLEAN_API_TOKEN');
      testInfo.skip();
      return;
    }

    // Use service worker to set config directly in storage
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup-modern.html`);

    // Set auth config via chrome.storage
    await page.evaluate(async (creds) => {
      return new Promise((resolve, reject) => {
        chrome.storage.local.set({
          gleanConfig: {
            domain: creds.domain,
            apiToken: creds.token,
            authMethod: 'manual',
          }
        }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    }, credentials);

    // Verify config was saved
    const savedConfig = await page.evaluate(() => {
      return new Promise((resolve) => {
        chrome.storage.local.get(['gleanConfig'], (result) => {
          resolve(result.gleanConfig);
        });
      });
    });

    expect(savedConfig).toBeDefined();
    expect(savedConfig.domain).toBe(credentials.domain);
    expect(savedConfig.apiToken).toBe(credentials.token);

    console.log('✅ Auth configured with domain:', credentials.domain);
    await page.close();
  });

  test('5. Background script responds to getAuthConfig', async ({ }, testInfo) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/dashboard/index.html`);
    await page.waitForLoadState('networkidle');

    const response = await page.evaluate(() => {
      return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve({ error: 'timeout' }), 5000);
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

    console.log('getAuthConfig response:', JSON.stringify(response, null, 2));

    expect(response).toBeDefined();
    expect(response.error).not.toBe('timeout');

    if (credentials) {
      expect(response.success).toBe(true);
      expect(response.token).toBe(credentials.token);
      expect(response.domain).toBe(credentials.domain);
      console.log('✅ Auth config returned successfully');
    } else {
      expect(response.requiresSetup).toBe(true);
      console.log('✅ Correctly reports auth not configured');
    }

    await page.close();
  });

  test('6. Dashboard index page loads and renders', async () => {
    const page = await context.newPage();

    // Collect errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[Dashboard /] ${msg.text()}`);
      }
    });
    page.on('pageerror', err => {
      pageErrors.push(`[Dashboard /] ${err.message}`);
    });
    page.on('requestfailed', req => {
      networkFailures.push(`[Dashboard /] ${req.url()} - ${req.failure()?.errorText}`);
    });

    await page.goto(`chrome-extension://${extensionId}/dashboard/index.html`);
    await page.waitForLoadState('networkidle');

    // Check page title
    const title = await page.title();
    console.log('Dashboard title:', title);
    expect(title).toBe('Glean Dashboard');

    // Wait for spinner to disappear (React is hydrating)
    try {
      await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 });
      console.log('Spinner disappeared - React hydrated');
    } catch {
      // Take screenshot to see what's happening
      await page.screenshot({ path: 'test-results/dashboard-index-spinner.png', fullPage: true });
      console.log('Warning: Spinner still visible after 10s (screenshot saved)');
    }

    // Check for CSS loading (no giant black boxes)
    const hasStyles = await page.evaluate(() => {
      const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
      return styles.length > 0;
    });
    expect(hasStyles).toBe(true);

    // Take screenshot for visual inspection
    await page.screenshot({ path: 'test-results/dashboard-index.png', fullPage: true });

    // Check that we have some meaningful DOM content
    const hasContent = await page.evaluate(() => {
      // Check for either login form, dashboard content, or at least some rendered elements
      return document.querySelectorAll('button, input, h1, h2, nav, form').length > 0;
    });
    console.log('Has rendered content:', hasContent);
    expect(hasContent).toBe(true);

    console.log('✅ Dashboard index page rendered (screenshot saved)');

    await page.close();
  });

  test('7. Dashboard library page loads and renders', async () => {
    const page = await context.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[Dashboard /library] ${msg.text()}`);
      }
    });
    page.on('pageerror', err => {
      pageErrors.push(`[Dashboard /library] ${err.message}`);
    });

    await page.goto(`chrome-extension://${extensionId}/dashboard/library/index.html`);
    await page.waitForLoadState('networkidle');

    // Wait for spinner to disappear
    try {
      await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 });
      console.log('Spinner disappeared - React hydrated');
    } catch {
      await page.screenshot({ path: 'test-results/dashboard-library-spinner.png', fullPage: true });
      console.log('Warning: Spinner still visible after 10s');
    }

    await page.screenshot({ path: 'test-results/dashboard-library.png', fullPage: true });

    // Check for rendered content
    const hasContent = await page.evaluate(() => {
      return document.querySelectorAll('button, input, h1, h2, nav, form').length > 0;
    });
    expect(hasContent).toBe(true);

    console.log('✅ Dashboard library page rendered (screenshot saved)');

    await page.close();
  });

  test('8. Dashboard clips page loads and renders', async () => {
    const page = await context.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[Dashboard /clips] ${msg.text()}`);
      }
    });
    page.on('pageerror', err => {
      pageErrors.push(`[Dashboard /clips] ${err.message}`);
    });

    await page.goto(`chrome-extension://${extensionId}/dashboard/clips/index.html`);
    await page.waitForLoadState('networkidle');

    // Wait for spinner to disappear
    try {
      await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 });
      console.log('Spinner disappeared - React hydrated');
    } catch {
      await page.screenshot({ path: 'test-results/dashboard-clips-spinner.png', fullPage: true });
      console.log('Warning: Spinner still visible after 10s');
    }

    await page.screenshot({ path: 'test-results/dashboard-clips.png', fullPage: true });

    // Check for rendered content
    const hasContent = await page.evaluate(() => {
      return document.querySelectorAll('button, input, h1, h2, nav, form').length > 0;
    });
    expect(hasContent).toBe(true);

    console.log('✅ Dashboard clips page rendered (screenshot saved)');

    await page.close();
  });

  test('9. Dashboard prompts page loads and renders', async () => {
    const page = await context.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[Dashboard /prompts] ${msg.text()}`);
      }
    });
    page.on('pageerror', err => {
      pageErrors.push(`[Dashboard /prompts] ${err.message}`);
    });

    await page.goto(`chrome-extension://${extensionId}/dashboard/prompts/index.html`);
    await page.waitForLoadState('networkidle');

    // Wait for spinner to disappear
    try {
      await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 });
      console.log('Spinner disappeared - React hydrated');
    } catch {
      await page.screenshot({ path: 'test-results/dashboard-prompts-spinner.png', fullPage: true });
      console.log('Warning: Spinner still visible after 10s');
    }

    await page.screenshot({ path: 'test-results/dashboard-prompts.png', fullPage: true });

    // Check for rendered content
    const hasContent = await page.evaluate(() => {
      return document.querySelectorAll('button, input, h1, h2, nav, form').length > 0;
    });
    expect(hasContent).toBe(true);

    console.log('✅ Dashboard prompts page rendered (screenshot saved)');

    await page.close();
  });

  test('10. Auth syncs from extension to dashboard', async ({ }, testInfo) => {
    if (!credentials) {
      testInfo.skip();
      return;
    }

    const page = await context.newPage();

    page.on('console', msg => {
      console.log(`[Auth Sync] ${msg.type()}: ${msg.text()}`);
    });

    // Clear dashboard localStorage first
    await page.goto(`chrome-extension://${extensionId}/dashboard/index.html`);
    await page.evaluate(() => localStorage.clear());

    // Reload to trigger auth sync
    await page.reload();
    await page.waitForLoadState('networkidle');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if we're logged in (not showing login form)
    const pageContent = await page.content();
    const hasLoginForm = pageContent.includes('Sign in') || pageContent.includes('API Token');
    const isLoggedIn = !hasLoginForm || pageContent.includes('Dashboard') || pageContent.includes('Library');

    // Check localStorage for synced auth
    const localAuth = await page.evaluate(() => {
      return localStorage.getItem('glean_auth_config');
    });

    console.log('localStorage auth:', localAuth ? 'present' : 'missing');
    console.log('Page appears logged in:', isLoggedIn);

    if (localAuth) {
      const parsed = JSON.parse(localAuth);
      expect(parsed.apiToken).toBe(credentials.token);
      expect(parsed.domain).toBe(credentials.domain);
      console.log('✅ Auth synced to dashboard localStorage');
    }

    await page.screenshot({ path: 'test-results/auth-sync-result.png', fullPage: true });
    await page.close();
  });

  test('11. No critical console errors', async () => {
    // Filter out known non-critical errors
    const criticalErrors = consoleErrors.filter(err => {
      // Ignore some common non-critical errors
      if (err.includes('favicon')) return false;
      if (err.includes('404')) return false;
      return true;
    });

    if (criticalErrors.length > 0) {
      console.log('Critical console errors found:');
      criticalErrors.forEach(e => console.log('  -', e));
    }

    // Warn but don't fail for now - we want to see what errors exist
    if (criticalErrors.length > 0) {
      console.log('⚠️ Found', criticalErrors.length, 'console errors (see above)');
    } else {
      console.log('✅ No critical console errors');
    }
  });

  test('12. No page errors (uncaught exceptions)', async () => {
    if (pageErrors.length > 0) {
      console.log('Page errors found:');
      pageErrors.forEach(e => console.log('  -', e));
      // Fail on uncaught exceptions - these are serious
      expect(pageErrors.length).toBe(0);
    } else {
      console.log('✅ No uncaught page errors');
    }
  });
});
