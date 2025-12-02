const { chromium } = require('playwright');
const path = require('path');

async function testExtensionWithLogs() {
  // Launch Chrome with extension loaded
  const extensionPath = __dirname;
  
  console.log('🚀 Loading extension from:', extensionPath);
  
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--load-extension=${extensionPath}`,
      '--disable-extensions-except=' + extensionPath,
      '--disable-web-security'
    ]
  });

  const page = await context.newPage();
  
  // Capture all console messages
  page.on('console', msg => {
    console.log(`🔍 PAGE: ${msg.type()}: ${msg.text()}`);
  });
  
  try {
    // Navigate to a test page
    await page.goto('https://example.com');
    console.log('✅ Navigated to test page');
    
    // Wait a moment for extension to load
    await page.waitForTimeout(2000);
    
    // Check if extension is loaded
    const hasExtension = await page.evaluate(() => {
      return !!window.chrome?.runtime?.id;
    });
    
    console.log('🔧 Extension context available:', hasExtension);
    
    // Try to select text and trigger clipping
    const clipResult = await page.evaluate(() => {
      // Select the h1 text
      const h1 = document.querySelector('h1');
      if (h1) {
        const range = document.createRange();
        range.selectNodeContents(h1);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Simulate clip button click after a moment
        setTimeout(() => {
          const clipButton = document.getElementById('glean-clip-button');
          if (clipButton) {
            console.log('📎 Found clip button, clicking...');
            clipButton.click();
          } else {
            console.log('❌ No clip button found');
          }
        }, 100);
        
        return { 
          selectedText: selection.toString(),
          hasClipButton: !!document.getElementById('glean-clip-button')
        };
      }
      return null;
    });
    
    console.log('📋 Clip result:', clipResult);
    
    // Wait for clipping to complete and check logs
    await page.waitForTimeout(3000);
    
    // Try to access extension popup
    try {
      console.log('📱 Trying to access extension popup...');
      
      // Get extension ID by checking chrome.runtime
      const extensionInfo = await page.evaluate(() => {
        return {
          id: window.chrome?.runtime?.id || 'unknown',
          hasRuntime: !!window.chrome?.runtime
        };
      });
      
      console.log('🔧 Extension info:', extensionInfo);
      
    } catch (error) {
      console.log('❌ Error accessing extension:', error.message);
    }
    
    console.log('✅ Test completed - keeping browser open for inspection');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  } finally {
    await context.close();
  }
}

testExtensionWithLogs();