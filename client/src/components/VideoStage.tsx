import { useEffect, useRef, useState } from 'react';

interface VideoStageProps {
  stream: MediaStream | null;
  label: string;
  /** Preview da própria tela: muda a moldura e evita eco de áudio. */
  isLocal: boolean;
  emptyHint: string;
}

export default function VideoStage({ stream, label, isLocal, emptyHint }: VideoStageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = stream;
    if (stream) {
      // Autoplay pode ser recusado; sem o catch vira erro solto no console.
      video.play().catch(() => {});
    }
  }, [stream]);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement !== null);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current?.requestFullscreen();
  };

  if (!stream) {
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
      <div className="video-frame" ref={containerRef}>
        <video
          ref={videoRef}
          className="video-frame__video"
          autoPlay
          playsInline
          muted={isLocal}
        />

        <div className="video-frame__bar">
          <span className="video-frame__label">
            {isLocal && <span className="live-dot" />}
            {label}
          </span>
          <button className="btn btn--tiny" onClick={toggleFullscreen}>
            {fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          </button>
        </div>
      </div>
    </main>
  );
}
