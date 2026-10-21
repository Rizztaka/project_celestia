import type { calculateAdvice } from './guide-knowledge.calculator.js';

export function explainAdvice(result: ReturnType<typeof calculateAdvice>): string[] {
  if (result.conclusion === 'unsupported')
    return [
      'Tailored guidance is unavailable for this character. K1 covers only Keqing and the Harbinger of Dawn passive.',
    ];
  if (result.conclusion === 'no_weapon_scenario')
    return [
      'Harbinger of Dawn is not recorded on this character. Select the hypothetical example to explore its passive without changing equipment or implying ownership.',
    ];
  const lines = [
    result.basis === 'hypothetical'
      ? 'Hypothetical Harbinger of Dawn example; this does not record ownership or equip a weapon.'
      : 'Using the recorded Harbinger of Dawn and its stored refinement. This import snapshot is not live game state.',
  ];
  if (result.conditionalCritRatePp === null)
    lines.push(
      'Refinement is unknown. An exact CRIT Rate contribution is unavailable; R5 is not assumed.',
    );
  else
    lines.push(
      `At R${result.refinement}, the passive can contribute ${result.conditionalCritRatePp} percentage points of CRIT Rate while HP is strictly above 90%.`,
    );
  switch (result.conclusion) {
    case 'active':
      lines.push(
        `Under your above-90% HP assumption, the modeled passive contribution is ${result.modeledCritRatePp} percentage points of CRIT Rate.`,
      );
      break;
    case 'inactive':
      lines.push(
        'Under your at-or-below-90% HP assumption, the modeled passive contribution is 0 percentage points. Exactly 90% does not activate it.',
      );
      break;
    case 'conditional':
      lines.push(
        'The passive contribution remains conditional. Unknown HP or refinement cannot establish an active contribution.',
      );
      break;
  }
  lines.push(
    'Changing HP across the strict 90% threshold changes activation; refinement changes the potential amount. Difficulty maintaining HP does not prove zero uptime throughout combat.',
    'HP is a scenario assumption, not observed game HP. This contribution is neither total character CRIT Rate nor a DPS gain or best-weapon verdict.',
  );
  return lines;
}
