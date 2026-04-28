import { WorkspaceRole } from '@prisma/client';
import { MemberRepository } from './member.repository';
import { UpdateMemberRoleDto } from './member.dto';
import { AppError } from '../../lib/errors';
import { parsePagination, buildMeta, PaginatedResult } from '../../lib/pagination';

export class MemberService {
  constructor(private readonly repo: MemberRepository) {}

  async list(workspaceId: string, query: unknown): Promise<PaginatedResult<unknown>> {
    const { page, perPage, skip, take } = parsePagination(query);
    const [data, total] = await Promise.all([
      this.repo.findByWorkspace(workspaceId, skip, take),
      this.repo.countByWorkspace(workspaceId),
    ]);
    return { data, meta: buildMeta(total, page, perPage) };
  }

  async changeRole(
    workspaceId: string,
    actorRole: WorkspaceRole,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
  ) {
    const target = await this.repo.findOne(workspaceId, targetUserId);
    if (!target) throw new AppError('NOT_FOUND', 'Member not found', 404);
    if (target.role === WorkspaceRole.OWNER) {
      throw new AppError('FORBIDDEN', 'Cannot change the workspace owner role', 403);
    }
    if (actorRole === WorkspaceRole.ADMIN && dto.role === 'ADMIN') {
      throw new AppError('FORBIDDEN', 'Admins cannot promote other members to admin', 403);
    }
    return this.repo.updateRole(workspaceId, targetUserId, dto.role as WorkspaceRole);
  }

  async remove(workspaceId: string, actorId: string, actorRole: WorkspaceRole, targetUserId: string) {
    if (actorId === targetUserId && actorRole === WorkspaceRole.OWNER) {
      throw new AppError('FORBIDDEN', 'Workspace owner cannot remove themselves', 403);
    }
    const target = await this.repo.findOne(workspaceId, targetUserId);
    if (!target) throw new AppError('NOT_FOUND', 'Member not found', 404);
    if (target.role === WorkspaceRole.OWNER) {
      throw new AppError('FORBIDDEN', 'Cannot remove the workspace owner', 403);
    }
    await this.repo.remove(workspaceId, targetUserId);
  }
}
