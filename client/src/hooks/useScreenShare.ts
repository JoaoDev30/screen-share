import { useCallback, useEffect, useRef, useState } from 'react';
import { ScreenShareCancelled, captureScreen, stopStream } from '../services/screen';
import { socket } from '../services/socket';
import { peerManager } from '../services/webrtc';

interface UseScreenShareResult {
  localStream: MediaStream | null;
  isSharing: boolean;
  error: string | null;
  /** O SO entregou áudio do sistema junto com a tela? */
  hasSystemAudio: boolean;
  /** Áudio do sistema ligado no momento. */
  systemAudioOn: boolean;
  toggleSystemAudio: () => void;
  startSharing: () => Promise<void>;
  stopSharing: () => void;
}

/** Captura da tela local e distribuição para a malha P2P. */
export function useScreenShare(inRoom: boolean): UseScreenShareResult {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [systemAudioOn, setSystemAudioOn] = useState(true);
  const streamRef = useRef<MediaStream | null>(null);

  const systemAudioTrack = localStream?.getAudioTracks()[0] ?? null;

  const stopSharing = useCallback(() => {
    if (!streamRef.current) return;

    peerManager.clearLocalStream();
    stopStream(streamRef.current);
    streamRef.current = null;
    setLocalStream(null);
    setSystemAudioOn(true);
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
      setSystemAudioOn(stream.getAudioTracks().length > 0);
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

  /**
   * Alterna com track.enabled em vez de remover a track: é instantâneo e não
   * dispara renegociação, ao contrário de ligar/desligar o microfone.
   */
  const toggleSystemAudio = useCallback(() => {
    if (!systemAudioTrack) return;
    systemAudioTrack.enabled = !systemAudioTrack.enabled;
    setSystemAudioOn(systemAudioTrack.enabled);
  }, [systemAudioTrack]);

  return {
    localStream,
    isSharing: localStream !== null,
    error,
    hasSystemAudio: systemAudioTrack !== null,
    systemAudioOn,
    toggleSystemAudio,
    startSharing,
    stopSharing,
  };
}
