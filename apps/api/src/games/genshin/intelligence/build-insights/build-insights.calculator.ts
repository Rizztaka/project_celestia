export type Truth = 'true' | 'false' | 'unknown';
export interface Bounds {
  min: number;
  max: number;
}
export interface Condition {
  key: string;
  truth: Truth;
}
export interface Decision {
  id: string;
  code: 'compatibility' | 'missing_weapon' | 'piece_count' | 'passive' | 'source_only';
  state: 'applies' | 'conditional' | 'not_applicable' | 'unavailable' | 'reference';
  conditions: Condition[];
  values: Record<string, number | string | null>;
}
export const all = (values: Truth[]): Truth =>
  values.includes('false') ? 'false' : values.includes('unknown') ? 'unknown' : 'true';
export const atLeast = (bounds: Bounds, n: number): Truth =>
  bounds.min >= n ? 'true' : bounds.max < n ? 'false' : 'unknown';
const state = (truth: Truth): Decision['state'] =>
  truth === 'true' ? 'applies' : truth === 'false' ? 'not_applicable' : 'conditional';
export function weaponCompatibility(characterType: string, weaponType: string | null): Decision {
  const truth: Truth =
    !weaponType || !characterType ? 'unknown' : characterType === weaponType ? 'true' : 'false';
  return {
    id: 'weapon-compatibility',
    code: weaponType ? 'compatibility' : 'missing_weapon',
    state: weaponType ? state(truth) : 'unavailable',
    conditions: [{ key: 'weapon_type_matches', truth }],
    values: { characterType, weaponType },
  };
}
export function pieceBounds(
  assignments: { slot: string; set: string }[],
  consistent: boolean,
  set: string,
): Bounds {
  const slots = ['flower', 'plume', 'sands', 'goblet', 'circlet'];
  if (
    !consistent ||
    assignments.some((a) => !slots.includes(a.slot)) ||
    new Set(assignments.map((a) => a.slot)).size !== assignments.length
  )
    return { min: 0, max: 5 };
  const min = assignments.filter((a) => a.set === set).length;
  return { min, max: min + 5 - assignments.length };
}
export function evaluateSet(key: string, bounds: Bounds, modeled: boolean): Decision[] {
  const pieces: Decision = {
    id: key + '-pieces',
    code: 'piece_count',
    state: bounds.min === bounds.max ? 'applies' : 'conditional',
    conditions: [],
    values: { min: bounds.min, max: bounds.max },
  };
  if (!modeled)
    return [
      pieces,
      { id: key + '-effects', code: 'source_only', state: 'reference', conditions: [], values: {} },
    ];
  const decisions = [
    pieces,
    ...[2, 4].map((count): Decision => {
      const eligibility = atLeast(bounds, count);
      // Only the reviewed two-piece effects are unconditional. Four-piece
      // activation/window/stack state is never available from equipment imports.
      const conditions: Condition[] = [
        { key: 'at_least_' + count + '_pieces', truth: eligibility },
      ];
      if (count === 4 && key !== 'GoldenTroupe') {
        const required: Record<string, string[]> = {
          DeepwoodMemories: ['skill_or_burst_hits_opponent', 'target_debuff_within_8_seconds'],
          GildedDreams: [
            'wearer_triggers_reaction',
            'reaction_buff_within_8_seconds',
            'other_party_elements_known',
          ],
          MarechausseeHunter: ['hp_changed_within_5_seconds', 'active_stack_count_known'],
        };
        for (const condition of required[key] ?? ['unmodeled_activation'])
          conditions.push({ key: condition, truth: 'unknown' });
      }
      return {
        id: key + '-' + count,
        code: 'passive',
        state: state(all(conditions.map((c) => c.truth))),
        conditions,
        values: { pieces: count },
      };
    }),
  ];
  if (key === 'GoldenTroupe')
    decisions.push({
      id: key + '-field-bonus',
      code: 'passive',
      state: state(all([atLeast(bounds, 4), 'unknown'])),
      conditions: [
        { key: 'at_least_4_pieces', truth: atLeast(bounds, 4) },
        { key: 'off_field_or_returned_within_2_seconds', truth: 'unknown' },
      ],
      values: { pieces: 4 },
    });
  return decisions;
}
export function evaluateHarbinger(
  refinement: number | null,
  compatible: Truth,
  hpPercent: number | null = null,
): Decision {
  const rank =
    refinement !== null && Number.isInteger(refinement) && refinement >= 1 && refinement <= 5
      ? refinement
      : null;
  const conditions: Condition[] = [
    { key: 'weapon_type_matches', truth: compatible },
    { key: 'refinement_known', truth: rank === null ? 'unknown' : 'true' },
    {
      key: 'hp_above_90_percent',
      truth:
        hpPercent === null || !Number.isFinite(hpPercent) || hpPercent < 0 || hpPercent > 100
          ? 'unknown'
          : hpPercent > 90
            ? 'true'
            : 'false',
    },
  ];
  const truth = all(conditions.map((c) => c.truth));
  const potential = rank === null ? null : [14, 17.5, 21, 24.5, 28][rank - 1]!;
  return {
    id: 'harbinger-hp-passive',
    code: 'passive',
    state: state(truth),
    conditions,
    values: {
      refinement: rank,
      potentialCritRatePp: potential,
      activeCritRatePp: truth === 'true' ? potential : truth === 'false' ? 0 : null,
    },
  };
}
