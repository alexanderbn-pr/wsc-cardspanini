// Servicio de redis para una arquitectura hexagonal. Los servicios que llaman a la cache no tienen porque saber que la cache es de redis
import redisClient from "./redis.client.js";

export class RedisService {

  async get<T>(key: string): Promise<T | null> {
    const value = await redisClient.get(key);

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
    await redisClient.set(
      key,
      JSON.stringify(value),
      {
        EX: ttlSeconds,
      },
    );
  }

  async delete(key: string): Promise<void> {
    await redisClient.del(key);
  }
}