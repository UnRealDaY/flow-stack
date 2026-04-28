import { Request, Response, NextFunction } from 'express';
import { WorkspaceRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';

declare global {
  namespace Express {
    interface Request {
      workspaceId: string;
      memberRole: WorkspaceRole;
    }
  }
}

// Validates membership and attaches workspaceId + memberRole.
// Must run after `authenticate`. Expects :workspaceId in route params.
export async function requireWorkspaceMember(req: Request, _res: Response, next: NextFunction) {
  const { workspaceId } = req.params;
  if (!workspaceId) return next(new AppError('BAD_REQUEST', 'workspaceId is required', 400));

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: req.auth.sub } },
  });

  if (!member) {
    return next(new AppError('FORBIDDEN', 'Not a member of this workspace', 403));
  }

  req.workspaceId = workspaceId;
  req.memberRole = member.role;
  next();
}
