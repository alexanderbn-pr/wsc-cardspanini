import { StickerFilters } from "src/modules/stickers.js";
import { StickerRepository } from "../../domain/repositories/sticker.repository.js";
import { TeamService } from "../team/team.service.js";
import { Sticker } from "../../domain/entities/Sticker.js";
import { RedisService } from "src/infrastructure/redis/redis.service.js";
import { getStickerFilterCacheKey } from "src/infrastructure/redis/redis.keys.js";
import { logger } from "../../infrastructure/logger/logger.js";
import { AppError } from "../../infrastructure/http/middlewares/errorHandler/errorHandler.js";

export class StickerService {
  constructor(
    private readonly stickerRepository: StickerRepository,
    private readonly teamService: TeamService,
    private readonly redisService: RedisService,
  ) {}

  async getByTeamId(
    teamId: number,
    positionId?: number,
    limit?: number,
    offset?: number,
  ): Promise<Sticker[]> {
    await this.teamService.getById(teamId);

    const cacheKey = `team:${teamId}:stickers`;
    let stickers = await this.redisService.get<Sticker[]>(cacheKey);
    if (!stickers) {
      logger.debug({ teamId }, "Cache miss — fetching stickers from database");
      stickers = await this.stickerRepository.getByTeamId(teamId);
      await this.redisService.set(cacheKey, stickers, 30);
    } else {
      logger.debug({ teamId }, "Cache hit — stickers loaded from Redis");
    }

    if (positionId) {
      stickers = stickers.filter(
        (sticker) => sticker.positionId === positionId,
      );
    }

    const start = offset ?? 0;
    const end = limit !== undefined ? start + limit : undefined;
    return stickers.slice(start, end);
  }

  async filterStickers(filters: StickerFilters): Promise<Sticker[]> {
    const cacheKey = getStickerFilterCacheKey(filters);
    logger.debug({ filters }, "Filtering stickers");
    let stickers = await this.redisService.get<Sticker[]>(cacheKey);
    if (!stickers) {
      logger.debug(
        { filters },
        "Cache miss — fetching filtered stickers from database",
      );
      stickers = await this.stickerRepository.filterStickers(filters);
      await this.redisService.set(cacheKey, stickers, 30);
    } else {
      logger.debug(
        { filters },
        "Cache hit — filtered stickers loaded from Redis",
      );
    }
    return stickers || [];
  }

  /**
   * Ajusta la cantidad de un sticker por `delta` (+1 / -1) y recalcula el
   * estado `check` en el SERVIDOR (decisión E2): el floor y la derivación
   * `check = quantity >= 1` no se confían al cliente.
   *
   * Lectura-escritura no atómica: acepta un lost update si dos clicks llegan
   * a la vez (tradeoff registrado en E2, no se resuelve aquí).
   */
  async updateQuantity(id: number, delta: number): Promise<Sticker> {
    const existing = await this.stickerRepository.findById(id);
    if (!existing) {
      throw new AppError(404, `Sticker with id ${id} not found`);
    }

    const quantity = Math.max(existing.quantity + delta, 0);
    const check = quantity >= 1;

    const updated = await this.stickerRepository.update(id, {
      quantity,
      check,
    });
    if (!updated) {
      throw new AppError(404, `Sticker with id ${id} not found`);
    }

    // E3: se invalida únicamente la clave exacta del equipo. Las claves
    // `stickers:filter:*` son un keyspace combinatorio y se resuelven por TTL.
    const cacheKey = `team:${existing.idTeam}:stickers`;
    await this.redisService.delete(cacheKey);
    logger.debug(
      { id, idTeam: existing.idTeam, quantity, check },
      "Cache invalidated after sticker quantity update",
    );

    return updated;
  }

  async create(sticker: Sticker, teamId: number): Promise<Sticker> {
    await this.teamService.getById(teamId);
    logger.info(
      { teamId, sticker: { name: sticker.name, number: sticker.number } },
      "Creating sticker",
    );
    const createdSticker = await this.stickerRepository.create(sticker, teamId);

    // Invalidate cache after create
    const cacheKey = `team:${teamId}:stickers`;
    await this.redisService.delete(cacheKey);
    logger.debug({ teamId }, "Cache invalidated after sticker creation");

    return createdSticker;
  }
}
