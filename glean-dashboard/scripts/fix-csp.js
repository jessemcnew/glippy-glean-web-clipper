#!/usr/bin/env node
/**
 * Post-build script to fix CSP issues in Next.js static export
 * Extracts inline scripts to external files for Chrome extension compatibility
 * Also fixes asset paths for chrome-extension:// context
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const outDir = path.join(__dirname, '..', 'out');

// Find all HTML files recursively
function findHtmlFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findHtmlFiles(fullPath));
    } else if (entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Calculate relative path prefix based on directory depth
function getRelativePrefix(htmlPath, outDir) {
  const relativePath = path.relative(outDir, path.dirname(htmlPath));
  if (!relativePath) {
    return './'; // Root level
  }
  const depth = relativePath.split(path.sep).length;
  return '../'.repeat(depth);
}

// Extract inline scripts and replace with external script tags
function processHtmlFile(htmlPath, outDir) {
  let html = fs.readFileSync(htmlPath, 'utf-8');
  const dir = path.dirname(htmlPath);
  let scriptIndex = 0;
  const hashes = [];
  const relativePrefix = getRelativePrefix(htmlPath, outDir);

  // Create a base config script file for this page
  // This sets __NEXT_BASE before any other scripts load
  const baseConfigContent = `globalThis.__NEXT_BASE="${relativePrefix}";`;
  const baseConfigPath = path.join(dir, '_base_config.js');
  fs.writeFileSync(baseConfigPath, baseConfigContent);

  // Inject the base config script at the very beginning of head
  html = html.replace('<head>', '<head><script src="./_base_config.js"></script>');

  // Fix absolute paths to _next
  html = html.replace(/href="\/_next\//g, `href="${relativePrefix}_next/`);
  html = html.replace(/src="\/_next\//g, `src="${relativePrefix}_next/`);
  html = html.replace(/href="\/favicon/g, `href="${relativePrefix}favicon`);

  // Match inline script tags (not ones with src)
  const scriptRegex = /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;

  html = html.replace(scriptRegex, (match, scriptContent) => {
    if (!scriptContent.trim()) {
      return match; // Keep empty scripts as-is
    }

    // Fix absolute paths inside the script content
    // These are JSON string references like "/_next/static/chunks/..."
    let fixedScriptContent = scriptContent;
    fixedScriptContent = fixedScriptContent.replace(/"\\?\/_next\//g, `"${relativePrefix}_next/`);

    // Generate hash for the script content
    const hash = crypto.createHash('sha256').update(fixedScriptContent).digest('base64');
    hashes.push(`'sha256-${hash}'`);

    // Create external script file
    const scriptFileName = `_inline_${scriptIndex++}.js`;
    const scriptPath = path.join(dir, scriptFileName);
    fs.writeFileSync(scriptPath, fixedScriptContent);

    // Replace with external script tag
    // Use relative path (same directory)
    return `<script src="./${scriptFileName}"></script>`;
  });

  fs.writeFileSync(htmlPath, html);

  return hashes;
}

// Find all JS files in _next directory
function findJsFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findJsFiles(fullPath));
    } else if (entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Fix absolute paths in JS chunks (especially turbopack loader)
function fixJsChunkPaths(jsPath, outDir) {
  let content = fs.readFileSync(jsPath, 'utf-8');
  const original = content;

  // The turbopack loader needs to compute the _next path relative to the current page
  // We use globalThis.__NEXT_BASE which we'll set in each HTML file's inline script
  // Default to "./_next/" if not set (for root pages)
  content = content.replace(/let t="\/_next\/"/g, 'let t=(globalThis.__NEXT_BASE||"./")+"_next/"');

  // Also fix the other pattern used in the same variable declaration
  content = content.replace(/="\/_next\/"/g, '=(globalThis.__NEXT_BASE||"./")+"_next/"');

  // Fix any other string references to /_next/
  content = content.replace(/"\\?\/_next\//g, '"./_next/');

  if (content !== original) {
    fs.writeFileSync(jsPath, content);
    return true;
  }
  return false;
}

console.log('Fixing CSP issues in Next.js static export...');

const htmlFiles = findHtmlFiles(outDir);
console.log(`Found ${htmlFiles.length} HTML files`);

const allHashes = new Set();

for (const htmlFile of htmlFiles) {
  const hashes = processHtmlFile(htmlFile, outDir);
  hashes.forEach(h => allHashes.add(h));
  if (hashes.length > 0) {
    console.log(`  ${path.relative(outDir, htmlFile)}: extracted ${hashes.length} inline scripts`);
  }
}

// Fix paths in JS chunks (especially turbopack)
const nextDir = path.join(outDir, '_next');
const jsFiles = findJsFiles(nextDir);
let fixedJsCount = 0;
for (const jsFile of jsFiles) {
  if (fixJsChunkPaths(jsFile, outDir)) {
    fixedJsCount++;
  }
}
if (fixedJsCount > 0) {
  console.log(`Fixed absolute paths in ${fixedJsCount} JS chunk files`);
}

console.log('\nIf you need CSP hashes instead, add these to your manifest.json:');
console.log([...allHashes].join(' '));
console.log('\nDone!');
