const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  exportToPDF: (htmlContent) => ipcRenderer.invoke('export-to-pdf', htmlContent)
});
