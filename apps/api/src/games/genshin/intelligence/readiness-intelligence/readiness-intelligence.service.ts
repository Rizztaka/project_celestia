import type {
  CharacterReadinessRequestInput,
  CharacterReadinessResponse,
} from '@celestia/api-contracts';

import {
  calculateReadiness,
  type ReadinessCalculatorResult,
} from './readiness-intelligence.calculator.js';
import { explainReadiness } from './readiness-intelligence.explainer.js';

export interface ReadinessServiceResult extends CharacterReadinessResponse {
  recommendation: {
    status: CharacterReadinessResponse['status'];
    dimensions: CharacterReadinessResponse['dimensions'];
    missingData: CharacterReadinessResponse['missingData'];
  };
  score: number;
  explanations: string[];
}

export class ReadinessIntelligenceService {
  /**
   * Orchestrates the Contextual Readiness Engine:
   * 1. Evaluates pure deterministic readiness via `calculateReadiness`.
   * 2. Translates numeric calculator scores into human rationale via `explainReadiness`.
   * 3. Assembles and returns structured response adhering to ADR-0011 and Intelligence Engine spec.
   */
  evaluateReadiness(request: CharacterReadinessRequestInput): ReadinessServiceResult {
    const calcResult: ReadinessCalculatorResult = calculateReadiness(request);
    const explanations: string[] = explainReadiness(calcResult);

    const recommendation = {
      status: calcResult.status,
      dimensions: calcResult.dimensions,
      missingData: calcResult.missingData,
    };

    return {
      recommendation,
      status: calcResult.status,
      score: calcResult.score,
      dimensions: calcResult.dimensions,
      explanations,
      missingData: calcResult.missingData,
    };
  }
}
