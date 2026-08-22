"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const response_1 = require("@/common/response");
const mcpClient_1 = require("@/mcp/mcpClient");
const store_1 = require("@/data/store");
const router = (0, express_1.Router)();
// GET /api/v1/health
router.get('/', (req, res) => {
    const mcpStatus = mcpClient_1.mcpService.getStatus();
    const store = store_1.storeManager.getStore();
    const healthData = {
        status: 'HEALTHY',
        service: 'nexus-backend-service',
        version: '1.0.0',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        mcpServer: {
            isAvailable: mcpStatus.isAvailable,
            isConnected: mcpStatus.isConnected,
            mode: mcpStatus.isAvailable ? 'Subprocess IPC' : 'Offline / Resilient Fallback',
        },
        dataStore: {
            entitiesCount: store.entities.length,
            trackerNodesCount: store.trackerData.length,
            mapPinsCount: store.mapPins.length,
        },
    };
    return response_1.ResponseUtil.success(res, healthData);
});
exports.healthRouter = router;
