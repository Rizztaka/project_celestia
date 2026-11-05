import type {
  MarginalInvestmentRequestInput,
  MarginalInvestmentResponse,
  UpgradeCandidate,
} from '@celestia/api-contracts';

import {
  calculateMarginalInvestment,
  type MarginalInvestmentCalculatorResult,
} from './marginal-investment.calculator.js';
import { explainMarginalInvestment } from './marginal-investment.explainer.js';

export interface MarginalInvestmentServiceResult extends MarginalInvestmentResponse {
  recommendation: {
    recommendedNextAction: UpgradeCandidate | null;
    rankedUpgrades: UpgradeCandidate[];
  };
  score: number;
  explanations: string[];
}

export class MarginalInvestmentService {
  /**
   * Orchestrates the Marginal Investment Advice Engine:
   * 1. Evaluates pure deterministic upgrade candidates via `calculateMarginalInvestment`.
   * 2. Translates efficiency scores and resource breakdowns into human rationale via `explainMarginalInvestment`.
   * 3. Assembles and returns structured response adhering to ADR-0011 and Intelligence Engine spec.
   */
  evaluate(request: MarginalInvestmentRequestInput): MarginalInvestmentServiceResult {
    const calcResult: MarginalInvestmentCalculatorResult = calculateMarginalInvestment(request);
    const explanations: string[] = explainMarginalInvestment(calcResult);

    const recommendation = {
      recommendedNextAction: calcResult.recommendedNextAction,
      rankedUpgrades: calcResult.rankedUpgrades,
    };

    return {
      currentReadiness: {
        status: calcResult.currentReadiness.status,
        score: calcResult.currentReadiness.score,
        dimensions: calcResult.currentReadiness.dimensions,
        missingData: calcResult.currentReadiness.missingData,
      },
      rankedUpgrades: calcResult.rankedUpgrades,
      recommendedNextAction: calcResult.recommendedNextAction,
      explanations,
      recommendation,
      score: calcResult.currentReadiness.score,
    };
  }
}
