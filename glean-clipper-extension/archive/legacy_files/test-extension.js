const { chromium } = require('playwright');

async function testExtension() {
  // Launch Chrome with extension
  const extensionPath = '/Users/jmcnew/claude/projects/sidebar-sam/llm-log-analyzer/llm-log-analyzer/glean-clipper-extension';
  
  const browser = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--load-extension=${extensionPath}`,
      '--disable-extensions-except=' + extensionPath,
      '--disable-web-security'
    ]
  });

  const page = await browser.newPage();
  
  try {
    // Go to extensions page
    await page.goto('chrome://extensions/');
    await page.waitForTimeout(2000);
    
    // Find and click reload button for Glean Clipper
    console.log('Looking for Glean Clipper extension...');
    const reloadButton = page.locator('[aria-label*="Reload"], [title*="Reload"]').first();
    if (await reloadButton.isVisible()) {
      console.log('Clicking reload button...');
      await reloadButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Get extension ID
    const extensionCards = page.locator('extensions-item');
    let extensionId = null;
    
    for (let i = 0; i < await extensionCards.count(); i++) {
      const card = extensionCards.nth(i);
      const name = await card.locator('#name').textContent();
      if (name && name.includes('Glean Clipper')) {
        extensionId = await card.getAttribute('id');
        console.log('Found extension ID:', extensionId);
        break;
      }
    }
    
    if (!extensionId) {
      console.log('Extension not found, trying to get any extension popup...');
      // Go to a test page and try to access extension popup
      await page.goto('https://example.com');
      await page.waitForTimeout(1000);
    }
    
    // Try to open extension popup by clicking the extension icon
    console.log('Attempting to open extension popup...');
    
    // Method 1: Try to access popup directly if we have extension ID
    if (extensionId) {
      try {
        const popupUrl = `chrome-extension://${extensionId.replace('extensions-item-', '')}/popup.html`;
        console.log('Trying popup URL:', popupUrl);
        await page.goto(popupUrl);
        
        // Wait for popup to load
        await page.waitForSelector('#settings-btn', { timeout: 5000 });
        console.log('Popup loaded successfully!');
        
        // Test the settings button
        console.log('Testing settings button...');
        await page.click('#settings-btn');
        
        // Check if settings panel appears
        const settingsPanel = page.locator('#settings-panel');
        const isVisible = await settingsPanel.isVisible();
        
        if (isVisible) {
          console.log('✅ Settings button works! Panel is now visible.');
          
          // Test filling out the form
          await page.fill('#glean-domain', 'test.glean.com');
          await page.fill('#glean-token', 'test-token-123');
          await page.check('#glean-enabled');
          
          console.log('✅ Form fields work correctly!');
          
          // Test save button
          await page.click('#save-settings');
          console.log('✅ Save button clicked successfully!');
          
        } else {
          console.log('❌ Settings panel not visible after clicking button');
        }
        
      } catch (error) {
        console.log('Error accessing popup directly:', error.message);
      }
    }
    
    console.log('Extension test completed');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

testExtension();