import { app, BrowserWindow, desktopCapturer, ipcMain, session, shell } from 'electron';
import path from 'node:path';

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

// Flags que ajudam na captura/decodificacao de tela com baixa latencia.
app.commandLine.appendSwitch('enable-features', 'WebRTCPipeWireCapturer');
app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling');

let mainWindow: BrowserWindow | null = null;

/** Tempo maximo esperando o usuario escolher uma fonte no seletor. */
const PICKER_TIMEOUT_MS = 60_000;

/**
 * Sem este handler o getDisplayMedia() do Electron nao abre seletor nenhum e
 * a promise rejeita. Aqui buscamos as fontes e delegamos a escolha para a UI.
 */
function setupDisplayMediaHandler(): void {
  session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: { width: 320, height: 180 },
      fetchWindowIcons: true,
    });

    if (!mainWindow || sources.length === 0) {
      // Objeto vazio = negado: o getDisplayMedia rejeita com NotAllowedError.
      return callback({});
    }

    const chosenId = await new Promise<string | null>((resolve) => {
      const onPicked = (_event: Electron.IpcMainEvent, id: string | null) => {
        clearTimeout(timer);
        resolve(id);
      };
      const timer = setTimeout(() => {
        ipcMain.removeListener('screen:picked', onPicked);
        resolve(null);
      }, PICKER_TIMEOUT_MS);

      ipcMain.once('screen:picked', onPicked);

      mainWindow!.webContents.send(
        'screen:pick',
        sources.map((source) => ({
          id: source.id,
          name: source.name,
          // 'screen:0:0' = tela inteira; 'window:...' = janela/aplicativo.
          kind: source.id.startsWith('screen') ? 'screen' : 'window',
          thumbnail: source.thumbnail.toDataURL(),
          icon: source.appIcon?.toDataURL() ?? null,
        }))
      );
    });

    const source = sources.find((s) => s.id === chosenId);
    if (!source) return callback({});

    // 'loopback' captura o audio que o sistema esta tocando (Windows/macOS).
    // Sem isso o getDisplayMedia devolve so video, mesmo pedindo audio.
    callback({
      video: source,
      audio: request.audioRequested ? 'loopback' : undefined,
    });
  });
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 940,
    minHeight: 620,
    backgroundColor: '#0F1117',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());

  // Links externos abrem no navegador padrao, nunca dentro do app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (DEV_SERVER_URL) {
    mainWindow.loadURL(DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  setupDisplayMediaHandler();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
