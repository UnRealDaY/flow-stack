import { config } from './config';
import { logger } from './lib/logger';
import { httpServer, io, initRedisAdapter } from './transport/server';
import { applyAuthMiddleware, setupConnection } from './transport/connection';
import { subscribeToInternalEvents } from './subscribers/events';

async function main(): Promise<void> {
  // 1. Connect Redis adapter (pub + sub clients)
  await initRedisAdapter();
  logger.info('Redis adapter ready');

  // 2. Subscribe to internal events on a dedicated client
  await subscribeToInternalEvents();

  // 3. Wire auth guard and connection handler
  applyAuthMiddleware(io);
  io.on('connection', setupConnection);

  // 4. Start HTTP server
  httpServer.listen(config.port, () => {
    logger.info({ port: config.port, env: config.env }, 'realtime server started');
  });
}

main().catch((err) => {
  logger.error(err, 'fatal: realtime server failed to start');
  process.exit(1);
});
