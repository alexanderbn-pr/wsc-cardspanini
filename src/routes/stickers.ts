import { Router, Request, Response } from 'express';
import { StickerController } from '../controllers/stickers.js';

const router = Router();

router.get("/:id", StickerController.getId);

export default router;