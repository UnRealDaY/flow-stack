import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRepository } from './auth.repository';
import { RegisterDto, LoginDto } from './auth.dto';
import { config } from '../../config';
import { AppError } from '../../lib/errors';

export class AuthService {
  constructor(private readonly repo: AuthRepository) {}

  async register(dto: RegisterDto) {
    const existing = await this.repo.findUserByEmail(dto.email);
    if (existing) throw new AppError('EMAIL_TAKEN', 'Email already in use', 409);

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await this.repo.createUser({ ...dto, password: hashed });
    return this.issueTokenPair(user.id);
  }

  async login(dto: LoginDto) {
    const user = await this.repo.findUserByEmail(dto.email);
    if (!user) throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);

    return this.issueTokenPair(user.id);
  }

  async refresh(token: string) {
    const stored = await this.repo.findRefreshToken(token);
    if (!stored || stored.expiresAt < new Date()) {
      throw new AppError('INVALID_TOKEN', 'Refresh token invalid or expired', 401);
    }
    // Rotation: delete old, issue new pair
    await this.repo.deleteRefreshToken(token);
    return this.issueTokenPair(stored.userId);
  }

  async logout(refreshToken: string) {
    await this.repo.deleteRefreshToken(refreshToken).catch(() => null);
  }

  private async issueTokenPair(userId: string) {
    const accessToken = jwt.sign({ sub: userId }, config.jwt.secret, {
      expiresIn: config.jwt.accessExpiresIn,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign({ sub: userId }, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiresIn,
    } as jwt.SignOptions);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.repo.saveRefreshToken(userId, refreshToken, expiresAt);

    return { accessToken, refreshToken };
  }
}
