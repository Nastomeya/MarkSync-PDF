const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Set Application User Model ID for Windows notification & taskbar grouping
app.setAppUserModelId('com.marksyncpdf.app');

// Prevent GPU cache, shader disk cache, and cache lock errors on Windows
// app.disableHardwareAcceleration(); // Disabled: causes severe scrolling lag in PDF preview
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-gpu-cache');
app.commandLine.appendSwitch('disable-http-cache');

// Helper to clean up any leftover corrupted/stale cache directories from older versions
function cleanupStaleCache() {
  try {
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) return;

    const entries = fs.readdirSync(userDataPath);
    for (const entry of entries) {
      if (entry.startsWith('old_GPUCache_') || entry.startsWith('old_Cache_') || entry === 'GPUCache') {
        const fullPath = path.join(userDataPath, entry);
        try {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } catch (_) {}
      }
    }
  } catch (_) {}
}

// Enforce single instance lock to prevent multiple instances from conflicting
// on Chromium's user-data cache and causing infinite splash loading.
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Another instance is already running; quit immediately to avoid lock contention
  app.quit();
} else {
  let mainWindow = null;
  let splashWindow = null;

  app.on('second-instance', () => {
    // If another instance was launched, focus the active window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });

  function createWindow() {
    let splashClosed = false;

    // 1. Create and show Splash Screen immediately
    splashWindow = new BrowserWindow({
      width: 500,
      height: 350,
      frame: false,
      alwaysOnTop: true,
      backgroundColor: '#0b0f19',
      icon: path.join(__dirname, 'assets', 'icon.png'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    splashWindow.loadFile('splash.html');

    // 2. Create Main Window (hidden initially)
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      show: false, // Hide until loaded
      backgroundColor: '#0b0f19',
      icon: path.join(__dirname, 'assets', 'icon.png'), 
      webPreferences: {
        nodeIntegration: true,
        nodeIntegrationInWorker: true,
        contextIsolation: false,
        plugins: true,
        webviewTag: true
      },
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        color: '#0b0f19',
        symbolColor: '#f3f4f6'
      }
    });

    mainWindow.loadFile('index.html');

    function showMainWindow() {
      if (splashClosed) return;
      splashClosed = true;

      // Close and clean up splash window safely
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.destroy();
        splashWindow = null;
      }

      // Show and focus main window
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
      }
    }

    // 3. Primary trigger: When main window has rendered and is ready to show
    mainWindow.once('ready-to-show', () => {
      setTimeout(showMainWindow, 300);
    });

    // Fallback 1: When page finished loading (in case ready-to-show was delayed)
    mainWindow.webContents.once('did-finish-load', () => {
      setTimeout(showMainWindow, 800);
    });

    // Fallback 2: Failsafe timer (maximum 4 seconds) to ensure splash screen NEVER hangs
    const failsafeTimer = setTimeout(() => {
      if (!splashClosed) {
        console.warn('Splash screen transition timed out; forcing main window to display.');
        showMainWindow();
      }
    }, 4000);

    // Fallback 3: Handle load errors or render process crashes gracefully
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('Failed to load main window:', errorCode, errorDescription);
      showMainWindow();
    });

    mainWindow.webContents.on('render-process-gone', (event, details) => {
      console.error('Render process gone:', details);
      showMainWindow();
    });

    mainWindow.on('closed', () => {
      clearTimeout(failsafeTimer);
      mainWindow = null;
    });
  }

  app.whenReady().then(() => {
    cleanupStaleCache();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

let activeTempPdfPath = null;

function cleanupTempPdf() {
  if (activeTempPdfPath && fs.existsSync(activeTempPdfPath)) {
    try {
      fs.unlinkSync(activeTempPdfPath);
    } catch (_) {}
    activeTempPdfPath = null;
  }
}

app.on('window-all-closed', () => {
  cleanupTempPdf();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  cleanupTempPdf();
});

// Handle PDF Preview Generation
ipcMain.handle('preview-pdf', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  
  try {
    // Clean up previous temporary PDF before creating a new one
    cleanupTempPdf();

    const pdfData = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: {
        marginType: 'none'
      }
    });

    const tempPath = path.join(os.tmpdir(), `marksync-preview-${Date.now()}.pdf`);
    fs.writeFileSync(tempPath, pdfData);
    activeTempPdfPath = tempPath;

    return { success: true, tempPath };
  } catch (error) {
    console.error('Failed to generate preview:', error);
    return { success: false, message: error.message };
  }
});

// Handle saving the generated PDF
ipcMain.handle('save-pdf', async (event, tempPath) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  
  try {
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Save PDF',
      defaultPath: 'document.pdf',
      filters: [{ name: 'PDF Documents', extensions: ['pdf'] }]
    });

    if (canceled || !filePath) return { success: false, message: 'Cancelled' };

    fs.copyFileSync(tempPath, filePath);
    return { success: true, filePath };
  } catch (error) {
    console.error('Failed to save PDF:', error);
    return { success: false, message: error.message };
  }
});
}

