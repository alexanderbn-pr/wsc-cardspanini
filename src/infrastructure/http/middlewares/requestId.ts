import { Request, Response, NextFunction } from 'express';
// generador de uuid propio de nodejs
import crypto from 'node:crypto';

//Middleware para el RequestID de las peticiones
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // comprobamos si el requestid nos viene, si no existe lo creamos
  req.id = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}
