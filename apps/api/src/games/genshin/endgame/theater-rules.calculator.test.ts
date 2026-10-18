import { type TheaterCastRequest, theaterCastRequestSchema } from '@celestia/api-contracts';
import { describe, expect, it } from 'vitest';

import { calculateTheaterCast } from './theater-rules.calculator.js';
const rules: TheaterCastRequest = {
  difficulty: 'EASY',
  elements: ['Pyro', 'Hydro', 'Electro'],
  openingKeys: [],
  guestKeys: [],
  selectedKeys: [],
};
describe('Theater planning cast calculator', () => {
  it('enforces the level 70 boundary and all three allowed elements', () => {
    const { candidates } = calculateTheaterCast(
      [
        { characterKey: 'Low', level: 69, element: 'Pyro' },
        { characterKey: 'Ready', level: 70, element: 'Hydro' },
        { characterKey: 'Wrong', level: 90, element: 'Cryo' },
      ],
      rules,
    );
    expect(candidates.map((c) => [c.eligible, c.reasons])).toEqual([
      [false, ['level']],
      [true, []],
      [false, ['element']],
    ]);
  });
  it('opening and guest characters bypass elements, while level cutoff still applies', () => {
    const result = calculateTheaterCast(
      [
        { characterKey: 'Opening', level: 70, element: 'Cryo' },
        { characterKey: 'Guest', level: 70, element: 'Geo' },
        { characterKey: 'LowOpening', level: 69, element: 'Cryo' },
      ],
      { ...rules, openingKeys: ['Opening', 'LowOpening'], guestKeys: ['Guest'] },
    );
    expect(result.candidates.map((c) => [c.badge, c.eligible])).toEqual([
      ['opening', true],
      ['guest', true],
      ['opening', false],
    ]);
  });
  it.each([
    ['EASY', 10],
    ['NORMAL', 14],
    ['HARD', 18],
    ['VISIONARY', 22],
  ] as const)('%s requires %s distinct qualified selected characters', (difficulty, required) => {
    const roster = Array.from({ length: required }, (_, i) => ({
      characterKey: `C${i}`,
      level: 70,
      element: 'Pyro',
    }));
    const selectedKeys = roster.map((c) => c.characterKey);
    expect(calculateTheaterCast(roster, { ...rules, difficulty, selectedKeys })).toMatchObject({
      required,
      ready: true,
    });
    expect(
      calculateTheaterCast(roster, { ...rules, difficulty, selectedKeys: selectedKeys.slice(1) })
        .ready,
    ).toBe(false);
  });
  it('deduplicates identities, ignores unowned trials and rejects invalid selections', () => {
    const roster = [
      { characterKey: 'TravelerGeo', identity: 'Traveler', level: 90, element: 'Geo' },
      { characterKey: 'TravelerPyro', identity: 'Traveler', level: 90, element: 'Pyro' },
    ];
    const result = calculateTheaterCast(roster, {
      ...rules,
      openingKeys: ['UnownedTrial'],
      selectedKeys: ['TravelerGeo', 'TravelerPyro', 'UnownedTrial', 'UnownedTrial'],
    });
    expect(result.candidates).toHaveLength(1);
    expect(result.qualifiedCount).toBe(1);
    expect(result.selectedKeys).toEqual(['TravelerPyro']);
    expect(result.invalidSelectedKeys).toHaveLength(2);
  });
  it('does not infer unknown or adaptive elements, and accepts explicitly supplied Traveler element', () => {
    const roster = [
      { characterKey: 'Aether', level: 90, element: 'Adaptive' },
      { characterKey: 'Unknown', level: 90, element: null },
    ];
    expect(calculateTheaterCast(roster, rules).qualifiedCount).toBe(0);
    expect(calculateTheaterCast(roster, { ...rules, travelerElement: 'Pyro' }).qualifiedCount).toBe(
      1,
    );
  });
  it('does not mutate inputs and duplicate selections count once', () => {
    const roster = Object.freeze([
      Object.freeze({ characterKey: 'Bennett', level: 80, element: 'Pyro' }),
    ]);
    const input = { ...rules, selectedKeys: ['Bennett', 'Bennett'] };
    expect(calculateTheaterCast(roster, input).selectedKeys).toEqual(['Bennett']);
    expect(input.selectedKeys).toHaveLength(2);
  });
  it('rejects duplicate elements, malformed cutoffs and excessive scenario exceptions at the boundary', () => {
    for (const override of [
      { elements: ['Pyro', 'Pyro', 'Hydro'] },
      { elements: ['Pyro'] },
      { difficulty: 'INVENTED' },
      { openingKeys: Array(7).fill('Bennett') },
      { userId: 'another-user' },
    ])
      expect(theaterCastRequestSchema.safeParse({ ...rules, ...override }).success).toBe(false);
  });
});
