"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const config_1 = require("@/config");
const response_1 = require("@/common/response");
const validator_1 = require("@/common/middleware/validator");
const auth_1 = require("@/common/middleware/auth");
const router = (0, express_1.Router)();
const loginSchema = {
    body: zod_1.z.object({
        username: zod_1.z.string().min(1),
        password: zod_1.z.string().min(1),
    }),
};
// Seed users for demonstration
const USERS = {
    admin: {
        passwordHash: 'nexus-admin-2026',
        payload: { id: 'usr-admin-01', username: 'admin', role: 'ADMIN' },
    },
    agent_torres: {
        passwordHash: 'nexus-2026',
        payload: { id: 'usr-investigator-01', username: 'agent_torres', role: 'INVESTIGATOR' },
    },
    analyst_chen: {
        passwordHash: 'nexus-2026',
        payload: { id: 'usr-analyst-01', username: 'analyst_chen', role: 'ANALYST' },
    },
};
router.post('/login', (0, validator_1.validateRequest)(loginSchema), (req, res) => {
    const { username, password } = req.body;
    const user = USERS[username];
    if (!user || user.passwordHash !== password) {
        return response_1.ResponseUtil.error(res, 'INVALID_CREDENTIALS', 'Invalid username or password.', 401);
    }
    const token = jsonwebtoken_1.default.sign(user.payload, config_1.config.jwtSecret, { expiresIn: config_1.config.jwtExpiresIn });
    return response_1.ResponseUtil.success(res, {
        token,
        user: user.payload,
    });
});
router.get('/me', auth_1.authenticate, (req, res) => {
    return response_1.ResponseUtil.success(res, {
        user: req.user,
    });
});
router.post('/logout', auth_1.authenticate, (req, res) => {
    return response_1.ResponseUtil.success(res, { message: 'Logged out successfully.' });
});
exports.authRouter = router;
