const { contextBridge } = require('electron');

// Expose minimal APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform
});
