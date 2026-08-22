"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const response_1 = require("@/common/response");
const config_1 = require("@/config");
class AppError extends Error {
    message;
    statusCode;
    code;
    details;
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const code = err.code || 'INTERNAL_ERROR';
    const message = err.message || 'An unexpected internal error occurred.';
    const details = config_1.config.nodeEnv === 'development' ? err.stack : undefined;
    console.error(`[Error] [${req.method}] ${req.originalUrl} - ${code}: ${message}`, err);
    response_1.ResponseUtil.error(res, code, message, statusCode, details);
};
exports.errorHandler = errorHandler;
