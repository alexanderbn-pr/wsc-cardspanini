import pino from 'pino';

//pino-pretty para que se vean coloridos los logs
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'debug',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty' }
    : undefined,
});
