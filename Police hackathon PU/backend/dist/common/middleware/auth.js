"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRoles = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("@/config");
const response_1 = require("@/common/response");
const authenticate = (req, res, next) => {
    if (config_1.config.devAuthBypass) {
        req.user = {
            id: 'usr-admin-01',
            username: 'agent_torres',
            role: 'ADMIN',
        };
        return next();
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        response_1.ResponseUtil.error(res, 'UNAUTHORIZED', 'Missing or invalid Authorization header.', 401);
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        req.user = decoded;
        next();
    }
    catch (err) {
        response_1.ResponseUtil.error(res, 'INVALID_TOKEN', 'Token is invalid or has expired.', 401);
    }
};
exports.authenticate = authenticate;
const requireRoles = (...roles) => {
    return (req, res, next) => {
        if (config_1.config.devAuthBypass) {
            return next();
        }
        if (!req.user || !roles.includes(req.user.role)) {
            response_1.ResponseUtil.error(res, 'FORBIDDEN', `Access denied. Requires one of roles: [${roles.join(', ')}]`, 403);
            return;
        }
        next();
    };
};
exports.requireRoles = requireRoles;
