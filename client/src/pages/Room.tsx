import { useCallback, useMemo, useState } from 'react';
import ParticipantList from '../components/ParticipantList';
import RoomHeader from '../components/RoomHeader';
import VideoStage, { type Broadcast } from '../components/VideoStage';
import RemoteAudio from '../components/RemoteAudio';
import VolumeMenu, { type VolumeTarget } from '../components/VolumeMenu';
import { useVolumes } from '../hooks/useVolumes';
import type { Participant, PeerState, RoomSnapshot } from '../services/types';

interface RoomProps {
  room: RoomSnapshot;
  participants: Participant[];
  peerStates: Record<string, PeerState>;
  channelsOpen: string[];
  remoteStreams: Record<string, MediaStream>;
  remoteAudio: Record<string, MediaStream>;
  localStream: MediaStream | null;
  isSharing: boolean;
  shareError: string | null;
  hasSystemAudio: boolean;
  systemAudioOn: boolean;
  onToggleSystemAudio: () => void;
  micOn: boolean;
  micError: string | null;
  onToggleMic: () => void;
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
  remoteAudio,
  localStream,
  isSharing,
  shareError,
  hasSystemAudio,
  systemAudioOn,
  onToggleSystemAudio,
  micOn,
  micError,
  onToggleMic,
  onStartShare,
  onStopShare,
  onLeave,
}: RoomProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [volumeTarget, setVolumeTarget] = useState<VolumeTarget | null>(null);
  const { getVolume, setVolume } = useVolumes();

  const abrirVolume = useCallback((peerId: string, name: string, x: number, y: number) => {
    setVolumeTarget({ peerId, name, x, y });
  }, []);

  const broadcasts = useMemo<Broadcast[]>(() => {
    const remote = Object.entries(remoteStreams).map(([id, stream]) => ({
      id,
      stream,
      name: participants.find((p) => p.id === id)?.name ?? 'Alguém',
      isLocal: false,
    }));

    // A própria tela vai por último: a transmissão dos outros tem prioridade.
    return localStream
      ? [...remote, { id: room.self.id, stream: localStream, name: 'Sua tela', isLocal: true }]
      : remote;
  }, [remoteStreams, localStream, participants, room.self.id]);

  /**
   * Seleção derivada, sem efeito colateral: se o escolhido sair do ar, cai
   * sozinho para a primeira transmissão disponível.
   */
  const active =
    broadcasts.find((b) => b.id === selectedId) ??
    broadcasts.find((b) => !b.isLocal) ??
    broadcasts[0] ??
    null;

  return (
    <div className="room">
      <RoomHeader code={room.code} />

      <div className="room__body">
        <ParticipantList
          participants={participants}
          selfId={room.self.id}
          peerStates={peerStates}
          channelsOpen={channelsOpen}
          activeId={active?.id ?? null}
          onSelectSharer={setSelectedId}
          liveCount={broadcasts.length}
          onContextMenu={(p, x, y) => abrirVolume(p.id, p.name, x, y)}
        />

        <VideoStage
          broadcasts={broadcasts}
          active={active}
          onSelect={setSelectedId}
          emptyHint={`Compartilhe o código ${room.code} com seus amigos.`}
          volume={active ? getVolume(active.id) : 100}
          onContextMenu={(b, x, y) => abrirVolume(b.id, b.isLocal ? 'Sua tela' : b.name, x, y)}
        />
      </div>

      <footer className="controls">
        {(shareError ?? micError) && (
          <span className="controls__error">{shareError ?? micError}</span>
        )}

        <button className="btn btn--primary" onClick={onStartShare} disabled={isSharing}>
          Compartilhar tela
        </button>
        <button className="btn btn--ghost" onClick={onStopShare} disabled={!isSharing}>
          Parar
        </button>

        <button
          className={`btn ${micOn ? 'btn--on' : 'btn--ghost'}`}
          onClick={onToggleMic}
        >
          {micOn ? 'Mutar microfone' : 'Ativar microfone'}
        </button>

        <button
          className={`btn ${hasSystemAudio && systemAudioOn ? 'btn--on' : 'btn--ghost'}`}
          onClick={onToggleSystemAudio}
          disabled={!hasSystemAudio}
          title={
            hasSystemAudio
              ? 'Áudio que o seu computador está tocando'
              : isSharing
                ? 'Esta fonte não forneceu áudio do sistema'
                : 'Disponível ao compartilhar a tela'
          }
        >
          {systemAudioOn && hasSystemAudio ? 'Áudio da tela: ligado' : 'Áudio da tela'}
        </button>

        <button className="btn btn--danger" onClick={onLeave}>
          Sair
        </button>
      </footer>

      {/* Microfones dos outros: tocam independentemente do palco. */}
      <RemoteAudio streams={remoteAudio} getVolume={getVolume} />

      {volumeTarget && (
        <VolumeMenu
          target={volumeTarget}
          volume={getVolume(volumeTarget.peerId)}
          onChange={(v) => setVolume(volumeTarget.peerId, v)}
          onClose={() => setVolumeTarget(null)}
        />
      )}
    </div>
  );
}
