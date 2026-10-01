import { Router } from 'express';
import { TeamController } from '../controllers/teams.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { createProtectedRouter } from '../middlewares/auth.js';
import { AuthService } from '../../../services/auth/auth.service.js';

export default function createTeamsRouter(controller: TeamController, authService: AuthService): Router {
    const router = createProtectedRouter(authService);

    router.get("/", asyncHandler(controller.getAll));
    router.get("/:id", asyncHandler(controller.getId));

    return router;
}
