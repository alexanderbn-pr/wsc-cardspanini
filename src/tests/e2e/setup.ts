import "dotenv/config";
import { vi } from "vitest";

export type E2eFakeRedisClient = {
  get: (key: string) => Promise<unknown>;
  set: (
    key: string,
    value: string,
    options?: { EX?: number },
  ) => Promise<unknown>;
  del: (key: string) => Promise<unknown>;
  on: (event: string, listener: (error: unknown) => void) => unknown;
  isOpen: boolean;
  connect: () => Promise<unknown>;
  quit: () => Promise<unknown>;
};

export type E2eRedisMockProbe = {
  installed: boolean;
  client: E2eFakeRedisClient | null;
  get: ((key: string) => Promise<unknown>) | null;
  getCalls: unknown[];
  setCalls: unknown[];
  delCalls: unknown[];
};

declare global {
  var __e2eRedisMock: E2eRedisMockProbe | undefined;
}

const { probe, fakeRedisClient } = vi.hoisted(() => {
  const probe: E2eRedisMockProbe = {
    installed: false,
    client: null,
    get: null,
    getCalls: [],
    setCalls: [],
    delCalls: [],
  };

  const get = vi.fn((key: string): Promise<unknown> => {
    probe.getCalls.push(key);
    return Promise.resolve(null);
  });

  const set = vi.fn(
    (key: string, value: string, _options?: { EX?: number }) => {
      probe.setCalls.push({ key, value });
      return Promise.resolve(undefined);
    },
  );

  const del = vi.fn((key: string) => {
    probe.delCalls.push(key);
    return Promise.resolve(0);
  });

  const client: E2eFakeRedisClient = {
    get,
    set,
    del,
    on: vi.fn(),
    isOpen: false,
    connect: vi.fn().mockResolvedValue(undefined),
    quit: vi.fn().mockResolvedValue(undefined),
  };

  probe.client = client;
  probe.get = get;

  return { probe, fakeRedisClient: client };
});

vi.mock("../../infrastructure/redis/redis.client.js", () => {
  probe.installed = true;
  return {
    default: fakeRedisClient,
    redisClient: fakeRedisClient,
    connectRedis: vi.fn().mockResolvedValue(undefined),
  };
});

globalThis.__e2eRedisMock = probe;
