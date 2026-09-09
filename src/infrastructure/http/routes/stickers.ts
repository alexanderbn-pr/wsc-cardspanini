import { Router } from 'express';
import { StickerController } from '../controllers/stickers.controller.js';
import { validate } from '../middlewares/zod.js';
import { CreateStickerSchema } from '../schemes/CreateStickerSchema.js'
/**
 * Creates and configures the stickers router.
 * Factory pattern: accepts controller instance for dependency injection.
 *
 * @param controller - StickerController instance
 * @returns Configured Express Router
 */
export default function createStickersRouter(controller: StickerController): Router {
    const router = Router();

    router.get("/:id", controller.getId);
    // Ejemplo de utilización del middleware de schema de zod
    router.post("/create", validate(CreateStickerSchema), controller.create);
    return router;
}