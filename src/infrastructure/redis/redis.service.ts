// Servicio de redis para una arquitectura hexagonal. Los servicios que llaman a la cache no tienen porque saber que la cache es de redis
import redisClient, { connectRedis } from "./redis.client.js";
import pRetry from "p-retry";
import { CACHE_RETRY_CONFIG } from "../../config/retry.js";
import { logger } from "../logger/logger.js";


const REDIS_COOLDOWN_MS = 10_000;
let unavailableUntil = 0;

const isRedisAvailable = (): boolean => Date.now() >= unavailableUntil;

function degradeRedis(operation: string, error: unknown): void {
  unavailableUntil = Date.now() + REDIS_COOLDOWN_MS;
  logger.warn(
    { err: error, operation, cooldownMs: REDIS_COOLDOWN_MS },
    "Redis unavailable — cache degraded to miss",
  );
}

export class RedisService {
  async get<T>(key: string): Promise<T | null> {
    if (!isRedisAvailable()) {
      return null;
    }

    let value: string | null;
    try {
      value = await pRetry(async () => {
        await connectRedis();
        return redisClient.get(key);
      }, CACHE_RETRY_CONFIG);
    } catch (error) {
      degradeRedis("get", error);
      return null;
    }

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      logger.warn(
        { err: error, key },
        "Invalid cache payload — treating as miss",
      );
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const payload = JSON.stringify(value);

    if (!isRedisAvailable()) {
      return;
    }

    try {
      await pRetry(async () => {
        await connectRedis();
        return redisClient.set(key, payload, {
          EX: ttlSeconds,
        });
      }, CACHE_RETRY_CONFIG);
    } catch (error) {
      degradeRedis("set", error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!isRedisAvailable()) {
      return;
    }

    try {
      await pRetry(async () => {
        await connectRedis();
        return redisClient.del(key);
      }, CACHE_RETRY_CONFIG);
    } catch (error) {
      degradeRedis("delete", error);
    }
  }
}
