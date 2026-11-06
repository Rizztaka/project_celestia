import type {
  AbyssJointRequestInput,
  AbyssJointResponse,
  OnslaughtJointRequestInput,
  OnslaughtJointResponse,
  TheaterActPlanRequestInput,
  TheaterActPlanResponse,
} from '@celestia/api-contracts';

import { type AbyssJointCalculationResult, solveAbyssJoint } from './abyss-joint.calculator.js';
import { explainAbyssJoint } from './abyss-joint.explainer.js';
import {
  type OnslaughtJointCalculationResult,
  solveOnslaughtJoint,
} from './onslaught-joint.calculator.js';
import { explainOnslaughtJoint } from './onslaught-joint.explainer.js';
import {
  solveTheaterActPlan,
  type TheaterActPlanCalculationResult,
} from './theater-act-planner.calculator.js';
import { explainTheaterActPlan } from './theater-act-planner.explainer.js';

export class EndgameIntelligenceService {
  /**
   * Evaluates Spiral Abyss dual-half joint team recommendations.
   * Enforces disjoint constraints and maximizes harmonic mean clearance score.
   */
  evaluateAbyssJoint(request: AbyssJointRequestInput): AbyssJointResponse {
    const calcResult: AbyssJointCalculationResult = solveAbyssJoint(request);
    const explanations: string[] = explainAbyssJoint(calcResult);

    return {
      cycleId: calcResult.cycleId,
      floor: calcResult.floor,
      chamber: calcResult.chamber,
      isCurrentCycle: calcResult.isCurrentCycle,
      isExpired: calcResult.isExpired,
      expirationNote: calcResult.expirationNote,
      firstHalf: calcResult.firstHalf,
      secondHalf: calcResult.secondHalf,
      jointScore: calcResult.jointScore,
      isJointOptimal: calcResult.isJointOptimal,
      greedyComparison: calcResult.greedyComparison,
      explanations,
    };
  }

  /**
   * Evaluates Stygian Onslaught consecutive 3-boss team allocations.
   * Enforces strict 12-character exclusivity ($T_1 \cap T_2 \cap T_3 = \emptyset$)
   * and 3-way harmonic mean score.
   */
  evaluateOnslaughtJoint(request: OnslaughtJointRequestInput): OnslaughtJointResponse {
    const calcResult: OnslaughtJointCalculationResult = solveOnslaughtJoint(request);
    const explanations: string[] = explainOnslaughtJoint(calcResult);

    return {
      cycleId: calcResult.cycleId,
      isCurrentCycle: calcResult.isCurrentCycle,
      isExpired: calcResult.isExpired,
      expirationNote: calcResult.expirationNote,
      stages: calcResult.stages,
      jointScore: calcResult.jointScore,
      allStagesCleared: calcResult.allStagesCleared,
      hasMechanicGaps: calcResult.hasMechanicGaps,
      explanations,
    };
  }

  /**
   * Schedules Imaginarium Theater dynamic act progression and vigor conservation.
   * Backward-chains boss reservations and projects forward 4-man act lineups.
   */
  evaluateTheaterActPlan(request: TheaterActPlanRequestInput): TheaterActPlanResponse {
    const calcResult: TheaterActPlanCalculationResult = solveTheaterActPlan(request);
    const explanations: string[] = explainTheaterActPlan(calcResult);

    return {
      seasonId: calcResult.seasonId,
      isCurrentSeason: calcResult.isCurrentSeason,
      isExpired: calcResult.isExpired,
      expirationNote: calcResult.expirationNote,
      currentAct: calcResult.currentAct,
      nextRecommendedTeam: calcResult.nextRecommendedTeam,
      projectedSchedule: calcResult.projectedSchedule,
      reservedForBosses: calcResult.reservedForBosses,
      vigorExhaustionRisk: calcResult.vigorExhaustionRisk,
      ineligibleCastExcluded: calcResult.ineligibleCastExcluded,
      explanations,
    };
  }
}
