import { eventsClient } from '../lib/redis';
import { io } from '../transport/server';
import { logger } from '../lib/logger';

interface InternalEvent {
  channel: string; // e.g. "workspace:ws-abc123"
  event: string;   // e.g. "file:processed" | "payment:updated" | "presence:join"
  data: unknown;
}

// Bridges internal Redis pub/sub events → socket.io rooms.
// Publishers: core-api, file-service, payment service.
// Uses a dedicated Redis client separate from the socket.io adapter clients.
export async function subscribeToInternalEvents(): Promise<void> {
  await eventsClient.connect();

  await eventsClient.subscribe('events', (message) => {
    try {
      const { channel, event, data } = JSON.parse(message) as InternalEvent;
      io.to(channel).emit(event as any, data);
      logger.debug({ channel, event }, 'internal event forwarded');
    } catch (err) {
      logger.error({ err, message }, 'failed to process internal event');
    }
  });

  logger.info('subscribed to internal Redis events channel');
}
