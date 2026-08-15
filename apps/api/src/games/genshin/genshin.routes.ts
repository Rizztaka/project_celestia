import { Router } from 'express';
import { importerRoutes } from './importer/importer.routes.js';
import { characterRoutes } from './characters/character.routes.js';
import { weaponRoutes } from './weapons/weapon.routes.js';
import { artifactRoutes } from './artifacts/artifact.routes.js';
import { characterIntelligenceRoutes } from './intelligence/character-intelligence/character-intelligence.routes.js';

const router = Router();

/**
 * Genshin Impact domain router — parent aggregator.
 * Mounted at /api/v1/games/genshin in app.ts.
 *
 * Sub-domain routers by milestone:
 *   importerRoutes    → /import        ✅ Milestone 2C
 *   characterRoutes   → /characters    ✅ Milestone 2D
 *   weaponRoutes      → /weapons       ✅ Milestone 2E
 *   artifactRoutes    → /artifacts     ✅ Milestone 2E
 *   characterIntelligenceRoutes → /intelligence ✅ Milestone 4A
 *
 * Per ADR 0001 (Modular Monolith): each sub-domain owns its own routes file.
 * This file only aggregates — no route definitions belong here directly.
 */
router.use(importerRoutes);
router.use(characterRoutes);
router.use(weaponRoutes);
router.use(artifactRoutes);
router.use(characterIntelligenceRoutes);

export { router as genshinRoutes };
