import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '@/common/response';
import { config } from '@/config';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: any
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected internal error occurred.';

  // [M6] Only expose stack traces when NODE_ENV is explicitly 'development'.
  // The default fallback in config is 'development', but we check the raw env var
  // to avoid accidental leaks when the var is simply unset in production.
  const isDev = process.env.NODE_ENV === 'development';
  const details = isDev ? err.stack : undefined;

  console.error(`[Error] [${req.method}] ${req.originalUrl} - ${code}: ${message}`, err);

  ResponseUtil.error(res, code, message, statusCode, details);
};
