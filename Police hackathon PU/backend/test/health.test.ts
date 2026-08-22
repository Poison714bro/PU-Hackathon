import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('GET /api/v1/health', () => {
  it('should return 200 and healthy status metadata', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('HEALTHY');
    expect(res.body.data.service).toBe('nexus-backend-service');
    expect(res.body.data.dataStore.entitiesCount).toBeGreaterThan(0);
  });
});
