import type { BuildInsightCard } from '@celestia/api-contracts';

import type { Decision } from './build-insights.calculator.js';

export function explainDecision(decision: Decision): string[] {
  const v = decision.values;
  if (decision.code === 'missing_weapon' && v.sourceKey)
    return [
      `No verified reference is available for weapon key ${v.sourceKey}. Its type and passive remain unresolved.`,
    ];
  if (decision.code === 'missing_weapon')
    return [
      'No reliable equipped weapon is recorded. Import equipment to evaluate its compatibility and passive.',
    ];
  if (decision.code === 'compatibility')
    return decision.state === 'applies'
      ? [
          `This character uses ${v.characterType}; the weapon has the matching type. Compatibility alone does not establish build suitability.`,
        ]
      : [
          `This character uses ${v.characterType}; the selected weapon is ${v.weaponType}. Its passive is not applied to this build.`,
        ];
  if (decision.code === 'piece_count')
    return [
      `Matching pieces in this evaluated build: ${v.min}–${v.max}. Unresolved recorded slots remain unknown; missing assignments are not assumed empty.`,
    ];
  if (decision.code === 'source_only')
    return decision.state === 'unavailable'
      ? ['No verified reference is available for this key. Its effects are unresolved.']
      : [
          'The full pinned effect is available below. Its activation and build suitability do not yet have a reviewed executable rule.',
        ];
  if (decision.id === 'harbinger-hp-passive')
    return [
      v.potentialCritRatePp === null
        ? 'Refinement is unresolved; no exact passive bonus is selected.'
        : `At refinement ${v.refinement}, the conditional passive grants ${v.potentialCritRatePp} percentage points of CRIT Rate while HP is above 90%.`,
      decision.state === 'applies'
        ? 'All modeled conditions are satisfied in the evaluated state.'
        : decision.state === 'not_applicable'
          ? 'A required condition is false; this passive is not applied.'
          : 'Current combat HP is unknown. The bonus is conditional and is not added to recorded stats.',
    ];
  if (v.pieces === 2)
    return [
      decision.state === 'applies'
        ? 'The two-piece requirement is met. The sourced two-piece effect applies to this evaluated equipment configuration.'
        : decision.state === 'not_applicable'
          ? 'The two-piece requirement is not met.'
          : 'Incomplete equipment records leave the two-piece requirement unresolved.',
    ];
  return [
    decision.state === 'not_applicable'
      ? 'The four-piece requirement is not met.'
      : decision.state === 'applies'
        ? 'The four-piece requirement is met. Golden Troupe’s unconditional 25% Skill DMG component applies; its additional field-dependent bonus is evaluated separately.'
        : 'The four-piece effect remains conditional. Equipment records do not establish combat triggers, timing, stacks or current field state. Read its complete activation conditions below.',
  ];
}
export function explainCard(
  decision: Decision,
  context: Pick<BuildInsightCard, 'title' | 'basis' | 'sourceText' | 'source'>,
): BuildInsightCard {
  return {
    ...context,
    id: decision.id,
    state: decision.state,
    explanations: explainDecision(decision),
    conditions: decision.conditions,
  };
}
