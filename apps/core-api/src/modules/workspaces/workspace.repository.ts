import { PrismaClient, Workspace, WorkspaceRole } from '@prisma/client';

export class WorkspaceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: { name: string; slug: string; ownerId: string }): Promise<Workspace> {
    return this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: { name: data.name, slug: data.slug, ownerId: data.ownerId },
      });
      await tx.workspaceMember.create({
        data: { workspaceId: workspace.id, userId: data.ownerId, role: WorkspaceRole.OWNER },
      });
      return workspace;
    });
  }

  findById(id: string): Promise<Workspace | null> {
    return this.prisma.workspace.findFirst({ where: { id, deletedAt: null } });
  }

  findBySlug(slug: string): Promise<Workspace | null> {
    return this.prisma.workspace.findFirst({ where: { slug, deletedAt: null } });
  }

  findByMember(userId: string, skip: number, take: number): Promise<Workspace[]> {
    return this.prisma.workspace.findMany({
      where: { deletedAt: null, members: { some: { userId } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  countByMember(userId: string): Promise<number> {
    return this.prisma.workspace.count({
      where: { deletedAt: null, members: { some: { userId } } },
    });
  }

  update(id: string, data: { name?: string }): Promise<Workspace> {
    return this.prisma.workspace.update({ where: { id }, data });
  }

  softDelete(id: string): Promise<Workspace> {
    return this.prisma.workspace.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
