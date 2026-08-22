import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ResponseUtil } from '@/common/response';
import { validateRequest } from '@/common/middleware/validator';
import { storeManager } from '@/data/store';
import { authenticate } from '@/common/middleware/auth';

const router = Router();

const updateCardSchema = {
  body: z.object({
    stage: z.enum(['Open', 'Under Investigation', 'Preparing Brief', 'Arrest Warrant', 'Closed']).optional(),
    priority: z.enum(['Critical', 'High', 'Medium', 'Low']).optional(),
    assignedAgent: z.string().max(100).optional(),
  }),
};

// [M2] Explicit mapping from stage enum to column ID — no more brittle title.includes() matching.
const STAGE_TO_COLUMN_ID: Record<string, string> = {
  'Open': 'col-open',
  'Under Investigation': 'col-open',
  'Preparing Brief': 'col-brief',
  'Arrest Warrant': 'col-warrant',
  'Closed': 'col-closed',
};

// GET /api/v1/investigations
router.get('/', authenticate, (req: Request, res: Response) => {
  const store = storeManager.getStore();
  return ResponseUtil.success(res, store.kanbanColumns);
});

// PATCH /api/v1/investigations/:id
router.patch('/:id', authenticate, validateRequest(updateCardSchema), (req: Request, res: Response) => {
  const store = storeManager.getStore();
  const { id } = req.params;
  const { stage, priority, assignedAgent } = req.body;

  // Locate the card across all columns
  let targetCard: any = null;
  let sourceColIdx = -1;
  let sourceCardIdx = -1;

  for (let cIdx = 0; cIdx < store.kanbanColumns.length; cIdx++) {
    const col = store.kanbanColumns[cIdx];
    const cardIdx = col.cards.findIndex((card) => card.id === id);
    if (cardIdx !== -1) {
      targetCard = col.cards[cardIdx];
      sourceColIdx = cIdx;
      sourceCardIdx = cardIdx;
      break;
    }
  }

  // [C5] Sanitized error message — don't reflect user-provided ID.
  if (!targetCard) {
    return ResponseUtil.error(res, 'CASE_NOT_FOUND', 'Investigation case not found.', 404);
  }

  // Apply field updates
  if (priority) targetCard.priority = priority;
  if (assignedAgent) targetCard.assignedAgent = assignedAgent;
  targetCard.updatedAt = new Date().toISOString();

  // [M2/M3] Stage move: remove from source, find correct destination by ID map, insert.
  if (stage && stage !== targetCard.stage) {
    // Remove from current column
    store.kanbanColumns[sourceColIdx].cards.splice(sourceCardIdx, 1);

    // Update stage on the card
    targetCard.stage = stage;

    // Find destination column by explicit ID mapping
    const destColId = STAGE_TO_COLUMN_ID[stage];
    const destCol = store.kanbanColumns.find((c) => c.id === destColId) || store.kanbanColumns[0];
    destCol.cards.push(targetCard);
  }

  return ResponseUtil.success(res, targetCard);
});

export const investigationsRouter = router;
