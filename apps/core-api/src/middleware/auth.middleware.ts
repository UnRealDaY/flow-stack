import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from '../lib/errors';

export interface AuthPayload {
  sub: string;
}

declare global {
  namespace Express {
    interface Request {
      auth: AuthPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('UNAUTHORIZED', 'Missing bearer token', 401));
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwt.secret) as AuthPayload;
    req.auth = payload;
    next();
  } catch {
    next(new AppError('UNAUTHORIZED', 'Invalid or expired token', 401));
  }
}
