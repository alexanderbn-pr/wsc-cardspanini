import { createClient } from "redis";
import { logger } from "../logger/logger.js";

export const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (error) => {
  logger.error({ err: error }, "Redis Client Error");
});

// Promesa compartida para que conexiones concurrentes (arranque en frío de
// serverless) no lancen dos connect() a la vez sobre el mismo cliente.
let connectPromise: Promise<void> | null = null;

/**
 * Conexión perezosa e idempotente.
 * Segura para entornos serverless (Vercel): api/index.ts importa dist/app.js
 * directamente y nunca ejecuta src/index.ts, por lo que aquí se garantiza la
 * conexión en el primer uso de la cache en cada invocación en frío.
 */
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
