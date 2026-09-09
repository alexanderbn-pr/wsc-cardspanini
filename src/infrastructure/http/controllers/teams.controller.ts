import { Request, Response } from 'express';
import { TeamService } from "../../../services/team.service.js";

export class TeamController {
    constructor(
        private readonly teamService: TeamService
    ) {}

    getAll = async (req: Request, res: Response) => {
        const teams = await this.teamService.getAll();
        res.json(teams);
    }

    getId = async (req: Request, res: Response) => {
        const { id } = req.params;
        const team = await this.teamService.getById(Number(id));
        res.json(team);
    }
}
