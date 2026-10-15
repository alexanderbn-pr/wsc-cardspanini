import { Request, Response } from "express";
import { TeamService } from "../../../../services/team/team.service.js";

export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  getAll = async (req: Request, res: Response) => {
    const collectionId = req.query?.collectionId
      ? Number(req.query.collectionId)
      : undefined;
    const teams = await this.teamService.getAll(collectionId);
    res.json(teams);
  };

  getId = async (req: Request, res: Response) => {
    const { id } = req.params;
    const team = await this.teamService.getById(Number(id));
    res.json(team);
  };
}
