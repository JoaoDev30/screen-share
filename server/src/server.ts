import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { setupSocket } from './socket.js';
import { roomStats } from './rooms.js';

const PORT = Number(process.env.PORT ?? 3001);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime(), ...roomStats() });
});

const httpServer = http.createServer(app);
setupSocket(httpServer);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] sinalizacao ouvindo em http://localhost:${PORT}`);
});
