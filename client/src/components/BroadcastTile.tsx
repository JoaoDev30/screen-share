import { useEffect, useRef } from 'react';

interface BroadcastTileProps {
  stream: MediaStream;
  name: string;
  isLocal: boolean;
  active: boolean;
  onClick: () => void;
}

/** Miniatura clicável de uma transmissão. Clicar joga ela no palco principal. */
export default function BroadcastTile({
  stream,
  name,
  isLocal,
  active,
  onClick,
}: BroadcastTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    video.play().catch(() => {});
  }, [stream]);

  return (
    <button
      className={`tile ${active ? 'tile--active' : ''}`}
      onClick={onClick}
      title={`Ver ${name}`}
    >
      {/* Sempre mudo: o áudio sai pelo palco principal, nunca pelas miniaturas. */}
      <video ref={videoRef} className="tile__video" autoPlay playsInline muted />
      <span className="tile__name">
        {isLocal && <span className="live-dot" />}
        {name}
      </span>
    </button>
  );
}
