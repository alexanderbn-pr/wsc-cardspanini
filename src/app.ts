import express from 'express';
import { loadEnv } from './config/env.js';
import { errorHandler } from './infrastructure/http/middlewares/errorHandler.js';
import { corsMiddleware } from './infrastructure/http/middlewares/cors.js';
import { requestIdMiddleware } from './infrastructure/http/middlewares/requestId.js';
import { pinoHttp } from 'pino-http';

import { logger } from './infrastructure/logger/logger.js';
import healthRouter from './infrastructure/http/routes/health.js';

// Load env BEFORE any adapter that needs it
loadEnv();

// Infrastructure
// Repository JSON
//import { JsonTeamRepository } from './infrastructure/json/json-team.repository.js';
// Repository Supabase
//import { SupabaseTeamRepository } from "./infrastructure/supabase/team.repository.js";
//import { SupabaseStickerRepository } from "./infrastructure/supabase/sticker.repository.js";
// Repository Prisma
import { PrismaTeamRepository } from "./infrastructure/prisma/team.repository.js";
import { PrismaStickerRepository } from "./infrastructure/prisma/sticker.repository.js";
import { RedisService } from "./infrastructure/redis/redis.service.js";


// Services
import { TeamService } from './services/team.service.js';
import { StickerService } from './services/sticker.service.js';
// Controllers
import { TeamController } from './infrastructure/http/controllers/teams.controller.js';
import { StickerController } from './infrastructure/http/controllers/stickers.controller.js';

// Route factories
import createStickersRouter from './infrastructure/http/routes/stickers.js';
import createTeamsRouter from './infrastructure/http/routes/teams.js';
const app = express();

// -- MIDDLEWARES --
app.use(corsMiddleware());
app.use(requestIdMiddleware);
app.use(pinoHttp({ 
  logger,
  genReqId: (req) => req.id,
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (req, res, err) => `${req.method} ${req.url} ${res.statusCode} — ${err.message}`,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const redisService = new RedisService()
// -- DEPENDENCY INJECTION (Composition Root) --
// Infrastructure adapters
//const teamRepository = new JsonTeamRepository();
const teamRepository = new PrismaTeamRepository();
const stickerRepository = new PrismaStickerRepository();
// Application services
const teamService = new TeamService(teamRepository, redisService);
const stickerService = new StickerService(stickerRepository, teamService, redisService);
// Controllers
const teamController = new TeamController(teamService);
const stickerController = new StickerController(stickerService);

// Routes (factory pattern)
const stickersRouter = createStickersRouter(stickerController);
const teamsRouter = createTeamsRouter(teamController);

// -- ROUTES --
app.use('/api', healthRouter);
app.use('/stickers', stickersRouter);
app.use('/teams', teamsRouter);

// Error handling (must be last)
app.use(errorHandler);

export default app;
