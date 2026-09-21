import { TeamRepository } from "../domain/repositories/team.repository.js";
import { Team } from "../domain/entities/Team.js";
import { AppError } from "../infrastructure/http/middlewares/errorHandler.js";
import { RedisService } from "src/infrastructure/redis/redis.service.js";
import { logger } from "../infrastructure/logger/logger.js";

export class TeamService {

    constructor(
        private readonly teamRepository: TeamRepository,
        private readonly redisService: RedisService,
    ) {}

    async getAll(): Promise<Team[]> {
        return this.teamRepository.getAll();
    }

    async getById(id: number): Promise<Team> {
        const cacheKey = `team:${id}:`;
        let team = await this.redisService.get<Team>(cacheKey);
        if(!team){
            logger.debug({ teamId: id }, 'Cache miss — fetching team from database');
            let teamRepository = await this.teamRepository.getById(id);
            if (!teamRepository) {
                throw new AppError(404, `Team with id ${id} not found`);
            }
            team = teamRepository
            await this.redisService.set(cacheKey,team, 30)
        } else {
            logger.debug({ teamId: id }, 'Cache hit — team loaded from Redis');
        }
        return team ;
    }
}
