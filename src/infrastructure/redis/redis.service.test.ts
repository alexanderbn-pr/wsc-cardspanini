import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const clientMocks = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  connectRedis: vi.fn(),
}));

vi.mock("./redis.client.js", () => ({
  default: {
    get: clientMocks.get,
    set: clientMocks.set,
    del: clientMocks.del,
  },
  connectRedis: clientMocks.connectRedis,
}));

vi.mock("../logger/logger.js", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// El cooldown es estado de módulo: resetModules + import dinámico para que
// cada test arranche con la ventana de degradación limpia.
const loadService = async () => {
  vi.resetModules();
  const { RedisService } = await import("./redis.service.js");
  return new RedisService();
};

// Surte los timers de pRetry (200ms + 400ms de backoff) y el cooldown (10s).
const tick = (ms: number) => vi.advanceTimersByTimeAsync(ms);

const ECONNREFUSED = () => new Error("connect ECONNREFUSED");

describe("RedisService — degradación elegante", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(clientMocks.get).mockReset();
    vi.mocked(clientMocks.set).mockReset();
    vi.mocked(clientMocks.del).mockReset();
    vi.mocked(clientMocks.connectRedis).mockReset();
    clientMocks.connectRedis.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("get", () => {
    it("devuelve null (miss) cuando la conexión a Redis falla", async () => {
      const service = await loadService();
      clientMocks.connectRedis.mockRejectedValue(ECONNREFUSED());

      const pending = service.get("teams:all");
      await tick(10_000);

      await expect(pending).resolves.toBeNull();
    });

    it("devuelve null cuando el comando falla en caliente", async () => {
      const service = await loadService();
      clientMocks.get.mockRejectedValue(new Error("The client is closed"));

      const pending = service.get("teams:all");
      await tick(10_000);

      await expect(pending).resolves.toBeNull();
    });

    it("devuelve el valor parseado en el camino feliz", async () => {
      const service = await loadService();
      clientMocks.get.mockResolvedValue(
        JSON.stringify({ id: 1, name: "R.Madrid" }),
      );

      await expect(service.get("team:1")).resolves.toEqual({
        id: 1,
        name: "R.Madrid",
      });
    });

    it("payload corrupto → miss SIN activar la ventana de cooldown", async () => {
      const service = await loadService();
      clientMocks.get.mockResolvedValue("{{{no-json");

      await expect(service.get("team:1")).resolves.toBeNull();

      const callsAfterMiss = clientMocks.get.mock.calls.length;
      await expect(service.get("team:1")).resolves.toBeNull();

      // Sigue intentando: Redis está sano, solo venía un payload corrupto
      expect(clientMocks.get.mock.calls.length).toBe(callsAfterMiss + 1);
    });
  });

  describe("set / delete", () => {
    it("set no lanza cuando Redis está caído", async () => {
      const service = await loadService();
      clientMocks.connectRedis.mockRejectedValue(ECONNREFUSED());

      const pending = service.set("teams:all", [{ id: 1 }], 60);
      await tick(10_000);

      await expect(pending).resolves.toBeUndefined();
    });

    it("delete no lanza cuando Redis está caído", async () => {
      const service = await loadService();
      clientMocks.del.mockRejectedValue(new Error("The client is closed"));

      const pending = service.delete("teams:all");
      await tick(10_000);

      await expect(pending).resolves.toBeUndefined();
    });

    it("set propaga los errores de serialización (bug de código, no de infra)", async () => {
      const service = await loadService();
      const circular: Record<string, unknown> = {};
      circular.self = circular;

      await expect(service.set("k", circular, 60)).rejects.toThrow();
    });
  });

  describe("ventana de cooldown", () => {
    it("tras un fallo, las siguientes peticiones fallan rápido sin tocar Redis", async () => {
      const service = await loadService();
      clientMocks.connectRedis.mockRejectedValue(ECONNREFUSED());

      const first = service.get("teams:all");
      await tick(10_000);
      await expect(first).resolves.toBeNull();

      const attemptsWhileUp = clientMocks.connectRedis.mock.calls.length;

      await expect(service.get("teams:all")).resolves.toBeNull();
      await expect(service.get("teams:all")).resolves.toBeNull();

      expect(clientMocks.connectRedis.mock.calls.length).toBe(attemptsWhileUp);
    });

    it("tras la ventana reintenta y recupera el cacheo si Redis volvió", async () => {
      const service = await loadService();
      clientMocks.connectRedis.mockRejectedValue(ECONNREFUSED());

      const first = service.get("teams:all");
      await tick(10_000);
      await expect(first).resolves.toBeNull();

      // Redis "vuelve" y ya estamos fuera de la ventana
      clientMocks.connectRedis.mockResolvedValue(undefined);
      clientMocks.get.mockResolvedValue(JSON.stringify([{ id: 1 }]));
      await tick(5_000);

      await expect(service.get("teams:all")).resolves.toEqual([{ id: 1 }]);
      expect(clientMocks.connectRedis.mock.calls.length).toBeGreaterThan(1);
    });
  });
});
