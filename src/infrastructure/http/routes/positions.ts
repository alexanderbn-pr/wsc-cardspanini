import { Router } from 'express';
import { PositionController } from '../controllers/positions.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

export default function createPositionsRouter(controller: PositionController): Router {
    const router = Router();

    router.get("/", asyncHandler(controller.getAll));

    return router;
}
