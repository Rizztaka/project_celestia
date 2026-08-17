import { prisma } from '@/core/db/prisma.js';
import { NotFoundError, UnprocessableError } from '@/core/errors/app-error.js';
import { DailyCompanionService } from '@/platform/companion/companion.service.js';

import { CharacterIntelligenceService } from '../character-intelligence/character-intelligence.service.js';
import {
  allocateResin,
  filterAndScoreGoals,
} from './planner-intelligence.calculator.js';
import { explainRouteItem } from './planner-intelligence.explainer.js';

// -------------------------------------------------------
// Constants
// -------------------------------------------------------

/** Resin regeneration rate in Genshin Impact: 1 resin per 8 minutes. */
const REGEN_RATE_MS = 8 * 60 * 1000;
const MAX_RESIN = 200;

// -------------------------------------------------------
// Response types
// -------------------------------------------------------

export interface PlannerRouteItem {
  goalId: string;
  targetKey: string;
  goalType: string;
  talentType: string | null;
  domainName: string;
  resinCost: number;
  runs: number;
  explanations: string[];
}

export interface PlannerIntelligenceResponse {
  currentResin: number;
  timeUntilCapped: string;
  route: PlannerRouteItem[];
  unallocatedResin: number;
  analysedAt: string;
}

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

/**
 * Projects the current resin from the stored checkpoint.
 * Caps at MAX_RESIN (200).
 */
function projectCurrentResin(storedAmount: number, updatedAt: Date): number {
  const elapsedMs = Date.now() - updatedAt.getTime();
  const regenAmount = Math.floor(elapsedMs / REGEN_RATE_MS);
  return Math.min(storedAmount + regenAmount, MAX_RESIN);
}

/**
 * Calculates how long until resin is capped.
 * Returns "Capped" if already at max.
 */
function timeUntilCapped(currentResin: number): string {
  if (currentResin >= MAX_RESIN) return 'Capped';
  const missingResin = MAX_RESIN - currentResin;
  const totalMinutes = missingResin * 8;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

/**
 * Returns the UTC day of the week as 0=Monday … 6=Sunday.
 * JavaScript Date uses 0=Sunday … 6=Saturday, so we shift it.
 */
function getUtcDayOfWeek(): number {
  const jsDay = new Date().getUTCDay(); // 0=Sun, 1=Mon … 6=Sat
  return jsDay === 0 ? 6 : jsDay - 1; // remap to 0=Mon … 6=Sun
}

// -------------------------------------------------------
// Service
// -------------------------------------------------------

export class PlannerIntelligenceService {
  private readonly companionService: DailyCompanionService;
  private readonly characterIntelligenceService: CharacterIntelligenceService;

  constructor() {
    this.companionService = new DailyCompanionService();
    this.characterIntelligenceService = new CharacterIntelligenceService();
  }

  /**
   * Returns an optimised daily farming route for the authenticated user.
   *
   * Throws:
   *  - NotFoundError (404) if the user has no Genshin account.
   *  - UnprocessableError (422) if the user has no active upgrade goals.
   */
  async getRecommendations(userId: string): Promise<PlannerIntelligenceResponse> {
    // ── 1. Verify Genshin account exists ─────────────────────────────────
    const account = await prisma.genshinAccount.findUnique({ where: { userId } });
    if (!account) {
      throw new NotFoundError(
        'No Genshin Impact account found. Please import your data first.',
      );
    }

    // ── 2. Fetch resin (projected from checkpoint) ────────────────────────
    const companion = await this.companionService.getDailyState(userId);
    const currentResin = projectCurrentResin(
      companion.resinAmount,
      companion.resinUpdatedAt,
    );

    // ── 3. Fetch upgrade goals ────────────────────────────────────────────
    const goals = await prisma.upgradeGoal.findMany({ where: { userId } });
    if (goals.length === 0) {
      throw new UnprocessableError(
        'No upgrade goals found. Add goals in the Planner to receive farming recommendations.',
      );
    }

    // ── 4. Fetch character priority rankings from Character Intelligence ──
    // We handle the case where Character Intelligence itself throws (e.g. empty
    // roster) by gracefully falling back to an empty recommendations array so
    // the Planner can still function using the base score alone.
    let characterRankings: Awaited<
      ReturnType<CharacterIntelligenceService['getRecommendations']>
    >['recommendations'] = [];

    try {
      const ciResponse = await this.characterIntelligenceService.getRecommendations(userId);
      characterRankings = ciResponse.recommendations;
    } catch {
      // Non-fatal: if Character Intelligence fails, we fall back to neutral weights.
    }

    // ── 5. Calculate today's UTC day ──────────────────────────────────────
    const dayOfWeek = getUtcDayOfWeek();

    // ── 6. Filter goals to today's farmable set and score them ────────────
    const scoredGoals = filterAndScoreGoals(goals, dayOfWeek, characterRankings);

    // ── 7. Allocate resin ─────────────────────────────────────────────────
    const { route: rawRoute, unallocatedResin } = allocateResin(scoredGoals, currentResin);

    // ── 8. Attach explanations ────────────────────────────────────────────
    const route: PlannerRouteItem[] = rawRoute.map((item) => ({
      goalId: item.goalId,
      targetKey: item.targetKey,
      goalType: item.goalType,
      talentType: item.talentType,
      domainName: item.domainName,
      resinCost: item.resinCost,
      runs: item.runs,
      explanations: explainRouteItem(item),
    }));

    return {
      currentResin,
      timeUntilCapped: timeUntilCapped(currentResin),
      route,
      unallocatedResin,
      analysedAt: new Date().toISOString(),
    };
  }
}
