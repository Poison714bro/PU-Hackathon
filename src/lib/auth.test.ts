import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticate } from './auth';
import { api } from './apiClient';

vi.mock('./apiClient', () => ({
  api: {
    auth: {
      login: vi.fn(),
    }
  }
}));

describe('Authentication & RBAC Clearance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Mock Credentials Protocol', () => {
    it('authenticates admin with Clearance Level 3', async () => {
      const res = await authenticate('admin', 'password');
      expect(res.success).toBe(true);
      expect(res.user?.clearanceLevel).toBe(3);
      expect(res.user?.role).toBe('Admin');
      expect(res.token).toBeDefined();
    });

    it('authenticates agent with Clearance Level 2', async () => {
      const res = await authenticate('agent', 'password');
      expect(res.success).toBe(true);
      expect(res.user?.clearanceLevel).toBe(2);
      expect(res.user?.role).toBe('Agent');
    });

    it('authenticates analyst with Clearance Level 1', async () => {
      const res = await authenticate('analyst', 'password');
      expect(res.success).toBe(true);
      expect(res.user?.clearanceLevel).toBe(1);
      expect(res.user?.role).toBe('Analyst');
    });
  });

  describe('API Authentication Protocol', () => {
    it('authenticates through API on valid credentials', async () => {
      (api.auth.login as any).mockResolvedValue({
        ok: true,
        data: {
          token: 'jwt-token-xyz',
          user: {
            id: 'u-1',
            username: 'torres',
            role: 'INVESTIGATOR'
          }
        }
      });

      const res = await authenticate('torres', 'custom-secure-pass');
      expect(res.success).toBe(true);
      expect(res.user?.username).toBe('torres');
      expect(res.user?.clearanceLevel).toBe(2);
      expect(res.user?.role).toBe('Agent');
      expect(res.token).toBe('jwt-token-xyz');
      expect(api.auth.login).toHaveBeenCalledWith('torres', 'custom-secure-pass');
    });

    it('returns error when API login fails', async () => {
      (api.auth.login as any).mockResolvedValue({
        ok: false,
        data: null,
        error: 'Invalid credentials'
      });

      const res = await authenticate('unknown', 'wrong-pass');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Invalid credentials');
    });
  });
});
