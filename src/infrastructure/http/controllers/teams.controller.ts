import { Request, Response } from 'express';
import { TeamService } from "../../../services/team.service.js";

/**
 * Controller for team-related HTTP endpoints.
 * Uses constructor-based dependency injection to receive TeamService.
 * Follows the same pattern as StickerController.
 */
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
        if (!team) {
            return res.status(404).json({ error: "Team not found" });
        }
        res.json(team);
    }
}