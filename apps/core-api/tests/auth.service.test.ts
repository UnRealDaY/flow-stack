import { AuthService } from '../src/modules/auth/auth.service';
import { AuthRepository } from '../src/modules/auth/auth.repository';
import { AppError } from '../src/lib/errors';

jest.mock('../src/config', () => ({
  config: {
    jwt: {
      secret: 'test-secret-that-is-at-least-32-chars-long',
      accessExpiresIn: '15m',
      refreshExpiresIn: '7d',
    },
  },
}));

const mockRepo = (): jest.Mocked<AuthRepository> => ({
  findUserByEmail: jest.fn(),
  createUser: jest.fn(),
  saveRefreshToken: jest.fn(),
  findRefreshToken: jest.fn(),
  deleteRefreshToken: jest.fn(),
  deleteUserRefreshTokens: jest.fn(),
} as any);

const fakeUser = {
  id: 'user-1',
  email: 'a@b.com',
  name: 'Alice',
  password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfmgTewX0hn7MuG', // "password123"
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('AuthService.register', () => {
  it('returns token pair when email is new', async () => {
    const repo = mockRepo();
    repo.findUserByEmail.mockResolvedValue(null);
    repo.createUser.mockResolvedValue(fakeUser);
    repo.saveRefreshToken.mockResolvedValue({} as any);

    const result = await new AuthService(repo).register({
      email: 'a@b.com', password: 'password123', name: 'Alice',
    });

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(repo.createUser).toHaveBeenCalledTimes(1);
  });

  it('throws EMAIL_TAKEN when email already exists', async () => {
    const repo = mockRepo();
    repo.findUserByEmail.mockResolvedValue(fakeUser);

    await expect(
      new AuthService(repo).register({ email: 'a@b.com', password: 'password123', name: 'A' }),
    ).rejects.toMatchObject({ code: 'EMAIL_TAKEN', statusCode: 409 });
  });
});

describe('AuthService.login', () => {
  it('throws INVALID_CREDENTIALS when user not found', async () => {
    const repo = mockRepo();
    repo.findUserByEmail.mockResolvedValue(null);

    await expect(
      new AuthService(repo).login({ email: 'a@b.com', password: 'x' }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', statusCode: 401 });
  });

  it('throws INVALID_CREDENTIALS when password is wrong', async () => {
    const repo = mockRepo();
    repo.findUserByEmail.mockResolvedValue(fakeUser);

    await expect(
      new AuthService(repo).login({ email: 'a@b.com', password: 'wrong' }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });
});

describe('AuthService.refresh', () => {
  it('throws INVALID_TOKEN when token not found', async () => {
    const repo = mockRepo();
    repo.findRefreshToken.mockResolvedValue(null);

    await expect(new AuthService(repo).refresh('bad')).rejects.toMatchObject({
      code: 'INVALID_TOKEN',
      statusCode: 401,
    });
  });

  it('throws INVALID_TOKEN when token is expired', async () => {
    const repo = mockRepo();
    repo.findRefreshToken.mockResolvedValue({
      id: '1', userId: 'user-1', token: 'tok', expiresAt: new Date(Date.now() - 1000), createdAt: new Date(),
    });

    await expect(new AuthService(repo).refresh('tok')).rejects.toMatchObject({
      code: 'INVALID_TOKEN',
    });
  });

  it('rotates token: deletes old and issues new pair', async () => {
    const repo = mockRepo();
    repo.findRefreshToken.mockResolvedValue({
      id: '1', userId: 'user-1', token: 'tok', expiresAt: new Date(Date.now() + 60000), createdAt: new Date(),
    });
    repo.deleteRefreshToken.mockResolvedValue({} as any);
    repo.saveRefreshToken.mockResolvedValue({} as any);

    const result = await new AuthService(repo).refresh('tok');

    expect(repo.deleteRefreshToken).toHaveBeenCalledWith('tok');
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
  });
});
