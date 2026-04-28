import { Socket, Server } from 'socket.io';
import { verifyToken } from '../lib/jwt';
import { logger } from '../lib/logger';
import { handleJoin, handleLeave, handleHeartbeat, handleDisconnect } from '../handlers/presence';
import { ClientToServerEvents, ServerToClientEvents, SocketData } from '../types';

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;
type AppServer = Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;

export function applyAuthMiddleware(io: AppServer): void {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('UNAUTHORIZED'));

    try {
      const payload = verifyToken(token);
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });
}

export function setupConnection(socket: AppSocket): void {
  const { userId } = socket.data;
  logger.info({ socketId: socket.id, userId }, 'client connected');

  socket.on('workspace:join', (workspaceId) => handleJoin(socket, workspaceId));
  socket.on('workspace:leave', (workspaceId) => handleLeave(socket, workspaceId));
  socket.on('heartbeat', (workspaceId) => handleHeartbeat(socket, workspaceId));
  socket.on('disconnect', () => handleDisconnect(socket));
}
