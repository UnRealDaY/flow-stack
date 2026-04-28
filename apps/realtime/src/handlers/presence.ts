import { Socket } from 'socket.io';
import { pubClient } from '../lib/redis';
import { isWorkspaceMember } from '../lib/db';
import { logger } from '../lib/logger';
import { ClientToServerEvents, ServerToClientEvents, SocketData } from '../types';

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;

// Presence key expires after 90s — survives 3 missed 30s heartbeats
const PRESENCE_TTL_SEC = 90;
const presenceKey = (workspaceId: string, userId: string) =>
  `presence:${workspaceId}:${userId}`;

export async function handleJoin(socket: AppSocket, workspaceId: string): Promise<void> {
  const { userId } = socket.data;

  try {
    const member = await isWorkspaceMember(workspaceId, userId);
    if (!member) {
      socket.emit('error', { code: 'FORBIDDEN', message: 'Not a member of this workspace' });
      return;
    }

    await socket.join(`workspace:${workspaceId}`);
    await pubClient.setEx(presenceKey(workspaceId, userId), PRESENCE_TTL_SEC, '1');

    // Tell others this user is online
    socket.to(`workspace:${workspaceId}`).emit('presence:join', { userId });

    // Send caller the current online list
    const keys = await pubClient.keys(`presence:${workspaceId}:*`);
    const userIds = keys.map((k) => k.split(':')[2]).filter(Boolean);
    socket.emit('presence:list', { userIds });

    logger.debug({ userId, workspaceId }, 'workspace:join');
  } catch (err) {
    logger.error({ err, userId, workspaceId }, 'handleJoin error');
    socket.emit('error', { code: 'INTERNAL_ERROR', message: 'Failed to join workspace' });
  }
}

export async function handleLeave(socket: AppSocket, workspaceId: string): Promise<void> {
  const { userId } = socket.data;

  try {
    await socket.leave(`workspace:${workspaceId}`);
    await pubClient.del(presenceKey(workspaceId, userId));
    socket.to(`workspace:${workspaceId}`).emit('presence:leave', { userId });

    logger.debug({ userId, workspaceId }, 'workspace:leave');
  } catch (err) {
    logger.error({ err, userId, workspaceId }, 'handleLeave error');
  }
}

export async function handleHeartbeat(socket: AppSocket, workspaceId: string): Promise<void> {
  const { userId } = socket.data;

  try {
    // Refresh TTL so presence doesn't expire between heartbeats
    await pubClient.expire(presenceKey(workspaceId, userId), PRESENCE_TTL_SEC);
    socket.emit('heartbeat:ack');
  } catch (err) {
    logger.error({ err, userId, workspaceId }, 'handleHeartbeat error');
  }
}

export async function handleDisconnect(socket: AppSocket): Promise<void> {
  const { userId } = socket.data;

  try {
    // Clean up presence for every workspace this socket was in
    const rooms = Array.from(socket.rooms).filter((r) => r.startsWith('workspace:'));

    await Promise.all(
      rooms.map(async (room) => {
        const workspaceId = room.slice('workspace:'.length);
        await pubClient.del(presenceKey(workspaceId, userId));
        socket.to(room).emit('presence:leave', { userId });
      }),
    );

    logger.info({ socketId: socket.id, userId }, 'client disconnected');
  } catch (err) {
    logger.error({ err, userId }, 'handleDisconnect error');
  }
}
