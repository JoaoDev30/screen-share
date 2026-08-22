import { io, type Socket } from 'socket.io-client';
import { SERVER_URL } from './config';
import type { ClientToServerEvents, ServerToClientEvents } from './types';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Conexão única com o servidor de sinalização.
 * websocket primeiro: evita o salto de polling -> upgrade e corta latência inicial.
 */
export const socket: AppSocket = io(SERVER_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnectionDelay: 500,
  reconnectionDelayMax: 3000,
});

export function connectSocket(): void {
  if (!socket.connected) socket.connect();
}

// Handle de depuração no dev, junto com o __peers do webrtc.ts.
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__socket = socket;
}
