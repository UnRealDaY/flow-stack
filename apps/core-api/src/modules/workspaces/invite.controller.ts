import { Request, Response, NextFunction } from 'express';
import { InviteService } from './invite.service';
import { SendInviteDto } from './invite.dto';

export class InviteController {
  constructor(private readonly service: InviteService) {}

  send = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = SendInviteDto.parse(req.body);
      const invite = await this.service.send(req.workspaceId, req.auth.sub, dto);
      res.status(201).json({ data: invite });
    } catch (err) { next(err); }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invites = await this.service.list(req.workspaceId);
      res.json({ data: invites });
    } catch (err) { next(err); }
  };

  revoke = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.revoke(req.workspaceId, req.params.inviteId);
      res.status(204).send();
    } catch (err) { next(err); }
  };

  accept = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.accept(req.params.token, req.auth.sub);
      res.status(204).send();
    } catch (err) { next(err); }
  };
}
