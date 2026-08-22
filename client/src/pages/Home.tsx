import { useEffect, useState, type FormEvent } from 'react';
import type { ConnectionState } from '../hooks/useRoom';
import ServerSettings from '../components/ServerSettings';

const NAME_KEY = 'screenshare:name';

interface HomeProps {
  connection: ConnectionState;
  wakingServer: boolean;
  error: string | null;
  busy: boolean;
  onCreate: (name: string) => void;
  onJoin: (code: string, name: string) => void;
  onClearError: () => void;
}

export default function Home({
  connection,
  wakingServer,
  error,
  busy,
  onCreate,
  onJoin,
  onClearError,
}: HomeProps) {
  // Guarda o nome entre sessões: ninguém quer redigitar toda vez.
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) ?? '');
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(NAME_KEY, name);
  }, [name]);

  const offline = connection !== 'connected';
  const ready = !busy && !offline;
  const canCreate = ready && name.trim().length > 0;

  // O submit fica habilitado sempre que dá para tentar: botão desabilitado
  // impede o Enter de submeter o formulário, e digitar + Enter é o caminho natural.
  const handleJoin = (event: FormEvent) => {
    event.preventDefault();
    if (!ready) return;

    if (!name.trim()) return setLocalError('Digite seu nome para entrar.');
    if (code.trim().length !== 6) {
      return setLocalError('O código tem 6 caracteres (letras e números).');
    }

    setLocalError(null);
    onJoin(code, name);
  };

  return (
    <div className="app-shell">
      <div className="card home-card">
        <h1 className="brand">
          Screen<span>Share</span>
        </h1>
        <p className="subtitle">Transmissão de tela entre amigos, sem burocracia.</p>

        <form onSubmit={handleJoin}>
          <label className="field">
            <span className="field__label">Nome</span>
            <input
              className="input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setLocalError(null);
              }}
              placeholder="Como os amigos te chamam"
              maxLength={24}
              autoFocus
            />
          </label>

          <label className="field">
            <span className="field__label">Código da sala</span>
            <input
              className="input input--code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().slice(0, 6));
                setLocalError(null);
                if (error) onClearError();
              }}
              placeholder="ABC123"
              maxLength={6}
              spellCheck={false}
            />
          </label>

          {(localError ?? error) && <p className="form-error">{localError ?? error}</p>}

          <div className="home-actions">
            <button
              type="button"
              className="btn btn--ghost"
              disabled={!canCreate}
              onClick={() => onCreate(name)}
            >
              Criar sala
            </button>
            <button type="submit" className="btn btn--primary" disabled={!ready}>
              Entrar na sala
            </button>
          </div>
        </form>

        <div className="status-row">
          <span className={`dot dot--${connection === 'connected' ? 'online' : connection === 'connecting' ? 'checking' : 'offline'}`} />
          <span className="status-text">
            {connection === 'connecting' &&
              (wakingServer ? 'Acordando o servidor… pode levar até 1 minuto' : 'Conectando…')}
            {connection === 'connected' && 'Servidor online'}
            {connection === 'disconnected' &&
              (wakingServer
                ? 'Acordando o servidor… pode levar até 1 minuto'
                : 'Servidor offline — confira o endereço')}
            {connection === 'idle' && 'Aguardando…'}
          </span>
        </div>

        <ServerSettings />
      </div>
    </div>
  );
}
