import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    intelEntity: {
      findMany: vi.fn(),
    },
  },
}));

describe('Search API Route (v1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.intelEntity.findMany as any).mockResolvedValue([
      {
        id: 'ent-001',
        primaryAlias: 'DarkPhoenix_77',
        category: 'Opioids/Fentanyl',
        summary: 'Primary bulk vendor operating across AlphaBay Reborn',
      },
      {
        id: 'ent-003',
        primaryAlias: 'Ghost_Supply',
        category: 'Stimulants',
        summary: 'Encrypted communication seller of synthetic cathinones',
      },
    ]);
  });

  it('filters entities with ?q= parameter', async () => {
    const req = new Request('http://localhost:3000/api/v1/search?q=darkphoenix');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe('ent-001');
    expect(body.data[0].label).toBe('DarkPhoenix_77');
  });

  it('filters entities with ?keyword= parameter (backward compatibility)', async () => {
    const req = new Request('http://localhost:3000/api/v1/search?keyword=ghost');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe('ent-003');
    expect(body.data[0].label).toBe('Ghost_Supply');
  });

  it('matches entity summaries', async () => {
    const req = new Request('http://localhost:3000/api/v1/search?q=synthetic');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe('ent-003');
  });

  it('returns empty array when no matches found', async () => {
    const req = new Request('http://localhost:3000/api/v1/search?q=nonexistent_target_999');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(0);
  });
});
