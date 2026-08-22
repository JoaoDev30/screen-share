import { useEffect, useRef } from 'react';

interface RemoteAudioProps {
  streams: Record<string, MediaStream>;
}

/**
 * Toca os microfones dos outros participantes.
 *
 * Fica fora do palco de propósito: voz não depende de quem está no vídeo
 * principal, então continua audível mesmo trocando de transmissão.
 */
export default function RemoteAudio({ streams }: RemoteAudioProps) {
  return (
    <>
      {Object.entries(streams).map(([peerId, stream]) => (
        <AudioSink key={peerId} stream={stream} />
      ))}
    </>
  );
}

function AudioSink({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = stream;
    el.play().catch(() => {});
  }, [stream]);

  return <audio ref={ref} autoPlay />;
}
