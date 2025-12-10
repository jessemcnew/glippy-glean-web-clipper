#!/usr/bin/env node
/**
 * Service Worker Console Log Reader
 * Connects to Chrome DevTools Protocol via WebSocket to read service worker console logs
 */

const WebSocket = require('ws');
const http = require('http');

const DEBUG_PORT = 9222;
const SW_EXTENSION_ID = 'ehajhplmdepljmlmfkpccfkbcjgcfgib';

/**
 * Get service worker WebSocket URL
 */
function getServiceWorkerUrl() {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${DEBUG_PORT}/json`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const targets = JSON.parse(data);
          const sw = targets.find(
            t => t.type === 'service_worker' && 
            t.url && t.url.includes(SW_EXTENSION_ID)
          );
          if (sw && sw.webSocketDebuggerUrl) {
            resolve(sw.webSocketDebuggerUrl);
          } else {
            reject(new Error('Service worker not found'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Connect to service worker and listen for console messages
 */
async function getServiceWorkerLogs() {
  try {
    console.log('🔍 Finding service worker...');
    const wsUrl = await getServiceWorkerUrl();
    console.log(`✅ Found service worker: ${wsUrl}`);
    console.log('🔌 Connecting...\n');

    const ws = new WebSocket(wsUrl);
    let messageId = 1;
    const pendingMessages = new Map();

    /**
     * Send a Chrome DevTools Protocol message
     */
    const sendMessage = (method, params, id) => {
      const message = {
        id: id,
        method: method,
        params: params
      };
      pendingMessages.set(id, message);
      ws.send(JSON.stringify(message));
    };

    ws.on('open', () => {
      console.log('✅ Connected to service worker!\n');
      console.log('📋 Listening for console messages...\n');
      console.log('─'.repeat(60));

      // Enable Runtime domain to receive console messages
      sendMessage('Runtime.enable', {}, messageId++);
      
      // Enable Console domain
      sendMessage('Console.enable', {}, messageId++);
      
      // Get existing console messages
      sendMessage('Runtime.getIsolateId', {}, messageId++);
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Handle responses to our commands
        if (message.id) {
          const pending = pendingMessages.get(message.id);
          if (pending) {
            pendingMessages.delete(message.id);
            if (message.error) {
              console.error(`❌ Error (ID ${message.id}):`, message.error);
            }
          }
        }
        
        // Handle console messages
        if (message.method === 'Runtime.consoleAPICalled') {
          const params = message.params;
          const type = params.type;
          const args = params.args || [];
          
          // Format the log message
          const timestamp = new Date(params.timestamp * 1000).toLocaleTimeString();
          const typeIcon = {
            'log': '📝',
            'error': '❌',
            'warn': '⚠️',
            'info': 'ℹ️',
            'debug': '🐛'
          }[type] || '📋';
          
          // Extract text from args
          const text = args.map(arg => {
            if (arg.type === 'string') return arg.value;
            if (arg.type === 'object') return JSON.stringify(arg.value, null, 2);
            return String(arg.value || '');
          }).join(' ');
          
          console.log(`${typeIcon} [${timestamp}] ${text}`);
        }
        
        // Handle execution context created (service worker started)
        if (message.method === 'Runtime.executionContextCreated') {
          console.log('🚀 Service worker execution context created');
        }
        
      } catch (e) {
        console.error('Error parsing message:', e.message);
      }
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
    });

    ws.on('close', () => {
      console.log('\n─'.repeat(60));
      console.log('🔌 Connection closed');
    });

    // Keep connection alive and listen for new messages
    setTimeout(() => {
      console.log('\n⏱️  Listening for 10 seconds... (press Ctrl+C to exit)');
    }, 1000);

    // Keep running for a while to capture logs
    setTimeout(() => {
      console.log('\n✅ Done listening. Closing connection...');
      ws.close();
    }, 10000);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}


// Run the script
if (require.main === module) {
  getServiceWorkerLogs().catch(console.error);
}

module.exports = { getServiceWorkerLogs };
