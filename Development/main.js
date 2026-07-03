const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Prevent GPU cache lock errors on Windows
app.disableHardwareAcceleration();

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#0b0f19',
	icon: path.join(__dirname, 'assets', 'icon.png'), 
    webPreferences: {
      nodeIntegration: true,
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
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle PDF Preview Generation
ipcMain.handle('preview-pdf', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  
  try {
    const pdfData = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: {
        marginType: 'none'
      }
    });

    const tempPath = path.join(os.tmpdir(), `markdown-preview-${Date.now()}.pdf`);
    fs.writeFileSync(tempPath, pdfData);

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
