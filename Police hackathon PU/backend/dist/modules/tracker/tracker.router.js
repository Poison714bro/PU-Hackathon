"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackerRouter = void 0;
const express_1 = require("express");
const response_1 = require("@/common/response");
const store_1 = require("@/data/store");
const auth_1 = require("@/common/middleware/auth");
const router = (0, express_1.Router)();
// GET /api/v1/tracker
router.get('/', auth_1.authenticate, (req, res) => {
    const store = store_1.storeManager.getStore();
    const { q, category, status, limit = '50', page = '1' } = req.query;
    let items = store.trackerData;
    if (q && typeof q === 'string') {
        const term = q.toLowerCase();
        items = items.filter((t) => t.alias.toLowerCase().includes(term) ||
            t.location.toLowerCase().includes(term) ||
            t.evidence.toLowerCase().includes(term) ||
            t.wallet.toLowerCase().includes(term));
    }
    if (category && typeof category === 'string') {
        items = items.filter((t) => t.category.toLowerCase() === category.toLowerCase());
    }
    if (status && typeof status === 'string') {
        items = items.filter((t) => t.status.toLowerCase() === status.toLowerCase());
    }
    const p = parseInt(page, 10) || 1;
    const l = parseInt(limit, 10) || 50;
    const total = items.length;
    const paginated = items.slice((p - 1) * l, p * l);
    return response_1.ResponseUtil.success(res, paginated, 200, {
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l),
    });
});
exports.trackerRouter = router;
