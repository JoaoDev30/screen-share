import { useCallback, useEffect, useRef, useState } from 'react';
import { captureMicrophone, stopStream } from '../services/screen';
import { peerManager } from '../services/webrtc';

interface UseMicrophoneResult {
  /** true quando o microfone está capturando e sendo enviado. */
  micOn: boolean;
  micError: string | null;
  toggleMic: () => Promise<void>;
}

/**
 * Microfone opcional, desligado por padrão.
 *
 * Desligar remove a track de verdade em vez de só mutar: com track.enabled
 * o navegador continua com o microfone aberto, e ninguém quer isso.
 */
export function useMicrophone(inRoom: boolean): UseMicrophoneResult {
  const [micOn, setMicOn] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const disable = useCallback(() => {
    if (!streamRef.current) return;
    peerManager.clearMicStream();
    stopStream(streamRef.current);
    streamRef.current = null;
    setMicOn(false);
  }, []);

  const toggleMic = useCallback(async () => {
    if (streamRef.current) return disable();

    setMicError(null);
    try {
      const stream = await captureMicrophone();
      streamRef.current = stream;
      peerManager.setMicStream(stream);
      setMicOn(true);
    } catch (err) {
      console.error('[mic] falha ao abrir o microfone', err);
      setMicError('Sem acesso ao microfone.');
    }
  }, [disable]);

  useEffect(() => {
    if (!inRoom) disable();
  }, [inRoom, disable]);

  useEffect(() => () => disable(), [disable]);

  return { micOn, micError, toggleMic };
}
