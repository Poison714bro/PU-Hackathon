"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.investigationsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const response_1 = require("@/common/response");
const validator_1 = require("@/common/middleware/validator");
const store_1 = require("@/data/store");
const auth_1 = require("@/common/middleware/auth");
const router = (0, express_1.Router)();
const updateCardSchema = {
    body: zod_1.z.object({
        stage: zod_1.z.enum(['Open', 'Under Investigation', 'Preparing Brief', 'Arrest Warrant', 'Closed']).optional(),
        priority: zod_1.z.enum(['Critical', 'High', 'Medium', 'Low']).optional(),
        assignedAgent: zod_1.z.string().optional(),
    }),
};
// GET /api/v1/investigations
router.get('/', auth_1.authenticate, (req, res) => {
    const store = store_1.storeManager.getStore();
    return response_1.ResponseUtil.success(res, store.kanbanColumns);
});
// PATCH /api/v1/investigations/:id
router.patch('/:id', auth_1.authenticate, (0, validator_1.validateRequest)(updateCardSchema), (req, res) => {
    const store = store_1.storeManager.getStore();
    const { id } = req.params;
    const { stage, priority, assignedAgent } = req.body;
    let targetCard = null;
    let sourceColIdx = -1;
    for (let cIdx = 0; cIdx < store.kanbanColumns.length; cIdx++) {
        const col = store.kanbanColumns[cIdx];
        const cardIdx = col.cards.findIndex((card) => card.id === id);
        if (cardIdx !== -1) {
            targetCard = col.cards[cardIdx];
            sourceColIdx = cIdx;
            if (stage && stage !== targetCard.stage) {
                col.cards.splice(cardIdx, 1);
            }
            break;
        }
    }
    if (!targetCard) {
        return response_1.ResponseUtil.error(res, 'CASE_NOT_FOUND', `Investigation case '${id}' not found.`, 404);
    }
    if (priority)
        targetCard.priority = priority;
    if (assignedAgent)
        targetCard.assignedAgent = assignedAgent;
    targetCard.updatedAt = 'Just now';
    if (stage && stage !== targetCard.stage) {
        targetCard.stage = stage;
        const destCol = store.kanbanColumns.find((c) => c.title.toLowerCase().includes(stage.toLowerCase())) || store.kanbanColumns[0];
        destCol.cards.push(targetCard);
    }
    return response_1.ResponseUtil.success(res, targetCard);
});
exports.investigationsRouter = router;
