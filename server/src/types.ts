/** Tipos compartilhados entre servidor e cliente (sinalização). */

export interface Participant {
  /** socket.id do participante */
  id: string;
  name: string;
  /** true enquanto esse participante estiver transmitindo a tela */
  isSharing: boolean;
}

export interface Room {
  code: string;
  participants: Map<string, Participant>;
  createdAt: number;
}

/** Estado que o cliente guarda sobre a sala em que está. */
export interface RoomSnapshot {
  code: string;
  self: Participant;
  participants: Participant[];
}

export type JoinError = 'ROOM_NOT_FOUND' | 'INVALID_CODE' | 'INVALID_NAME' | 'ROOM_FULL';

export type CreateRoomAck = { ok: true; room: RoomSnapshot };
export type JoinRoomAck = { ok: true; room: RoomSnapshot } | { ok: false; error: JoinError };

export interface JoinRoomPayload {
  code: string;
  name: string;
}

/** Sinalização WebRTC: o servidor só repassa, nunca interpreta o conteúdo. */
export interface SignalPayload {
  /** socket.id do destinatário */
  to: string;
  /** SDP (offer/answer) — opaco para o servidor */
  description?: unknown;
  /** ICE candidate — opaco para o servidor */
  candidate?: unknown;
}

/** O mesmo payload, já com o remetente preenchido pelo servidor. */
export interface IncomingSignal {
  from: string;
  description?: unknown;
  candidate?: unknown;
}

/** Eventos servidor -> cliente. */
export interface ServerToClientEvents {
  'room:participants': (participants: Participant[]) => void;
  'participant:joined': (participant: Participant) => void;
  'participant:left': (participant: Participant) => void;
  'room:closed': () => void;
  'webrtc:signal': (payload: IncomingSignal) => void;
  'share:started': (participantId: string) => void;
  'share:stopped': (participantId: string) => void;
}

/** Eventos cliente -> servidor. */
export interface ClientToServerEvents {
  'room:create': (name: string, ack: (res: CreateRoomAck) => void) => void;
  'room:join': (payload: JoinRoomPayload, ack: (res: JoinRoomAck) => void) => void;
  'room:leave': () => void;
  'webrtc:signal': (payload: SignalPayload) => void;
  'share:start': () => void;
  'share:stop': () => void;
}

/** Dados que o servidor guarda no próprio socket. */
export interface SocketData {
  roomCode?: string;
  name?: string;
}
