import { Router } from "express";
import { importerRoutes } from "./importer/importer.routes.js";

const router = Router();

/**
 * Genshin Impact domain router — parent aggregator.
 * Mounted at /api/v1/games/genshin in app.ts.
 *
 * Add new sub-domain routers here as milestones are completed:
 *   importerRoutes    → /import        ✅ Milestone 2C
 *   characterRoutes   → /characters    ⬜ Milestone 2D
 *   weaponRoutes      → /weapons       ⬜ Milestone 2D
 *   artifactRoutes    → /artifacts     ⬜ Milestone 2D
 *
 * Per ADR 0001 (Modular Monolith): each sub-domain owns its own routes file.
 * This file only aggregates — no route definitions belong here directly.
 */
router.use(importerRoutes);

export { router as genshinRoutes };
