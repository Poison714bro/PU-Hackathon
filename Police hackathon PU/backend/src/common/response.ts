import { Response } from 'express';
import { ApiResponse } from './types';

export class ResponseUtil {
  static success<T>(
    res: Response,
    data: T,
    statusCode: number = 200,
    pagination?: { total: number; page: number; limit: number; totalPages: number }
  ): Response {
    const payload: ApiResponse<T> = {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...(pagination ? { pagination } : {}),
      },
    };
    return res.status(statusCode).json(payload);
  }

  static error(
    res: Response,
    code: string,
    message: string,
    statusCode: number = 500,
    details?: any
  ): Response {
    const payload: ApiResponse = {
      success: false,
      error: {
        code,
        message,
        statusCode,
        ...(details ? { details } : {}),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    return res.status(statusCode).json(payload);
  }
}
