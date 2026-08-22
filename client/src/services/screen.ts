/** Fonte de tela oferecida pelo seletor do Electron. */
export interface DesktopSource {
  id: string;
  name: string;
  kind: 'screen' | 'window';
  thumbnail: string;
  icon: string | null;
}

interface ScreenShareBridge {
  isElectron: boolean;
  platform: string;
  onPickSource: (handler: (sources: DesktopSource[]) => void) => () => void;
  pickSource: (id: string | null) => void;
}

export function getBridge(): ScreenShareBridge | undefined {
  return (window as unknown as { screenShare?: ScreenShareBridge }).screenShare;
}

export const isElectron = (): boolean => getBridge()?.isElectron === true;

/**
 * 30 FPS e teto de 1080p. A resolução é negociada dinamicamente pelo WebRTC
 * a partir daí — o encoder cai sozinho se a banda apertar.
 */
const CONSTRAINTS: DisplayMediaStreamOptions = {
  video: {
    frameRate: { ideal: 30, max: 30 },
    width: { max: 1920 },
    height: { max: 1080 },
  },
  // Áudio do sistema chega na ETAPA 6.
  audio: false,
};

export class ScreenShareCancelled extends Error {
  constructor() {
    super('Compartilhamento cancelado');
    this.name = 'ScreenShareCancelled';
  }
}

/**
 * Abre o seletor de tela. No Electron o seletor é nosso (via IPC);
 * no navegador é o nativo do Chrome.
 */
export async function captureScreen(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getDisplayMedia(CONSTRAINTS);
  } catch (err) {
    // Cancelar no seletor cai aqui: não é falha, é escolha do usuário.
    if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'AbortError')) {
      throw new ScreenShareCancelled();
    }
    throw err;
  }
}

export function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}
