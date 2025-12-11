// Preload script for Electron
// Provides secure bridge between renderer and main process

const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Add any Electron APIs you need here
  platform: process.platform,
})
