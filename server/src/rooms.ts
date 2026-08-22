import type { Participant, Room } from './types.js';

/** Estado 100% em memória. Sem banco, sem persistência. */
const rooms = new Map<string, Room>();

/** Alfabeto sem caracteres ambíguos (0/O, 1/I) para ditar o código por voz. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

/** Grupo pequeno de amigos: malha P2P acima disso derrete o upload. */
export const MAX_PARTICIPANTS = 10;

export function normalizeCode(input: string): string {
  return input.trim().toUpperCase();
}

export function isValidCode(code: string): boolean {
  return new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`).test(code);
}

/** Gera um código de 6 caracteres que ainda não esteja em uso. */
export function generateRoomCode(): string {
  let code: string;
  do {
    code = Array.from(
      { length: CODE_LENGTH },
      () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
    ).join('');
  } while (rooms.has(code));
  return code;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(normalizeCode(code));
}

export function createRoom(): Room {
  const room: Room = {
    code: generateRoomCode(),
    participants: new Map(),
    createdAt: Date.now(),
  };
  rooms.set(room.code, room);
  return room;
}

/** Adiciona o participante numa sala que já existe. */
export function addParticipant(code: string, participant: Participant): Room | undefined {
  const room = getRoom(code);
  if (!room) return undefined;
  room.participants.set(participant.id, participant);
  return room;
}

/** Remove o participante e apaga a sala se ela ficar vazia. */
export function leaveRoom(code: string, socketId: string): Participant | undefined {
  const room = getRoom(code);
  if (!room) return undefined;

  const participant = room.participants.get(socketId);
  room.participants.delete(socketId);

  if (room.participants.size === 0) {
    rooms.delete(room.code);
  }
  return participant;
}

export function listParticipants(code: string): Participant[] {
  const room = getRoom(code);
  return room ? [...room.participants.values()] : [];
}

export function roomStats() {
  return {
    rooms: rooms.size,
    participants: [...rooms.values()].reduce((acc, r) => acc + r.participants.size, 0),
  };
}
