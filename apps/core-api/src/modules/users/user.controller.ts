import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { UpdateMeDto } from './user.dto';

export class UserController {
  constructor(private readonly service: UserService) {}

  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.service.getMe(req.auth.sub);
      res.json({ data: user });
    } catch (err) { next(err); }
  };

  updateMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = UpdateMeDto.parse(req.body);
      const user = await this.service.updateMe(req.auth.sub, dto);
      res.json({ data: user });
    } catch (err) { next(err); }
  };
}
