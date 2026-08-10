import { Router } from "express";
import { importerRoutes }   from "./importer/importer.routes.js";
import { characterRoutes }  from "./characters/character.routes.js";
import { weaponRoutes }     from "./weapons/weapon.routes.js";
import { artifactRoutes }   from "./artifacts/artifact.routes.js";

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
 *
 * Per ADR 0001 (Modular Monolith): each sub-domain owns its own routes file.
 * This file only aggregates — no route definitions belong here directly.
 */
router.use(importerRoutes);
router.use(characterRoutes);
router.use(weaponRoutes);
router.use(artifactRoutes);

export { router as genshinRoutes };
