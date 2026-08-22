import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('Investigations Endpoints', () => {
  it('should return kanban columns with case cards', async () => {
    const res = await request(app).get('/api/v1/investigations');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(4);
  });

  it('should update stage of an investigation card', async () => {
    const res = await request(app)
      .patch('/api/v1/investigations/INV-2026-001')
      .send({ stage: 'Arrest Warrant' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stage).toBe('Arrest Warrant');
  });

  it('should acknowledge an alert', async () => {
    const res = await request(app).patch('/api/v1/reports/alerts/ALT-001/acknowledge');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.acknowledged).toBe(true);
  });
});
