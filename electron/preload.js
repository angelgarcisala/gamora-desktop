if (!process.versions?.electron) {
  throw new Error('[❌] Este preload.js no debe ejecutarse fuera de Electron');
}

const { contextBridge, shell, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const https = require('https');
const unzipper = require('unzipper');
const os = require('os');

const logFile = path.join(os.homedir(), 'gamora-preload.log');
const isElectron = !!process.versions.electron;

fs.writeFileSync(
  logFile,
  `[${new Date().toISOString()}] preload.js ejecutado - ¿Electron?: ${isElectron}\n`,
  { flag: 'a' }
);

console.log('[🧪] ¿Estamos en Electron?:', isElectron);
fs.writeFileSync(logFile, '[🟢] preload.js cargado correctamente\n', { flag: 'a' });

console.log('[📦] preload.js cargado');

contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => console.log('electronAPI disponible'),

  getExecutablePath: (gameFolder, exeName) => {
    const exePath = path.join(os.homedir(), 'GamoraGames', gameFolder, exeName);
    console.log('[🧩] Path generado por getExecutablePath:', exePath);
    return exePath;
  },

  downloadGameWithProgress: (url, exeName, gameFolder, onProgress, onComplete, onError) => {
    const basePath = path.join(os.homedir(), 'GamoraGames');
    const gamePath = path.join(basePath, gameFolder);
    const zipPath = path.join(gamePath, 'temp.zip');
    const execPath = path.join(gamePath, exeName);

    console.log('[🔽] Iniciando descarga desde:', url);
    console.log('[📁] Carpeta destino del juego:', gamePath);

    try {
      if (!fs.existsSync(gamePath)) {
        fs.mkdirSync(gamePath, { recursive: true });
        console.log('Carpeta del juego creada:', gamePath);
      }

      const file = fs.createWriteStream(zipPath);
      https.get(url, response => {
        if (response.statusCode !== 200) {
          console.error('Error de respuesta HTTPS:', response.statusCode);
          onError(`Código de estado: ${response.statusCode}`);
          return;
        }

        const totalSize = parseInt(response.headers['content-length'], 10);
        let downloaded = 0;

        response.on('data', chunk => {
          downloaded += chunk.length;
          const percent = Math.round((downloaded / totalSize) * 100);
          console.log(`Progreso: ${percent}%`);
          onProgress(percent);
        });

        response.pipe(file);

        file.on('finish', () => {
          file.close(() => {
            console.log('Descarga completada. Descomprimiendo en:', gamePath);
            fs.createReadStream(zipPath)
              .pipe(unzipper.Extract({ path: gamePath }))
              .on('close', () => {
                console.log('Descompresión finalizada. Juego listo.');
                onComplete(execPath);
              });
          });
        });
      }).on('error', err => {
        console.error('Error de descarga:', err);
        onError(err.message);
      });
    } catch (e) {
      console.error('Error general:', e);
      onError(e.message);
    }
  },

  launchGame: (exePath) => ipcRenderer.invoke('launch-game', exePath),

  checkIfFileExists: (filePath, callback) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      callback(!err);
    });
  }
});
