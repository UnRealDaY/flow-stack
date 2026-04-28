import { PrismaClient, Invite, WorkspaceRole } from '@prisma/client';
import { randomUUID } from 'crypto';

export class InviteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: {
    workspaceId: string;
    senderId: string;
    email: string;
    role: WorkspaceRole;
  }): Promise<Invite> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return this.prisma.invite.create({
      data: { ...data, token: randomUUID(), expiresAt },
    });
  }

  findByToken(token: string): Promise<Invite | null> {
    return this.prisma.invite.findUnique({ where: { token } });
  }

  findPending(workspaceId: string, email: string): Promise<Invite | null> {
    return this.prisma.invite.findFirst({
      where: { workspaceId, email, expiresAt: { gt: new Date() } },
    });
  }

  findByWorkspace(workspaceId: string): Promise<Invite[]> {
    return this.prisma.invite.findMany({
      where: { workspaceId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string): Promise<Invite | null> {
    return this.prisma.invite.findUnique({ where: { id } });
  }

  delete(id: string): Promise<Invite> {
    return this.prisma.invite.delete({ where: { id } });
  }

  async accept(token: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const invite = await tx.invite.findUnique({ where: { token } });
      if (!invite) throw new Error('INVITE_NOT_FOUND');

      await tx.workspaceMember.create({
        data: { workspaceId: invite.workspaceId, userId, role: invite.role },
      });
      await tx.invite.delete({ where: { id: invite.id } });
    });
  }
}
