import { Request, Response, NextFunction } from 'express';
import { WorkspaceService } from './workspace.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './workspace.dto';

export class WorkspaceController {
  constructor(private readonly service: WorkspaceService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = CreateWorkspaceDto.parse(req.body);
      const workspace = await this.service.create(req.auth.sub, dto);
      res.status(201).json({ data: workspace });
    } catch (err) { next(err); }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.list(req.auth.sub, req.query);
      res.json(result);
    } catch (err) { next(err); }
  };

  getOne = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspace = await this.service.getOne(req.workspaceId);
      res.json({ data: workspace });
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = UpdateWorkspaceDto.parse(req.body);
      const workspace = await this.service.update(req.workspaceId, dto);
      res.json({ data: workspace });
    } catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.workspaceId);
      res.status(204).send();
    } catch (err) { next(err); }
  };
}
