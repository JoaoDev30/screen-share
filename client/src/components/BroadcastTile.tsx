import { useEffect, useRef } from 'react';

interface BroadcastTileProps {
  stream: MediaStream;
  name: string;
  isLocal: boolean;
  active: boolean;
  onClick: () => void;
  onContextMenu: (x: number, y: number) => void;
}

/** Miniatura clicável de uma transmissão. Clicar joga ela no palco principal. */
export default function BroadcastTile({
  stream,
  name,
  isLocal,
  active,
  onClick,
  onContextMenu,
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
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e.clientX, e.clientY);
      }}
      title={`Ver ${name} — clique direito para o volume`}
    >
      {/* Sempre mudo: o áudio sai pelo palco principal, nunca pelas miniaturas. */}
      <video ref={videoRef} className="tile__video" autoPlay playsInline muted />
      {active && <span className="tile__badge">▶ Assistindo</span>}

      <span className="tile__name">
        {isLocal && <span className="live-dot" />}
        {name}
      </span>
    </button>
  );
}
