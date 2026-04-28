import { Request, Response, NextFunction } from 'express';
import { MemberService } from './member.service';
import { UpdateMemberRoleDto } from './member.dto';

export class MemberController {
  constructor(private readonly service: MemberService) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.list(req.workspaceId, req.query);
      res.json(result);
    } catch (err) { next(err); }
  };

  changeRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = UpdateMemberRoleDto.parse(req.body);
      const member = await this.service.changeRole(
        req.workspaceId,
        req.memberRole,
        req.params.userId,
        dto,
      );
      res.json({ data: member });
    } catch (err) { next(err); }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.remove(req.workspaceId, req.auth.sub, req.memberRole, req.params.userId);
      res.status(204).send();
    } catch (err) { next(err); }
  };
}
