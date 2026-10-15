import { TeamRepository } from "../../domain/repositories/team.repository.js";
import { Team } from "../../domain/entities/Team.js";
import { AppError } from "../../infrastructure/http/middlewares/errorHandler/errorHandler.js";
import { RedisService } from "src/infrastructure/redis/redis.service.js";
import { logger } from "../../infrastructure/logger/logger.js";
import {
  TEAMS_CACHE_KEY,
  TEAMS_CACHE_TTL_SECONDS,
  TEAM_CACHE_TTL_SECONDS,
  teamCacheKey,
  teamCollectionCacheKey,
} from "../../config/cache.js";

export class TeamService {
  constructor(
    private readonly teamRepository: TeamRepository,
    private readonly redisService: RedisService,
  ) {}

  async getAll(collectionId?: number): Promise<Team[]> {
    const cacheKey = teamCollectionCacheKey(collectionId);
    const cached = await this.redisService.get<Team[]>(cacheKey);
    if (cached) {
      logger.debug({ collectionId }, "Cache hit — teams loaded from Redis");
      return cached;
    }

    logger.debug({ collectionId }, "Cache miss — fetching teams from database");
    const teams = await this.teamRepository.getAll(collectionId);
    await this.redisService.set(cacheKey, teams, TEAMS_CACHE_TTL_SECONDS);
    return teams;
  }

  async getById(id: number): Promise<Team> {
    const cacheKey = teamCacheKey(id);
    let team = await this.redisService.get<Team>(cacheKey);
    if (!team) {
      logger.debug({ teamId: id }, "Cache miss — fetching team from database");
      const teamRepository = await this.teamRepository.getById(id);
      if (!teamRepository) {
        throw new AppError(404, `Team with id ${id} not found`);
      }
      team = teamRepository;
      await this.redisService.set(cacheKey, team, TEAM_CACHE_TTL_SECONDS);
    } else {
      logger.debug({ teamId: id }, "Cache hit — team loaded from Redis");
    }
    return team;
  }

  async invalidateCaches(teamId: number): Promise<void> {
    await Promise.all([
      this.redisService.delete(TEAMS_CACHE_KEY),
      this.redisService.delete(teamCacheKey(teamId)),
      // Also invalidate any collection-specific cache entries
      // by deleting the base key — callers should decide based on their needs
    ]);
    logger.debug({ teamId }, "Team caches invalidated");
  }
}
