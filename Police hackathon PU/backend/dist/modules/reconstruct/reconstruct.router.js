"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reconstructRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validator_1 = require("@/common/middleware/validator");
const store_1 = require("@/data/store");
const mcpClient_1 = require("@/mcp/mcpClient");
const router = (0, express_1.Router)();
const reconstructSchema = {
    body: zod_1.z.object({
        query: zod_1.z.string().min(1, 'Query parameter is required'),
    }),
};
router.post('/', (0, validator_1.validateRequest)(reconstructSchema), async (req, res) => {
    const { query } = req.body;
    const q = query.trim().toLowerCase();
    const store = store_1.storeManager.getStore();
    // Find matching entity across aliases, wallets, handles, PGP keys, or entityId
    let matchedEntity = store.entities.find((e) => {
        if (e.id.toLowerCase() === q)
            return true;
        if (e.primaryAlias.toLowerCase().includes(q))
            return true;
        if (e.identifiers.knownAliases.some((a) => a.alias.toLowerCase().includes(q)))
            return true;
        if (e.identifiers.cryptoWallets.some((w) => w.address.toLowerCase().includes(q)))
            return true;
        if (e.identifiers.pgpKeyFingerprint.fingerprint.toLowerCase().replace(/\s+/g, '').includes(q.replace(/\s+/g, '')))
            return true;
        if (e.identifiers.pgpKeyFingerprint.keyId.toLowerCase().includes(q))
            return true;
        if (e.identifiers.encryptedHandles.some((h) => h.handle.toLowerCase().includes(q)))
            return true;
        return false;
    });
    // Default to ent-001 (DarkPhoenix_77) if query is generic or exploratory
    if (!matchedEntity) {
        matchedEntity = store.entities[0];
    }
    const primaryWallet = matchedEntity.identifiers.cryptoWallets.find((w) => w.isPrimary) || matchedEntity.identifiers.cryptoWallets[0];
    // Query MCP Service for on-chain profile
    const blockchainProfile = await mcpClient_1.mcpService.queryBlockchainLedger(primaryWallet ? primaryWallet.address : 'bc1q9h52x4k2');
    // Return exact shape expected by frontend TimelineReconstructor
    const responseData = {
        entityId: matchedEntity.id,
        primaryAlias: matchedEntity.primaryAlias,
        riskScore: matchedEntity.riskScore,
        status: matchedEntity.status,
        financialProfile: {
            totalVolumeUSD: blockchainProfile.totalVolumeUSD || (primaryWallet ? primaryWallet.balanceUSD : 482000),
            peakOperationPeriod: blockchainProfile.peakOperationPeriod || '2026-05',
            genesisDate: blockchainProfile.genesisDate || matchedEntity.firstSeen.split('T')[0],
            coinJoinRounds: blockchainProfile.coinJoinRounds || 14,
        },
    };
    return res.status(200).json(responseData);
});
exports.reconstructRouter = router;
