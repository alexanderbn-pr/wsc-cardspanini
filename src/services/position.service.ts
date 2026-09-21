import { Position } from "../domain/entities/Position.js";
import { PositionRepository } from "../domain/repositories/position.repository.js";
import { RedisService } from "src/infrastructure/redis/redis.service.js";
import { logger } from "../infrastructure/logger/logger.js";

export class PositionService {

    constructor(
        private readonly positionRepository: PositionRepository,
        private readonly redisService: RedisService,
    ) {}

    async getAll(): Promise<Position[]> {
        const cacheKey = 'positions:all';
        let positions = await this.redisService.get<Position[]>(cacheKey);
        if (!positions) {
            logger.debug('Cache miss — fetching positions from database');
            positions = await this.positionRepository.getAll();
            await this.redisService.set(cacheKey, positions, 300);
        } else {
            logger.debug('Cache hit — positions loaded from Redis');
        }
        return positions;
    }
}
