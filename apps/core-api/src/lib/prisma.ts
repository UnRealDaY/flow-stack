import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

export const prisma = new PrismaClient({
  log: [{ emit: 'event', level: 'query' }, 'warn', 'error'],
});

prisma.$on('query', (e) => {
  logger.debug({ query: e.query, duration: e.duration }, 'prisma query');
});
