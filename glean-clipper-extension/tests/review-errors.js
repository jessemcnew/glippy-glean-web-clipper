/**
 * Interactive error review script
 * Opens browser with extension and checks for errors
 * Run with: node tests/review-errors.js
 */

import { chromium } from 'playwright';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const extensionPath = join(__dirname, '..');

async function reviewErrors() {
  console.log('🔍 Starting Extension Error Review...\n');

  // Check files exist
  console.log('📁 Checking UI Files:');
  const files = [
    { name: 'reader.html', desc: 'Recent Clips page' },
    { name: 'library.html', desc: 'Library/Notebook page' },
    { name: 'prompts.html', desc: 'Saved Prompts page' },
    { name: 'reader.css', desc: 'Reader styles' },
    { name: 'library.css', desc: 'Library styles' },
    { name: 'prompts.css', desc: 'Prompts styles' },
  ];

  files.forEach(file => {
    const path = join(extensionPath, file.name);
    const exists = existsSync(path);
    console.log(`  ${exists ? '✅' : '❌'} ${file.name} - ${file.desc}`);
  });

  // Check manifest
  console.log('\n📦 Checking Manifest:');
  const manifestPath = join(extensionPath, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  const webAccessible = manifest.web_accessible_resources?.[0]?.resources || [];
  
  const required = ['reader.html', 'library.html', 'prompts.html', 'reader.css', 'library.css', 'prompts.css'];
  required.forEach(resource => {
    const included = webAccessible.includes(resource);
    console.log(`  ${included ? '✅' : '❌'} ${resource} ${included ? 'in manifest' : 'MISSING from manifest!'}`);
  });

  // Launch browser
  console.log('\n🚀 Launching browser with extension...\n');
  
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  // Collect errors
  const errors = [];
  const warnings = [];

  context.on('page', page => {
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        if (!text.includes('favicon') && !text.includes('DevTools')) {
          errors.push({ page: page.url(), message: text });
        }
      } else if (msg.type() === 'warning') {
        warnings.push({ page: page.url(), message: text });
      }
    });

    page.on('pageerror', error => {
      errors.push({ page: page.url(), message: error.message });
    });
  });

  // Wait for extension to initialize
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Open extensions page
  const extensionsPage = await context.newPage();
  await extensionsPage.goto('chrome://extensions');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Print summary
  console.log('='.repeat(60));
  console.log('📊 ERROR SUMMARY');
  console.log('='.repeat(60));
  
  if (errors.length === 0) {
    console.log('✅ No errors found!');
  } else {
    console.log(`❌ Found ${errors.length} error(s):\n`);
    errors.forEach((err, i) => {
      console.log(`${i + 1}. [${err.page}]`);
      console.log(`   ${err.message}\n`);
    });
  }

  if (warnings.length > 0) {
    console.log(`⚠️  Found ${warnings.length} warning(s):\n`);
    warnings.slice(0, 5).forEach((warn, i) => {
      console.log(`${i + 1}. [${warn.page}]`);
      console.log(`   ${warn.message}\n`);
    });
    if (warnings.length > 5) {
      console.log(`   ... and ${warnings.length - 5} more warnings\n`);
    }
  }

  console.log('='.repeat(60));
  console.log('\n🔍 Browser is open for manual inspection:');
  console.log('   1. Check chrome://extensions for errors');
  console.log('   2. Click extension icon to test popup');
  console.log('   3. Click "Recent Clips" - should open reader.html');
  console.log('   4. Click "Library" - should open library.html');
  console.log('   5. Click "Saved Prompts" - should open prompts.html');
  console.log('\n⏸️  Browser will stay open. Press Ctrl+C to close.\n');

  // Keep open
  process.on('SIGINT', async () => {
    console.log('\n\n👋 Closing browser...');
    await context.close();
    process.exit(0);
  });

  await new Promise(() => {});
}

reviewErrors().catch(console.error);








