/**
 * Simple Node.js test to validate manifest.json
 * Can be run without Playwright for quick validation
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const extensionPath = join(__dirname, '..');
const manifestPath = join(extensionPath, 'manifest.json');

console.log('🔍 Validating manifest.json...\n');

try {
  // Read and parse manifest
  const manifestContent = readFileSync(manifestPath, 'utf-8');
  const manifest = JSON.parse(manifestContent);
  
  console.log('✅ manifest.json is valid JSON');
  
  // Check required fields
  const required = ['manifest_version', 'name', 'version', 'description'];
  let allValid = true;
  
  required.forEach(field => {
    if (manifest[field]) {
      console.log(`✅ ${field}: ${manifest[field]}`);
    } else {
      console.log(`❌ Missing required field: ${field}`);
      allValid = false;
    }
  });
  
  // Check oauth2
  if (manifest.oauth2) {
    if (!manifest.oauth2.client_id || manifest.oauth2.client_id === '' || manifest.oauth2.client_id.includes('YOUR_')) {
      console.log(`❌ Invalid oauth2.client_id: "${manifest.oauth2.client_id}"`);
      console.log('   Chrome requires a valid client_id or the oauth2 section should be removed');
      allValid = false;
    } else {
      console.log(`✅ oauth2.client_id: ${manifest.oauth2.client_id}`);
    }
  } else {
    console.log('✅ No oauth2 section (optional, fine if OAuth not configured)');
  }
  
  // Check required files exist
  const fs = await import('fs');
  const requiredFiles = [
    'background.js',
    'content.js',
    'popup-modern.html',
    'popup.js',
    'icon128.png'
  ];
  
  console.log('\n📁 Checking required files...');
  requiredFiles.forEach(file => {
    const filePath = join(extensionPath, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ Missing: ${file}`);
      allValid = false;
    }
  });
  
  console.log('\n' + '='.repeat(50));
  if (allValid) {
    console.log('✅ All checks passed! Extension should load correctly.');
    process.exit(0);
  } else {
    console.log('❌ Some checks failed. Fix issues before loading extension.');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Error validating manifest:', error.message);
  process.exit(1);
}
