import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface VolumeTarget {
  peerId: string;
  name: string;
  x: number;
  y: number;
}

interface VolumeMenuProps {
  target: VolumeTarget;
  volume: number;
  onChange: (volume: number) => void;
  onClose: () => void;
}

const LARGURA = 236;

export default function VolumeMenu({ target, volume, onChange, onClose }: VolumeMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: target.x, top: target.y });

  // Mantém o menu dentro da janela mesmo se abrir perto da borda.
  useLayoutEffect(() => {
    const altura = ref.current?.offsetHeight ?? 120;
    setPos({
      left: Math.min(target.x, window.innerWidth - LARGURA - 8),
      top: Math.min(target.y, window.innerHeight - altura - 8),
    });
  }, [target.x, target.y]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };

    document.addEventListener('keydown', onKey);
    // capture: fecha antes de qualquer clique da interface por baixo.
    document.addEventListener('mousedown', onDown, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown, true);
    };
  }, [onClose]);

  const mudo = volume === 0;

  return (
    <div
      ref={ref}
      className="volume-menu"
      style={{ left: pos.left, top: pos.top, width: LARGURA }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="volume-menu__header">
        <span className="volume-menu__name">{target.name}</span>
        <span className="volume-menu__value">{volume}</span>
      </div>

      <div className="volume-menu__row">
        <button
          className="volume-menu__icon"
          onClick={() => onChange(mudo ? 100 : 0)}
          title={mudo ? 'Reativar som' : 'Silenciar'}
        >
          {mudo ? '🔇' : '🔊'}
        </button>

        <input
          className="volume-slider"
          type="range"
          min={0}
          max={100}
          step={1}
          value={volume}
          onChange={(e) => onChange(Number(e.target.value))}
          // Preenchimento azul até o nível atual, como no Discord.
          style={{
            background: `linear-gradient(to right, var(--blue) ${volume}%, rgba(255,255,255,0.14) ${volume}%)`,
          }}
          autoFocus
        />
      </div>

      <p className="volume-menu__hint">Volume só para você.</p>
    </div>
  );
}
