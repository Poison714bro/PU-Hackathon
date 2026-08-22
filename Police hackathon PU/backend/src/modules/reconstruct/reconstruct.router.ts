import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ResponseUtil } from '@/common/response';
import { validateRequest } from '@/common/middleware/validator';
import { authenticate } from '@/common/middleware/auth';
import { asyncHandler } from '@/common/middleware/asyncHandler';
import { storeManager } from '@/data/store';
import { mcpService } from '@/mcp/mcpClient';

const router = Router();

const reconstructSchema = {
  body: z.object({
    query: z.string().min(1, 'Query parameter is required').max(500),
  }),
};

// [C4] authenticate middleware added — this endpoint returns sensitive financial intelligence.
// [L1] asyncHandler wraps the async route to catch unhandled rejections.
router.post('/', authenticate, validateRequest(reconstructSchema), asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.body;
  const q = query.trim().toLowerCase();
  const store = storeManager.getStore();

  // Find matching entity across aliases, wallets, handles, PGP keys, or entityId
  const matchedEntity = store.entities.find((e) => {
    if (e.id.toLowerCase() === q) return true;
    if (e.primaryAlias.toLowerCase().includes(q)) return true;
    if (e.identifiers.knownAliases.some((a) => a.alias.toLowerCase().includes(q))) return true;
    if (e.identifiers.cryptoWallets.some((w) => w.address.toLowerCase().includes(q))) return true;
    if (e.identifiers.pgpKeyFingerprint.fingerprint.toLowerCase().replace(/\s+/g, '').includes(q.replace(/\s+/g, ''))) return true;
    if (e.identifiers.pgpKeyFingerprint.keyId.toLowerCase().includes(q)) return true;
    if (e.identifiers.encryptedHandles.some((h) => h.handle.toLowerCase().includes(q))) return true;
    return false;
  });

  // [M1] Return proper 404 instead of silently defaulting to entities[0].
  if (!matchedEntity) {
    return ResponseUtil.error(res, 'ENTITY_NOT_FOUND', 'No entity matched the provided query.', 404);
  }

  const primaryWallet = matchedEntity.identifiers.cryptoWallets.find((w) => w.isPrimary) || matchedEntity.identifiers.cryptoWallets[0];

  // Query MCP Service for on-chain profile
  const blockchainProfile = await mcpService.queryBlockchainLedger(
    primaryWallet ? primaryWallet.address : ''
  );

  // Return exact shape expected by frontend TimelineReconstructor.
  // [H2] isFallback flag propagated so consumers know if data is real or synthetic.
  const responseData = {
    entityId: matchedEntity.id,
    primaryAlias: matchedEntity.primaryAlias,
    riskScore: matchedEntity.riskScore,
    status: matchedEntity.status,
    financialProfile: {
      totalVolumeUSD: blockchainProfile.totalVolumeUSD || (primaryWallet ? primaryWallet.balanceUSD : 0),
      peakOperationPeriod: blockchainProfile.peakOperationPeriod || '2026-05',
      genesisDate: blockchainProfile.genesisDate || matchedEntity.firstSeen.split('T')[0],
      coinJoinRounds: blockchainProfile.coinJoinRounds || 0,
      isFallback: blockchainProfile.isFallback,
    },
  };

  return ResponseUtil.success(res, responseData);
}));

export const reconstructRouter = router;
