import { Invite, WorkspaceRole } from '@prisma/client';
import { InviteRepository } from './invite.repository';
import { MemberRepository } from './member.repository';
import { SendInviteDto } from './invite.dto';
import { AppError } from '../../lib/errors';
import { sendInviteEmail } from '../../lib/mailer';
import { config } from '../../config';

export class InviteService {
  constructor(
    private readonly inviteRepo: InviteRepository,
    private readonly memberRepo: MemberRepository,
  ) {}

  async send(workspaceId: string, senderId: string, dto: SendInviteDto): Promise<Invite> {
    const pending = await this.inviteRepo.findPending(workspaceId, dto.email);
    if (pending) {
      throw new AppError('INVITE_PENDING', 'A pending invite already exists for this email', 409);
    }

    const invite = await this.inviteRepo.create({
      workspaceId,
      senderId,
      email: dto.email,
      role: dto.role as WorkspaceRole,
    });

    const inviteLink = `${config.cors.origin}/invites/${invite.token}/accept`;
    await sendInviteEmail(dto.email, workspaceId, inviteLink);

    return invite;
  }

  list(workspaceId: string): Promise<Invite[]> {
    return this.inviteRepo.findByWorkspace(workspaceId);
  }

  async revoke(workspaceId: string, inviteId: string): Promise<void> {
    const invite = await this.inviteRepo.findById(inviteId);
    if (!invite || invite.workspaceId !== workspaceId) {
      throw new AppError('NOT_FOUND', 'Invite not found', 404);
    }
    await this.inviteRepo.delete(inviteId);
  }

  async accept(token: string, userId: string): Promise<void> {
    const invite = await this.inviteRepo.findByToken(token);
    if (!invite) throw new AppError('INVITE_NOT_FOUND', 'Invite not found', 404);
    if (invite.expiresAt < new Date()) {
      throw new AppError('INVITE_EXPIRED', 'Invite has expired', 410);
    }

    const alreadyMember = await this.memberRepo.findOne(invite.workspaceId, userId);
    if (alreadyMember) {
      throw new AppError('ALREADY_MEMBER', 'You are already a member of this workspace', 409);
    }

    await this.inviteRepo.accept(token, userId);
  }
}
