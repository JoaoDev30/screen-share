/** Espelho dos tipos do servidor (server/src/types.ts). Sem monorepo: MVP. */

export interface Participant {
  id: string;
  name: string;
  isSharing: boolean;
}

export interface RoomSnapshot {
  code: string;
  self: Participant;
  participants: Participant[];
}

export type JoinError = 'ROOM_NOT_FOUND' | 'INVALID_CODE' | 'INVALID_NAME' | 'ROOM_FULL';

export type CreateRoomAck = { ok: true; room: RoomSnapshot };
export type JoinRoomAck = { ok: true; room: RoomSnapshot } | { ok: false; error: JoinError };

/** Estado da conexão P2P com um participante. */
export type PeerState =
  | 'new'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'closed';

export interface SignalPayload {
  to: string;
  description?: unknown;
  candidate?: unknown;
}

export interface IncomingSignal {
  from: string;
  description?: unknown;
  candidate?: unknown;
}

export interface ServerToClientEvents {
  'room:participants': (participants: Participant[]) => void;
  'participant:joined': (participant: Participant) => void;
  'participant:left': (participant: Participant) => void;
  'room:closed': () => void;
  'webrtc:signal': (payload: IncomingSignal) => void;
  'share:started': (participantId: string) => void;
  'share:stopped': (participantId: string) => void;
}

export interface ClientToServerEvents {
  'room:create': (name: string, ack: (res: CreateRoomAck) => void) => void;
  'room:join': (
    payload: { code: string; name: string },
    ack: (res: JoinRoomAck) => void
  ) => void;
  'room:leave': () => void;
  'webrtc:signal': (payload: SignalPayload) => void;
  'share:start': () => void;
  'share:stop': () => void;
}

/** Mensagens de erro prontas para a interface. */
export const JOIN_ERROR_MESSAGES: Record<JoinError, string> = {
  ROOM_NOT_FOUND: 'Sala não encontrada. Confira o código.',
  INVALID_CODE: 'O código tem 6 caracteres (letras e números).',
  INVALID_NAME: 'Digite seu nome para entrar.',
  ROOM_FULL: 'A sala está cheia.',
};
