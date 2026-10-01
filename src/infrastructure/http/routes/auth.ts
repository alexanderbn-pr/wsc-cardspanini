import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validate } from '../middlewares/zod.js';
import { createProtectedRouter, requireSelf } from '../middlewares/auth.js';
import { AuthService } from '../../../services/auth/auth.service.js';
import { CredentailsSchema} from '../schemes/CredentialsSchema.js'

export default function manageAuthRouter(controller: AuthController, authService: AuthService): Router {
    const protectedRoutes = createProtectedRouter(authService);
    protectedRoutes.get("/delete/:id", requireSelf, asyncHandler(controller.delete));

    const router = Router();
    router.post("/login", validate(CredentailsSchema) ,asyncHandler(controller.login));
    router.post("/register", validate(CredentailsSchema),asyncHandler(controller.register));
    router.use(protectedRoutes);

    return router;
}
