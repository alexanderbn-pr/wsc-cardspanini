import express from 'express';
import { errorHandler } from '@/middlewares/errorHandler.js';
import { corsMiddleware } from '@/middlewares/cors.js';
import healthRouter from '@/routes/health.js';
import stickersRouter from '@/routes/stickers.js';
import teamsRouter from '@/routes/teams.js';

const app = express();

// -- MIDDLEWARES --
app.use(corsMiddleware());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', healthRouter);
app.use('/stickers', stickersRouter);
app.use('/teams', teamsRouter);

// Error handling (must be last)
app.use(errorHandler);

export default app;
