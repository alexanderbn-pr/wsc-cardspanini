import 'dotenv/config';
import app from './app.js';
import { connectRedis } from "./infrastructure/redis/redis.client.js";
import { logger } from "./infrastructure/logger/logger.js";

const PORT = process.env.PORT ?? 1234;

//Conecto de la cache
await connectRedis();
// Start server (Vercel no ejecuta esto, usa api/index.mjs)
if(process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    logger.info({ port: PORT }, 'Server running');
    logger.info({ env: process.env.NODE_ENV }, 'Environment');
    logger.info({ supabase: process.env.SUPABASE_URL }, 'Supabase URL');
  });
}
