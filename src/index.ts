import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { loadEnv } from './config/env';
import { initDatabase } from './config/database';
import { errorHandler } from './middlewares/errorHandler';
import healthRouter from './routes/health';

// Load environment variables first
const env = loadEnv();

const app = express();

// Initialize database
initDatabase();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', healthRouter);

// Error handling (must be last)
app.use(errorHandler);

// Start server
app.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`);
  console.log(`📊 Environment: ${env.NODE_ENV}`);
  console.log(`💾 Supabase: ${env.SUPABASE_URL}`);
});

export default app;
