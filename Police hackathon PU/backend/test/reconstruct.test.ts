import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('POST /api/v1/reconstruct & /api/reconstruct', () => {
  it('should reconstruct target entity and return exact frontend schema', async () => {
    const res = await request(app)
      .post('/api/v1/reconstruct')
      .send({ query: 'DarkPhoenix_77' });

    expect(res.status).toBe(200);
    expect(res.body.entityId).toBe('ent-001');
    expect(res.body.primaryAlias).toBe('DarkPhoenix_77');
    expect(res.body.riskScore).toBe(94);
    expect(res.body.status).toBe('Active');
    expect(res.body.financialProfile).toBeDefined();
    expect(typeof res.body.financialProfile.totalVolumeUSD).toBe('number');
    expect(typeof res.body.financialProfile.peakOperationPeriod).toBe('string');
  });

  it('should match alias on direct compatibility route /api/reconstruct', async () => {
    const res = await request(app)
      .post('/api/reconstruct')
      .send({ query: 'ShadowPharm' });

    expect(res.status).toBe(200);
    expect(res.body.entityId).toBe('ent-001');
    expect(res.body.primaryAlias).toBe('DarkPhoenix_77');
  });

  it('should fail validation with 400 when query is missing', async () => {
    const res = await request(app)
      .post('/api/v1/reconstruct')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
