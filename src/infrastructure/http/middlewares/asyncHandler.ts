import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async Express handler so that thrown errors
 * are forwarded to the error handler middleware.
 *
 * Express 4 does NOT catch errors from async functions automatically.
 * Without this wrapper, unhandled promise rejections crash the process
 * or hang the request.
 *
 * Usage:
 *   router.get("/", asyncHandler(controller.getAll));
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res, next).catch(next);
};
