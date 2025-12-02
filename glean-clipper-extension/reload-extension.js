const puppeteer = require('puppeteer');
const path = require('path');

async function reloadExtension() {
  console.log('Starting Chrome extension reload and test...');

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--disable-extensions-except=' + __dirname,
      '--load-extension=' + __dirname,
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
    ],
  });

  try {
    const page = await browser.newPage();

    // Navigate to extensions page
    await page.goto('chrome://extensions/');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Enable developer mode if not already enabled
    try {
      const devModeToggle = await page.$('cr-toggle#devMode');
      if (devModeToggle) {
        const isChecked = await page.evaluate(toggle => toggle.checked, devModeToggle);
        if (!isChecked) {
          console.log('Enabling developer mode...');
          await devModeToggle.click();
          await page.waitForTimeout(1000);
        }
      }
    } catch (e) {
      // Developer mode toggle might not be found, continue
    }

    console.log('Looking for Glean Clipper extension...');

    // Look for the extension and reload it
    try {
      // Wait for extensions to load
      await page.waitForTimeout(2000);

      // Find and click reload button for our extension
      const reloadButton = await page.$('cr-icon-button[aria-label*="Reload"]');
      if (reloadButton) {
        await reloadButton.click();
        console.log('Extension reloaded successfully!');
        await page.waitForTimeout(2000);
      } else {
        console.log('Reload button not found, extension may not be loaded');
      }
    } catch (e) {
      console.error('Error reloading extension:', e.message);
    }

    // Try to test the extension by looking for its icon
    try {
      console.log('Attempting to test extension icon...');

      // Navigate to a test page
      await page.goto('https://example.com');
      await page.waitForTimeout(2000);

      // Look for extension icon in toolbar (this is tricky with Puppeteer)
      // For now, just log that we've navigated to a test page
      console.log('Navigated to test page - extension should be active');
    } catch (e) {
      console.log('Extension icon not visible in toolbar');
    }

    console.log('\nExtension reload complete!');
    console.log('You can now test the extension manually.');
    console.log('- Click the extension icon in the toolbar');
    console.log('- Try clipping some text from the current page');
    console.log('- Check the popup interface');

    console.log('\nKeeping browser open for manual testing...');
    console.log('Close this terminal or press Ctrl+C to exit');

    // Keep the browser open for manual testing
    await new Promise(() => {}); // This will keep the process running
  } catch (error) {
    console.error('Error during extension reload:', error);
  } finally {
    // Don't close browser automatically - let user test manually
    // await browser.close();
  }
}

reloadExtension().catch(console.error);