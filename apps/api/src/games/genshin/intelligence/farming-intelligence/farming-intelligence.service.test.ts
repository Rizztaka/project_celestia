import { createRequire } from 'node:module';

import type { PlanAdvice } from '@celestia/api-contracts';
import { farmingQuerySchema } from '@celestia/api-contracts';
import { describe, expect, it, vi } from 'vitest';

import { stableFingerprint } from '../../companion/catalog-trust.js';
import { farmingData, validateFarmingData } from './farming-data.js';
import { FarmingIntelligenceService } from './farming-intelligence.service.js';

vi.mock('./farming-intelligence.repository.js', () => ({
  FarmingIntelligenceRepository: class {},
}));
const require = createRequire(import.meta.url);
const domain = farmingData.families.find((f) => f.materialKeys.includes('TeachingsOfDiligence'))!;
const advice = (needed: Record<string, number>, inventory: Record<string, number>): PlanAdvice => ({
  contractVersion: 1,
  revision: 3,
  routineRevision: 2,
  goalRevisions: [],
  serverNow: '2026-10-17T12:00:00.000Z',
  dailyPeriodId: 'test-period',
  materials: {
    contractVersion: 2,
    needed,
    inventory,
    delta: Object.fromEntries(
      Object.keys(needed).map((k) => [
        k,
        Object.hasOwn(inventory, k) ? Math.max(0, needed[k]! - inventory[k]!) : null,
      ]),
    ),
    goals: [],
    neededComplete: true,
    sources: [],
    stockBasis: {
      kind: 'recorded_import',
      importedAt: null,
      source: null,
      scope: null,
      suppliedEntryCount: null,
    },
  },
  goalDemand: [],
  budget: 40,
  availableResin: null,
  ceiling: null,
  allocatedResin: 0,
  sources: [],
  reason: 'test',
});
const query = (extra = {}) => farmingQuerySchema.parse({ contractVersion: '1', ...extra });
const run = async (needed: Record<string, number>, stock: Record<string, number>, extra = {}) => {
  const read = vi.fn(async () => ({
    advice: advice(needed, stock),
    serverId: 'asia' as const,
    weekday: 5,
  }));
  return {
    response: await new FarmingIntelligenceService({ read }).getRecommendations(
      'only-owner',
      query(extra),
    ),
    read,
  };
};
describe('Farming source and projection boundaries', () => {
  it('joins actual domain tiers in rarity order, with reviewed coordinate families', () => {
    expect(domain.materialKeys).toEqual([
      'TeachingsOfDiligence',
      'GuideToDiligence',
      'PhilosophiesOfDiligence',
    ]);
    expect(farmingData.routes).toHaveLength(48);
    expect(farmingData.routes.reduce((n, r) => n + r.points.length, 0)).toBe(6176);
    expect(farmingData.yields.talent[3]).toEqual([2.197, 1.977, 0.227]);
    expect(farmingData.yields.weapon[3]).toEqual([2.205, 2.404, 0.626, 0.073]);
  });
  it('rejects drift and rehashed invalid material joins', () => {
    const copy = structuredClone(require('../../static/farming-data.json'));
    copy.yields.talent[3][0] = 999;
    expect(() => validateFarmingData(copy)).toThrow(/fingerprint/);
    copy.families[0].materialKeys[0] = 'UncataloguedMaterial';
    const { contentFingerprint: _old, ...payload } = copy;
    void _old;
    copy.contentFingerprint = stableFingerprint(payload);
    expect(() => validateFarmingData(copy)).toThrow(/family|material/i);
  });
  it('keeps the runtime snapshot immutable across requests', () => {
    expect(() => {
      farmingData.yields.talent[0]![0] = 999;
    }).toThrow(TypeError);
    expect(() => {
      farmingData.routes[0]!.points[0]!.x = 999;
    }).toThrow(TypeError);
  });
  it('rejects a rehashed farming schedule that differs from the progression source', () => {
    const copy = structuredClone(require('../../static/farming-data.json'));
    copy.families[0].domain.days = [6];
    const { contentFingerprint: _old, ...payload } = copy;
    void _old;
    copy.contentFingerprint = stableFingerprint(payload);
    expect(() => validateFarmingData(copy)).toThrow(/domain differs/);
  });
  it('plans without inventory but requires explicit difficulty without assuming player level', async () => {
    const a = await run({ TeachingsOfDiligence: 10 }, {});
    expect(a.response.recommendation.estimates[0]?.projection.state).toBe('difficulty_required');
    expect(a.response.recommendation.estimates[0]?.unrecordedStockKeys).toEqual([
      'TeachingsOfDiligence',
    ]);
    const b = await run({ TeachingsOfDiligence: 10 }, { TeachingsOfDiligence: 1 });
    expect(b.response.recommendation.estimates[0]?.projection.state).toBe('difficulty_required');
    expect(b.response.recommendation.schedule.calendarDays).toBeNull();
    expect(b.read).toHaveBeenCalledWith('only-owner');
  });
  it('estimates the full goal without stock and subtracts scanned stock and craftable surplus', async () => {
    const total = await run({ TeachingsOfDiligence: 10 }, {}, { talentTier: '4' });
    expect(total.response.recommendation.estimates[0]?.projection).toMatchObject({
      state: 'estimated',
      planningRuns: 5,
      resin: 100,
    });
    const reduced = await run(
      { TeachingsOfDiligence: 10 },
      { TeachingsOfDiligence: 6 },
      { talentTier: '4' },
    );
    expect(reduced.response.recommendation.estimates[0]?.projection.resin).toBe(40);
    const crafted = await run(
      { PhilosophiesOfDiligence: 1 },
      { TeachingsOfDiligence: 9 },
      { talentTier: '4' },
    );
    expect(crafted.response.recommendation.estimates[0]?.projection).toMatchObject({
      state: 'covered',
      resin: 0,
    });
    expect(crafted.response.explanations.join(' ')).toContain('do not record zero inventory');
  });
  it('estimates one shared family, credits stock once and keeps unrelated materials separate', async () => {
    const { response } = await run(
      { TeachingsOfDiligence: 10, PhilosophiesOfDiligence: 2, Mora: 5000 },
      { TeachingsOfDiligence: 1, PhilosophiesOfDiligence: 1 },
      { talentTier: '4' },
    );
    expect(response.recommendation.estimates).toHaveLength(1);
    expect(response.recommendation.estimatedResin).toBe(100);
    expect(response.recommendation.unmodeledMaterials).toEqual(['Mora']);
    expect(response.recommendation.estimates[0]?.comparisons).toHaveLength(4);
    expect(response.explanations.join(' ')).toContain('not guaranteed');
  });
  it('returns real coordinate stops and a bounded route, without pretending newer coverage', async () => {
    const { response } = await run(
      { EnergyNectar: 10 },
      {},
      { materialKey: 'EnergyNectar', maxStops: '5' },
    );
    const route = response.recommendation.route;
    expect(route.available).toBe(true);
    expect(route.stops).toHaveLength(5);
    const known = new Set(
      farmingData.routes.find((r) => r.key === 'whopperflowers')!.points.map((p) => p.id),
    );
    expect(route.stops.every((p) => known.has(p.id))).toBe(true);
    const newer = await run({ LakelightLily: 168 }, {}, { materialKey: 'LakelightLily' });
    expect(newer.response.recommendation.route.available).toBe(false);
    expect(newer.response.recommendation.unmodeledMaterials).toEqual(['LakelightLily']);
  });
  it('rejects unknown teleports and retains distinct user reads', async () => {
    await expect(run({ EnergyNectar: 1 }, {}, { startPointId: '3-999999999' })).rejects.toThrow(
      /Unknown teleport/,
    );
  });
  it('serves domain days without stock, difficulty or coordinate planning', async () => {
    const { response } = await run(
      { GuideToDiligence: 19, EnergyNectar: 10 },
      {},
      { includeRoute: 'false' },
    );
    const result = response.recommendation;
    expect(result.serverWeekday).toBe(5);
    expect(result.estimates[0]?.domain.days).toEqual([1, 4, 6]);
    expect(result.estimates[0]?.projection.state).toBe('difficulty_required');
    expect(result.route.available).toBe(false);
    expect(result.route.stops).toEqual([]);
    expect(result.routeMaterials).toEqual([]);
    expect(result.teleports).toEqual([]);
    expect(response.score).toBe(0);
    expect(response.explanations.join(' ')).not.toMatch(/coordinate|teleport/i);
  });
  it.each([
    { contractVersion: '2' },
    { contractVersion: '1', owner: 'foreign' },
    { contractVersion: '1', talentTier: '5' },
    { contractVersion: '1', maxStops: '500' },
    { contractVersion: '1', materialKey: '__proto__' },
    { contractVersion: '1', startPointId: 'https://example.com' },
    { contractVersion: '1', includeRoute: 'maybe' },
  ])('rejects malformed or identity-bearing query %j', (invalid) => {
    expect(farmingQuerySchema.safeParse(invalid).success).toBe(false);
  });
});
