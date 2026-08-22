import ParticipantList from '../components/ParticipantList';
import RoomHeader from '../components/RoomHeader';
import VideoStage from '../components/VideoStage';
import type { Participant, PeerState, RoomSnapshot } from '../services/types';

interface RoomProps {
  room: RoomSnapshot;
  participants: Participant[];
  peerStates: Record<string, PeerState>;
  channelsOpen: string[];
  remoteStreams: Record<string, MediaStream>;
  localStream: MediaStream | null;
  isSharing: boolean;
  shareError: string | null;
  onStartShare: () => void;
  onStopShare: () => void;
  onLeave: () => void;
}

export default function Room({
  room,
  participants,
  peerStates,
  channelsOpen,
  remoteStreams,
  localStream,
  isSharing,
  shareError,
  onStartShare,
  onStopShare,
  onLeave,
}: RoomProps) {
  // Transmissão alheia tem prioridade sobre o preview da minha própria tela.
  const [remoteId] = Object.keys(remoteStreams);
  const remoteStream = remoteId ? remoteStreams[remoteId] : null;
  const sharerName = participants.find((p) => p.id === remoteId)?.name ?? 'Alguém';

  const stream = remoteStream ?? localStream;
  const showingLocal = !remoteStream && localStream !== null;

  return (
    <div className="room">
      <RoomHeader code={room.code} />

      <div className="room__body">
        <ParticipantList
          participants={participants}
          selfId={room.self.id}
          peerStates={peerStates}
          channelsOpen={channelsOpen}
        />

        <VideoStage
          stream={stream}
          isLocal={showingLocal}
          label={showingLocal ? 'Sua tela (preview)' : `${sharerName} está transmitindo`}
          emptyHint={`Compartilhe o código ${room.code} com seus amigos.`}
        />
      </div>

      <footer className="controls">
        {shareError && <span className="controls__error">{shareError}</span>}

        <button className="btn btn--primary" onClick={onStartShare} disabled={isSharing}>
          Compartilhar tela
        </button>
        <button className="btn btn--ghost" onClick={onStopShare} disabled={!isSharing}>
          Parar
        </button>
        {/* Ligados na ETAPA 6. */}
        <button className="btn btn--ghost" disabled title="Chega na ETAPA 6">
          Mutar microfone
        </button>
        <button className="btn btn--ghost" disabled title="Chega na ETAPA 6">
          Áudio da tela
        </button>
        <button className="btn btn--danger" onClick={onLeave}>
          Sair
        </button>
      </footer>
    </div>
  );
}
