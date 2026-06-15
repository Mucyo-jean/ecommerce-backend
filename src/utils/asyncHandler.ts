import { Request, Response, NextFunction, RequestHandler } from 'express';

// Wraps async controllers so rejected promises are forwarded to Express'
// error-handling middleware instead of crashing the process.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
