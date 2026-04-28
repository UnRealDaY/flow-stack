import { PrismaClient, WorkspaceMember, WorkspaceRole } from '@prisma/client';

type MemberWithUser = WorkspaceMember & {
  user: { id: string; name: string; email: string };
};

export class MemberRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByWorkspace(workspaceId: string, skip: number, take: number): Promise<MemberWithUser[]> {
    return this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
      skip,
      take,
    }) as Promise<MemberWithUser[]>;
  }

  countByWorkspace(workspaceId: string): Promise<number> {
    return this.prisma.workspaceMember.count({ where: { workspaceId } });
  }

  findOne(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
    return this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
  }

  updateRole(workspaceId: string, userId: string, role: WorkspaceRole): Promise<WorkspaceMember> {
    return this.prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId } },
      data: { role },
    });
  }

  remove(workspaceId: string, userId: string): Promise<WorkspaceMember> {
    return this.prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
  }
}
