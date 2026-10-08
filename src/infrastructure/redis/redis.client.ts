import { createClient } from "redis";
import { logger } from "../logger/logger.js";

export const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: { connectTimeout: 1500 },
  disableOfflineQueue: true,
});

redisClient.on("error", (error) => {
  logger.error({ err: error }, "Redis Client Error");
});

let connectPromise: Promise<void> | null = null;

export const connectRedis = async (): Promise<void> => {
  if (redisClient.isOpen) {
    return;
  }
  if (!connectPromise) {
    connectPromise = redisClient
      .connect()
      .then(() => {
        logger.info("Redis connected");
      })
      .finally(() => {
        connectPromise = null;
      });
  }
  await connectPromise;
};

export default redisClient;
