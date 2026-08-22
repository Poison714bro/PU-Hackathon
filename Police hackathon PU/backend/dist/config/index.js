"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
exports.config = {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    jwtSecret: process.env.JWT_SECRET || 'nexus_cyber_intel_super_secret_jwt_key_2026_x99a',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
    devAuthBypass: process.env.DEV_AUTH_BYPASS === 'true',
    pythonPath: process.env.PYTHON_PATH || path_1.default.resolve(__dirname, '../../../darknet-intel-mcp/venv/Scripts/python.exe'),
    mcpServerPath: process.env.MCP_SERVER_PATH || path_1.default.resolve(__dirname, '../../../darknet-intel-mcp/server.py'),
    logLevel: process.env.LOG_LEVEL || 'info',
};
