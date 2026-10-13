import { Edition } from "../../domain/entities/Edition.js";
import { EditionRepository } from "../../domain/repositories/edition.repository.js";
import { RedisService } from "src/infrastructure/redis/redis.service.js";
import { logger } from "../../infrastructure/logger/logger.js";

export class EditionService {
  constructor(
    private readonly editionRepository: EditionRepository,
    private readonly redisService: RedisService,
  ) {}

  async getAll(): Promise<Edition[]> {
    const cacheKey = "editions:all";
    let editions = await this.redisService.get<Edition[]>(cacheKey);
    if (!editions) {
      logger.debug("Cache miss — fetching editions from database");
      editions = await this.editionRepository.getAll();
      await this.redisService.set(cacheKey, editions, 300);
    } else {
      logger.debug("Cache hit — editions loaded from Redis");
    }
    return editions;
  }
}
