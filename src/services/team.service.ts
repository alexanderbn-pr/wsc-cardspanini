// application/services/TeamService.ts

import { TeamRepository } from "../domain/repositories/team.repository.js";
import { Sticker } from "src/domain/entities/Sticker.js";
import { Team } from "src/domain/entities/Team.js"
export class TeamService {

    constructor(
        private readonly teamRepository: TeamRepository
    ) {}

    async getAll() {
        return this.teamRepository.getAll();
    }

    async getById(id: number) {
        return this.teamRepository.getById(id);
    }

    async createSticker(sticker: Sticker, id: number){
        const team = await this.teamRepository.getById(id);
        if (!team) return;
        team.stickers.push(sticker)
    }

    async getStickersByTeamId(
        id: number,
        position?: string,
        limit?: number,
        offset?: number
    ) {
        const team = await this.teamRepository.getById(id);

        let stickers = team?.stickers;

        if (position) {
            stickers = stickers?.filter(
                sticker =>
                    sticker.position.toLowerCase() ===
                    position.toLowerCase()
            );
        }

        const start = offset ?? 0;
        const end = limit !== undefined
            ? start + limit
            : undefined;

        return stickers?.slice(start, end);
    }
}