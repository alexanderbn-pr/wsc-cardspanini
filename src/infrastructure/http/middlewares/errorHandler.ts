import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../../logger/logger.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Dependiendo del error mostrar en el log un warn o un error
  const log =
    err instanceof AppError && err.isOperational && err.statusCode < 500
      ? logger.warn.bind(logger)
      : logger.error.bind(logger);

  log({ err, requestId: req.id, method: req.method, url: req.url }, err.message);

  if (err instanceof ZodError) {
    res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
}
