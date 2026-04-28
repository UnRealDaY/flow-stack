import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { pubClient, subClient } from '../lib/redis';
import { config } from '../config';
import { ClientToServerEvents, ServerToClientEvents, SocketData } from '../types';

export const httpServer = createServer();

export const io = new Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(
  httpServer,
  {
    cors: { origin: config.cors.origin, credentials: true },
    pingTimeout: 60_000,
    pingInterval: 25_000,
  },
);

export async function initRedisAdapter(): Promise<void> {
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));
}
