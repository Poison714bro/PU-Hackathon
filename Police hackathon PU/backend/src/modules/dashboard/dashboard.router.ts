import { Router, Request, Response } from 'express';
import { ResponseUtil } from '@/common/response';
import { storeManager } from '@/data/store';
import { authenticate } from '@/common/middleware/auth';

const router = Router();

// GET /api/v1/dashboard/kpis
router.get('/kpis', authenticate, (req: Request, res: Response) => {
  const store = storeManager.getStore();

  const totalMonitoredUSD = store.entities.reduce((acc, e) => {
    const primaryWallet = e.identifiers.cryptoWallets.find((w) => w.isPrimary) || e.identifiers.cryptoWallets[0];
    return acc + (primaryWallet ? primaryWallet.balanceUSD : 0);
  }, 0);

  const kpis = {
    activeTargets: store.entities.filter((e) => e.status === 'Active' || e.status === 'Under Investigation').length,
    highRiskAlerts: store.alerts.filter((a) => a.severity === 'critical' || a.severity === 'high').length,
    cryptoVolumeUSD: totalMonitoredUSD,
    openInvestigations: store.kanbanColumns.flatMap((c) => c.cards).filter((k) => k.stage !== 'Closed').length,
    globalArrestsEuropolContext: 270, // Operation RapTor source context
    interceptedListings: 1420,
    networkTrendRate: '+14.2%',
  };

  return ResponseUtil.success(res, kpis);
});

// GET /api/v1/dashboard/feed
router.get('/feed', authenticate, (req: Request, res: Response) => {
  const store = storeManager.getStore();
  const { source, category, severity, limit = '20', page = '1' } = req.query;

  let items = store.feedItems;

  if (source && typeof source === 'string') {
    items = items.filter((f) => f.source.toLowerCase().includes(source.toLowerCase()));
  }
  if (category && typeof category === 'string') {
    items = items.filter((f) => f.category.toLowerCase().includes(category.toLowerCase()));
  }
  if (severity && typeof severity === 'string') {
    items = items.filter((f) => f.severity.toLowerCase() === severity.toLowerCase());
  }

  // [M5] Clamp pagination params to safe ranges to prevent broken slices.
  const p = Math.max(1, parseInt(page as string, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / l));
  const paginated = items.slice((p - 1) * l, p * l);

  return ResponseUtil.success(res, paginated, 200, {
    total,
    page: p,
    limit: l,
    totalPages,
  });
});

// GET /api/v1/dashboard/charts
router.get('/charts', authenticate, (req: Request, res: Response) => {
  const charts = {
    weeklyActivity: [
      { date: 'Mon', transactions: 45, alerts: 12 },
      { date: 'Tue', transactions: 58, alerts: 19 },
      { date: 'Wed', transactions: 84, alerts: 24 },
      { date: 'Thu', transactions: 72, alerts: 18 },
      { date: 'Fri', transactions: 110, alerts: 32 },
      { date: 'Sat', transactions: 95, alerts: 28 },
      { date: 'Sun', transactions: 65, alerts: 14 },
    ],
    drugDistribution: [
      { name: 'Opioids/Fentanyl', count: 42, color: '#FF4500' },
      { name: 'Stimulants', count: 28, color: '#00FFFF' },
      { name: 'Cannabis', count: 15, color: '#39FF14' },
      { name: 'Psychedelics', count: 12, color: '#B026FF' },
      { name: 'Prescription/Other', count: 8, color: '#FFD700' },
    ],
  };

  return ResponseUtil.success(res, charts);
});

export const dashboardRouter = router;
