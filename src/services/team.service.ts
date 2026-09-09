import { TeamRepository } from "../domain/repositories/team.repository.js";
import { Sticker } from "../domain/entities/Sticker.js";
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
            //Invocamos al handle de error
            throw new AppError(404, `Team with id ${id} not found`);
        }
        return team;
    }

    async createSticker(sticker: Sticker, id: number): Promise<Sticker> {
        const team = await this.teamRepository.getById(id);
        if (!team) {
            throw new AppError(404, `Team with id ${id} not found`);
        }
        team.stickers.push(sticker);
        return sticker;
    }

    async getStickersByTeamId(
        id: number,
        position?: string,
        limit?: number,
        offset?: number
    ): Promise<Sticker[]> {
        const team = await this.teamRepository.getById(id);
        if (!team) {
            throw new AppError(404, `Team with id ${id} not found`);
        }

        let stickers = team.stickers;

        if (position) {
            stickers = stickers.filter(
                sticker =>
                    sticker.position.toLowerCase() ===
                    position.toLowerCase()
            );
        }

        const start = offset ?? 0;
        const end = limit !== undefined
            ? start + limit
            : undefined;

        return stickers.slice(start, end);
    }
}
