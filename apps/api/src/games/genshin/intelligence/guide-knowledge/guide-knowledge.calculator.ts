import type {
  CharacterEquipmentResponse,
  GuideAdvice,
  GuideScenario,
} from '@celestia/api-contracts';

import type { KnowledgePack, Predicate } from './guide-knowledge.pack.js';

export type Truth = 'true' | 'false' | 'unknown';
export interface Facts {
  characterKey: string;
  weaponKey: string | null;
  refinement: number | null;
  hpPercent: number | null;
}
export function evaluatePredicate(
  node: Predicate,
  facts: Facts,
  trace: GuideAdvice['trace'] = [],
): Truth {
  if ('all' in node || 'any' in node) {
    const children = 'all' in node ? node.all : node.any;
    const values = children.map((child) => evaluatePredicate(child, facts, trace));
    return 'all' in node
      ? values.includes('false')
        ? 'false'
        : values.includes('unknown')
          ? 'unknown'
          : 'true'
      : values.includes('true')
        ? 'true'
        : values.includes('unknown')
          ? 'unknown'
          : 'false';
  }
  if ('not' in node) {
    const result = evaluatePredicate(node.not, facts, trace);
    return result === 'unknown' ? result : result === 'true' ? 'false' : 'true';
  }
  let result: Truth;
  switch (node.kind) {
    case 'characterIs':
      result = facts.characterKey === node.key ? 'true' : 'false';
      break;
    case 'weaponIs':
      result =
        facts.weaponKey === null ? 'unknown' : facts.weaponKey === node.key ? 'true' : 'false';
      break;
    case 'hpAbove':
      result =
        facts.hpPercent === null ? 'unknown' : facts.hpPercent > node.percent ? 'true' : 'false';
      break;
    case 'refinementKnown':
      result = facts.refinement === null ? 'unknown' : 'true';
      break;
  }
  trace.push({ predicate: node.kind, result });
  return result;
}
export function calculateAdvice(
  pack: KnowledgePack,
  equipment: CharacterEquipmentResponse,
  scenario: GuideScenario,
) {
  const supported = equipment.character.characterKey === 'Keqing';
  const recorded = equipment.weapon.item;
  const hypothetical = scenario.example === 'harbinger';
  const basis: GuideAdvice['basis'] = hypothetical
    ? 'hypothetical'
    : recorded?.weaponKey === 'HarbingerOfDawn'
      ? 'recorded'
      : 'no_weapon_scenario';
  const rawRefinement = hypothetical ? Number(scenario.refinement) : recorded?.refinement;
  const refinement =
    rawRefinement && Number.isInteger(rawRefinement) && rawRefinement >= 1 && rawRefinement <= 5
      ? rawRefinement
      : null;
  const facts: Facts = {
    characterKey: equipment.character.characterKey,
    weaponKey: hypothetical ? 'HarbingerOfDawn' : (recorded?.weaponKey ?? null),
    refinement: basis === 'no_weapon_scenario' ? null : refinement,
    hpPercent: scenario.hp === 'unknown' ? null : scenario.hp === 'above_90' ? 100 : 90,
  };
  const trace: GuideAdvice['trace'] = [];
  const applicability = evaluatePredicate(pack.claims[0].condition, facts, trace);
  const conditionalCritRatePp =
    supported && basis !== 'no_weapon_scenario' && refinement !== null
      ? pack.claims[0].effect.values[refinement - 1]
      : null;
  const conclusion: GuideAdvice['conclusion'] = !supported
    ? 'unsupported'
    : basis === 'no_weapon_scenario'
      ? 'no_weapon_scenario'
      : scenario.hp === 'at_or_below_90'
        ? 'inactive'
        : applicability === 'true'
          ? 'active'
          : 'conditional';
  return {
    coverage: supported ? ('supported' as const) : ('unsupported' as const),
    basis,
    refinement: facts.refinement,
    applicability,
    conclusion,
    conditionalCritRatePp,
    modeledCritRatePp:
      conclusion === 'active' ? conditionalCritRatePp : conclusion === 'inactive' ? 0 : null,
    trace,
  };
}
