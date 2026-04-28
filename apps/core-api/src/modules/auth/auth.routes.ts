import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

export function createAuthRouter(prisma: PrismaClient): Router {
  const router = Router();
  const controller = new AuthController(new AuthService(new AuthRepository(prisma)));

  router.post('/register', controller.register);
  router.post('/login', controller.login);
  router.post('/refresh', controller.refresh);
  router.post('/logout', controller.logout);

  return router;
}
