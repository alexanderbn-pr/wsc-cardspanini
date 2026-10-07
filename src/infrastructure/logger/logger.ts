import pino from "pino";

function createLogger() {
  const level = process.env.LOG_LEVEL ?? "debug";

  if (process.env.NODE_ENV === "production") {
    return pino({ level });
  }

  try {
    return pino({ level, transport: { target: "pino-pretty" } });
  } catch {
    return pino({ level });
  }
}

export const logger = createLogger();
