const { app, BrowserWindow, ipcMain, shell, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ── electron-store ────────────────────────────────────────────────────────
let store;
try {
  const Store = require('electron-store');
  store = new Store({
    name: 'florida-burgers-data',
    defaults: {
      menu: null,
      orders: [],
      orderCounter: 0,
      settings: { kioskMode: false, printerName: '', autoLaunch: false }
    }
  });
} catch (e) {
  console.error('electron-store error:', e.message);
  const data = {};
  store = {
    get: (key) => data[key] ?? null,
    set: (key, val) => { data[key] = val; },
    delete: (key) => { delete data[key]; },
    path: 'memory',
  };
}

const isDev = !app.isPackaged;
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    title: 'Florida Burgers POS',
    backgroundColor: '#0a0a0a',
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
      allowRunningInsecureContent: false,
    },
  });

  Menu.setApplicationMenu(null);

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('loadFile error:', err);
    });
  }

  mainWindow.webContents.on('did-fail-load', (e, code, desc) => {
    console.error('did-fail-load:', code, desc);
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (!mainWindow) createWindow(); });

// ── IPC: Storage ─────────────────────────────────────────────────────────
ipcMain.handle('store:get', (_, key) => {
  try { return store.get(key); } catch { return null; }
});
ipcMain.handle('store:set', (_, key, value) => {
  try { store.set(key, value); return true; } catch { return false; }
});
ipcMain.handle('store:delete', (_, key) => {
  try { store.delete(key); return true; } catch { return false; }
});

// ── IPC: Imprimir ticket ─────────────────────────────────────────────────
ipcMain.handle('print:ticket', async (_, ticketHTML) => {
  return new Promise((resolve) => {
    const printWin = new BrowserWindow({
      show: false,
      webPreferences: { contextIsolation: true, webSecurity: false }
    });
    printWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(ticketHTML));
    printWin.webContents.once('did-finish-load', () => {
      setTimeout(() => {
        const settings = store.get('settings') || {};
        printWin.webContents.print({
          silent: true,
          printBackground: true,
          deviceName: settings.printerName || '',
          margins: { marginType: 'printableArea' },
        }, (success, err) => {
          printWin.destroy();
          resolve({ success, err });
        });
      }, 500);
    });
  });
});

// ── IPC: Guardar PDF ─────────────────────────────────────────────────────
// SOLUCIÓN DEFINITIVA:
// El problema era que shell.openPath() abría el PDF con Edge/el visor del
// sistema, y en algunos casos Windows cerraba el handle antes de que el
// visor terminara de leer el archivo (race condition). La solución es:
// 1. Mostrar el diálogo ANTES de generar el PDF (el usuario elige dónde lo guarda)
// 2. Generar el PDF real con printToPDF() (bytes PDF, no HTML)
// 3. Escribir al disco y NO llamar shell.openPath() automáticamente
// 4. Devolver el filePath al renderer para mostrar "Abrir PDF" como acción opcional
ipcMain.handle('save:pdf', async (_, { htmlContent, defaultName }) => {
  // Primero elegir destino
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: path.join(app.getPath('documents'), defaultName),
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });

  if (canceled || !filePath) {
    return { success: false };
  }

  return new Promise((resolve) => {
    const pdfWin = new BrowserWindow({
      show: false,
      width: 420,
      height: 900,
      webPreferences: { contextIsolation: true, webSecurity: false }
    });

    pdfWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));

    pdfWin.webContents.once('did-finish-load', async () => {
      await new Promise(r => setTimeout(r, 600));

      try {
        const pdfData = await pdfWin.webContents.printToPDF({
          pageSize: { width: 80000, height: 297000 },
          printBackground: true,
          margins: { top: 2, bottom: 2, left: 2, right: 2 },
          preferCSSPageSize: true,
        });

        pdfWin.destroy();
        fs.writeFileSync(filePath, pdfData);

        // NO llamamos shell.openPath() automáticamente — devolvemos el path
        // y el renderer decide si mostrar un botón "Abrir PDF"
        resolve({ success: true, filePath });

      } catch (err) {
        if (!pdfWin.isDestroyed()) pdfWin.destroy();
        console.error('save:pdf error:', err);
        resolve({ success: false, error: err.message });
      }
    });
  });
});

// ── IPC: Abrir archivo con la app del sistema ─────────────────────────────
// Separado del guardado para que el usuario lo controle
ipcMain.handle('open:file', async (_, filePath) => {
  try {
    const err = await shell.openPath(filePath);
    if (err) return { success: false, error: err };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ── IPC: Mostrar archivo en el explorador ─────────────────────────────────
ipcMain.handle('show:file', async (_, filePath) => {
  shell.showItemInFolder(filePath);
  return { success: true };
});

// ── IPC: Guardar Excel ───────────────────────────────────────────────────
ipcMain.handle('save:excel', async (_, { buffer, defaultName }) => {
  try {
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: path.join(app.getPath('documents'), defaultName),
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
    });
    if (canceled || !filePath) return { success: false };
    fs.writeFileSync(filePath, Buffer.from(buffer));
    shell.showItemInFolder(filePath);
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ── IPC: Settings ────────────────────────────────────────────────────────
ipcMain.handle('settings:get', () => store.get('settings') || {});
ipcMain.handle('settings:set', (_, settings) => {
  store.set('settings', settings);
  if (mainWindow) mainWindow.setKiosk(!!settings.kioskMode);
  return true;
});

// ── IPC: Autoarranque ────────────────────────────────────────────────────
ipcMain.handle('autolaunch:get', () => app.getLoginItemSettings().openAtLogin);
ipcMain.handle('autolaunch:set', (_, enable) => {
  app.setLoginItemSettings({ openAtLogin: enable, name: 'Florida Burgers POS' });
  return true;
});

// ── IPC: App info ────────────────────────────────────────────────────────
ipcMain.handle('app:info', () => ({
  version: app.getVersion(),
  platform: process.platform,
  isPackaged: app.isPackaged,
  dataPath: store.path || 'N/A',
  appPath: app.getAppPath(),
}));

ipcMain.handle('app:openDataFolder', () => {
  if (store.path && store.path !== 'memory') shell.showItemInFolder(store.path);
});
