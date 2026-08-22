import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// [C2] In production, JWT_SECRET must be provided via environment — no hardcoded fallback.
const jwtSecret = process.env.JWT_SECRET || (isProduction ? '' : 'nexus_cyber_intel_super_secret_jwt_key_2026_x99a');
if (isProduction && !jwtSecret) {
  throw new Error('FATAL: JWT_SECRET environment variable is required in production.');
}

// [C3] Auth bypass is force-disabled in production regardless of env var value.
const devAuthBypass = isProduction ? false : process.env.DEV_AUTH_BYPASS === 'true';

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv,
  isProduction,
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigin: process.env.CORS_ORIGIN || (isProduction ? '' : 'http://localhost:3000'),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  devAuthBypass,
  pythonPath: process.env.PYTHON_PATH || path.resolve(__dirname, '../../../darknet-intel-mcp/venv/Scripts/python.exe'),
  mcpServerPath: process.env.MCP_SERVER_PATH || path.resolve(__dirname, '../../../darknet-intel-mcp/server.py'),
  logLevel: process.env.LOG_LEVEL || 'info',
};
