import { Router } from 'express';
import { StickerController } from '../controllers/stickers.controller.js';
import { validate } from '../middlewares/zod.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { CreateStickerSchema } from '../schemes/CreateStickerSchema.js';

export default function createStickersRouter(controller: StickerController): Router {
    const router = Router();

    router.get("/:id", asyncHandler(controller.getId));
    router.post("/create", validate(CreateStickerSchema), asyncHandler(controller.create));

    return router;
}
