import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('Map and Tracker Endpoints', () => {
  it('should return map pins with risk filtering', async () => {
    const res = await request(app).get('/api/v1/map/pins?riskMin=80');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.every((p: any) => p.riskScore >= 80)).toBe(true);
  });

  it('should search tracker entities by query term', async () => {
    const res = await request(app).get('/api/v1/tracker?q=Miami');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some((t: any) => t.location.includes('Miami'))).toBe(true);
  });

  it('should return graph topology with nodes and edges', async () => {
    const res = await request(app).get('/api/v1/graph/topology');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nodes.length).toBeGreaterThan(0);
    expect(res.body.data.edges.length).toBeGreaterThan(0);
  });
});
