import type {
  TheaterCandidate,
  TheaterCastRequest,
  TheaterCastResult,
} from '@celestia/api-contracts';

export const THEATER_CAST_CUTOFFS = { EASY: 10, NORMAL: 14, HARD: 18, VISIONARY: 22 } as const;
export interface TheaterRosterEntry {
  characterKey: string;
  level: number;
  element: string | null;
  identity?: string;
}
/** User-requested planning preset. No I/O, clock, season inference, or trial ownership assumptions. */
export function calculateTheaterCast(
  roster: readonly TheaterRosterEntry[],
  rules: TheaterCastRequest,
): TheaterCastResult {
  const identities = new Map<string, TheaterCandidate>();
  const candidates: TheaterCandidate[] = [];
  for (const character of roster) {
    const identity = character.identity ?? character.characterKey;
    const badge = rules.openingKeys.includes(character.characterKey)
      ? 'opening'
      : rules.guestKeys.includes(character.characterKey)
        ? 'guest'
        : 'qualified';
    const element =
      character.element === 'Adaptive' ? (rules.travelerElement ?? null) : character.element;
    const reasons: TheaterCandidate['reasons'] = [];
    if (character.level < 70) reasons.push('level');
    if (badge === 'qualified') {
      if (!element) reasons.push('unknown_element');
      else if (!rules.elements.some((allowed) => allowed === element)) reasons.push('element');
    }
    const candidate: TheaterCandidate = {
      characterKey: character.characterKey,
      level: character.level,
      element,
      badge,
      eligible: reasons.length === 0,
      reasons,
    };
    const previous = identities.get(identity);
    const rank = (c: TheaterCandidate) =>
      Number(c.eligible) * 2 + Number(rules.selectedKeys.includes(c.characterKey));
    if (!previous || rank(candidate) > rank(previous)) identities.set(identity, candidate);
  }
  candidates.push(...identities.values());
  const qualified = new Set(candidates.filter((c) => c.eligible).map((c) => c.characterKey));
  const selectedKeys = [...new Set(rules.selectedKeys)].filter((key) => qualified.has(key));
  const invalidSelectedKeys = [...new Set(rules.selectedKeys)].filter((key) => !qualified.has(key));
  const required = THEATER_CAST_CUTOFFS[rules.difficulty];
  return {
    candidates,
    required,
    qualifiedCount: qualified.size,
    selectedKeys,
    invalidSelectedKeys,
    ready: selectedKeys.length >= required && invalidSelectedKeys.length === 0,
  };
}
