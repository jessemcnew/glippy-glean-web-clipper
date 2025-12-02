const { chromium } = require('playwright');
const path = require('path');

async function testPopup() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Capture console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      console.log(`Browser console - ${msg.type()}: ${msg.text()}`);
    });
    
    // Load the popup HTML file directly
    const popupPath = `file://${__dirname}/popup.html`;
    console.log('Loading popup from:', popupPath);
    
    await page.goto(popupPath);
    await page.waitForTimeout(2000);
    
    // Check if popup loaded
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check if settings button exists
    const settingsBtn = page.locator('#settings-btn');
    const btnExists = await settingsBtn.isVisible();
    console.log('Settings button exists:', btnExists);
    
    if (btnExists) {
      // Click the settings button
      console.log('Clicking settings button...');
      await settingsBtn.click();
      
      // Wait a moment for the panel to appear
      await page.waitForTimeout(500);
      
      // Check if settings panel is visible
      const settingsPanel = page.locator('#settings-panel');
      const panelVisible = await settingsPanel.isVisible();
      console.log('Settings panel visible after click:', panelVisible);
      
      if (panelVisible) {
        console.log('✅ Settings button works! Testing form...');
        
        // Test form fields
        await page.fill('#glean-domain', 'test.glean.com');
        await page.fill('#glean-token', 'test-token-123');
        await page.check('#glean-enabled');
        
        console.log('✅ Form fields filled successfully!');
        
        // Check connection status
        const status = await page.locator('#connection-status').textContent();
        console.log('Connection status:', status);
        
        // Test save button
        await page.click('#save-settings');
        console.log('✅ Save button clicked!');
        
        // Wait for feedback
        await page.waitForTimeout(1000);
        const saveText = await page.locator('#save-settings').textContent();
        console.log('Save button text after click:', saveText);
        
      } else {
        console.log('❌ Settings panel not visible');
        
        // Let's check for any errors
        const consoleMessages = [];
        page.on('console', msg => consoleMessages.push(msg.text()));
        
        // Check if panel has the right classes
        const panelClasses = await settingsPanel.getAttribute('class');
        console.log('Settings panel classes:', panelClasses);
      }
      
    } else {
      console.log('❌ Settings button not found');
    }
    
    // Check for console errors
    const errors = await page.evaluate(() => {
      return window.errors || [];
    });
    
    if (errors.length > 0) {
      console.log('JavaScript errors found:', errors);
    }
    
    // Keep browser open for inspection
    console.log('Test complete - keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

testPopup();