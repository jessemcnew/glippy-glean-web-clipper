const { test, expect, chromium } = require('@playwright/test');
const path = require('path');

test.describe('Command Palette', () => {
  let browser;
  let context;
  let extensionId;

  test.beforeAll(async () => {
    const extensionPath = path.resolve(__dirname, '..');

    browser = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
      ],
    });

    // Wait for service worker
    for (let i = 0; i < 10; i++) {
      const workers = browser.serviceWorkers();
      const sw = workers.find(w => w.url().includes('background.js'));
      if (sw) {
        extensionId = sw.url().split('/')[2];
        break;
      }
      await new Promise(r => setTimeout(r, 500));
    }
  });

  test.afterAll(async () => {
    await browser?.close();
  });

  test('command palette file exists and is syntactically valid', async () => {
    const page = await browser.newPage();

    // Navigate to a simple page
    await page.goto('https://example.com');
    await page.waitForLoadState('domcontentloaded');
    await new Promise(r => setTimeout(r, 500));

    // Try to open command palette - if it works, the script loaded correctly
    await page.keyboard.press('Meta+k');
    await new Promise(r => setTimeout(r, 300));

    // Check if command palette appeared (proves the script loaded)
    const paletteExists = await page.evaluate(() => {
      const palette = document.querySelector('.glippy-command-palette-overlay');
      return palette !== null;
    });

    expect(paletteExists).toBe(true);

    await page.close();
  });

  test('command palette opens with Cmd+K', async () => {
    const page = await browser.newPage();

    await page.goto('https://example.com');
    await page.waitForLoadState('domcontentloaded');
    await new Promise(r => setTimeout(r, 500));

    // Press Cmd+K (or Ctrl+K on non-Mac)
    await page.keyboard.press('Meta+k');
    await new Promise(r => setTimeout(r, 300));

    // Check if command palette is visible
    const paletteVisible = await page.evaluate(() => {
      const palette = document.querySelector('.glippy-command-palette-overlay');
      return palette && palette.style.display === 'flex';
    });

    expect(paletteVisible).toBe(true);

    await page.close();
  });

  test('command palette has all expected commands', async () => {
    const page = await browser.newPage();

    await page.goto('https://example.com');
    await page.waitForLoadState('domcontentloaded');
    await new Promise(r => setTimeout(r, 500));

    // Open command palette
    await page.keyboard.press('Meta+k');
    await new Promise(r => setTimeout(r, 300));

    // Check for expected commands
    const commands = await page.evaluate(() => {
      const items = document.querySelectorAll('.glippy-command-palette-item-label');
      return Array.from(items).map(el => el.textContent);
    });

    expect(commands).toContain('Clip Selection');
    expect(commands).toContain('Save URL');
    expect(commands).toContain('Recent Clips');
    expect(commands).toContain('Library');
    expect(commands).toContain('Prompts');
    expect(commands).toContain('Preferences');

    await page.close();
  });

  test('command palette closes with Escape', async () => {
    const page = await browser.newPage();

    await page.goto('https://example.com');
    await page.waitForLoadState('domcontentloaded');
    await new Promise(r => setTimeout(r, 500));

    // Open command palette
    await page.keyboard.press('Meta+k');
    await new Promise(r => setTimeout(r, 300));

    // Press Escape
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 200));

    // Check if command palette is hidden
    const paletteVisible = await page.evaluate(() => {
      const palette = document.querySelector('.glippy-command-palette-overlay');
      return palette && palette.style.display === 'flex';
    });

    expect(paletteVisible).toBe(false);

    await page.close();
  });

  test('command palette search filters results', async () => {
    const page = await browser.newPage();

    await page.goto('https://example.com');
    await page.waitForLoadState('domcontentloaded');
    await new Promise(r => setTimeout(r, 500));

    // Open command palette
    await page.keyboard.press('Meta+k');
    await new Promise(r => setTimeout(r, 300));

    // Type in search
    await page.keyboard.type('library');
    await new Promise(r => setTimeout(r, 200));

    // Check filtered results
    const commands = await page.evaluate(() => {
      const items = document.querySelectorAll('.glippy-command-palette-item-label');
      return Array.from(items).map(el => el.textContent);
    });

    expect(commands).toContain('Library');
    // Should not show unrelated items
    expect(commands.length).toBeLessThan(11); // Less than all 11 commands

    await page.close();
  });
});
