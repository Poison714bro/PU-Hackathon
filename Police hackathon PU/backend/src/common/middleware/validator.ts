import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ResponseUtil } from '@/common/response';

export const validateRequest = (schema: {
  body?: ZodSchema<any>;
  query?: ZodSchema<any>;
  params?: ZodSchema<any>;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        ResponseUtil.error(
          res,
          'VALIDATION_ERROR',
          'Request payload validation failed.',
          400,
          err.errors
        );
        return;
      }
      next(err);
    }
  };
};
