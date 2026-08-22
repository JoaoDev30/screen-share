import { useState } from 'react';
import { SERVER_URL, setServerUrl } from '../services/config';

/**
 * Endereço do servidor de sinalização. Sem isso o executável só funciona na
 * máquina que hospeda: cada cópia procuraria um servidor no próprio localhost.
 */
export default function ServerSettings() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(SERVER_URL);

  const dirty = value.trim() !== SERVER_URL;

  if (!open) {
    return (
      <button className="server-link" onClick={() => setOpen(true)}>
        Servidor: {SERVER_URL.replace(/^https?:\/\//, '')}
      </button>
    );
  }

  return (
    <div className="server-box">
      <label className="field">
        <span className="field__label">Endereço do servidor</span>
        <input
          className="input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && dirty) setServerUrl(value);
          }}
          placeholder="192.168.0.10:3001"
          spellCheck={false}
        />
      </label>

      <p className="server-box__hint">
        Peça o endereço para quem está hospedando a sala.
      </p>

      <div className="server-box__actions">
        <button className="btn btn--tiny" onClick={() => setOpen(false)}>
          Cancelar
        </button>
        <button
          className="btn btn--tiny btn--accent"
          disabled={!dirty}
          onClick={() => setServerUrl(value)}
        >
          Salvar e reconectar
        </button>
      </div>
    </div>
  );
}
