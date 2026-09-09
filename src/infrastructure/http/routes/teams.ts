import { Router } from 'express';
import { TeamController } from '../controllers/teams.controller.js';

/**
 * Creates and configures the teams router.
 * Factory pattern: accepts controller instance for dependency injection.
 *
 * @param controller - TeamController instance
 * @returns Configured Express Router
 */
export default function createTeamsRouter(controller: TeamController): Router {
    const router = Router();

    router.get("/", controller.getAll);
    router.get("/:id", controller.getId);

    return router;
}