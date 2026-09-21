import { StickerFilters } from "src/modules/stickers.js";
import { StickerRepository } from "../domain/repositories/sticker.repository.js";
import { TeamService } from "../services/team.service.js";
import { Sticker } from "../domain/entities/Sticker.js";
import { RedisService } from "src/infrastructure/redis/redis.service.js";
import { getStickerFilterCacheKey } from "src/infrastructure/redis/redis.keys.js"
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
        //comporbar que el team existe para capturar el error
        await this.teamService.getById(teamId);

        const cacheKey = `team:${teamId}:stickers`;
        let stickers = await this.redisService.get<Sticker[]>(cacheKey);
        if(!stickers){
            console.log("Cacheando los stickers de ", cacheKey)
            stickers = await await this.stickerRepository.getByTeamId(teamId);
            await this.redisService.set(cacheKey,stickers, 30)
        }else{
            console.log("Recuperados los stickers de la cache ", cacheKey)
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
        console.log("cache de filtros ", cacheKey)
        let stickers = await this.redisService.get<Sticker[]>(cacheKey);
        if(!stickers){
            stickers = await this.stickerRepository.filterStickers(filters)
            await this.redisService.set(cacheKey,stickers, 30)
        }
        return stickers || [];
    }


    async create(sticker: Sticker, teamId: number): Promise<Sticker> {
        //comporbar que el team existe para capturar el error
        await this.teamService.getById(teamId);
        const createdSticker = this.stickerRepository.create(sticker, teamId);

        // Eliminamos el registro de cahce de los stickers del equipo porque hemos creado uno nuevo
        // Se volvera a cachear cuando se llamade nuevo a recoger los stickers por equipo
        const cacheKey = `team:${teamId}:stickers`;
        await this.redisService.delete(cacheKey)

        return createdSticker;
    }
}
