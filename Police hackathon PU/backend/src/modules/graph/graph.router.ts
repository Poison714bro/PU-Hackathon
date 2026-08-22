import { Router, Request, Response } from 'express';
import { ResponseUtil } from '@/common/response';
import { storeManager } from '@/data/store';
import { authenticate } from '@/common/middleware/auth';

const router = Router();

// GET /api/v1/graph/topology
router.get('/topology', authenticate, (req: Request, res: Response) => {
  const store = storeManager.getStore();
  const { nodeType } = req.query;

  let nodes = store.graphNodes;
  if (nodeType && typeof nodeType === 'string') {
    nodes = nodes.filter((n) => n.type.toLowerCase() === nodeType.toLowerCase());
  }

  return ResponseUtil.success(res, {
    nodes,
    edges: store.graphEdges,
  });
});

export const graphRouter = router;
