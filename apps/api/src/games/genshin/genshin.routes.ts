import { Router } from 'express';

import type { RequestSafety } from '@/core/middleware/request-admission.js';

import { artifactRoutes } from './artifacts/artifact.routes.js';
import { characterRoutes } from './characters/character.routes.js';
import { endgameRoutes } from './endgame/endgame.routes.js';
import { createImporterRoutes } from './importer/importer.routes.js';
import { artifactIntelligenceRoutes } from './intelligence/artifact-intelligence/artifact-intelligence.routes.js';
import { characterIntelligenceRoutes } from './intelligence/character-intelligence/character-intelligence.routes.js';
import { farmingIntelligenceRoutes } from './intelligence/farming-intelligence/farming-intelligence.routes.js';
import { knowledgeIntelligenceRoutes } from './intelligence/knowledge-intelligence/knowledge-intelligence.routes.js';
import { plannerIntelligenceRoutes } from './intelligence/planner-intelligence/planner-intelligence.routes.js';
import { progressionIntelligenceRoutes } from './intelligence/progression-intelligence/progression-intelligence.routes.js';
import { pullIntelligenceRoutes } from './intelligence/pull-intelligence/pull-intelligence.routes.js';
import { teamIntelligenceRoutes } from './intelligence/team-intelligence/team-intelligence.routes.js';
import pullSimulatorRoutes from './simulators/pull-simulator.routes.js';
import { weaponRoutes } from './weapons/weapon.routes.js';
export function createGenshinRoutes(safety: RequestSafety) {
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
   *   teamIntelligenceRoutes      → /intelligence ✅ Milestone 4B
   *   artifactIntelligenceRoutes  → /intelligence ✅ Milestone 4C
   *   plannerIntelligenceRoutes   → /intelligence ✅ Milestone 4D
   *   pullIntelligenceRoutes      → /intelligence ✅ Milestone 4E
   *   knowledgeIntelligenceRoutes → /intelligence ✅ Milestone 4F
   *   endgameRoutes               → /endgame      ✅ Milestone 5A
   *
   * Per ADR 0001 (Modular Monolith): each sub-domain owns its own routes file.
   * This file only aggregates — no route definitions belong here directly.
   */
  // Only the import router can choose large-body parsing, after auth and admission.
  router.use(createImporterRoutes(safety));
  router.use(safety.ordinaryJson);
  router.use(characterRoutes);
  router.use(weaponRoutes);
  router.use(artifactRoutes);
  router.use(characterIntelligenceRoutes);
  router.use(teamIntelligenceRoutes);
  router.use(artifactIntelligenceRoutes);
  router.use(plannerIntelligenceRoutes);
  router.use(farmingIntelligenceRoutes);
  router.use(pullIntelligenceRoutes);
  router.use(progressionIntelligenceRoutes);
  router.use(knowledgeIntelligenceRoutes);
  router.use(endgameRoutes);
  router.use(pullSimulatorRoutes);
  return router;
}
