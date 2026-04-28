import { Request, Response, NextFunction } from 'express';
import { WorkspaceRole } from '@prisma/client';
import { AppError } from '../lib/errors';

// Use after requireWorkspaceMember — reads req.memberRole set by tenant middleware.
export function requireRole(...roles: WorkspaceRole[]) {
  return (_req: Request, _res: Response, next: NextFunction) => {
    if (!roles.includes(_req.memberRole)) {
      return next(new AppError('FORBIDDEN', 'Insufficient role for this action', 403));
    }
    next();
  };
}
