import { useEffect, useRef, useState } from 'react';
import { peerManager } from '../services/webrtc';
import type { Participant, PeerState, RoomSnapshot } from '../services/types';

interface UsePeersResult {
  /** Estado da conexão P2P por socket.id. */
  peerStates: Record<string, PeerState>;
  /** Peers cujo DataChannel já entregou mensagem (P2P confirmado de ponta a ponta). */
  channelsOpen: string[];
  /** Streams recebidos, por socket.id de quem transmite. */
  remoteStreams: Record<string, MediaStream>;
}

/**
 * Mantém a malha P2P alinhada com a lista de participantes.
 *
 * Regra de iniciativa: quem CHEGA disca para quem já estava. Quem já estava
 * apenas aguarda a offer. Sem isso os dois lados discam ao mesmo tempo.
 */
export function usePeers(room: RoomSnapshot | null, participants: Participant[]): UsePeersResult {
  const [peerStates, setPeerStates] = useState<Record<string, PeerState>>({});
  const [channelsOpen, setChannelsOpen] = useState<string[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const knownIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!room) return;

    peerManager.start(
      room.self.id,
      (peerId, state) => {
        setPeerStates((prev) => (prev[peerId] === state ? prev : { ...prev, [peerId]: state }));
      },
      (peerId, stream) => {
        setRemoteStreams((prev) => {
          if (!stream) {
            if (!(peerId in prev)) return prev;
            const next = { ...prev };
            delete next[peerId];
            return next;
          }
          return prev[peerId] === stream ? prev : { ...prev, [peerId]: stream };
        });
      }
    );

    const onPeerMessage = (event: Event) => {
      const { from } = (event as CustomEvent<{ from: string }>).detail;
      setChannelsOpen((prev) => (prev.includes(from) ? prev : [...prev, from]));
    };
    window.addEventListener('peer:message', onPeerMessage);

    // Disca para quem já estava na sala no momento em que entrei.
    for (const participant of room.participants) {
      if (participant.id !== room.self.id) {
        knownIds.current.add(participant.id);
        peerManager.connect(participant.id);
      }
    }

    return () => {
      window.removeEventListener('peer:message', onPeerMessage);
      peerManager.stop();
      knownIds.current.clear();
      setPeerStates({});
      setChannelsOpen([]);
      setRemoteStreams({});
    };
  }, [room]);

  // Quem sai leva junto a conexão. Quem entra disca para mim, então só espero.
  useEffect(() => {
    if (!room) return;

    const currentIds = new Set(participants.map((p) => p.id));
    currentIds.delete(room.self.id);

    for (const id of knownIds.current) {
      if (!currentIds.has(id)) {
        peerManager.disconnect(id);
        knownIds.current.delete(id);
        setPeerStates((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        setChannelsOpen((prev) => prev.filter((peerId) => peerId !== id));
        setRemoteStreams((prev) => {
          if (!(id in prev)) return prev;
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    }

    for (const id of currentIds) knownIds.current.add(id);
  }, [participants, room]);

  return { peerStates, channelsOpen, remoteStreams };
}
