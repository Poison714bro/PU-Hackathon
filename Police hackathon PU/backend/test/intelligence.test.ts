import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('Intelligence Endpoints', () => {
  it('should list all entities', async () => {
    const res = await request(app).get('/api/v1/intelligence/entities');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(10);
  });

  it('should filter entities by category', async () => {
    const res = await request(app).get('/api/v1/intelligence/entities?category=Opioids/Fentanyl');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.every((e: any) => e.category === 'Opioids/Fentanyl')).toBe(true);
  });

  it('should return full intelligence dossier for an entity', async () => {
    const res = await request(app).get('/api/v1/intelligence/entities/ent-001/dossier');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.entity.id).toBe('ent-001');
    expect(res.body.data.legalChainOfCustody).toBeDefined();
    expect(res.body.data.timeline.length).toBeGreaterThan(0);
  });

  it('should return 404 for unknown entity ID', async () => {
    const res = await request(app).get('/api/v1/intelligence/entities/non-existent-999');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ENTITY_NOT_FOUND');
  });
});
