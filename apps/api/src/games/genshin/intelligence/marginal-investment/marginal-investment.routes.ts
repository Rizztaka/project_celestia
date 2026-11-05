import { Router } from 'express';

import { MarginalInvestmentController } from './marginal-investment.controller.js';

const router = Router();
const controller = new MarginalInvestmentController();

/**
 * POST /api/v1/games/genshin/intelligence/marginal-investment
 *
 * Evaluates bounded upgrade candidates and ranks them by marginal efficiency.
 * Adheres strictly to ADR-0011 (pure calculator separated from explainer).
 *
 * @access Public
 * @milestone 2 — Subphase 2.2 (Marginal Investment Advice Engine)
 */
router.post('/intelligence/marginal-investment', controller.evaluate);

export { router as marginalInvestmentRoutes };
