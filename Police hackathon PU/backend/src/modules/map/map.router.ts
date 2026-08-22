import { Router, Request, Response } from 'express';
import { ResponseUtil } from '@/common/response';
import { storeManager } from '@/data/store';
import { authenticate } from '@/common/middleware/auth';

const router = Router();

// GET /api/v1/map/pins
router.get('/pins', authenticate, (req: Request, res: Response) => {
  const store = storeManager.getStore();
  const { drugCategory, riskMin, riskMax, sourceType } = req.query;

  let pins = store.mapPins;

  if (drugCategory && typeof drugCategory === 'string') {
    const cats = drugCategory.split(',');
    pins = pins.filter((p) => cats.includes(p.drugCategory));
  }
  if (sourceType && typeof sourceType === 'string') {
    pins = pins.filter((p) => p.sourceType.toLowerCase() === sourceType.toLowerCase());
  }
  if (riskMin && !isNaN(Number(riskMin))) {
    pins = pins.filter((p) => p.riskScore >= Number(riskMin));
  }
  if (riskMax && !isNaN(Number(riskMax))) {
    pins = pins.filter((p) => p.riskScore <= Number(riskMax));
  }

  return ResponseUtil.success(res, pins);
});

export const mapRouter = router;
