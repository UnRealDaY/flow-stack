import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';

const PORT = Number(process.env.REALTIME_PORT) || 4001;
const JWT_SECRET = process.env.JWT_SECRET!;
const REDIS_URL = process.env.REDIS_URL!;

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true },
});

// ── Redis adapter for horizontal scaling ─────────────────────────────────────
const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  console.log('Redis adapter connected');
});

// ── Auth guard on connect ─────────────────────────────────────────────────────
io.use((socket: Socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return next(new Error('UNAUTHORIZED'));

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    (socket as any).userId = payload.sub;
    next();
  } catch {
    next(new Error('UNAUTHORIZED'));
  }
});

// ── Connection handler ────────────────────────────────────────────────────────
io.on('connection', (socket: Socket) => {
  const userId = (socket as any).userId as string;

  socket.on('workspace:join', async (workspaceId: string) => {
    await socket.join(`workspace:${workspaceId}`);
    socket.to(`workspace:${workspaceId}`).emit('presence:join', { userId });

    // Heartbeat TTL presence in Redis
    await pubClient.setEx(`presence:${workspaceId}:${userId}`, 60, '1');
  });

  socket.on('workspace:leave', async (workspaceId: string) => {
    await socket.leave(`workspace:${workspaceId}`);
    socket.to(`workspace:${workspaceId}`).emit('presence:leave', { userId });
    await pubClient.del(`presence:${workspaceId}:${userId}`);
  });

  socket.on('disconnect', () => {
    // Presence cleanup handled by Redis TTL
  });
});

// ── Redis subscriber — forwards internal events to WS clients ─────────────────
async function subscribeToInternalEvents() {
  const subscriber = createClient({ url: REDIS_URL });
  await subscriber.connect();

  await subscriber.subscribe('events', (message) => {
    try {
      const { channel, event, data } = JSON.parse(message) as {
        channel: string;
        event: string;
        data: unknown;
      };
      io.to(channel).emit(event, data);
    } catch {
      // malformed message
    }
  });
}

subscribeToInternalEvents();

httpServer.listen(PORT, () => {
  console.log(`realtime listening on :${PORT}`);
});
