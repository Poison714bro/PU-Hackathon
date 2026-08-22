"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.graphRouter = void 0;
const express_1 = require("express");
const response_1 = require("@/common/response");
const store_1 = require("@/data/store");
const auth_1 = require("@/common/middleware/auth");
const router = (0, express_1.Router)();
// GET /api/v1/graph/topology
router.get('/topology', auth_1.authenticate, (req, res) => {
    const store = store_1.storeManager.getStore();
    const { nodeType } = req.query;
    let nodes = store.graphNodes;
    if (nodeType && typeof nodeType === 'string') {
        nodes = nodes.filter((n) => n.type.toLowerCase() === nodeType.toLowerCase());
    }
    return response_1.ResponseUtil.success(res, {
        nodes,
        edges: store.graphEdges,
    });
});
exports.graphRouter = router;
