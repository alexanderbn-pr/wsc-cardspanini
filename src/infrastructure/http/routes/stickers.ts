import { Router } from "express";
import { StickerController } from "../controllers/stickers.controller.js";
import { validate } from "../middlewares/zod.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { createProtectedRouter } from "../middlewares/auth.js";
import { AuthService } from "../../../services/auth/auth.service.js";
import { CreateStickerSchema } from "../schemes/CreateStickerSchema.js";

export default function createStickersRouter(
  controller: StickerController,
  authService: AuthService,
): Router {
  const router = createProtectedRouter(authService);

  router.get("/", asyncHandler(controller.filterStickers));
  router.get("/:id", asyncHandler(controller.getId));
  router.post(
    "/create",
    validate(CreateStickerSchema),
    asyncHandler(controller.create),
  );

  return router;
}
