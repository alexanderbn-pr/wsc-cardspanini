import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validate } from '../middlewares/zod.js';
import { CredentailsSchema} from '../schemes/CredentialsSchema.js'
export default function manageAuthRouter(controller: AuthController): Router {
    const router = Router();
    
    router.post("/login", validate(CredentailsSchema) ,asyncHandler(controller.login));
    router.get("/delete/:id" , asyncHandler(controller.delete));
    router.post("/register", validate(CredentailsSchema),asyncHandler(controller.register));

    return router;
}
