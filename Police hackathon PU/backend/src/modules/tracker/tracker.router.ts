import { Router, Request, Response } from 'express';
import { ResponseUtil } from '@/common/response';
import { storeManager } from '@/data/store';
import { authenticate } from '@/common/middleware/auth';

const router = Router();

// GET /api/v1/tracker
router.get('/', authenticate, (req: Request, res: Response) => {
  const store = storeManager.getStore();
  const { q, category, status, limit = '50', page = '1' } = req.query;

  let items = store.trackerData;

  if (q && typeof q === 'string') {
    const term = q.toLowerCase();
    items = items.filter(
      (t) =>
        t.alias.toLowerCase().includes(term) ||
        t.location.toLowerCase().includes(term) ||
        t.evidence.toLowerCase().includes(term) ||
        t.wallet.toLowerCase().includes(term)
    );
  }

  if (category && typeof category === 'string') {
    items = items.filter((t) => t.category.toLowerCase() === category.toLowerCase());
  }

  if (status && typeof status === 'string') {
    items = items.filter((t) => t.status.toLowerCase() === status.toLowerCase());
  }

  const p = parseInt(page as string, 10) || 1;
  const l = parseInt(limit as string, 10) || 50;
  const total = items.length;
  const paginated = items.slice((p - 1) * l, p * l);

  return ResponseUtil.success(res, paginated, 200, {
    total,
    page: p,
    limit: l,
    totalPages: Math.ceil(total / l),
  });
});

export const trackerRouter = router;
