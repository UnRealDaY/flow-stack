import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { config } from './config';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';
import { errorMiddleware } from './middleware/error.middleware';
import { createAuthRouter } from './modules/auth/auth.routes';
import { createWorkspaceRouter, createInvitePublicRouter } from './modules/workspaces/workspace.routes';
import { createUserRouter } from './modules/users/user.routes';

const app = express();

app.set('trust proxy', 1);

app.use(pinoHttp({ logger }));
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true }));

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  const [dbResult, redisResult] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    redis.ping(),
  ]);

  const db = dbResult.status === 'fulfilled' ? 'ok' : 'unreachable';
  const cache = redisResult.status === 'fulfilled' ? 'ok' : 'unreachable';
  const healthy = db === 'ok' && cache === 'ok';

  res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'error', db, cache });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', createAuthRouter(prisma));
app.use('/api/v1/me', createUserRouter(prisma));
app.use('/api/v1/workspaces', createWorkspaceRouter(prisma));
app.use('/api/v1/invites', createInvitePublicRouter(prisma));

app.use(errorMiddleware);

app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.env }, 'core-api started');
});

export default app;
