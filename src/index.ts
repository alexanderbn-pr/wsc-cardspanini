import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ACCEPTED_ORIGINS } from "@/config/config.js";

//import { initDatabase } from './config/database';
import { errorHandler } from '@/middlewares/errorHandler.js';
import { corsMiddleware } from '@/middlewares/cors.js';
import healthRouter from '@/routes/health.js';
import stickersRouter from '@/routes/stickers.js';
import teamsRouter from '@/routes/teams.js';
// Load environment variables first

const PORT = process.env.PORT ?? 1234;
const app = express();

// Initialize database
// initDatabase();

// -- MIDDLEWARES --
// Con el cors se puede dividir entre produccion y desarrollo para aplicar ACCEPTED_ORIGINS o solo permitir todo localhost en desarrollo.
app.use(corsMiddleware());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', healthRouter);
app.use('/stickers', stickersRouter);
app.use('/teams', teamsRouter);

// Error handling (must be last)
app.use(errorHandler);

// Start server
if(process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`💾 Supabase: ${process.env.SUPABASE_URL}`);
  });
}

export default app;
