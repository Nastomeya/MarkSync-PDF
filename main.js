const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Prevent GPU cache lock errors on Windows
app.disableHardwareAcceleration();

function createWindow() {
  // 1. Create and show Splash Screen immediately
  const splash = new BrowserWindow({
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
  splash.loadFile('splash.html');

  // 2. Create Main Window (hidden initially)
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // <--- Crucial: Hide until loaded
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

  win.loadFile('index.html');

  // 3. When main window is fully rendered, swap them
  win.once('ready-to-show', () => {
    // Optional tiny delay to ensure all CSS/fonts are fully painted
    setTimeout(() => {
      if (!splash.isDestroyed()) {
        splash.destroy();
      }
      win.show();
      win.focus();
    }, 500);
  });
}

app.whenReady().then(() => {
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
