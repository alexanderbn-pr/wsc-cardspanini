import { Router } from "express";
import { PositionController } from "../controllers/positions.controller.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { createProtectedRouter } from "../middlewares/auth.js";
import { AuthService } from "../../../services/auth/auth.service.js";

export default function createPositionsRouter(
  controller: PositionController,
  authService: AuthService,
): Router {
  // El guard va como primer registro del router: toda ruta declarada por
  // debajo queda protegida sin que haya una posicion que acertar.
  const router = createProtectedRouter(authService);

  router.get("/", asyncHandler(controller.getAll));

  return router;
}
