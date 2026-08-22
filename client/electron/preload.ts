import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

export interface DesktopSource {
  id: string;
  name: string;
  kind: 'screen' | 'window';
  thumbnail: string;
  icon: string | null;
}

/**
 * Ponte entre o seletor de tela (React) e o processo principal.
 * O main pede a escolha; a UI responde com o id da fonte (ou null se cancelar).
 */
contextBridge.exposeInMainWorld('screenShare', {
  isElectron: true,
  platform: process.platform,

  onPickSource: (handler: (sources: DesktopSource[]) => void) => {
    const listener = (_event: IpcRendererEvent, sources: DesktopSource[]) => handler(sources);
    ipcRenderer.on('screen:pick', listener);
    return () => ipcRenderer.removeListener('screen:pick', listener);
  },

  pickSource: (id: string | null) => ipcRenderer.send('screen:picked', id),
});
