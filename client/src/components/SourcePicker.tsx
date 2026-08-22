import { useEffect, useState } from 'react';
import { getBridge, type DesktopSource } from '../services/screen';

/**
 * Seletor de tela do Electron. O processo principal manda as fontes por IPC
 * e esperamos a escolha do usuário. No navegador este componente nunca abre.
 */
export default function SourcePicker() {
  const [sources, setSources] = useState<DesktopSource[] | null>(null);

  useEffect(() => {
    const bridge = getBridge();
    if (!bridge) return;
    return bridge.onPickSource((incoming) => setSources(incoming));
  }, []);

  if (!sources) return null;

  const choose = (id: string | null) => {
    getBridge()?.pickSource(id);
    setSources(null);
  };

  const screens = sources.filter((s) => s.kind === 'screen');
  const windows = sources.filter((s) => s.kind === 'window');

  return (
    <div className="modal-backdrop" onClick={() => choose(null)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal__title">O que você quer compartilhar?</h2>

        {screens.length > 0 && (
          <>
            <h3 className="modal__section">Telas</h3>
            <div className="source-grid">
              {screens.map((source) => (
                <SourceCard key={source.id} source={source} onPick={choose} />
              ))}
            </div>
          </>
        )}

        {windows.length > 0 && (
          <>
            <h3 className="modal__section">Janelas e aplicativos</h3>
            <div className="source-grid">
              {windows.map((source) => (
                <SourceCard key={source.id} source={source} onPick={choose} />
              ))}
            </div>
          </>
        )}

        <div className="modal__actions">
          <button className="btn btn--ghost" onClick={() => choose(null)}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function SourceCard({
  source,
  onPick,
}: {
  source: DesktopSource;
  onPick: (id: string) => void;
}) {
  return (
    <button className="source-card" onClick={() => onPick(source.id)} title={source.name}>
      <img className="source-card__thumb" src={source.thumbnail} alt="" />
      <span className="source-card__name">
        {source.icon && <img className="source-card__icon" src={source.icon} alt="" />}
        {source.name}
      </span>
    </button>
  );
}
