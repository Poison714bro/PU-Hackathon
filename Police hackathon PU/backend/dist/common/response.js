"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseUtil = void 0;
class ResponseUtil {
    static success(res, data, statusCode = 200, pagination) {
        const payload = {
            success: true,
            data,
            meta: {
                timestamp: new Date().toISOString(),
                ...(pagination ? { pagination } : {}),
            },
        };
        return res.status(statusCode).json(payload);
    }
    static error(res, code, message, statusCode = 500, details) {
        const payload = {
            success: false,
            error: {
                code,
                message,
                statusCode,
                ...(details ? { details } : {}),
            },
            meta: {
                timestamp: new Date().toISOString(),
            },
        };
        return res.status(statusCode).json(payload);
    }
}
exports.ResponseUtil = ResponseUtil;
