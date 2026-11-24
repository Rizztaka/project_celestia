import type { ArtifactStopRecommendation } from '../types/genshin';
import { computeBuildEstimateFromSlidersInternal } from './artifact-probability';

export * from './artifact-probability';

/**
 * Universal quick-estimate stop point calculator.
 * Delegates to the exact discrete PMF convolution engine in artifact-probability.ts
 * so supports, EM/HP/DEF scalers, and v7.2 Lunar/Stellar carries are evaluated accurately.
 */
export function calculateArtifactStopPoint(
  characterName: string,
  critRate: number,
  critDmg: number,
  isEmOrDefScaler: boolean = false,
): ArtifactStopRecommendation {
  const safeCr = Number.isFinite(critRate) ? Math.max(0, critRate) : 0;
  const safeCd = Number.isFinite(critDmg) ? Math.max(0, critDmg) : 0;
  const cv = Math.round(safeCr * 2 + safeCd);

  // If character scales with EM/DEF/HP and CV is already high (>=140),
  // they have reached their stop point since Crit is secondary to their reaction/kit stat.
  if (isEmOrDefScaler && cv >= 140) {
    return {
      characterName,
      currentCv: cv,
      currentRolls: 24,
      status: 'Ready / Stop Farming',
      estimatedDaysForUpgrade: 45,
      resinEfficiency: 15,
      advice: `${characterName} scales heavily with EM/Reaction damage rather than pure Crit. At ${cv} CV with target EM stats, further artifact farming yields diminishing returns. STOP farming and level talents/supports.`,
    };
  }

  // Early build below 170 CV has high ROI for artifact farming
  if (cv < 170) {
    return {
      characterName,
      currentCv: cv,
      currentRolls: Math.round(cv / 6.6),
      status: 'High ROI',
      estimatedDaysForUpgrade: 6,
      resinEfficiency: 95,
      advice: `Your ${characterName} is at ${cv} CV (early build). Upgrades are very likely within 5–7 days of farming (~1,000 resin). Keep farming your main 4pc set.`,
    };
  }

  const analysis = computeBuildEstimateFromSlidersInternal(
    characterName,
    safeCr,
    safeCd,
    isEmOrDefScaler ? 220 : 100,
    isEmOrDefScaler,
  );

  const roi1k = analysis.universalStop?.roiPer1kResinPct ?? 0;
  const threshold = analysis.universalStop?.thresholdPct ?? 0.6;
  // Convert marginal ROI into a smooth 0..100 resin efficiency score
  let resinEfficiency = Math.max(
    5,
    Math.min(100, Math.round((roi1k / (threshold * 3)) * 100)),
  );

  let status = analysis.overallStatus;
  let advice = analysis.advice;

  if (cv >= 220) {
    status = 'Ready / Stop Farming';
    resinEfficiency = Math.min(20, resinEfficiency);
    if (!advice.includes('STOP')) {
      advice = `STOP FARMING (${cv} CV). ${advice}`;
    }
  }

  return {
    characterName: analysis.characterName || characterName,
    currentCv: cv,
    currentRolls: Math.round(analysis.totalUsefulRolls),
    status,
    estimatedDaysForUpgrade: Math.max(1, Math.round(analysis.daysToNextUpgrade)),
    resinEfficiency,
    advice,
  };
}
