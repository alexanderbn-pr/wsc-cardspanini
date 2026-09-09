import { StickerRepository } from "../domain/repositories/sticker.repository.js";
import { TeamRepository } from "../domain/repositories/team.repository.js";
import { Sticker } from "../domain/entities/Sticker.js";
import { AppError } from "../infrastructure/http/middlewares/errorHandler.js";

export class StickerService {

    constructor(
        private readonly stickerRepository: StickerRepository,
        private readonly teamRepository: TeamRepository
    ) {}

    async getByTeamId(
        teamId: number,
        position?: string,
        limit?: number,
        offset?: number
    ): Promise<Sticker[]> {
        const team = await this.teamRepository.getById(teamId);
        if (!team) {
            throw new AppError(404, `Team with id ${teamId} not found`);
        }

        let stickers = await this.stickerRepository.getByTeamId(teamId);

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

    async create(sticker: Sticker, teamId: number): Promise<Sticker> {
        const team = await this.teamRepository.getById(teamId);
        if (!team) {
            throw new AppError(404, `Team with id ${teamId} not found`);
        }
        return this.stickerRepository.create(sticker, teamId);
    }
}
