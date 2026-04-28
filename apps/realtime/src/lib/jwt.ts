import jwt from 'jsonwebtoken';
import { config } from '../config';

export function verifyToken(token: string): { sub: string } {
  return jwt.verify(token, config.jwt.secret) as { sub: string };
}
