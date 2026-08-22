"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = exports.auditLogger = void 0;
const auditLogs = [];
const auditLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const durationMs = Date.now() - start;
        const record = {
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
        if (auditLogs.length > 500) {
            auditLogs.shift();
        }
    });
    next();
};
exports.auditLogger = auditLogger;
const getAuditLogs = () => [...auditLogs];
exports.getAuditLogs = getAuditLogs;
