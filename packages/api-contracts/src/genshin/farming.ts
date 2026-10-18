import { z } from 'zod';

import type { AdviceDomain } from './advice.js';
import type { SupportedServerId } from './companion.js';

const tier = z.enum(['1', '2', '3', '4']).transform(Number);
export const farmingQuerySchema = z
  .object({
    contractVersion: z.literal('1'),
    talentTier: tier.optional(),
    weaponTier: tier.optional(),
    includeRoute: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
    materialKey: z
      .string()
      .regex(/^[A-Z][A-Za-z0-9]{0,99}$/)
      .optional(),
    startPointId: z
      .string()
      .regex(/^\d{1,5}-\d{1,10}$/)
      .optional(),
    maxStops: z.enum(['5', '10', '12', '20']).transform(Number).default('12'),
  })
  .strict();
export type FarmingQuery = z.infer<typeof farmingQuerySchema>;
export interface FarmingPoint {
  id: string;
  x: number;
  y: number;
  landmark: string;
}
export interface FarmingSource {
  repository: string;
  commit: string;
  file: string;
  sha256: string;
}
export interface YieldProjection {
  state: 'estimated' | 'covered' | 'unknown_stock' | 'difficulty_required' | 'limit';
  planningRuns: number | null;
  resin: number | null;
  meanDrops: number[] | null;
}
export interface FarmingEstimate {
  domain: AdviceDomain;
  kind: 'talent' | 'weapon';
  materialKeys: string[];
  difficulty: number | null;
  projection: YieldProjection;
  comparisons: { difficulty: number; projection: YieldProjection }[];
}
export interface FarmingSchedule {
  state: 'complete' | 'unavailable' | 'exceeds_horizon';
  calendarDays: number | null;
  start: 'next_server_reset';
  days: {
    offset: number;
    weekday: number;
    resin: number;
    allocations: { domainKey: string; runs: number }[];
  }[];
}
export interface FarmingRoute {
  available: boolean;
  materialKey: string | null;
  name: string | null;
  kind: 'enemy' | 'gathering' | null;
  start: FarmingPoint | null;
  stops: FarmingPoint[];
  mapDistance: number;
  baselineDistance: number;
  candidateCount: number;
}
export interface FarmingRecommendation {
  contractVersion: 1;
  serverNow: string;
  serverId: SupportedServerId | null;
  /** Selected server's game weekday: 0=Monday … 6=Sunday; null without a server. */
  serverWeekday: number | null;
  dailyPeriodId: string | null;
  validUntil: string | null;
  revision: number;
  routineRevision: number;
  goalRevisions: { id: string; revision: number }[];
  dailyResinBudget: number | null;
  estimates: FarmingEstimate[];
  estimatedResin: number;
  unestimatedFamilies: number;
  unmodeledMaterials: string[];
  schedule: FarmingSchedule;
  route: FarmingRoute;
  routeMaterials: { key: string; name: string }[];
  teleports: FarmingPoint[];
  sources: { coordinates: FarmingSource; yields: FarmingSource };
}
export interface FarmingIntelligenceResponse {
  recommendation: FarmingRecommendation;
  /** Percentage planar-distance improvement over this route's nearest-neighbor baseline. */
  score: number;
  explanations: string[];
}
