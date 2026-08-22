import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import {
  MAX_PARTICIPANTS,
  addParticipant,
  createRoom,
  getRoom,
  isValidCode,
  leaveRoom,
  listParticipants,
  normalizeCode,
  roomStats,
} from './rooms.js';
import type {
  ClientToServerEvents,
  Participant,
  ServerToClientEvents,
  SocketData,
} from './types.js';

type IOServer = Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>;
type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents, never, SocketData>;

const MAX_NAME_LENGTH = 24;

function sanitizeName(raw: string): string {
  return raw.trim().slice(0, MAX_NAME_LENGTH);
}

/**
 * Sinalização via Socket.IO.
 * ETAPA 2: salas e participantes. ETAPA 3: SDP + ICE.
 */
export function setupSocket(httpServer: HttpServer): IOServer {
  const io: IOServer = new Server(httpServer, {
    // Rede de confiança: libera qualquer origem (Electron usa origin file:// ou localhost).
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket: IOSocket) => {
    console.log(`[socket] conectado: ${socket.id}`);

    /** Sai da sala atual e avisa quem ficou. Usado no leave e no disconnect. */
    const detach = (): void => {
      const code = socket.data.roomCode;
      if (!code) return;

      const removed = leaveRoom(code, socket.id);
      socket.leave(code);
      socket.data.roomCode = undefined;

      if (removed) {
        io.to(code).emit('participant:left', removed);
        io.to(code).emit('room:participants', listParticipants(code));
        console.log(`[socket] ${removed.name} saiu da sala ${code}`);
      }
    };

    /** Entra de fato na sala (já validada) e notifica todo mundo. */
    const attach = (code: string, participant: Participant) => {
      socket.data.roomCode = code;
      socket.data.name = participant.name;
      socket.join(code);

      // Avisa os outros antes de devolver o ack, para ninguém perder o evento.
      socket.to(code).emit('participant:joined', participant);
      io.to(code).emit('room:participants', listParticipants(code));
    };

    socket.on('room:create', (rawName, ack) => {
      const name = sanitizeName(rawName ?? '');
      if (!name) {
        console.warn(`[socket] ${socket.id} tentou criar sala sem nome`);
        return;
      }

      detach();
      const room = createRoom();
      const self: Participant = { id: socket.id, name, isSharing: false };
      addParticipant(room.code, self);
      attach(room.code, self);

      console.log(`[socket] ${name} criou a sala ${room.code}`);
      ack({
        ok: true,
        room: { code: room.code, self, participants: listParticipants(room.code) },
      });
    });

    socket.on('room:join', ({ code: rawCode, name: rawName }, ack) => {
      const code = normalizeCode(rawCode ?? '');
      const name = sanitizeName(rawName ?? '');

      if (!name) return ack({ ok: false, error: 'INVALID_NAME' });
      if (!isValidCode(code)) return ack({ ok: false, error: 'INVALID_CODE' });

      const room = getRoom(code);
      if (!room) return ack({ ok: false, error: 'ROOM_NOT_FOUND' });
      if (room.participants.size >= MAX_PARTICIPANTS) return ack({ ok: false, error: 'ROOM_FULL' });

      detach();
      const self: Participant = { id: socket.id, name, isSharing: false };
      addParticipant(code, self);
      attach(code, self);

      console.log(`[socket] ${name} entrou na sala ${code}`);
      ack({ ok: true, room: { code, self, participants: listParticipants(code) } });
    });

    socket.on('room:leave', () => {
      detach();
    });

    /**
     * Relay puro de SDP/ICE. O servidor não abre o conteúdo: só confere que
     * remetente e destinatário estão na mesma sala e repassa.
     */
    socket.on('webrtc:signal', ({ to, description, candidate }) => {
      const code = socket.data.roomCode;
      if (!code || !to) return;

      const room = getRoom(code);
      if (!room?.participants.has(to)) {
        console.warn(`[webrtc] ${socket.id} tentou sinalizar para ${to} fora da sala`);
        return;
      }

      io.to(to).emit('webrtc:signal', { from: socket.id, description, candidate });
    });

    /** Marca/desmarca a transmissão e avisa a sala. */
    const setSharing = (isSharing: boolean): void => {
      const code = socket.data.roomCode;
      if (!code) return;

      const room = getRoom(code);
      const me = room?.participants.get(socket.id);
      if (!me || me.isSharing === isSharing) return;

      me.isSharing = isSharing;
      io.to(code).emit(isSharing ? 'share:started' : 'share:stopped', socket.id);
      io.to(code).emit('room:participants', listParticipants(code));
      console.log(`[share] ${me.name} ${isSharing ? 'começou a' : 'parou de'} transmitir`);
    };

    socket.on('share:start', () => setSharing(true));
    socket.on('share:stop', () => setSharing(false));

    socket.on('disconnect', (reason) => {
      detach();
      console.log(`[socket] desconectado: ${socket.id} (${reason})`);
      console.log('[socket] estado:', roomStats());
    });
  });

  return io;
}
