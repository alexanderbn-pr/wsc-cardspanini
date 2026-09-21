import { createClient } from "redis";
import { logger } from "../logger/logger.js";

export const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (error) => {
  logger.error({ err: error }, 'Redis Client Error');
});

export const connectRedis = async (): Promise<void> => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    logger.info('Redis connected');
  }
};

export default redisClient;