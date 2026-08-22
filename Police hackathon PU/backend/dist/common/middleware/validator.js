"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
const response_1 = require("@/common/response");
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            if (schema.body) {
                req.body = schema.body.parse(req.body);
            }
            if (schema.query) {
                req.query = schema.query.parse(req.query);
            }
            if (schema.params) {
                req.params = schema.params.parse(req.params);
            }
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                response_1.ResponseUtil.error(res, 'VALIDATION_ERROR', 'Request payload validation failed.', 400, err.errors);
                return;
            }
            next(err);
        }
    };
};
exports.validateRequest = validateRequest;
