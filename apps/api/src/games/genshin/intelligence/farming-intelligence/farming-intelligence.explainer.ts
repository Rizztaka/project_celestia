import type { FarmingRecommendation } from '@celestia/api-contracts';

export function explainFarming(result: FarmingRecommendation, includeRoute = true): string[] {
  return [
    'Planning estimates use community mean drops per 20 Original Resin. Random rewards can take more or fewer runs; these are not guaranteed counts or confidence intervals.',
    'Select each domain difficulty you can clear. Three-to-one upward crafting is included; crafting Mora, character passives, bonuses and unrecorded surplus stock are not credited.',
    result.unestimatedFamilies
      ? `${result.unestimatedFamilies} domain families have no estimate. Required stock must be known and difficulty selected; totals and dates cover only the estimated subset.`
      : 'Resin totals cover the modeled talent/weapon domains only. Bosses, Mora, EXP and gathering are separate.',
    'Calendar pacing starts at the next server reset, shares your daily budget across open domains, and assumes you choose to spend that budget on each eligible day. No streak or automatic spending is tracked.',
    ...(includeRoute
      ? [
          'Coordinates: canvas-genshin-maps (7c00), MIT, historical Mondstadt–early Sumeru snapshot. Newer areas, spawn state, terrain, elevation and access requirements are not verified.',
          result.route.available
            ? 'The numbered route minimizes planar distance heuristically from the chosen teleport. Lines show stop order, not walkable paths; use the landmark/coordinate list and check the game map.'
            : 'Choose a supported material to see coordinate stops. Unmatched materials have no coordinate coverage in this snapshot.',
        ]
      : []),
    'Drop averages: Paimon.moe (Made Baruna), MIT; original sample size, confidence bounds and capture patch are unknown. Newer domains use the same selected-tier planning scenario, not newly measured drop rates.',
  ];
}
