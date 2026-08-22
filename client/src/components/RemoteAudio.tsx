import { useEffect, useRef } from 'react';

interface RemoteAudioProps {
  streams: Record<string, MediaStream>;
  /** Volume 0-100 por participante, o mesmo do menu de clique direito. */
  getVolume: (peerId: string) => number;
}

/**
 * Toca os microfones dos outros participantes.
 *
 * Fica fora do palco de propósito: voz não depende de quem está no vídeo
 * principal, então continua audível mesmo trocando de transmissão.
 */
export default function RemoteAudio({ streams, getVolume }: RemoteAudioProps) {
  return (
    <>
      {Object.entries(streams).map(([peerId, stream]) => (
        <AudioSink key={peerId} stream={stream} volume={getVolume(peerId)} />
      ))}
    </>
  );
}

function AudioSink({ stream, volume }: { stream: MediaStream; volume: number }) {
  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = stream;
    el.play().catch(() => {});
  }, [stream]);

  useEffect(() => {
    if (ref.current) ref.current.volume = volume / 100;
  }, [volume]);

  return <audio ref={ref} autoPlay />;
}
