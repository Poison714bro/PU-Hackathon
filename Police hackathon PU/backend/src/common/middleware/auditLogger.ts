import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

export interface AuditRecord {
  timestamp: string;
  userId?: string;
  username?: string;
  role?: string;
  method: string;
  url: string;
  ip: string;
  statusCode: number;
  durationMs: number;
  userAgent?: string;
}

// [H1] Increased buffer from 500 to 2000 entries.
const MAX_AUDIT_BUFFER = 2000;
const auditLogs: AuditRecord[] = [];

export const auditLogger = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const record: AuditRecord = {
      timestamp: new Date().toISOString(),
      userId: req.user?.id,
      username: req.user?.username,
      role: req.user?.role,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
      statusCode: res.statusCode,
      durationMs,
      userAgent: req.headers['user-agent'],
    };

    auditLogs.push(record);
    if (auditLogs.length > MAX_AUDIT_BUFFER) {
      auditLogs.shift();
    }

    // [H1] Emit structured JSON to stderr so log collectors (Datadog, ELK, etc.)
    // can ingest audit records even if the process restarts.
    if (process.env.NODE_ENV !== 'test') {
      process.stderr.write(JSON.stringify({ type: 'AUDIT', ...record }) + '\n');
    }
  });

  next();
};

export const getAuditLogs = (): AuditRecord[] => [...auditLogs];
