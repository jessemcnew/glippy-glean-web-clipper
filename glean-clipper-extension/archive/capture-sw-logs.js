// capture-sw-logs.js
const http = require('http');
const WebSocket = require('ws');

const EXTENSION_ID = 'ehajhplmdepljmlmfkpccfkbcjgcfgib';
const DURATION_SECONDS = 30;
const CDP_URL = 'http://localhost:9222';

const logs = [];
const errors = [];
const warnings = [];

async function getCDPList() {
  return new Promise((resolve, reject) => {
    http.get(`${CDP_URL}/json`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function connectToServiceWorker() {
  console.log('🔍 Finding service worker for extension:', EXTENSION_ID);
  
  const targets = await getCDPList();
  
  // Find service worker target
  const swTarget = targets.find(t => 
    t.type === 'service_worker' && 
    t.url && t.url.includes(EXTENSION_ID)
  );

  if (!swTarget) {
    console.error('❌ Service worker not found!');
    console.error('Available targets:');
    targets.forEach(t => {
      console.error(`  - ${t.type}: ${t.url || 'N/A'}`);
    });
    throw new Error('Service worker not found');
  }

  console.log('✅ Found service worker:', swTarget.url);
  console.log('📡 Connecting to WebSocket:', swTarget.webSocketDebuggerUrl);
  
  return new WebSocket(swTarget.webSocketDebuggerUrl);
}

function captureLogs(ws) {
  let messageId = 0;
  
  // Enable Runtime domain
  ws.send(JSON.stringify({
    id: ++messageId,
    method: 'Runtime.enable',
    params: {}
  }));

  // Enable Log domain for console messages
  ws.send(JSON.stringify({
    id: ++messageId,
    method: 'Log.enable',
    params: {}
  }));

  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    
    // Handle console API calls
    if (message.method === 'Runtime.consoleAPICalled') {
      const timestamp = new Date().toISOString();
      const type = message.params.type;
      const args = message.params.args.map(arg => {
        if (arg.type === 'string') return arg.value;
        if (arg.type === 'object') {
          return arg.description || JSON.stringify(arg.preview?.properties || {}, null, 2);
        }
        return arg.value || String(arg);
      }).join(' ');

      const logEntry = {
        timestamp,
        type,
        message: args,
        level: type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'info'
      };

      logs.push(logEntry);
      
      // Categorize
      if (type === 'error') {
        errors.push(logEntry);
        console.error(`[${timestamp}] ERROR: ${args}`);
      } else if (type === 'warning') {
        warnings.push(logEntry);
        console.warn(`[${timestamp}] WARNING: ${args}`);
      } else {
        console.log(`[${timestamp}] ${type.toUpperCase()}: ${args}`);
      }
    }

    // Handle log entries
    if (message.method === 'Log.entryAdded') {
      const entry = message.params.entry;
      const timestamp = new Date(entry.timestamp * 1000).toISOString();
      
      const logEntry = {
        timestamp,
        type: entry.level,
        message: entry.text,
        level: entry.level
      };

      logs.push(logEntry);
      
      if (entry.level === 'error') {
        errors.push(logEntry);
        console.error(`[${timestamp}] ERROR: ${entry.text}`);
      } else if (entry.level === 'warning') {
        warnings.push(logEntry);
        console.warn(`[${timestamp}] WARNING: ${entry.text}`);
      } else {
        console.log(`[${timestamp}] ${entry.level.toUpperCase()}: ${entry.text}`);
      }
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    console.log('\n📴 Connection closed');
  });
}

async function main() {
  try {
    console.log('🚀 Starting service worker log capture');
    console.log(`⏱️  Duration: ${DURATION_SECONDS} seconds\n`);

    const ws = await connectToServiceWorker();
    
    await new Promise((resolve) => {
      ws.on('open', () => {
        console.log('✅ Connected! Starting capture...\n');
        console.log('='.repeat(80));
        captureLogs(ws);
        
        // Stop after duration
        setTimeout(() => {
          ws.close();
          resolve();
        }, DURATION_SECONDS * 1000);
      });
    });

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY\n');
    console.log(`Total logs captured: ${logs.length}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}\n`);

    if (errors.length > 0) {
      console.log('❌ ERRORS:');
      errors.forEach(err => {
        console.log(`  [${err.timestamp}] ${err.message}`);
      });
      console.log('');
    }

    if (warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      warnings.forEach(warn => {
        console.log(`  [${warn.timestamp}] ${warn.message}`);
      });
      console.log('');
    }

    // Last 100 lines
    console.log('📋 LAST 100 LOG LINES:');
    console.log('='.repeat(80));
    const last100 = logs.slice(-100);
    last100.forEach(log => {
      const prefix = log.level === 'error' ? '❌' : log.level === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`${prefix} [${log.timestamp}] ${log.type}: ${log.message}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nMake sure:');
    console.error('1. Chrome is running with: --remote-debugging-port=9222');
    console.error('2. The extension is loaded and active');
    console.error('3. The extension ID is correct');
    process.exit(1);
  }
}

main();
