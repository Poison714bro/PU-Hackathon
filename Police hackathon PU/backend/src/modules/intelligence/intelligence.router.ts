import { Router, Request, Response } from 'express';
import { ResponseUtil } from '@/common/response';
import { storeManager } from '@/data/store';
import { authenticate } from '@/common/middleware/auth';
import crypto from 'crypto';

const router = Router();

// GET /api/v1/intelligence/entities
router.get('/entities', authenticate, (req: Request, res: Response) => {
  const store = storeManager.getStore();
  const { category, status, riskMin } = req.query;

  let entities = store.entities;

  if (category && typeof category === 'string') {
    const cats = category.split(',');
    entities = entities.filter((e) => cats.includes(e.category));
  }
  if (status && typeof status === 'string') {
    entities = entities.filter((e) => e.status.toLowerCase() === status.toLowerCase());
  }
  if (riskMin && !isNaN(Number(riskMin))) {
    entities = entities.filter((e) => e.riskScore >= Number(riskMin));
  }

  return ResponseUtil.success(res, entities);
});

// GET /api/v1/intelligence/entities/:id
router.get('/entities/:id', authenticate, (req: Request, res: Response) => {
  const store = storeManager.getStore();
  const { id } = req.params;

  const entity = store.entities.find(
    (e) => e.id.toLowerCase() === id.toLowerCase() || e.primaryAlias.toLowerCase() === id.toLowerCase()
  );

  // [C5] Sanitized — don't reflect user-provided ID in error response.
  if (!entity) {
    return ResponseUtil.error(res, 'ENTITY_NOT_FOUND', 'Entity not found.', 404);
  }

  return ResponseUtil.success(res, entity);
});

// GET /api/v1/intelligence/entities/:id/dossier
router.get('/entities/:id/dossier', authenticate, (req: Request, res: Response) => {
  const store = storeManager.getStore();
  const { id } = req.params;

  const entity = store.entities.find(
    (e) => e.id.toLowerCase() === id.toLowerCase() || e.primaryAlias.toLowerCase() === id.toLowerCase()
  );

  if (!entity) {
    return ResponseUtil.error(res, 'ENTITY_NOT_FOUND', 'Entity not found.', 404);
  }

  const timeline = store.timelineEvents.filter((t) => t.entityId === entity.id);
  const mapPins = store.mapPins.filter((p) => p.entityId === entity.id);
  const relatedCases = store.kanbanColumns.flatMap((c) => c.cards).filter((k) => k.entityId === entity.id);

  // [L6] Compute a real SHA-256 digest over the dossier content for chain-of-custody integrity.
  const dossierContent = JSON.stringify({ entity, timeline, mapPins, relatedCases });
  const sha256Hash = crypto.createHash('sha256').update(dossierContent).digest('hex');

  const dossier = {
    entity,
    threatScore: entity.riskScore,
    classification: entity.riskScore >= 80 ? 'Critical' : entity.riskScore >= 60 ? 'High' : 'Medium',
    timeline,
    geospatialActivity: mapPins,
    activeInvestigations: relatedCases,
    legalChainOfCustody: {
      sha256DossierHash: sha256Hash,
      lastAccessed: new Date().toISOString(),
      authorizedJurisdiction: 'Europol EC3 / DEA Joint Cyber Division',
    },
  };

  return ResponseUtil.success(res, dossier);
});

// GET /api/v1/intelligence/timeline/:entityId
router.get('/timeline/:entityId', authenticate, (req: Request, res: Response) => {
  const store = storeManager.getStore();
  const { entityId } = req.params;

  const events = store.timelineEvents.filter(
    (t) => t.entityId.toLowerCase() === entityId.toLowerCase()
  );

  return ResponseUtil.success(res, events);
});

// GET /api/v1/intelligence/alias-matches
router.get('/alias-matches', authenticate, (req: Request, res: Response) => {
  const store = storeManager.getStore();
  return ResponseUtil.success(res, store.aliasMatches);
});

export const intelligenceRouter = router;
