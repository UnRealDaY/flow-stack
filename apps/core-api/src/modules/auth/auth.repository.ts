import { PrismaClient, User, RefreshToken } from '@prisma/client';

export class AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  createUser(data: { email: string; password: string; name: string }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  saveRefreshToken(userId: string, token: string, expiresAt: Date): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({ data: { userId, token, expiresAt } });
  }

  findRefreshToken(token: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({ where: { token } });
  }

  deleteRefreshToken(token: string): Promise<RefreshToken> {
    return this.prisma.refreshToken.delete({ where: { token } });
  }

  deleteUserRefreshTokens(userId: string): Promise<{ count: number }> {
    return this.prisma.refreshToken.deleteMany({ where: { userId } });
  }
}
