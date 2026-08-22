"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const config_1 = require("@/config");
const errorHandler_1 = require("@/common/middleware/errorHandler");
const auditLogger_1 = require("@/common/middleware/auditLogger");
const swagger_1 = require("@/docs/swagger");
const auth_router_1 = require("@/modules/auth/auth.router");
const reconstruct_router_1 = require("@/modules/reconstruct/reconstruct.router");
const intelligence_router_1 = require("@/modules/intelligence/intelligence.router");
const dashboard_router_1 = require("@/modules/dashboard/dashboard.router");
const map_router_1 = require("@/modules/map/map.router");
const graph_router_1 = require("@/modules/graph/graph.router");
const tracker_router_1 = require("@/modules/tracker/tracker.router");
const investigations_router_1 = require("@/modules/investigations/investigations.router");
const reports_router_1 = require("@/modules/reports/reports.router");
const search_router_1 = require("@/modules/search/search.router");
const health_router_1 = require("@/modules/health/health.router");
const createApp = () => {
    const app = (0, express_1.default)();
    // Security Middleware
    app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
    app.use((0, cors_1.default)({
        origin: [config_1.config.corsOrigin, 'http://localhost:3000', 'http://127.0.0.1:3000'],
        credentials: true,
    }));
    // Rate Limiting
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 60 * 1000,
        max: 200,
        message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests.', statusCode: 429 } },
    });
    app.use(limiter);
    // Parsers & Logging
    app.use(express_1.default.json({ limit: '1mb' }));
    app.use(express_1.default.urlencoded({ extended: true }));
    if (config_1.config.nodeEnv !== 'test') {
        app.use((0, morgan_1.default)('combined'));
    }
    app.use(auditLogger_1.auditLogger);
    // API Documentation
    app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerDocument));
    // Direct route compatibility for /api/reconstruct
    app.use('/api/reconstruct', reconstruct_router_1.reconstructRouter);
    // API Version 1 Routes
    const v1 = express_1.default.Router();
    v1.use('/health', health_router_1.healthRouter);
    v1.use('/auth', auth_router_1.authRouter);
    v1.use('/reconstruct', reconstruct_router_1.reconstructRouter);
    v1.use('/intelligence', intelligence_router_1.intelligenceRouter);
    v1.use('/dashboard', dashboard_router_1.dashboardRouter);
    v1.use('/map', map_router_1.mapRouter);
    v1.use('/graph', graph_router_1.graphRouter);
    v1.use('/tracker', tracker_router_1.trackerRouter);
    v1.use('/investigations', investigations_router_1.investigationsRouter);
    v1.use('/reports', reports_router_1.reportsRouter);
    v1.use('/search', search_router_1.searchRouter);
    app.use(config_1.config.apiPrefix, v1);
    // Global Error Handler
    app.use(errorHandler_1.errorHandler);
    return app;
};
exports.createApp = createApp;
