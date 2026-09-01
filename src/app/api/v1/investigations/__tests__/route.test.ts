import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH } from '../route';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    intelEntity: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Investigations API Route (v1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET Handler', () => {
    it('groups targets into categorized kanban columns', async () => {
      (prisma.intelEntity.findMany as any).mockResolvedValue([
        {
          id: 'ent-001',
          primaryAlias: 'DarkPhoenix_77',
          riskScore: 94,
          status: 'Active',
          lastActive: new Date('2026-08-17T12:00:00Z'),
          summary: 'Bulk fentanyl distributor',
        },
        {
          id: 'ent-002',
          primaryAlias: 'Target_B',
          riskScore: 82,
          status: 'Investigating',
          lastActive: new Date('2026-08-16T12:00:00Z'),
          summary: 'Under investigation',
        },
        {
          id: 'ent-003',
          primaryAlias: 'Target_C',
          riskScore: 70,
          status: 'Dismantled',
          lastActive: new Date('2026-08-15T12:00:00Z'),
          summary: 'Case closed',
        },
      ]);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(3);
      expect(body.data[0].cards).toHaveLength(1); // col-1 (Target Identification)
      expect(body.data[1].cards).toHaveLength(1); // col-2 (Active Investigation)
      expect(body.data[2].cards).toHaveLength(1); // col-3 (Closed/Dismantled)
      expect(body.data[0].cards[0].priority).toBe('Critical');
    });
  });

  describe('PATCH Handler', () => {
    it('updates investigation status and stage', async () => {
      (prisma.intelEntity.update as any).mockResolvedValue({ id: 'ent-001', status: 'Investigating' });

      const req = new Request('http://localhost:3000/api/v1/investigations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'ent-001', stage: 'Investigating' }),
      });

      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(prisma.intelEntity.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ent-001' },
          data: expect.objectContaining({ status: 'Investigating' }),
        })
      );
    });
  });
});
