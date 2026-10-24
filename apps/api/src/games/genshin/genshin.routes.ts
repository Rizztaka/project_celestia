import { Router } from 'express';

import type { RequestSafety } from '@/core/middleware/request-admission.js';

import { artifactRoutes } from './artifacts/artifact.routes.js';
import { characterRoutes } from './characters/character.routes.js';
import { endgameRoutes } from './endgame/endgame.routes.js';
import { createImporterRoutes } from './importer/importer.routes.js';
import { artifactIntelligenceRoutes } from './intelligence/artifact-intelligence/artifact-intelligence.routes.js';
import { buildInsightsRoutes } from './intelligence/build-insights/build-insights.routes.js';
import { characterIntelligenceRoutes } from './intelligence/character-intelligence/character-intelligence.routes.js';
import { farmingIntelligenceRoutes } from './intelligence/farming-intelligence/farming-intelligence.routes.js';
import { guideKnowledgeRoutes } from './intelligence/guide-knowledge/guide-knowledge.routes.js';
import { knowledgeIntelligenceRoutes } from './intelligence/knowledge-intelligence/knowledge-intelligence.routes.js';
import { plannerIntelligenceRoutes } from './intelligence/planner-intelligence/planner-intelligence.routes.js';
import { progressionIntelligenceRoutes } from './intelligence/progression-intelligence/progression-intelligence.routes.js';
import { pullIntelligenceRoutes } from './intelligence/pull-intelligence/pull-intelligence.routes.js';
import { teamIntelligenceRoutes } from './intelligence/team-intelligence/team-intelligence.routes.js';
import { createShowcaseRoutes } from './showcase/showcase.routes.js';
import type { ShowcaseService } from './showcase/showcase.service.js';
import pullSimulatorRoutes from './simulators/pull-simulator.routes.js';
import { weaponRoutes } from './weapons/weapon.routes.js';
export function createGenshinRoutes(safety: RequestSafety, showcaseService?: ShowcaseService) {
  const router = Router();

  /**
   * Genshin Impact domain router â€” parent aggregator.
   * Mounted at /api/v1/games/genshin in app.ts.
   *
   * Sub-domain routers by milestone:
   *   importerRoutes    â†’ /import        âœ… Milestone 2C
   *   characterRoutes   â†’ /characters    âœ… Milestone 2D
   *   weaponRoutes      â†’ /weapons       âœ… Milestone 2E
   *   artifactRoutes    â†’ /artifacts     âœ… Milestone 2E
   *   characterIntelligenceRoutes â†’ /intelligence âœ… Milestone 4A
   *   teamIntelligenceRoutes      â†’ /intelligence âœ… Milestone 4B
   *   artifactIntelligenceRoutes  â†’ /intelligence âœ… Milestone 4C
   *   plannerIntelligenceRoutes   â†’ /intelligence âœ… Milestone 4D
   *   pullIntelligenceRoutes      â†’ /intelligence âœ… Milestone 4E
   *   knowledgeIntelligenceRoutes â†’ /intelligence âœ… Milestone 4F
   *   endgameRoutes               â†’ /endgame      âœ… Milestone 5A
   *
   * Per ADR 0001 (Modular Monolith): each sub-domain owns its own routes file.
   * This file only aggregates â€” no route definitions belong here directly.
   */
  // Only the import router can choose large-body parsing, after auth and admission.
  router.use(createImporterRoutes(safety));
  router.use(createShowcaseRoutes(showcaseService));
  router.use(safety.ordinaryJson);
  router.use(buildInsightsRoutes);
  router.use(characterRoutes);
  router.use(guideKnowledgeRoutes);
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
