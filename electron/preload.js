const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  store: {
    get: (key) => ipcRenderer.invoke('store:get', key),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
    delete: (key) => ipcRenderer.invoke('store:delete', key),
  },
  print: {
    ticket: (html) => ipcRenderer.invoke('print:ticket', html),
  },
  savePDF: (htmlContent, defaultName) =>
    ipcRenderer.invoke('save:pdf', { htmlContent, defaultName }),
  openFile: (filePath) => ipcRenderer.invoke('open:file', filePath),
  showFile: (filePath) => ipcRenderer.invoke('show:file', filePath),
  saveExcel: (buffer, defaultName) =>
    ipcRenderer.invoke('save:excel', { buffer, defaultName }),
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (s) => ipcRenderer.invoke('settings:set', s),
  },
  autoLaunch: {
    get: () => ipcRenderer.invoke('autolaunch:get'),
    set: (enable) => ipcRenderer.invoke('autolaunch:set', enable),
  },
  appInfo: () => ipcRenderer.invoke('app:info'),
  openDataFolder: () => ipcRenderer.invoke('app:openDataFolder'),
});
