"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.intelligenceRouter = void 0;
const express_1 = require("express");
const response_1 = require("@/common/response");
const store_1 = require("@/data/store");
const auth_1 = require("@/common/middleware/auth");
const router = (0, express_1.Router)();
// GET /api/v1/intelligence/entities
router.get('/entities', auth_1.authenticate, (req, res) => {
    const store = store_1.storeManager.getStore();
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
    return response_1.ResponseUtil.success(res, entities);
});
// GET /api/v1/intelligence/entities/:id
router.get('/entities/:id', auth_1.authenticate, (req, res) => {
    const store = store_1.storeManager.getStore();
    const { id } = req.params;
    const entity = store.entities.find((e) => e.id.toLowerCase() === id.toLowerCase() || e.primaryAlias.toLowerCase() === id.toLowerCase());
    if (!entity) {
        return response_1.ResponseUtil.error(res, 'ENTITY_NOT_FOUND', `Entity with ID '${id}' not found.`, 404);
    }
    return response_1.ResponseUtil.success(res, entity);
});
// GET /api/v1/intelligence/entities/:id/dossier
router.get('/entities/:id/dossier', auth_1.authenticate, (req, res) => {
    const store = store_1.storeManager.getStore();
    const { id } = req.params;
    const entity = store.entities.find((e) => e.id.toLowerCase() === id.toLowerCase() || e.primaryAlias.toLowerCase() === id.toLowerCase());
    if (!entity) {
        return response_1.ResponseUtil.error(res, 'ENTITY_NOT_FOUND', `Entity with ID '${id}' not found.`, 404);
    }
    const timeline = store.timelineEvents.filter((t) => t.entityId === entity.id);
    const mapPins = store.mapPins.filter((p) => p.entityId === entity.id);
    const relatedCases = store.kanbanColumns.flatMap((c) => c.cards).filter((k) => k.entityId === entity.id);
    const dossier = {
        entity,
        threatScore: entity.riskScore,
        classification: entity.riskScore >= 80 ? 'Critical' : entity.riskScore >= 60 ? 'High' : 'Medium',
        timeline,
        geospatialActivity: mapPins,
        activeInvestigations: relatedCases,
        legalChainOfCustody: {
            sha256DossierHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            lastAccessed: new Date().toISOString(),
            authorizedJurisdiction: 'Europol EC3 / DEA Joint Cyber Division',
        },
    };
    return response_1.ResponseUtil.success(res, dossier);
});
// GET /api/v1/intelligence/timeline/:entityId
router.get('/timeline/:entityId', auth_1.authenticate, (req, res) => {
    const store = store_1.storeManager.getStore();
    const { entityId } = req.params;
    const events = store.timelineEvents.filter((t) => t.entityId.toLowerCase() === entityId.toLowerCase());
    return response_1.ResponseUtil.success(res, events);
});
// GET /api/v1/intelligence/alias-matches
router.get('/alias-matches', auth_1.authenticate, (req, res) => {
    const store = store_1.storeManager.getStore();
    return response_1.ResponseUtil.success(res, store.aliasMatches);
});
exports.intelligenceRouter = router;
