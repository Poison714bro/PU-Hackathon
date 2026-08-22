import { Router, Request, Response } from 'express';
import { ResponseUtil } from '@/common/response';
import { mcpService } from '@/mcp/mcpClient';
import { storeManager } from '@/data/store';

const router = Router();

// GET /api/v1/health
router.get('/', (req: Request, res: Response) => {
  const mcpStatus = mcpService.getStatus();
  const store = storeManager.getStore();

  const healthData = {
    status: 'HEALTHY',
    service: 'nexus-backend-service',
    version: '1.0.0',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    mcpServer: {
      isAvailable: mcpStatus.isAvailable,
      isConnected: mcpStatus.isConnected,
      mode: mcpStatus.isAvailable ? 'Subprocess IPC' : 'Offline / Resilient Fallback',
    },
    dataStore: {
      entitiesCount: store.entities.length,
      trackerNodesCount: store.trackerData.length,
      mapPinsCount: store.mapPins.length,
    },
  };

  return ResponseUtil.success(res, healthData);
});

export const healthRouter = router;
