import { Router } from 'express';
import { pullSimulatorController } from './pull-simulator.controller.js';
import { requireAuth } from '../../../core/middleware/auth.middleware.js';

const router = Router();

// Retrieve current active banners
router.get('/simulators/banners', requireAuth, pullSimulatorController.getBanners);

// Run simulation
router.post('/simulators/simulate-pulls', requireAuth, pullSimulatorController.simulatePulls);

export default router;
