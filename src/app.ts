import express from 'express';
import { loadEnv } from './config/env.js';
import { errorHandler } from './infrastructure/http/middlewares/errorHandler.js';
import { corsMiddleware } from './infrastructure/http/middlewares/cors.js';
import { requestIdMiddleware } from './infrastructure/http/middlewares/requestId.js';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import helmet from 'helmet'
import { logger } from './infrastructure/logger/logger.js';
import healthRouter from './infrastructure/http/routes/health.js';
import { openApiDocument } from './infrastructure/http/openapi/document.js';
import { apiRateLimiter } from "./infrastructure/http/rate-limit.js";
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
import { PrismaPositionRepository } from "./infrastructure/prisma/position.repository.js";
import { PrismaAuthRepository } from "./infrastructure/prisma/auth.repository.js";
import { RedisService } from "./infrastructure/redis/redis.service.js";


// Services
import { TeamService } from './services/team.service.js';
import { StickerService } from './services/sticker.service.js';
import { PositionService } from './services/position.service.js';
import { AuthService } from './services/auth.service.js';

// Controllers
import { TeamController } from './infrastructure/http/controllers/teams.controller.js';
import { StickerController } from './infrastructure/http/controllers/stickers.controller.js';
import { PositionController } from './infrastructure/http/controllers/positions.controller.js';

// Route factories
import createStickersRouter from './infrastructure/http/routes/stickers.js';
import createTeamsRouter from './infrastructure/http/routes/teams.js';
import createPositionsRouter from './infrastructure/http/routes/positions.js';
import manageAuthRouter from './infrastructure/http/routes/auth.js';

import { AuthController } from './infrastructure/http/controllers/auth.controller.js';
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
app.use(apiRateLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

const redisService = new RedisService()
// -- DEPENDENCY INJECTION (Composition Root) --
// Infrastructure adapters
//const teamRepository = new JsonTeamRepository();
const teamRepository = new PrismaTeamRepository();
const stickerRepository = new PrismaStickerRepository();
const positionRepository = new PrismaPositionRepository();
const authRepository = new PrismaAuthRepository();

// Application services
const teamService = new TeamService(teamRepository, redisService);
const stickerService = new StickerService(stickerRepository, teamService, redisService);
const positionService = new PositionService(positionRepository, redisService);
const authService = new AuthService(authRepository);

// Controllers
const teamController = new TeamController(teamService);
const stickerController = new StickerController(stickerService);
const positionController = new PositionController(positionService);
const authController = new AuthController(authService);
// Routes (factory pattern)
const stickersRouter = createStickersRouter(stickerController);
const teamsRouter = createTeamsRouter(teamController);
const positionsRouter = createPositionsRouter(positionController);
const authRouter = manageAuthRouter(authController);

// -- ROUTES --
app.use('/api', healthRouter);
app.use('/stickers', stickersRouter);
app.use('/teams', teamsRouter);
app.use('/positions', positionsRouter);
app.use('/auth', authRouter);


// Swagger UI and OpenAPI JSON
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.get('/api/openapi.json', (req, res) => res.json(openApiDocument));

// Error handling (must be last)
app.use(errorHandler);

export default app;
