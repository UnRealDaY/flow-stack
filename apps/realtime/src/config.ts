import { z } from 'zod';

const env = z.object({
  NODE_ENV:     z.enum(['development', 'production', 'test']).default('development'),
  REALTIME_PORT: z.coerce.number().default(4001),
  REDIS_URL:    z.string(),
  DATABASE_URL: z.string().url(),
  JWT_SECRET:   z.string().min(32),
  CORS_ORIGIN:  z.string().default('http://localhost:3000'),
}).parse(process.env);

export const config = {
  env:    env.NODE_ENV,
  port:   env.REALTIME_PORT,
  redis:  { url: env.REDIS_URL },
  db:     { url: env.DATABASE_URL },
  jwt:    { secret: env.JWT_SECRET },
  cors:   { origin: env.CORS_ORIGIN },
} as const;
