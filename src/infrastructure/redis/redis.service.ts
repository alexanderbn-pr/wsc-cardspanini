// Servicio de redis para una arquitectura hexagonal. Los servicios que llaman a la cache no tienen porque saber que la cache es de redis
import redisClient from "./redis.client.js";
import pRetry from "p-retry";
import { CACHE_RETRY_CONFIG } from "../../config/retry.js";

export class RedisService {

  async get<T>(key: string): Promise<T | null> {
    const value = await pRetry(
      () => redisClient.get(key),
      CACHE_RETRY_CONFIG,
    );

    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number,
  ): Promise<void> {
    await pRetry(
      () =>
        redisClient.set(
          key,
          JSON.stringify(value),
          {
            EX: ttlSeconds,
          },
        ),
      CACHE_RETRY_CONFIG,
    );
  }

  async delete(key: string): Promise<void> {
    await pRetry(
      () => redisClient.del(key),
      CACHE_RETRY_CONFIG,
    );
  }
}
