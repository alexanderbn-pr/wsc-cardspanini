import 'dotenv/config';
import app from './app.js';
import { connectRedis } from "./infrastructure/redis/redis.client.js";
import { RedisService } from "./infrastructure/redis/redis.service.js";

const PORT = process.env.PORT ?? 1234;

//Conecto de la cache
await connectRedis();
// Start server (Vercel no ejecuta esto, usa api/index.mjs)
if(process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`💾 Supabase: ${process.env.SUPABASE_URL}`);
  });
}
