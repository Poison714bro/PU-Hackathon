import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('Auth Endpoints', () => {
  it('should authenticate valid user and return JWT token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'agent_torres', password: 'nexus-2026' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('INVESTIGATOR');
  });

  it('should reject invalid credentials with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'agent_torres', password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});
