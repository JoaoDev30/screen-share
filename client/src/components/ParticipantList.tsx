import type { Participant, PeerState } from '../services/types';

interface ParticipantListProps {
  participants: Participant[];
  selfId: string;
  peerStates: Record<string, PeerState>;
  channelsOpen: string[];
}

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}

const PEER_LABEL: Record<PeerState, string> = {
  new: 'Iniciando…',
  connecting: 'Conectando…',
  connected: 'P2P conectado',
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

          return (
            <li key={p.id} className="participant">
              <span className="avatar">{initials(p.name)}</span>

              <span className="participant__info">
                <span className="participant__name">
                  {p.name}
                  {isSelf && <span className="tag">você</span>}
                </span>
                {!isSelf && (
                  <span className={`peer-state peer-state--${peerTone(state)}`}>
                    {state ? PEER_LABEL[state] : 'Aguardando…'}
                    {channelsOpen.includes(p.id) && ' · canal ok'}
                  </span>
                )}
              </span>

              {p.isSharing && <span className="live-dot" title="Transmitindo" />}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
