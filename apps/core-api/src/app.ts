import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { config } from './config';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { errorMiddleware } from './middleware/error.middleware';
import { createAuthRouter } from './modules/auth/auth.routes';

const app = express();

app.set('trust proxy', 1);

app.use(pinoHttp({ logger }));
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true }));

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'ok' });
  } catch {
    res.status(503).json({ status: 'error', db: 'unreachable' });
  }
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', createAuthRouter(prisma));

app.use(errorMiddleware);

app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.env }, 'core-api started');
});

export default app;
