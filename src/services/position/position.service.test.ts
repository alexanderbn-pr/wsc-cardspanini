import { describe, it, expect, vi, beforeEach, type Mocked } from "vitest";
import { PositionService } from "./position.service.js";

import { PositionRepository } from "../../domain/repositories/position.repository.js";
import { RedisService } from "../../infrastructure/redis/redis.service.js";
import { Position } from "../../domain/entities/Position.js";

type RedisDouble = Pick<RedisService, "get" | "set" | "delete">;

describe("PositionService", () => {
  const createMocks = () => ({
    redis: {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    } satisfies RedisDouble,

    repository: {
      getAll: vi.fn<PositionRepository["getAll"]>(),
    } satisfies Mocked<PositionRepository>,
  });
  let redis: ReturnType<typeof createMocks>["redis"];
  let repository: ReturnType<typeof createMocks>["repository"];
  let service: PositionService;

  beforeEach(() => {
    const mocks = createMocks();

    redis = mocks.redis;
    repository = mocks.repository;

    service = new PositionService(repository, redis);
  });

  describe("getAll", () => {
    const positions: Position[] = [
      { id: 1, name: "Portero" },
      { id: 2, name: "Defensa" },
    ];

    it("returns every position from the cache without querying the repository", async () => {
      redis.get.mockResolvedValue(positions);

      const result = await service.getAll();

      expect(result).toEqual(positions);
      expect(redis.get).toHaveBeenCalledExactlyOnceWith("positions:all");
      expect(repository.getAll).not.toHaveBeenCalled();
      expect(redis.set).not.toHaveBeenCalled();
    });

    it("fetches from the repository and caches the list when the cache misses", async () => {
      redis.get.mockResolvedValue(null);
      repository.getAll.mockResolvedValue(positions);

      const result = await service.getAll();

      expect(result).toEqual(positions);
      expect(repository.getAll).toHaveBeenCalledTimes(1);
      expect(redis.set).toHaveBeenCalledExactlyOnceWith(
        "positions:all",
        positions,
        300,
      );
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
      expect(redis.set).toHaveBeenCalledExactlyOnceWith(
        "positions:all",
        [],
        300,
      );
    });
  });
});
