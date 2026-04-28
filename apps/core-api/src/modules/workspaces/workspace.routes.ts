import { Router } from 'express';
import { PrismaClient, WorkspaceRole } from '@prisma/client';
import { WorkspaceRepository } from './workspace.repository';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { MemberRepository } from './member.repository';
import { MemberService } from './member.service';
import { MemberController } from './member.controller';
import { InviteRepository } from './invite.repository';
import { InviteService } from './invite.service';
import { InviteController } from './invite.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireWorkspaceMember } from '../../middleware/tenant.middleware';
import { requireRole } from '../../middleware/role.middleware';

export function createWorkspaceRouter(prisma: PrismaClient): Router {
  const router = Router();

  const memberRepo = new MemberRepository(prisma);
  const inviteRepo = new InviteRepository(prisma);

  const workspaceCtrl = new WorkspaceController(
    new WorkspaceService(new WorkspaceRepository(prisma)),
  );
  const memberCtrl = new MemberController(new MemberService(memberRepo));
  const inviteCtrl = new InviteController(new InviteService(inviteRepo, memberRepo));

  // ── Workspace CRUD ──────────────────────────────────────────────────────────
  router.post('/', authenticate, workspaceCtrl.create);
  router.get('/', authenticate, workspaceCtrl.list);
  router.get('/:workspaceId', authenticate, requireWorkspaceMember, workspaceCtrl.getOne);
  router.patch(
    '/:workspaceId',
    authenticate, requireWorkspaceMember,
    requireRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN),
    workspaceCtrl.update,
  );
  router.delete(
    '/:workspaceId',
    authenticate, requireWorkspaceMember,
    requireRole(WorkspaceRole.OWNER),
    workspaceCtrl.delete,
  );

  // ── Members ─────────────────────────────────────────────────────────────────
  router.get('/:workspaceId/members', authenticate, requireWorkspaceMember, memberCtrl.list);
  router.patch(
    '/:workspaceId/members/:userId',
    authenticate, requireWorkspaceMember,
    requireRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN),
    memberCtrl.changeRole,
  );
  router.delete(
    '/:workspaceId/members/:userId',
    authenticate, requireWorkspaceMember,
    requireRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN),
    memberCtrl.remove,
  );

  // ── Invites ─────────────────────────────────────────────────────────────────
  router.post(
    '/:workspaceId/invites',
    authenticate, requireWorkspaceMember,
    requireRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN),
    inviteCtrl.send,
  );
  router.get('/:workspaceId/invites', authenticate, requireWorkspaceMember, inviteCtrl.list);
  router.delete(
    '/:workspaceId/invites/:inviteId',
    authenticate, requireWorkspaceMember,
    requireRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN),
    inviteCtrl.revoke,
  );

  return router;
}

// Public invite accept — separate router, no workspace scope
export function createInvitePublicRouter(prisma: PrismaClient): Router {
  const router = Router();
  const memberRepo = new MemberRepository(prisma);
  const inviteRepo = new InviteRepository(prisma);
  const inviteCtrl = new InviteController(new InviteService(inviteRepo, memberRepo));

  router.post('/:token/accept', authenticate, inviteCtrl.accept);

  return router;
}
