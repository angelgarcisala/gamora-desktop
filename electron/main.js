const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

const preloadPath = path.join(__dirname, 'preload.js');
console.log('[MAIN] Cargando preload desde:', preloadPath);

function createWindow () {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false
    }
  });

  win.loadURL('https://gamora-trunk-y5gla9.laravel.cloud');
}

ipcMain.handle('launch-game', async (event, exePath) => {
  const workingDir = path.dirname(exePath);

  try {
    spawn(exePath, {
      cwd: workingDir,
      detached: true,
      stdio: 'ignore'
    }).unref();

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
