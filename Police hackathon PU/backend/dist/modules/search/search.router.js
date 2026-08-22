"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchRouter = void 0;
const express_1 = require("express");
const response_1 = require("@/common/response");
const store_1 = require("@/data/store");
const auth_1 = require("@/common/middleware/auth");
const router = (0, express_1.Router)();
// GET /api/v1/search?q=
router.get('/', auth_1.authenticate, (req, res) => {
    const store = store_1.storeManager.getStore();
    const { q } = req.query;
    if (!q || typeof q !== 'string' || !q.trim()) {
        return response_1.ResponseUtil.success(res, []);
    }
    const term = q.toLowerCase().trim();
    const results = [];
    // Search Entities
    for (const entity of store.entities) {
        if (entity.primaryAlias.toLowerCase().includes(term) ||
            entity.id.toLowerCase().includes(term) ||
            entity.summary.toLowerCase().includes(term)) {
            results.push({
                id: entity.id,
                label: entity.primaryAlias,
                type: 'entity',
                category: entity.category,
                view: 'dossier',
            });
        }
    }
    // Search Map Pins
    for (const pin of store.mapPins) {
        if (pin.label.toLowerCase().includes(term) ||
            pin.city.toLowerCase().includes(term) ||
            pin.country.toLowerCase().includes(term)) {
            results.push({
                id: pin.id,
                label: `${pin.label} (${pin.city}, ${pin.country})`,
                type: 'pin',
                category: pin.drugCategory,
                view: 'map',
            });
        }
    }
    // Search Graph Nodes
    for (const node of store.graphNodes) {
        if (node.label.toLowerCase().includes(term)) {
            results.push({
                id: node.id,
                label: node.label,
                type: 'node',
                category: node.type,
                view: 'evidence',
            });
        }
    }
    // Search Kanban Cases
    for (const col of store.kanbanColumns) {
        for (const card of col.cards) {
            if (card.title.toLowerCase().includes(term) || card.id.toLowerCase().includes(term)) {
                results.push({
                    id: card.id,
                    label: card.title,
                    type: 'case',
                    category: card.priority,
                    view: 'investigations',
                });
            }
        }
    }
    return response_1.ResponseUtil.success(res, results.slice(0, 20));
});
exports.searchRouter = router;
