"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsRouter = void 0;
const express_1 = require("express");
const response_1 = require("@/common/response");
const store_1 = require("@/data/store");
const auth_1 = require("@/common/middleware/auth");
const router = (0, express_1.Router)();
// GET /api/v1/reports/investigations
router.get('/investigations', auth_1.authenticate, (req, res) => {
    const investigationsReport = [
        { caseId: 'INV-2026-001', target: 'DarkPhoenix_77', agent: 'Agent Torres', risk: 'Critical', status: 'Open', updated: '2 hours ago' },
        { caseId: 'INV-2026-002', target: 'S11kR0ad_Vendor', agent: 'Agent Rivera', risk: 'Critical', status: 'Arrest Warrant', updated: '4 hours ago' },
        { caseId: 'INV-2026-003', target: 'CartelPlug_X', agent: 'Agent Torres', risk: 'Critical', status: 'Open', updated: '6 hours ago' },
        { caseId: 'INV-2026-004', target: 'Fent_Press_Ops', agent: 'Agent Nakamura', risk: 'Critical', status: 'Preparing Brief', updated: '8 hours ago' },
        { caseId: 'INV-2026-010', target: 'MethLabMike', agent: 'Agent Torres', risk: 'Critical', status: 'Closed', updated: '3 days ago' },
    ];
    return response_1.ResponseUtil.success(res, investigationsReport);
});
// GET /api/v1/reports/financial
router.get('/financial', auth_1.authenticate, (req, res) => {
    const financialReport = {
        sankeyStages: [
            { label: 'DARKNET ESCROW', color: '#a855f7', items: ['Hydra Escrow', 'AlphaBay Multi-Sig', 'Versus FE Wallet'], totalBTC: 42.8 },
            { label: 'MIXING SERVICES', color: '#f59e0b', items: ['Wasabi CoinJoin', 'Samourai Whirlpool', 'Tornado Cash'], totalBTC: 38.2 },
            { label: 'CENTRALIZED EXCHANGES', color: '#10b981', items: ['Binance Hot Wallet', 'Kraken Deposit', 'KuCoin OTC Desk'], totalBTC: 31.6 },
        ],
        ledger: [
            { date: '2026-08-18 14:32', txHash: '0x8a92b7c...e4f12a', amountBTC: 2.45, usd: 147000, owner: 'DarkPhoenix_77', direction: 'outbound' },
            { date: '2026-08-18 12:11', txHash: 'bc1q9h52...x4k2', amountBTC: 1.24, usd: 74400, owner: 'Binance Hot Wallet #4', direction: 'inbound' },
            { date: '2026-08-17 18:44', txHash: 'bc1qar0s...5mdq', amountBTC: 3.10, usd: 186000, owner: 'ChemKing2026', direction: 'outbound' },
            { date: '2026-08-17 15:20', txHash: '44AFFq5...EP3A', amountBTC: 0.55, usd: 33000, owner: 'S11kR0ad_Vendor (XMR Swap)', direction: 'outbound' },
        ],
    };
    return response_1.ResponseUtil.success(res, financialReport);
});
// GET /api/v1/reports/listings
router.get('/listings', auth_1.authenticate, (req, res) => {
    const listings = Array.from({ length: 25 }, (_, i) => ({
        id: `LST-${String(i + 1).padStart(4, '0')}`,
        vendor: ['DarkPhoenix_77', 'ChemKing2026', 'NightOwl_Pharm', 'AcidWizard420', 'S11kR0ad_Vendor'][i % 5],
        title: [
            'Fentanyl HCL 99% Pure — 500g Bulk',
            'Crystal Meth 98% — 1oz',
            'Xanax 2mg Pfizer Bars 500x',
            'LSD 250µg Blotter 100-Sheet',
            'Colombian Cocaine 1kg Brick',
        ][i % 5],
        priceUSD: Math.floor(Math.random() * 8000 + 500),
        priceBTC: +(Math.random() * 0.2 + 0.01).toFixed(4),
        platform: ['Hydra Market', 'AlphaBay Reborn', 'Versus Market', 'Dread Forum'][i % 4],
        category: ['Opioids/Fentanyl', 'Stimulants', 'Prescription/Other', 'Psychedelics', 'Cannabis'][i % 5],
        flag: 'High-Volume Escrow Transaction Flagged',
        scraped: `${Math.floor(Math.random() * 12 + 1)}h ago`,
    }));
    return response_1.ResponseUtil.success(res, listings);
});
// GET /api/v1/reports/alerts
router.get('/alerts', auth_1.authenticate, (req, res) => {
    const store = store_1.storeManager.getStore();
    return response_1.ResponseUtil.success(res, store.alerts);
});
// PATCH /api/v1/reports/alerts/:id/acknowledge
router.patch('/alerts/:id/acknowledge', auth_1.authenticate, (req, res) => {
    const store = store_1.storeManager.getStore();
    const { id } = req.params;
    const alert = store.alerts.find((a) => a.id === id);
    if (!alert) {
        return response_1.ResponseUtil.error(res, 'ALERT_NOT_FOUND', `Alert with ID '${id}' not found.`, 404);
    }
    alert.acknowledged = true;
    return response_1.ResponseUtil.success(res, alert);
});
exports.reportsRouter = router;
