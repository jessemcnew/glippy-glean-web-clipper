/**
 * Debug script to check __next_f array content
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

  const extensionId = serviceWorker.url().split('/')[2];

  // Test both pages
  for (const pagePath of ['index.html', 'library/index.html']) {
    console.log(`\n========== Testing ${pagePath} ==========`);
    const page = await browser.newPage();

    page.on('pageerror', err => {
      console.log(`[Page Error]: ${err.message}`);
    });

    await page.goto(`chrome-extension://${extensionId}/dashboard/${pagePath}`);
    await page.waitForLoadState('networkidle');
    await new Promise(r => setTimeout(r, 3000));

    const info = await page.evaluate(() => {
      return {
        nextF: typeof self.__next_f !== 'undefined' ? self.__next_f.map((item, i) => ({
          index: i,
          type: typeof item,
          isArray: Array.isArray(item),
          length: Array.isArray(item) ? item.length : null,
          firstElement: Array.isArray(item) && item.length > 0 ? item[0] : null,
          preview: Array.isArray(item) && item.length > 1 ?
            (typeof item[1] === 'string' ? item[1].substring(0, 100) : typeof item[1]) : null
        })) : null,
        hasReact: typeof React !== 'undefined',
        hasReactDOM: typeof ReactDOM !== 'undefined',
        bodyChildren: document.body.children.length,
        hasSpinner: document.body.innerHTML.includes('animate-spin'),
      };
    });

    console.log('__next_f array:', JSON.stringify(info.nextF, null, 2));
    console.log('Has React:', info.hasReact);
    console.log('Has ReactDOM:', info.hasReactDOM);
    console.log('Body children:', info.bodyChildren);
    console.log('Has spinner:', info.hasSpinner);

    await page.close();
  }

  await browser.close();
})();
