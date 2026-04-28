import { UserRepository } from './user.repository';
import { UpdateMeDto } from './user.dto';
import { AppError } from '../../lib/errors';

export class UserService {
  constructor(private readonly repo: UserRepository) {}

  async getMe(userId: string) {
    const user = await this.repo.findById(userId);
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);
    return user;
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    if (dto.email) {
      const existing = await this.repo.findByEmail(dto.email);
      if (existing && existing.id !== userId) {
        throw new AppError('EMAIL_TAKEN', 'Email already in use', 409);
      }
    }
    return this.repo.update(userId, dto);
  }
}
