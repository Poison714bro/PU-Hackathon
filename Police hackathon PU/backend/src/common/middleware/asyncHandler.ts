import { Request, Response, NextFunction } from 'express';

/**
 * [L1/L5] Wraps async Express route handlers to catch rejected promises
 * and forward them to the global error handler.
 *
 * Express 4 does not natively catch async errors — without this wrapper,
 * unhandled rejections crash the process.
 *
 * Usage:
 *   router.post('/', asyncHandler(async (req, res) => { ... }));
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
