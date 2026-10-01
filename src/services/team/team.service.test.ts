import { describe, it, expect, vi, beforeEach, type Mocked } from "vitest";
import { TeamService } from "../team/team.service.js";

import { TeamRepository } from "../../domain/repositories/team.repository.js";
import { RedisService } from "../../infrastructure/redis/redis.service.js";
import { Team } from "../../domain/entities/Team.js";

type RedisDouble = Pick<RedisService, "get" | "set" | "delete">;

describe("TeamService", () => {
    const createMocks = () => ({
        redis: {
            get: vi.fn(),
            set: vi.fn(),
            delete: vi.fn(),
        } satisfies RedisDouble,

        repository: {
            getById: vi.fn<TeamRepository["getById"]>(),
            getAll: vi.fn<TeamRepository["getAll"]>(),
        } satisfies Mocked<TeamRepository>,
    });
    let redis: ReturnType<typeof createMocks>["redis"];
    let repository: ReturnType<typeof createMocks>["repository"];
    let service: TeamService;

    beforeEach(() => {
        const mocks = createMocks();

        redis = mocks.redis;
        repository = mocks.repository;

        service = new TeamService(repository, redis);
    });

    describe("getAll", () => {
        const teams: Team[] = [
            { id: 1, name: "Valencia CF", stickers: [] },
            { id: 2, name: "Valencia Mestalla", stickers: [] },
        ];

        it("returns every team from the cache without querying the repository", async () => {
            redis.get.mockResolvedValue(teams);

            const result = await service.getAll();

            expect(result).toEqual(teams);
            expect(redis.get).toHaveBeenCalledExactlyOnceWith("teams");
            expect(repository.getAll).not.toHaveBeenCalled();
            expect(redis.set).not.toHaveBeenCalled();
        });

        it("fetches from the repository and caches the list when the cache misses", async () => {
            redis.get.mockResolvedValue(null);
            repository.getAll.mockResolvedValue(teams);

            const result = await service.getAll();

            expect(result).toEqual(teams);
            expect(repository.getAll).toHaveBeenCalledTimes(1);
            expect(redis.set).toHaveBeenCalledExactlyOnceWith("teams", teams, 30);
        });

        it("returns a cached empty list without treating it as a cache miss", async () => {
            redis.get.mockResolvedValue([]);

            const result = await service.getAll();

            expect(result).toEqual([]);
            expect(repository.getAll).not.toHaveBeenCalled();
            expect(redis.set).not.toHaveBeenCalled();
        });

        it("caches an empty list returned by the repository", async () => {
            redis.get.mockResolvedValue(null);
            repository.getAll.mockResolvedValue([]);

            const result = await service.getAll();

            expect(result).toEqual([]);
            expect(redis.set).toHaveBeenCalledExactlyOnceWith("teams", [], 30);
        });
    });

    describe("getById", () => {
        const team: Team = {
            id: 1,
            name: "Valencia CF",
            stickers: [],
        };

        it("returns the team from the repository and caches it when the cache misses", async () => {
            redis.get.mockResolvedValue(null);
            repository.getById.mockResolvedValue(team);

            const result = await service.getById(1);

            expect(result).toEqual(team);
            expect(repository.getById).toHaveBeenCalledExactlyOnceWith(1);
            expect(redis.set).toHaveBeenCalledExactlyOnceWith("team:1:", team, 30);
        });

        it("throws 404 and does not cache anything when the team does not exist", async () => {
            redis.get.mockResolvedValue(null);
            repository.getById.mockResolvedValue(undefined);

            await expect(service.getById(999)).rejects.toMatchObject({
                statusCode: 404
            });
            expect(repository.getById).toHaveBeenCalledExactlyOnceWith(999);
            expect(redis.set).not.toHaveBeenCalled();
        });

        it("returns the team from the cache without querying the repository or repopulating it", async () => {
            redis.get.mockResolvedValue(team);

            const result = await service.getById(1);

            expect(result).toEqual(team);
            expect(redis.get).toHaveBeenCalledExactlyOnceWith("team:1:");
            expect(repository.getById).not.toHaveBeenCalled();
            expect(redis.set).not.toHaveBeenCalled();
        });
    });
});
