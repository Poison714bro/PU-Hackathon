import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { config } from '@/config';
import { ResponseUtil } from '@/common/response';
import { validateRequest } from '@/common/middleware/validator';
import { authenticate, AuthenticatedRequest } from '@/common/middleware/auth';
import { UserPayload } from '@/common/types';

const router = Router();

const loginSchema = {
  body: z.object({
    username: z.string().min(1).max(50),
    password: z.string().min(1).max(128),
  }),
};

// [C1] Passwords are now bcrypt-hashed. Pre-computed at 10 rounds.
// Plaintext originals (for development reference only):
//   admin        -> nexus-admin-2026
//   agent_torres -> nexus-2026
//   analyst_chen -> nexus-2026
const USERS: Record<string, { passwordHash: string; payload: UserPayload }> = {
  admin: {
    passwordHash: '$2a$10$xYZNF1P9ma9v4XWbh9pqx.BcZY72oLjj8lPKQw/20p8XzFl2kXK2W',
    payload: { id: 'usr-admin-01', username: 'admin', role: 'ADMIN' },
  },
  agent_torres: {
    passwordHash: '$2a$10$lE1fEPENxZztlEAmPNfHG.pmoF.RZD6nNN3wwsoPTFKHrYYyGfpZe',
    payload: { id: 'usr-investigator-01', username: 'agent_torres', role: 'INVESTIGATOR' },
  },
  analyst_chen: {
    passwordHash: '$2a$10$lE1fEPENxZztlEAmPNfHG.pmoF.RZD6nNN3wwsoPTFKHrYYyGfpZe',
    payload: { id: 'usr-analyst-01', username: 'analyst_chen', role: 'ANALYST' },
  },
};

router.post('/login', validateRequest(loginSchema), async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = USERS[username];

  // [C1] Use bcrypt.compare instead of plaintext === comparison.
  // Constant-time comparison prevents timing attacks.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    // Generic message — don't reveal whether username or password was wrong.
    return ResponseUtil.error(res, 'INVALID_CREDENTIALS', 'Invalid username or password.', 401);
  }

  const token = jwt.sign(user.payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
    algorithm: 'HS256',
  });
  return ResponseUtil.success(res, {
    token,
    user: user.payload,
  });
});

router.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  return ResponseUtil.success(res, {
    user: req.user,
  });
});

router.post('/logout', authenticate, (req: AuthenticatedRequest, res: Response) => {
  return ResponseUtil.success(res, { message: 'Logged out successfully.' });
});

export const authRouter = router;
