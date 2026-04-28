import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { authenticate } from '../../middleware/auth.middleware';

export function createUserRouter(prisma: PrismaClient): Router {
  const router = Router();
  const controller = new UserController(new UserService(new UserRepository(prisma)));

  router.get('/', authenticate, controller.getMe);
  router.patch('/', authenticate, controller.updateMe);

  return router;
}
