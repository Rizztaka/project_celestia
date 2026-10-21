import {
  type CharacterEquipmentResponse,
  type ContextualAdvice,
  type ContextualScenario,
  contextualSets,
} from '@celestia/api-contracts';

import type {
  ContextPredicate,
  ContextualClaim,
  ContextualPack,
  FactKey,
} from './contextual.pack.js';

export type Truth = 'true' | 'false' | 'unknown';
export type Origin = 'recorded' | 'assumed' | 'unknown' | 'mixed';
export type Value = ContextualAdvice['cards'][number]['trace'][number]['value'];
export interface Fact {
  value: Value;
  origin: Origin;
}
export type Facts = Record<FactKey, Fact>;
export interface TeamMember {
  characterKey: string;
  selection: 'owned' | 'hypothetical';
  origin: Origin;
  ascension: number | null;
}
export function setPieceBounds(equipment: CharacterEquipmentResponse, setKey: string) {
  if (!equipment.artifactRelationsConsistent) return { min: 0, max: 5 };
  const slots = Object.values(equipment.artifacts);
  const min = slots.filter((slot) => slot.item?.setKey === setKey).length;
  return { min, max: min + slots.filter((slot) => slot.state !== 'recorded_assigned').length };
}
export function buildContextualFacts(
  equipment: CharacterEquipmentResponse,
  scenario: ContextualScenario,
  team: TeamMember[],
) {
  const assumed = (value: string | boolean | number | null): Fact => ({
    value: value === 'unknown' ? null : value,
    origin: value === 'unknown' || value === null ? 'unknown' : 'assumed',
  });
  const flag = (value: string) => assumed(value === 'unknown' ? null : value === 'yes');
  const setBounds = contextualSets.map((setKey) => {
    const recorded = setPieceBounds(equipment, setKey);
    const modeled =
      scenario.setExample === 'recorded'
        ? recorded
        : scenario.examplePieces === 'unknown'
          ? { min: 0, max: 5 }
          : scenario.setExample === setKey
            ? { min: Number(scenario.examplePieces), max: Number(scenario.examplePieces) }
            : { min: 0, max: 5 - Number(scenario.examplePieces) };
    return {
      setKey,
      recorded,
      modeled,
      origin:
        scenario.setExample === 'recorded'
          ? recorded.min === recorded.max
            ? ('recorded' as const)
            : ('mixed' as const)
          : scenario.examplePieces === 'unknown'
            ? ('unknown' as const)
            : ('assumed' as const),
    };
  });
  const fischl = team.find((member) => member.characterKey === 'Fischl');
  const fischlAscension: Fact = !fischl
    ? { value: null, origin: 'unknown' }
    : fischl.selection === 'owned'
      ? { value: fischl.ascension, origin: 'recorded' }
      : scenario.exampleFischlA4 === 'unlocked'
        ? { value: 4, origin: 'assumed' }
        : { value: null, origin: 'unknown' };
  const facts: Facts = {
    role: assumed(scenario.role),
    burst: assumed(scenario.burst),
    'set.MarechausseeHunter': { value: setBounds[0].modeled, origin: setBounds[0].origin },
    'set.GoldenTroupe': { value: setBounds[1].modeled, origin: setBounds[1].origin },
    'set.ViridescentVenerer': { value: setBounds[2].modeled, origin: setBounds[2].origin },
    'mh.hpChange': flag(scenario.hpChange),
    'mh.onField': flag(scenario.mhOnField),
    'mh.stacks': assumed(scenario.mhStacks === 'unknown' ? null : Number(scenario.mhStacks)),
    'mh.window': assumed(scenario.mhWindow),
    'gt.field': assumed(scenario.gtField),
    'vv.swirl': flag(scenario.swirl),
    'vv.targetElement': assumed(scenario.targetElement),
    'vv.elementMatches':
      scenario.swirlElement === 'unknown' || scenario.targetElement === 'unknown'
        ? assumed(null)
        : assumed(
            ['pyro', 'hydro', 'electro', 'cryo'].includes(scenario.targetElement) &&
              scenario.targetElement === scenario.swirlElement,
          ),
    'vv.onField': flag(scenario.vvOnField),
    'vv.window': assumed(scenario.vvWindow),
    'team.fischl': fischl
      ? { value: true, origin: fischl.origin }
      : scenario.team === undefined
        ? { value: null, origin: 'unknown' }
        : { value: false, origin: 'assumed' },
    'team.fischlAscension': fischlAscension,
    'team.activeSelected': scenario.activeCharacter
      ? {
          value: team.some((member) => member.characterKey === scenario.activeCharacter),
          origin: 'assumed',
        }
      : { value: null, origin: 'unknown' },
    'team.oz': flag(scenario.oz),
    'team.electroReaction': flag(scenario.electroReaction),
  };
  return { facts, setBounds };
}
export function evaluateContextPredicate(
  node: ContextPredicate,
  facts: Facts,
  path = 'root',
  trace: ContextualAdvice['cards'][number]['trace'] = [],
): Truth {
  let result: Truth;
  let origin: Origin;
  let value: Value = null;
  let expected: string | number | boolean | null = null;
  if ('args' in node) {
    const values = node.args.map((arg, index) =>
      evaluateContextPredicate(arg, facts, `${path}.${index}`, trace),
    );
    result =
      node.op === 'all'
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
    const origins = new Set(
      trace.filter((entry) => entry.path.startsWith(path + '.')).map((entry) => entry.origin),
    );
    origin = origins.size === 1 ? [...origins][0] : 'mixed';
  } else if (node.op === 'not') {
    const child = evaluateContextPredicate(node.arg, facts, `${path}.0`, trace);
    result = child === 'unknown' ? 'unknown' : child === 'true' ? 'false' : 'true';
    origin = trace.at(-1)?.origin ?? 'unknown';
  } else {
    const fact = facts[node.fact];
    value = fact.value;
    origin = fact.origin;
    if (node.op === 'known') result = value === null ? 'false' : 'true';
    else {
      expected = node.value;
      if (value === null) result = 'unknown';
      else if (node.op === 'equals') result = value === node.value ? 'true' : 'false';
      else if (typeof value === 'number') result = value >= node.value ? 'true' : 'false';
      else if (typeof value === 'object')
        result = value.min >= node.value ? 'true' : value.max < node.value ? 'false' : 'unknown';
      else result = 'unknown';
    }
  }
  trace.push({
    path,
    op: node.op,
    fact: 'fact' in node ? node.fact : null,
    value,
    expected,
    origin,
    result,
  });
  return result;
}
function potentialEffect(
  claim: ContextualClaim,
  facts: Facts,
): ContextualAdvice['cards'][number]['potential'] {
  const effect = claim.effect;
  if (effect.kind === 'crit_rate') {
    const stack = facts[effect.stackFact].value;
    return {
      unit: effect.unit,
      amount: typeof stack === 'number' ? stack * effect.perStack : null,
      maximum: effect.perStack * effect.maxStacks,
      target: 'critRate',
      durationSeconds: effect.durationSeconds,
    };
  }
  if (effect.kind === 'damage_bonus')
    return {
      unit: effect.unit,
      amount: effect.amount,
      maximum: effect.amount,
      target: effect.target,
      durationSeconds: null,
    };
  if (effect.kind === 'resistance_reduction')
    return {
      unit: effect.unit,
      amount: effect.amount,
      maximum: effect.amount,
      target:
        typeof facts[effect.elementFact].value === 'string'
          ? String(facts[effect.elementFact].value)
          : 'matching_element_unknown',
      durationSeconds: effect.durationSeconds,
    };
  return null;
}
export function calculateContextualAdvice(
  pack: ContextualPack,
  equipment: CharacterEquipmentResponse,
  scenario: ContextualScenario,
  team: TeamMember[],
) {
  const { facts, setBounds } = buildContextualFacts(equipment, scenario, team);
  const relevant = pack.claims.filter((claim) =>
    claim.subjects.includes(equipment.character.characterKey),
  );
  const cards = relevant
    .filter((claim) => claim.status === 'active')
    .sort((a, b) => a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((claim) => {
      const trace: ContextualAdvice['cards'][number]['trace'] = [];
      const eligibility = evaluateContextPredicate(claim.eligibility, facts, 'eligibility', trace);
      const applicability = evaluateContextPredicate(
        { op: 'all', args: [claim.eligibility, claim.condition] },
        facts,
        'applicability',
        trace,
      );
      const potential = potentialEffect(claim, facts);
      const presentation =
        (claim.topic === 'talents' || claim.topic === 'energy') && applicability !== 'true'
          ? ('details' as const)
          : claim.topic === 'team' && eligibility === 'false'
            ? ('details' as const)
            : ('card' as const);
      return {
        id: claim.id,
        topic: claim.topic,
        kind: claim.kind,
        applicability,
        eligibility,
        conclusion:
          applicability === 'true'
            ? ('applies' as const)
            : applicability === 'false'
              ? ('inactive' as const)
              : ('conditional' as const),
        presentation,
        effect: claim.effect,
        potential,
        modeledAmount: potential
          ? applicability === 'true'
            ? potential.amount
            : applicability === 'false'
              ? 0
              : null
          : null,
        trace,
        sourceIds: claim.sourceIds,
        review: claim.review,
      };
    });
  return {
    cards,
    setBounds,
    excluded: relevant
      .filter((claim) => claim.status === 'excluded')
      .map((claim) => ({ id: claim.id, reason: claim.excludedReason! })),
  };
}
