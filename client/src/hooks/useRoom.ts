import { useCallback, useEffect, useState } from 'react';
import { connectSocket, socket } from '../services/socket';
import {
  JOIN_ERROR_MESSAGES,
  type Participant,
  type RoomSnapshot,
} from '../services/types';

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected';

interface UseRoomResult {
  connection: ConnectionState;
  /** Demora além do normal: servidor gratuito costuma estar hibernando. */
  wakingServer: boolean;
  room: RoomSnapshot | null;
  participants: Participant[];
  error: string | null;
  busy: boolean;
  createRoom: (name: string) => void;
  joinRoom: (code: string, name: string) => void;
  leaveRoom: () => void;
  clearError: () => void;
}

/** Estado da sala + ciclo de vida do socket. Fonte única de verdade da ETAPA 2. */
export function useRoom(): UseRoomResult {
  const [connection, setConnection] = useState<ConnectionState>('idle');
  const [room, setRoom] = useState<RoomSnapshot | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wakingServer, setWakingServer] = useState(false);

  useEffect(() => {
    setConnection('connecting');
    connectSocket();

    const onConnect = () => {
      setConnection('connected');
      setWakingServer(false);
    };
    const onDisconnect = () => setConnection('disconnected');
    const onConnectError = () => {
      setConnection('disconnected');
      setBusy(false);
    };
    const onParticipants = (list: Participant[]) => setParticipants(list);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('room:participants', onParticipants);

    // Hospedagem gratuita hiberna. Sem este aviso o usuário acha que quebrou.
    const slowTimer = setTimeout(() => {
      setWakingServer(!socket.connected);
    }, 4000);

    return () => {
      clearTimeout(slowTimer);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('room:participants', onParticipants);
    };
  }, []);

  const createRoom = useCallback((name: string) => {
    setBusy(true);
    setError(null);
    socket.emit('room:create', name, (res) => {
      setBusy(false);
      if (res.ok) {
        setRoom(res.room);
        setParticipants(res.room.participants);
      }
    });
  }, []);

  const joinRoom = useCallback((code: string, name: string) => {
    setBusy(true);
    setError(null);
    socket.emit('room:join', { code, name }, (res) => {
      setBusy(false);
      if (res.ok) {
        setRoom(res.room);
        setParticipants(res.room.participants);
      } else {
        setError(JOIN_ERROR_MESSAGES[res.error]);
      }
    });
  }, []);

  const leaveRoom = useCallback(() => {
    socket.emit('room:leave');
    setRoom(null);
    setParticipants([]);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    connection,
    wakingServer,
    room,
    participants,
    error,
    busy,
    createRoom,
    joinRoom,
    leaveRoom,
    clearError,
  };
}
