import type { ArtifactStopRecommendation } from '../types/genshin';

export function calculateArtifactStopPoint(
  characterName: string,
  critRate: number,
  critDmg: number,
  isEmOrDefScaler: boolean = false,
): ArtifactStopRecommendation {
  // Total Artifact CV = (CR * 2) + CD
  const cv = Math.round(critRate * 2 + critDmg);

  if (isEmOrDefScaler) {
    // For characters like Nefer, Nilou, Kokomi, or Kuki where CV is secondary to EM/HP/DEF
    if (cv >= 140) {
      return {
        characterName,
        currentCv: cv,
        currentRolls: 24,
        status: 'Ready / Stop Farming',
        estimatedDaysForUpgrade: 45,
        resinEfficiency: 15,
        advice: `${characterName} scales heavily with EM/Reaction damage rather than pure Crit. At ${cv} CV with target EM stats, further artifact farming yields less than 1.5% damage gain. STOP farming and level talents/supports.`,
      };
    }
  }

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
  } else if (cv < 210) {
    return {
      characterName,
      currentCv: cv,
      currentRolls: Math.round(cv / 6.6),
      status: 'High ROI',
      estimatedDaysForUpgrade: 14,
      resinEfficiency: 65,
      advice: `Solid baseline at ${cv} CV. You can comfortably clear Spiral Abyss Floor 12 with this build. Farming further will take ~2 weeks of resin for a ~4% damage improvement.`,
    };
  } else if (cv < 235) {
    return {
      characterName,
      currentCv: cv,
      currentRolls: Math.round(cv / 6.6),
      status: 'Diminishing Returns',
      estimatedDaysForUpgrade: 38,
      resinEfficiency: 20,
      advice: `High-tier investment (${cv} CV). Upgrading any single piece now requires nearly 40 days of daily resin (~6,800 resin) for a marginal ~2.1% damage increase. It is STRONGLY recommended to STOP and spend resin leveling teammates, weapons, and guaranteed talents.`,
    };
  } else {
    return {
      characterName,
      currentCv: cv,
      currentRolls: Math.round(cv / 6.6),
      status: 'Ready / Stop Farming',
      estimatedDaysForUpgrade: 90,
      resinEfficiency: 5,
      advice: `Elite Top 1% build (${cv} CV). Finding an upgrade has a probability of less than 0.2% per domain run. STOP farming and do not spend resin here—your artifacts are complete.`,
    };
  }
}
