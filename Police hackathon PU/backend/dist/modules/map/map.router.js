"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapRouter = void 0;
const express_1 = require("express");
const response_1 = require("@/common/response");
const store_1 = require("@/data/store");
const auth_1 = require("@/common/middleware/auth");
const router = (0, express_1.Router)();
// GET /api/v1/map/pins
router.get('/pins', auth_1.authenticate, (req, res) => {
    const store = store_1.storeManager.getStore();
    const { drugCategory, riskMin, riskMax, sourceType } = req.query;
    let pins = store.mapPins;
    if (drugCategory && typeof drugCategory === 'string') {
        const cats = drugCategory.split(',');
        pins = pins.filter((p) => cats.includes(p.drugCategory));
    }
    if (sourceType && typeof sourceType === 'string') {
        pins = pins.filter((p) => p.sourceType.toLowerCase() === sourceType.toLowerCase());
    }
    if (riskMin && !isNaN(Number(riskMin))) {
        pins = pins.filter((p) => p.riskScore >= Number(riskMin));
    }
    if (riskMax && !isNaN(Number(riskMax))) {
        pins = pins.filter((p) => p.riskScore <= Number(riskMax));
    }
    return response_1.ResponseUtil.success(res, pins);
});
exports.mapRouter = router;
