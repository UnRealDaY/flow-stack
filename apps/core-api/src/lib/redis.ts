import Redis from 'ioredis';
import { config } from '../config';
import { logger } from './logger';

export const redis = new Redis(config.redis.url, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});

redis.on('error', (err: Error) => logger.error({ err }, 'redis error'));
