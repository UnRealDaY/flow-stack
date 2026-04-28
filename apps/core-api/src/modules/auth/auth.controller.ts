import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';

const COOKIE = 'refresh_token';
const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export class AuthController {
  constructor(private readonly service: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = RegisterDto.parse(req.body);
      const { accessToken, refreshToken } = await this.service.register(dto);
      res.cookie(COOKIE, refreshToken, cookieOpts);
      res.status(201).json({ accessToken });
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = LoginDto.parse(req.body);
      const { accessToken, refreshToken } = await this.service.login(dto);
      res.cookie(COOKIE, refreshToken, cookieOpts);
      res.json({ accessToken });
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token: string | undefined = req.cookies?.[COOKIE];
      if (!token) return res.status(401).json({ error: { code: 'NO_TOKEN', message: 'No refresh token' } });

      const { accessToken, refreshToken } = await this.service.refresh(token);
      res.cookie(COOKIE, refreshToken, cookieOpts);
      res.json({ accessToken });
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token: string | undefined = req.cookies?.[COOKIE];
      if (token) await this.service.logout(token);
      res.clearCookie(COOKIE);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
