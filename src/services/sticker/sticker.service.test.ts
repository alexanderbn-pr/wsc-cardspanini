import { describe, it, expect, vi, beforeEach, type Mocked } from "vitest";
import { StickerService } from "./sticker.service.js";
import { TeamService } from "../team/team.service.js";

import { StickerRepository } from "../../domain/repositories/sticker.repository.js";
import { RedisService } from "../../infrastructure/redis/redis.service.js";
import { Sticker } from "../../domain/entities/Sticker.js";
import { StickerFilters } from "../../modules/stickers.js";
import { AppError } from "../../infrastructure/http/middlewares/errorHandler/errorHandler.js";

type RedisDouble = Pick<RedisService, "get" | "set" | "delete">;
type TeamServiceDouble = Pick<TeamService, "getById" | "invalidateCaches">;

describe("StickerService", () => {
  const createMocks = () => ({
    redis: {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    } satisfies RedisDouble,

    teamService: {
      getById: vi.fn<TeamService["getById"]>(),
      invalidateCaches: vi.fn<TeamService["invalidateCaches"]>(),
    } satisfies TeamServiceDouble,

    repository: {
      getByTeamId: vi.fn<StickerRepository["getByTeamId"]>(),
      filterStickers: vi.fn<StickerRepository["filterStickers"]>(),
      create: vi.fn<StickerRepository["create"]>(),
      findById: vi.fn<StickerRepository["findById"]>(),
      update: vi.fn<StickerRepository["update"]>(),
    } satisfies Mocked<StickerRepository>,
  });
  let redis: ReturnType<typeof createMocks>["redis"];
  let teamService: ReturnType<typeof createMocks>["teamService"];
  let repository: ReturnType<typeof createMocks>["repository"];
  let service: StickerService;

  const buildSticker = (id: number, positionId: number): Sticker => ({
    id,
    number: String(id),
    name: `Sticker ${id}`,
    positionId,
    position: `Position ${positionId}`,
    check: false,
    quantity: 1,
  });

  const team: Sticker[] = [
    buildSticker(1, 7),
    buildSticker(2, 9),
    buildSticker(3, 7),
  ];

  beforeEach(() => {
    const mocks = createMocks();

    redis = mocks.redis;
    teamService = mocks.teamService;
    repository = mocks.repository;

    teamService.getById.mockResolvedValue({
      id: 5,
      name: "Valencia CF",
      stickers: [],
    });

    service = new StickerService(
      repository,
      teamService as unknown as TeamService,
      redis,
    );
  });

  describe("getByTeamId", () => {
    it("returns the team's stickers from the cache without querying the repository", async () => {
      redis.get.mockResolvedValue(team);

      const result = await service.getByTeamId(5);

      expect(result).toEqual(team);
      // Key is hardcoded inline in sticker.service.ts:25.
      expect(redis.get).toHaveBeenCalledExactlyOnceWith("team:5:stickers");
      expect(repository.getByTeamId).not.toHaveBeenCalled();
      expect(redis.set).not.toHaveBeenCalled();
    });

    it("fetches from the repository and caches the list when the cache misses", async () => {
      redis.get.mockResolvedValue(null);
      repository.getByTeamId.mockResolvedValue(team);

      const result = await service.getByTeamId(5);

      expect(result).toEqual(team);
      expect(repository.getByTeamId).toHaveBeenCalledExactlyOnceWith(5);
      expect(redis.set).toHaveBeenCalledExactlyOnceWith(
        "team:5:stickers",
        team,
        30,
      );
    });

    it("filters the repository result by positionId and caches the unfiltered list", async () => {
      redis.get.mockResolvedValue(null);
      repository.getByTeamId.mockResolvedValue(team);

      const result = await service.getByTeamId(5, 7);

      expect(result).toEqual([buildSticker(1, 7), buildSticker(3, 7)]);
      expect(redis.set).toHaveBeenCalledExactlyOnceWith(
        "team:5:stickers",
        team,
        30,
      );
    });

    it("applies limit and offset as a slice when reading a cached list", async () => {
      redis.get.mockResolvedValue(team);

      const result = await service.getByTeamId(5, undefined, 2, 1);

      expect(result).toEqual([buildSticker(2, 9), buildSticker(3, 7)]);
      expect(redis.set).not.toHaveBeenCalled();
    });

    it("rejects with the team's not-found error before touching Redis or the repository", async () => {
      teamService.getById.mockRejectedValue(
        new AppError(404, "Team not found"),
      );

      await expect(service.getByTeamId(999)).rejects.toMatchObject({
        statusCode: 404,
      });
      expect(redis.get).not.toHaveBeenCalled();
      expect(redis.set).not.toHaveBeenCalled();
      expect(repository.getByTeamId).not.toHaveBeenCalled();
    });
  });

  describe("filterStickers", () => {
    const filters: StickerFilters = { idTeam: 5, page: 1, limit: 10 };
    const filterKey = "stickers:filter:idTeam=5:limit=10:page=1";

    it("returns filtered stickers from the cache without querying the repository", async () => {
      redis.get.mockResolvedValue(team);

      const result = await service.filterStickers(filters);

      expect(result).toEqual(team);
      expect(redis.get).toHaveBeenCalledExactlyOnceWith(filterKey);
      expect(repository.filterStickers).not.toHaveBeenCalled();
      expect(redis.set).not.toHaveBeenCalled();
    });

    it("fetches from the repository and caches the result when the cache misses", async () => {
      redis.get.mockResolvedValue(null);
      repository.filterStickers.mockResolvedValue(team);

      const result = await service.filterStickers(filters);

      expect(result).toEqual(team);
      expect(repository.filterStickers).toHaveBeenCalledExactlyOnceWith(
        filters,
      );
      expect(redis.set).toHaveBeenCalledExactlyOnceWith(filterKey, team, 30);
    });

    it("caches an empty filtered result returned by the repository", async () => {
      redis.get.mockResolvedValue(null);
      repository.filterStickers.mockResolvedValue([]);

      const result = await service.filterStickers(filters);

      expect(result).toEqual([]);
      expect(redis.set).toHaveBeenCalledExactlyOnceWith(filterKey, [], 30);
    });
  });

  describe("create", () => {
    it("creates the sticker through the repository and returns it", async () => {
      const sticker = buildSticker(10, 7);
      const created: Sticker = { ...sticker, id: 42 };
      repository.create.mockResolvedValue(created);

      const result = await service.create(sticker, 5);

      expect(result).toEqual(created);
      expect(repository.create).toHaveBeenCalledExactlyOnceWith(sticker, 5);
    });

    it("rejects before writing when the team does not exist", async () => {
      teamService.getById.mockRejectedValue(
        new AppError(404, "Team not found"),
      );

      await expect(
        service.create(buildSticker(10, 7), 5),
      ).rejects.toMatchObject({
        statusCode: 404,
      });
      expect(repository.create).not.toHaveBeenCalled();
      expect(redis.delete).not.toHaveBeenCalled();
      expect(teamService.invalidateCaches).not.toHaveBeenCalled();
    });

    it("invalidates the team's individual sticker key after creating", async () => {
      repository.create.mockResolvedValue(buildSticker(10, 7));

      await service.create(buildSticker(10, 7), 5);

      expect(redis.delete).toHaveBeenCalledExactlyOnceWith("team:5:stickers");
    });

    it("delegates full team cache invalidation to TeamService (teams + team:id embed stickers)", async () => {
      repository.create.mockResolvedValue(buildSticker(10, 7));

      await service.create(buildSticker(10, 7), 5);

      expect(teamService.invalidateCaches).toHaveBeenCalledExactlyOnceWith(5);
    });

    // Este test FIJA el comportamiento actual, no lo valida como correcto.
    //
    // Defecto conocido: `create()` solo borra `team:${teamId}:stickers`, pero
    // `filterStickers()` cachea bajo `stickers:filter:*` (via getStickerFilterCacheKey).
    // Son espacios de claves DISJUNTOS, asi que tras crear un sticker todos los
    // `stickers:filter:*` sobreviven y `filterStickers` devuelve datos RANCIOS
    // hasta que expire el TTL (30s).
    //
    // RedisService no expone borrado por patron, por lo que arreglarlo requiere
    // un cambio de diseno: contador de version en la key, o un SCAN por patron.
    // NO "arregles" este test esperando que create() invalide las filter keys:
    // ese cambio debe venir con su propio cambio de codigo de produccion.
    it("does not invalidate any stickers:filter:* entry", async () => {
      repository.create.mockResolvedValue(buildSticker(10, 7));

      await service.create(buildSticker(10, 7), 5);

      expect(redis.delete).toHaveBeenCalledTimes(1);
      const deletedKeys = redis.delete.mock.calls.map(([key]) => key);
      expect(
        deletedKeys.some((key) => key.startsWith("stickers:filter:")),
      ).toBe(false);
    });

    it("invalidates the cache only after the repository write succeeds", async () => {
      repository.create.mockResolvedValue(buildSticker(10, 7));

      await service.create(buildSticker(10, 7), 5);

      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(redis.delete).toHaveBeenCalledTimes(1);
      expect(repository.create.mock.invocationCallOrder[0]).toBeLessThan(
        redis.delete.mock.invocationCallOrder[0],
      );
    });
  });

  describe("updateQuantity", () => {
    const existing = (quantity: number, idTeam = 5) => ({
      ...buildSticker(1, 7),
      quantity,
      idTeam,
    });

    it("increments the quantity and derives check from the SERVER-side value", async () => {
      repository.findById.mockResolvedValue(existing(1));
      repository.update.mockResolvedValue({
        ...buildSticker(1, 7),
        quantity: 2,
        check: true,
      });

      const result = await service.updateQuantity(1, +1);

      expect(result.quantity).toBe(2);
      expect(repository.update).toHaveBeenCalledExactlyOnceWith(1, {
        quantity: 2,
        check: true,
      });
    });

    it("keeps check true when the quantity lands exactly on 1", async () => {
      repository.findById.mockResolvedValue(existing(2));
      repository.update.mockResolvedValue({
        ...buildSticker(1, 7),
        quantity: 1,
        check: true,
      });

      await service.updateQuantity(1, -1);

      expect(repository.update).toHaveBeenCalledExactlyOnceWith(1, {
        quantity: 1,
        check: true,
      });
    });

    it("clears check when the quantity drops to 0", async () => {
      repository.findById.mockResolvedValue(existing(1));
      repository.update.mockResolvedValue({
        ...buildSticker(1, 7),
        quantity: 0,
        check: false,
      });

      await service.updateQuantity(1, -1);

      expect(repository.update).toHaveBeenCalledExactlyOnceWith(1, {
        quantity: 0,
        check: false,
      });
    });

    it("floors the quantity at 0 instead of going negative", async () => {
      repository.findById.mockResolvedValue(existing(0));
      repository.update.mockResolvedValue({
        ...buildSticker(1, 7),
        quantity: 0,
        check: false,
      });

      await service.updateQuantity(1, -1);

      expect(repository.update).toHaveBeenCalledExactlyOnceWith(1, {
        quantity: 0,
        check: false,
      });
    });

    it("rejects with 404 before writing when the sticker does not exist", async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.updateQuantity(999, +1)).rejects.toMatchObject({
        statusCode: 404,
      });
      expect(repository.update).not.toHaveBeenCalled();
      expect(redis.delete).not.toHaveBeenCalled();
      expect(teamService.invalidateCaches).not.toHaveBeenCalled();
    });

    it("invalidates only the exact team key, never a stickers:filter:* entry", async () => {
      repository.findById.mockResolvedValue(existing(1, 7));
      repository.update.mockResolvedValue({
        ...buildSticker(1, 7),
        quantity: 2,
        check: true,
      });

      await service.updateQuantity(1, +1);

      expect(redis.delete).toHaveBeenCalledExactlyOnceWith("team:7:stickers");
      const deletedKeys = redis.delete.mock.calls.map(([key]) => key);
      expect(
        deletedKeys.some((key) => key.startsWith("stickers:filter:")),
      ).toBe(false);
      // La caché de equipos (lista global "teams" + "team:7:") se limpia
      // delegando en TeamService.invalidateCaches.
      expect(teamService.invalidateCaches).toHaveBeenCalledExactlyOnceWith(7);
    });

    it("does not invalidate any cache when the write fails", async () => {
      repository.findById.mockResolvedValue(existing(1));
      repository.update.mockRejectedValue(new Error("write failed"));

      await expect(service.updateQuantity(1, +1)).rejects.toThrow(
        "write failed",
      );
      expect(redis.delete).not.toHaveBeenCalled();
      expect(teamService.invalidateCaches).not.toHaveBeenCalled();
    });
  });
});
