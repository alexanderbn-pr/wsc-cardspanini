import { TeamRepository } from "../domain/repositories/team.repository.js";
import { Team } from "../domain/entities/Team.js";
import { AppError } from "../infrastructure/http/middlewares/errorHandler.js";

export class TeamService {

    constructor(
        private readonly teamRepository: TeamRepository
    ) {}

    async getAll(): Promise<Team[]> {
        return this.teamRepository.getAll();
    }

    async getById(id: number): Promise<Team> {
        const team = await this.teamRepository.getById(id);
        if (!team) {
            throw new AppError(404, `Team with id ${id} not found`);
        }
        return team;
    }
}
