import { createClient } from 'redis';
import { config } from '../config';
import { logger } from './logger';

// pubClient + subClient are dedicated to the socket.io Redis adapter
export const pubClient = createClient({ url: config.redis.url });
export const subClient = pubClient.duplicate();

// eventsClient is a separate connection used to subscribe to internal app events.
// Kept apart from the adapter clients to avoid message routing conflicts.
export const eventsClient = pubClient.duplicate();

[pubClient, subClient, eventsClient].forEach((c) => {
  c.on('error', (err) => logger.error({ err }, 'redis client error'));
});
