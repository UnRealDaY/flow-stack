import { PrismaClient, User } from '@prisma/client';

type SafeUser = Omit<User, 'password'>;

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string): Promise<SafeUser | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      omit: { password: true },
    }) as Promise<SafeUser | null>;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  update(id: string, data: { name?: string; email?: string }): Promise<SafeUser> {
    return this.prisma.user.update({
      where: { id },
      data,
      omit: { password: true },
    }) as Promise<SafeUser>;
  }
}
