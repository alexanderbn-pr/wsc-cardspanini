import { StickerFilters } from "src/modules/stickers.js";
import { StickerRepository } from "../domain/repositories/sticker.repository.js";
import { TeamService } from "../services/team.service.js";
import { Sticker } from "../domain/entities/Sticker.js";
import { RedisService } from "src/infrastructure/redis/redis.service.js";
import { getStickerFilterCacheKey } from "src/infrastructure/redis/redis.keys.js"
import { logger } from "../infrastructure/logger/logger.js";

export class StickerService {

    constructor(
        private readonly stickerRepository: StickerRepository,
        private readonly teamService: TeamService,
        private readonly redisService: RedisService,
    ) {}

    async getByTeamId(
        teamId: number,
        position?: string,
        limit?: number,
        offset?: number
    ): Promise<Sticker[]> {
        await this.teamService.getById(teamId);

        const cacheKey = `team:${teamId}:stickers`;
        let stickers = await this.redisService.get<Sticker[]>(cacheKey);
        if(!stickers){
            logger.debug({ teamId }, 'Cache miss — fetching stickers from database');
            stickers = await this.stickerRepository.getByTeamId(teamId);
            await this.redisService.set(cacheKey, stickers, 30)
        } else {
            logger.debug({ teamId }, 'Cache hit — stickers loaded from Redis');
        }

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

    async filterStickers(filters: StickerFilters): Promise<Sticker[]>{
        const cacheKey = getStickerFilterCacheKey(filters)
        logger.debug({ filters }, 'Filtering stickers');
        let stickers = await this.redisService.get<Sticker[]>(cacheKey);
        if(!stickers){
            logger.debug({ filters }, 'Cache miss — fetching filtered stickers from database');
            stickers = await this.stickerRepository.filterStickers(filters)
            await this.redisService.set(cacheKey, stickers, 30)
        } else {
            logger.debug({ filters }, 'Cache hit — filtered stickers loaded from Redis');
        }
        return stickers || [];
    }

    async create(sticker: Sticker, teamId: number): Promise<Sticker> {
        await this.teamService.getById(teamId);
        logger.info({ teamId, sticker: { name: sticker.name, number: sticker.number } }, 'Creating sticker');
        const createdSticker = await this.stickerRepository.create(sticker, teamId);

        // Invalidate cache after create
        const cacheKey = `team:${teamId}:stickers`;
        await this.redisService.delete(cacheKey)
        logger.debug({ teamId }, 'Cache invalidated after sticker creation');

        return createdSticker;
    }
}
