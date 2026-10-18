import type {
  FarmingEstimate,
  FarmingIntelligenceResponse,
  FarmingQuery,
} from '@celestia/api-contracts';

import { BadRequestError } from '@/core/errors/app-error.js';

import { farmingData } from './farming-data.js';
import {
  emptyRoute,
  estimateYield,
  optimizeStops,
  paceFamilies,
} from './farming-intelligence.calculator.js';
import { explainFarming } from './farming-intelligence.explainer.js';
import { FarmingIntelligenceRepository } from './farming-intelligence.repository.js';

export class FarmingIntelligenceService {
  constructor(
    private readonly repository: Pick<
      FarmingIntelligenceRepository,
      'read'
    > = new FarmingIntelligenceRepository(),
  ) {}
  async getRecommendations(
    userId: string,
    query: FarmingQuery,
  ): Promise<FarmingIntelligenceResponse> {
    const { advice, serverId, weekday, validUntil } = await this.repository.read(userId);
    const { needed, inventory } = advice.materials;
    const models = farmingData.families.filter((f) =>
      f.materialKeys.some((key) => (needed[key] ?? 0) > 0),
    );
    const estimates: FarmingEstimate[] = models.map((family) => {
      const difficulty = (family.kind === 'talent' ? query.talentTier : query.weaponTier) ?? null;
      const costs = family.materialKeys.map((key) => needed[key] ?? 0);
      const stock = family.materialKeys.map((key) => inventory[key] ?? 0);
      const rates = farmingData.yields[family.kind];
      return {
        domain: family.domain,
        kind: family.kind,
        materialKeys: family.materialKeys,
        difficulty,
        unrecordedStockKeys: family.materialKeys.filter(
          (key) => (needed[key] ?? 0) > 0 && !Object.hasOwn(inventory, key),
        ),
        projection: estimateYield(costs, stock, difficulty ? rates[difficulty - 1]! : null),
        comparisons: rates.map((profile, i) => ({
          difficulty: i + 1,
          projection: estimateYield(costs, stock, profile),
        })),
      };
    });
    const routeMaterials = (query.includeRoute === false ? [] : farmingData.routes).flatMap(
      (route) =>
        route.materialKeys
          .filter((key) => (needed[key] ?? 0) > 0)
          .map((key) => ({ key, name: route.name })),
    );
    const materialKey =
      query.includeRoute === false ? null : (query.materialKey ?? routeMaterials[0]?.key ?? null);
    const routeModel = farmingData.routes.find((route) =>
      route.materialKeys.includes(materialKey ?? ''),
    );
    let route = emptyRoute(materialKey);
    const near = routeModel
      ? [...farmingData.teleports].sort(
          (a, b) =>
            Math.min(...routeModel.points.map((p) => Math.hypot(a.x - p.x, a.y - p.y))) -
              Math.min(...routeModel.points.map((p) => Math.hypot(b.x - p.x, b.y - p.y))) ||
            a.id.localeCompare(b.id, 'en'),
        )
      : [];
    if (query.startPointId && !farmingData.teleports.some((p) => p.id === query.startPointId))
      throw new BadRequestError('Unknown teleport. Refresh the route choices.');
    const start =
      (query.startPointId
        ? farmingData.teleports.find((p) => p.id === query.startPointId)
        : near[0]) ?? null;
    if (routeModel && start)
      route = {
        ...route,
        available: true,
        name: routeModel.name,
        kind: routeModel.kind,
        start,
        ...optimizeStops(start, routeModel.points, query.maxStops),
      };
    const modeledKeys = new Set(models.flatMap((f) => f.materialKeys));
    const recommendation = {
      contractVersion: 1 as const,
      serverNow: advice.serverNow,
      serverId,
      serverWeekday: weekday,
      dailyPeriodId: advice.dailyPeriodId,
      validUntil: validUntil ?? null,
      revision: advice.revision,
      routineRevision: advice.routineRevision,
      goalRevisions: advice.goalRevisions,
      dailyResinBudget: advice.budget,
      estimates,
      estimatedResin: estimates.reduce((sum, e) => sum + (e.projection.resin ?? 0), 0),
      unestimatedFamilies: estimates.filter((e) => e.projection.resin === null).length,
      unmodeledMaterials: Object.keys(needed).filter(
        (key) => !modeledKeys.has(key) && advice.materials.delta[key] !== 0,
      ),
      schedule: paceFamilies(
        estimates
          .filter((e) => e.projection.planningRuns !== null)
          .map((e) => ({
            key: e.domain.domainKey,
            days: e.domain.days,
            runs: e.projection.planningRuns!,
          })),
        estimates.some((entry) => entry.projection.planningRuns !== null) ? advice.budget : null,
        weekday,
      ),
      route,
      routeMaterials,
      teleports:
        query.startPointId && start && !near.some((p) => p.id === start.id)
          ? [start, ...near]
          : near,
      sources: farmingData.sources,
    };
    return {
      recommendation,
      score:
        route.baselineDistance > 0
          ? Math.max(0, 100 * (1 - route.mapDistance / route.baselineDistance))
          : 0,
      explanations: explainFarming(recommendation, query.includeRoute !== false),
    };
  }
}
