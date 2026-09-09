import { Router } from 'express';
import { TeamController } from '../controllers/teams.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

export default function createTeamsRouter(controller: TeamController): Router {
    const router = Router();

    router.get("/", asyncHandler(controller.getAll));
    router.get("/:id", asyncHandler(controller.getId));

    return router;
}
