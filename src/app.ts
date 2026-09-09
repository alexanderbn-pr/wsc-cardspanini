// Polyfill WebSocket for Node.js < 22 (Supabase requirement)
import './config/websocket-polyfill.js';

import express from 'express';
import { loadEnv } from './config/env.js';
import { errorHandler } from './infrastructure/http/middlewares/errorHandler.js';
import { corsMiddleware } from './infrastructure/http/middlewares/cors.js';
import healthRouter from './infrastructure/http/routes/health.js';

// Load env BEFORE any adapter that needs it
loadEnv();

// Infrastructure
//import { JsonTeamRepository } from './infrastructure/json/json-team.repository.js';
import { SupabaseTeamRepository } from "./infrastructure/supabase/team.repository.js";
import { SupabaseStickerRepository } from "./infrastructure/supabase/sticker.repository.js";
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -- DEPENDENCY INJECTION (Composition Root) --
// Infrastructure adapters
//const teamRepository = new JsonTeamRepository();
const teamRepository = new SupabaseTeamRepository();
const stickerRepository = new SupabaseStickerRepository();
// Application services
const teamService = new TeamService(teamRepository);
const stickerService = new StickerService(stickerRepository, teamRepository);
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
