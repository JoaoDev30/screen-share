import { useCallback, useEffect, useRef, useState } from 'react';
import { ScreenShareCancelled, captureScreen, stopStream } from '../services/screen';
import { socket } from '../services/socket';
import { peerManager } from '../services/webrtc';

interface UseScreenShareResult {
  localStream: MediaStream | null;
  isSharing: boolean;
  error: string | null;
  startSharing: () => Promise<void>;
  stopSharing: () => void;
}

/** Captura da tela local e distribuição para a malha P2P. */
export function useScreenShare(inRoom: boolean): UseScreenShareResult {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopSharing = useCallback(() => {
    if (!streamRef.current) return;

    peerManager.clearLocalStream();
    stopStream(streamRef.current);
    streamRef.current = null;
    setLocalStream(null);
    socket.emit('share:stop');
  }, []);

  const startSharing = useCallback(async () => {
    setError(null);
    try {
      const stream = await captureScreen();

      // "Parar de compartilhar" na barra do sistema encerra a track direto.
      stream.getVideoTracks()[0]?.addEventListener('ended', () => stopSharing());

      streamRef.current = stream;
      setLocalStream(stream);
      peerManager.setLocalStream(stream);
      socket.emit('share:start');
    } catch (err) {
      if (err instanceof ScreenShareCancelled) return;
      console.error('[share] falha ao capturar tela', err);
      setError('Não foi possível capturar a tela.');
    }
  }, [stopSharing]);

  // Sair da sala encerra a transmissão junto.
  useEffect(() => {
    if (!inRoom) stopSharing();
  }, [inRoom, stopSharing]);

  useEffect(() => () => stopSharing(), [stopSharing]);

  return {
    localStream,
    isSharing: localStream !== null,
    error,
    startSharing,
    stopSharing,
  };
}
