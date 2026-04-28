import { Workspace } from '@prisma/client';
import { WorkspaceRepository } from './workspace.repository';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './workspace.dto';
import { AppError } from '../../lib/errors';
import { parsePagination, buildMeta, PaginatedResult } from '../../lib/pagination';

export class WorkspaceService {
  constructor(private readonly repo: WorkspaceRepository) {}

  async create(userId: string, dto: CreateWorkspaceDto): Promise<Workspace> {
    const existing = await this.repo.findBySlug(dto.slug);
    if (existing) throw new AppError('SLUG_TAKEN', 'Workspace slug is already taken', 409);
    return this.repo.create({ ...dto, ownerId: userId });
  }

  async list(userId: string, query: unknown): Promise<PaginatedResult<Workspace>> {
    const { page, perPage, skip, take } = parsePagination(query);
    const [data, total] = await Promise.all([
      this.repo.findByMember(userId, skip, take),
      this.repo.countByMember(userId),
    ]);
    return { data, meta: buildMeta(total, page, perPage) };
  }

  async getOne(workspaceId: string): Promise<Workspace> {
    const ws = await this.repo.findById(workspaceId);
    if (!ws) throw new AppError('NOT_FOUND', 'Workspace not found', 404);
    return ws;
  }

  async update(workspaceId: string, dto: UpdateWorkspaceDto): Promise<Workspace> {
    return this.repo.update(workspaceId, dto);
  }

  async delete(workspaceId: string): Promise<void> {
    await this.repo.softDelete(workspaceId);
  }
}
