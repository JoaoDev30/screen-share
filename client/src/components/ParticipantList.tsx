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
  onContextMenu: (participant: Participant, x: number, y: number) => void;
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

/**
 * O status responde duas perguntas diferentes: quem está transmitindo, e qual
 * dessas transmissões estou vendo. Com várias telas no ar, a segunda é a que
 * some se todo mundo aparecer só como "Transmitindo".
 */
function statusLabel(
  p: Participant,
  isSelf: boolean,
  state: PeerState | undefined,
  onStage: boolean,
  channelOk: boolean
): string {
  if (p.isSharing && onStage) return isSelf ? 'Sua tela no palco' : 'Assistindo esta';
  if (p.isSharing) return isSelf ? 'Transmitindo' : 'Transmitindo · clique para ver';
  if (isSelf) return 'Você';
  return `${state ? PEER_LABEL[state] : 'Aguardando…'}${channelOk ? ' · canal ok' : ''}`;
}

function statusTone(
  p: Participant,
  isSelf: boolean,
  state: PeerState | undefined
): string {
  if (p.isSharing) return 'live';
  if (isSelf) return 'wait';
  return peerTone(state);
}

export default function ParticipantList({
  participants,
  selfId,
  peerStates,
  channelsOpen,
  activeId,
  onSelectSharer,
  liveCount,
  onContextMenu,
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
          /** Esta é a transmissão que estou vendo no palco agora. */
          const onStage = p.id === activeId;
          // Clicar em quem transmite joga a tela dessa pessoa no palco.
          const clickable = p.isSharing;

          return (
            <li
              key={p.id}
              className={[
                'participant',
                clickable ? 'participant--clickable' : '',
                onStage ? 'participant--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={clickable ? () => onSelectSharer(p.id) : undefined}
              onContextMenu={
                isSelf
                  ? undefined
                  : (e) => {
                      e.preventDefault();
                      onContextMenu(p, e.clientX, e.clientY);
                    }
              }
            >
              <span className="avatar">{initials(p.name)}</span>

              <span className="participant__info">
                <span className="participant__name">
                  {p.name}
                  {isSelf && <span className="tag">você</span>}
                </span>

                <span className={`peer-state peer-state--${statusTone(p, isSelf, state)}`}>
                  {statusLabel(p, isSelf, state, onStage, channelsOpen.includes(p.id))}
                </span>
              </span>

              {onStage ? (
                <span className="watching-badge" title="Você está vendo esta transmissão">
                  ▶
                </span>
              ) : (
                p.isSharing && <span className="live-dot" title="Transmitindo" />
              )}
            </li>
          );
        })}
      </ul>

      {/* Conta o que está na tela: o aviso nunca contradiz as miniaturas. */}
      {liveCount > 1 && (
        <p className="sidebar__note">
          {liveCount} transmissões ao vivo. O ▶ marca a que você está vendo — clique em
          outra para trocar.
        </p>
      )}
    </aside>
  );
}
