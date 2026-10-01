import { Request, Response, NextFunction, Router } from "express";
import { AuthService } from "../../../services/auth/auth.service.js";
import { AuthenticatedUser } from "../../../modules/users.js";
import {
  AUTH_HEADER_ERROR_MESSAGE,
  AUTH_REQUIRED_ERROR_MESSAGE,
} from "../../../costants/auth.constants.js";
import { AppError } from "./errorHandler/errorHandler.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const BEARER_HEADER = /^Bearer\s+(.+)$/i;

/**
 * Extrae el token de una cabecera `Authorization: Bearer <jwt>`.
 */
export function parseBearerHeader(header: string | undefined): string | null {
  // El tipo no es el runtime: un header repetido llega como string[].
  if (typeof header !== "string") {
    return null;
  }

  const match = BEARER_HEADER.exec(header);
  const token = match?.[1].trim();

  return token ? token : null;
}

/**
 * Comprobación del token
 * Se obtienen el token del header, se verifica el valor del token si es correcto llamando al varifyAccessToken
 */
const authenticate =
  (authService: AuthService) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const token = parseBearerHeader(req.headers.authorization);

    if (token === null) {
      return next(new AppError(401, AUTH_HEADER_ERROR_MESSAGE));
    }
    try {
      //Añadirmo el usuario autenticado
      req.user = await authService.verifyAccessToken(token);
    } catch (err) {
      return next(err);
    }

    next();
  };

/**
 * Self-delete only: solo quien porta el token puede borrar su propia cuenta.
 **/
export function requireSelf(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (req.user === undefined) {
    return next(new AppError(401, AUTH_REQUIRED_ERROR_MESSAGE));
  }

  const requestedId = Number(req.params.id);
  //Comparamos el requestId de parametro de la llamada /delete/{id} con el del usuario que añadimos al llamar a autenticate
  if (!Number.isSafeInteger(requestedId) || requestedId !== req.user.id) {
    return next(new AppError(403, "You can only delete your own account"));
  }

  next();
}

/**
 * LA idea es crear un router de inicio protegido y no tener que proteger todas las rutas una a una
 * */
export function createProtectedRouter(authService: AuthService): Router {
  const router = Router();
  router.use(authenticate(authService));

  return router;
}
