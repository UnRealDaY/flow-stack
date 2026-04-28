import { InviteService } from '../src/modules/workspaces/invite.service';
import { InviteRepository } from '../src/modules/workspaces/invite.repository';
import { MemberRepository } from '../src/modules/workspaces/member.repository';
import { AppError } from '../src/lib/errors';

jest.mock('../src/lib/mailer', () => ({ sendInviteEmail: jest.fn() }));
jest.mock('../src/config', () => ({
  config: { cors: { origin: 'http://localhost:3000' }, env: 'test' },
}));

const mockInviteRepo = (): jest.Mocked<InviteRepository> => ({
  create: jest.fn(),
  findByToken: jest.fn(),
  findPending: jest.fn(),
  findByWorkspace: jest.fn(),
  findById: jest.fn(),
  delete: jest.fn(),
  accept: jest.fn(),
} as any);

const mockMemberRepo = (): jest.Mocked<MemberRepository> => ({
  findOne: jest.fn(),
  findByWorkspace: jest.fn(),
  countByWorkspace: jest.fn(),
  updateRole: jest.fn(),
  remove: jest.fn(),
} as any);

const fakeInvite = {
  id: 'inv-1',
  workspaceId: 'ws-1',
  senderId: 'user-1',
  email: 'bob@example.com',
  role: 'MEMBER' as const,
  token: 'tok-abc',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
};

describe('InviteService.send', () => {
  it('creates invite and returns it when no pending invite exists', async () => {
    const inviteRepo = mockInviteRepo();
    const memberRepo = mockMemberRepo();
    inviteRepo.findPending.mockResolvedValue(null);
    inviteRepo.create.mockResolvedValue(fakeInvite);

    const result = await new InviteService(inviteRepo, memberRepo).send(
      'ws-1', 'user-1', { email: 'bob@example.com', role: 'MEMBER' },
    );

    expect(result.token).toBe('tok-abc');
    expect(inviteRepo.create).toHaveBeenCalledTimes(1);
  });

  it('throws INVITE_PENDING when a pending invite exists', async () => {
    const inviteRepo = mockInviteRepo();
    const memberRepo = mockMemberRepo();
    inviteRepo.findPending.mockResolvedValue(fakeInvite);

    await expect(
      new InviteService(inviteRepo, memberRepo).send(
        'ws-1', 'user-1', { email: 'bob@example.com', role: 'MEMBER' },
      ),
    ).rejects.toMatchObject({ code: 'INVITE_PENDING', statusCode: 409 });
  });
});

describe('InviteService.accept', () => {
  it('accepts a valid invite', async () => {
    const inviteRepo = mockInviteRepo();
    const memberRepo = mockMemberRepo();
    inviteRepo.findByToken.mockResolvedValue(fakeInvite);
    memberRepo.findOne.mockResolvedValue(null);
    inviteRepo.accept.mockResolvedValue(undefined);

    await expect(
      new InviteService(inviteRepo, memberRepo).accept('tok-abc', 'user-2'),
    ).resolves.toBeUndefined();

    expect(inviteRepo.accept).toHaveBeenCalledWith('tok-abc', 'user-2');
  });

  it('throws INVITE_NOT_FOUND for unknown token', async () => {
    const inviteRepo = mockInviteRepo();
    const memberRepo = mockMemberRepo();
    inviteRepo.findByToken.mockResolvedValue(null);

    await expect(
      new InviteService(inviteRepo, memberRepo).accept('bad', 'user-2'),
    ).rejects.toMatchObject({ code: 'INVITE_NOT_FOUND', statusCode: 404 });
  });

  it('throws INVITE_EXPIRED for expired token', async () => {
    const inviteRepo = mockInviteRepo();
    const memberRepo = mockMemberRepo();
    inviteRepo.findByToken.mockResolvedValue({
      ...fakeInvite, expiresAt: new Date(Date.now() - 1000),
    });

    await expect(
      new InviteService(inviteRepo, memberRepo).accept('tok-abc', 'user-2'),
    ).rejects.toMatchObject({ code: 'INVITE_EXPIRED', statusCode: 410 });
  });

  it('throws ALREADY_MEMBER when user is already in the workspace', async () => {
    const inviteRepo = mockInviteRepo();
    const memberRepo = mockMemberRepo();
    inviteRepo.findByToken.mockResolvedValue(fakeInvite);
    memberRepo.findOne.mockResolvedValue({ id: 'm-1' } as any);

    await expect(
      new InviteService(inviteRepo, memberRepo).accept('tok-abc', 'user-2'),
    ).rejects.toMatchObject({ code: 'ALREADY_MEMBER', statusCode: 409 });
  });
});

describe('InviteService.revoke', () => {
  it('deletes invite belonging to the workspace', async () => {
    const inviteRepo = mockInviteRepo();
    const memberRepo = mockMemberRepo();
    inviteRepo.findById.mockResolvedValue(fakeInvite);
    inviteRepo.delete.mockResolvedValue(fakeInvite);

    await new InviteService(inviteRepo, memberRepo).revoke('ws-1', 'inv-1');
    expect(inviteRepo.delete).toHaveBeenCalledWith('inv-1');
  });

  it('throws NOT_FOUND when invite belongs to a different workspace', async () => {
    const inviteRepo = mockInviteRepo();
    const memberRepo = mockMemberRepo();
    inviteRepo.findById.mockResolvedValue({ ...fakeInvite, workspaceId: 'ws-other' });

    await expect(
      new InviteService(inviteRepo, memberRepo).revoke('ws-1', 'inv-1'),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });
  });
});
