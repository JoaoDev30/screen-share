import type { Participant, PeerState } from '../services/types';

interface ParticipantListProps {
  participants: Participant[];
  selfId: string;
  peerStates: Record<string, PeerState>;
  channelsOpen: string[];
  /** Transmissão que está no palco agora. */
  activeId: string | null;
  onSelectSharer: (id: string) => void;
  /** Transmissões realmente recebidas — não a flag do servidor. */
  liveCount: number;
}

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}

const PEER_LABEL: Record<PeerState, string> = {
  new: 'Iniciando…',
  connecting: 'Conectando…',
  connected: 'Conectado',
  disconnected: 'Instável',
  failed: 'Falhou',
  closed: 'Encerrado',
};

/** Verde só quando o P2P realmente fechou; o resto é amarelo ou vermelho. */
function peerTone(state: PeerState | undefined): string {
  if (state === 'connected') return 'ok';
  if (state === 'failed' || state === 'closed') return 'bad';
  return 'wait';
}

export default function ParticipantList({
  participants,
  selfId,
  peerStates,
  channelsOpen,
  activeId,
  onSelectSharer,
  liveCount,
}: ParticipantListProps) {

  return (
    <aside className="sidebar">
      <h2 className="sidebar__title">
        Participantes <span className="badge">{participants.length}</span>
      </h2>

      <ul className="participants">
        {participants.map((p) => {
          const isSelf = p.id === selfId;
          const state = peerStates[p.id];
          // Clicar em quem transmite joga a tela dessa pessoa no palco.
          const clickable = p.isSharing;

          return (
            <li
              key={p.id}
              className={[
                'participant',
                clickable ? 'participant--clickable' : '',
                p.id === activeId ? 'participant--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={clickable ? () => onSelectSharer(p.id) : undefined}
            >
              <span className="avatar">{initials(p.name)}</span>

              <span className="participant__info">
                <span className="participant__name">
                  {p.name}
                  {isSelf && <span className="tag">você</span>}
                </span>

                <span
                  className={`peer-state peer-state--${
                    p.isSharing ? 'live' : peerTone(state)
                  }`}
                >
                  {p.isSharing
                    ? 'Transmitindo'
                    : isSelf
                      ? 'Você'
                      : `${state ? PEER_LABEL[state] : 'Aguardando…'}${
                          channelsOpen.includes(p.id) ? ' · canal ok' : ''
                        }`}
                </span>
              </span>

              {p.isSharing && <span className="live-dot" title="Transmitindo" />}
            </li>
          );
        })}
      </ul>

      {/* Conta o que está na tela: o aviso nunca contradiz as miniaturas. */}
      {liveCount > 1 && (
        <p className="sidebar__note">
          {liveCount} transmissões ao vivo — clique para trocar o vídeo principal.
        </p>
      )}
    </aside>
  );
}
