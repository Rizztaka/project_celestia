import { Router } from 'express';

import { requireAuth } from '../../../core/middleware/auth.middleware.js';
import { pullSimulatorController } from './pull-simulator.controller.js';

const router = Router();
// Public, stateless sandbox. It never reads or writes account data.
router.get('/simulators/sandbox/catalog', pullSimulatorController.getSandboxCatalog);
router.post('/simulators/sandbox/pulls', pullSimulatorController.simulateSandbox);

// Retrieve historical simulator scenarios
router.get('/simulators/banners', requireAuth, pullSimulatorController.getBanners);

// Run simulation
router.post('/simulators/simulate-pulls', requireAuth, pullSimulatorController.simulatePulls);

export default router;
