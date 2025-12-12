/**
 * Debug script to check why library page isn't rendering
 */
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const extensionPath = path.resolve(__dirname, '..');

  const browser = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
    ],
  });

  // Wait for service worker to start
  let serviceWorker;
  for (let i = 0; i < 10; i++) {
    const workers = browser.serviceWorkers();
    serviceWorker = workers.find(w => w.url().includes('background.js'));
    if (serviceWorker) break;
    await new Promise(r => setTimeout(r, 500));
  }

  if (!serviceWorker) {
    console.error('No service worker found!');
    await browser.close();
    process.exit(1);
  }

  // Get extension ID
  const extensionId = serviceWorker.url().split('/')[2];
  console.log('Extension ID:', extensionId);

  const page = await browser.newPage();

  // Capture ALL console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[Console ${type}]: ${text}`);
  });

  page.on('pageerror', err => {
    console.log(`[Page Error]: ${err.message}`);
    console.log(`[Page Error Stack]: ${err.stack}`);
  });

  page.on('requestfailed', req => {
    console.log(`[Request Failed]: ${req.url()} - ${req.failure()?.errorText}`);
  });

  // Also log requests to see what's loading
  page.on('request', req => {
    const url = req.url();
    if (url.includes('_next') || url.includes('_inline')) {
      console.log(`[Request]: ${url}`);
    }
  });

  page.on('response', res => {
    const url = res.url();
    if ((url.includes('_next') || url.includes('_inline')) && res.status() !== 200) {
      console.log(`[Response ${res.status()}]: ${url}`);
    }
  });

  console.log('\n--- Loading library page ---');
  await page.goto(`chrome-extension://${extensionId}/dashboard/library/index.html`);
  await page.waitForLoadState('networkidle');
  console.log('\n--- Network idle, waiting 10s for React ---');
  await new Promise(r => setTimeout(r, 10000));

  // Check what's in the DOM
  const htmlContent = await page.content();
  console.log('\n--- DOM summary ---');
  console.log('Has animate-spin:', htmlContent.includes('animate-spin'));
  console.log('Has Glean Dashboard:', htmlContent.includes('Glean Dashboard'));

  const elements = await page.evaluate(() => {
    return {
      scripts: document.querySelectorAll('script').length,
      buttons: document.querySelectorAll('button').length,
      inputs: document.querySelectorAll('input').length,
      divs: document.querySelectorAll('div').length,
      bodyText: document.body.innerText.substring(0, 200),
      // Check if __next_f exists
      hasNextF: typeof self.__next_f !== 'undefined',
      nextFLength: typeof self.__next_f !== 'undefined' ? self.__next_f.length : 0,
    };
  });
  console.log('Elements:', JSON.stringify(elements, null, 2));

  // Take screenshot
  await page.screenshot({ path: 'test-results/debug-library.png', fullPage: true });
  console.log('\nScreenshot saved to test-results/debug-library.png');

  // Check if there are any errors in window
  const windowErrors = await page.evaluate(() => {
    return {
      errors: window.__errors || [],
      nextErrors: window.__next_errors || [],
    };
  });
  console.log('Window errors:', JSON.stringify(windowErrors, null, 2));

  await browser.close();
})();
