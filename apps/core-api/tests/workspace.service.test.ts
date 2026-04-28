import { WorkspaceService } from '../src/modules/workspaces/workspace.service';
import { WorkspaceRepository } from '../src/modules/workspaces/workspace.repository';
import { AppError } from '../src/lib/errors';

const mockRepo = (): jest.Mocked<WorkspaceRepository> => ({
  create: jest.fn(),
  findById: jest.fn(),
  findBySlug: jest.fn(),
  findByMember: jest.fn(),
  countByMember: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
} as any);

const fakeWorkspace = {
  id: 'ws-1',
  name: 'Acme',
  slug: 'acme',
  ownerId: 'user-1',
  planId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('WorkspaceService.create', () => {
  it('creates workspace when slug is available', async () => {
    const repo = mockRepo();
    repo.findBySlug.mockResolvedValue(null);
    repo.create.mockResolvedValue(fakeWorkspace);

    const result = await new WorkspaceService(repo).create('user-1', { name: 'Acme', slug: 'acme' });

    expect(result.id).toBe('ws-1');
    expect(repo.create).toHaveBeenCalledWith({ name: 'Acme', slug: 'acme', ownerId: 'user-1' });
  });

  it('throws SLUG_TAKEN when slug is already used', async () => {
    const repo = mockRepo();
    repo.findBySlug.mockResolvedValue(fakeWorkspace);

    await expect(
      new WorkspaceService(repo).create('user-1', { name: 'Acme', slug: 'acme' }),
    ).rejects.toMatchObject({ code: 'SLUG_TAKEN', statusCode: 409 });
  });
});

describe('WorkspaceService.list', () => {
  it('returns paginated workspaces', async () => {
    const repo = mockRepo();
    repo.findByMember.mockResolvedValue([fakeWorkspace]);
    repo.countByMember.mockResolvedValue(1);

    const result = await new WorkspaceService(repo).list('user-1', { page: '1', perPage: '20' });

    expect(result.data).toHaveLength(1);
    expect(result.meta).toMatchObject({ total: 1, page: 1, perPage: 20, hasNextPage: false });
  });
});

describe('WorkspaceService.getOne', () => {
  it('returns workspace when found', async () => {
    const repo = mockRepo();
    repo.findById.mockResolvedValue(fakeWorkspace);

    const result = await new WorkspaceService(repo).getOne('ws-1');
    expect(result.slug).toBe('acme');
  });

  it('throws NOT_FOUND when workspace does not exist', async () => {
    const repo = mockRepo();
    repo.findById.mockResolvedValue(null);

    await expect(new WorkspaceService(repo).getOne('missing')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      statusCode: 404,
    });
  });
});

describe('WorkspaceService.delete', () => {
  it('calls softDelete on repository', async () => {
    const repo = mockRepo();
    repo.softDelete.mockResolvedValue({ ...fakeWorkspace, deletedAt: new Date() });

    await new WorkspaceService(repo).delete('ws-1');
    expect(repo.softDelete).toHaveBeenCalledWith('ws-1');
  });
});
