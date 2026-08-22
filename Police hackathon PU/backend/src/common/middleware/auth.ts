import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config';
import { ResponseUtil } from '@/common/response';
import { Role, UserPayload } from '@/common/types';

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // [C3] Double-check: bypass only in non-production environments.
  if (config.devAuthBypass && !config.isProduction) {
    req.user = {
      id: 'usr-admin-01',
      username: 'agent_torres',
      role: 'ADMIN',
    };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ResponseUtil.error(res, 'UNAUTHORIZED', 'Missing or invalid Authorization header.', 401);
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    // [C6] Pin algorithm to HS256 to prevent algorithm-confusion attacks.
    const decoded = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
    }) as UserPayload;
    req.user = decoded;
    next();
  } catch (err) {
    ResponseUtil.error(res, 'INVALID_TOKEN', 'Token is invalid or has expired.', 401);
  }
};

export const requireRoles = (...roles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (config.devAuthBypass && !config.isProduction) {
      return next();
    }

    if (!req.user || !roles.includes(req.user.role)) {
      ResponseUtil.error(
        res,
        'FORBIDDEN',
        'Access denied. Insufficient permissions.',
        403
      );
      return;
    }
    next();
  };
};
