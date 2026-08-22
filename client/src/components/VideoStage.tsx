import { useEffect, useRef, useState } from 'react';
import BroadcastTile from './BroadcastTile';

export interface Broadcast {
  /** socket.id de quem transmite */
  id: string;
  name: string;
  stream: MediaStream;
  isLocal: boolean;
}

interface VideoStageProps {
  broadcasts: Broadcast[];
  active: Broadcast | null;
  onSelect: (id: string) => void;
  emptyHint: string;
}

export default function VideoStage({
  broadcasts,
  active,
  onSelect,
  emptyHint,
}: VideoStageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = active?.stream ?? null;
    if (active) {
      // Autoplay pode ser recusado; sem o catch vira erro solto no console.
      video.play().catch(() => {});
    }
  }, [active]);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement !== null);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current?.requestFullscreen();
  };

  if (!active) {
    return (
      <main className="stage">
        <div className="stage__empty">
          <span className="stage__icon">🖥️</span>
          <p className="stage__title">Ninguém está transmitindo</p>
          <p className="stage__hint">{emptyHint}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="stage">
      <div className="stage__inner">
        <div className="video-frame" ref={containerRef}>
          <video
            ref={videoRef}
            className="video-frame__video"
            autoPlay
            playsInline
            muted={active.isLocal}
            onDoubleClick={toggleFullscreen}
          />

          <div className="video-frame__bar">
            <span className="video-frame__label">
              {active.isLocal && <span className="live-dot" />}
              {active.isLocal ? 'Sua tela (preview)' : `${active.name} está transmitindo`}
            </span>
            <button className="btn btn--tiny" onClick={toggleFullscreen}>
              {fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            </button>
          </div>
        </div>

        {/* Miniaturas só aparecem quando há mais de uma transmissão. */}
        {broadcasts.length > 1 && (
          <div className="tiles">
            {broadcasts.map((broadcast) => (
              <BroadcastTile
                key={broadcast.id}
                stream={broadcast.stream}
                name={broadcast.isLocal ? 'Sua tela' : broadcast.name}
                isLocal={broadcast.isLocal}
                active={broadcast.id === active.id}
                onClick={() => onSelect(broadcast.id)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
