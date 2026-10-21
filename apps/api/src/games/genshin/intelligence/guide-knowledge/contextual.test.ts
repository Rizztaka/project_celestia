import {
  artifactSlots,
  type CharacterEquipmentResponse,
  contextualQuerySchema,
  contextualScenarioSchema,
  contextualSets,
} from '@celestia/api-contracts';
import { describe, expect, it, vi } from 'vitest';

import {
  buildContextualFacts,
  calculateContextualAdvice,
  evaluateContextPredicate,
  type Facts,
  setPieceBounds,
  type TeamMember,
} from './contextual.calculator.js';
import { contextualKnowledgePack as pack } from './contextual.data.js';
import { explainContextualAdvice } from './contextual.explainer.js';
import type { ContextPredicate } from './contextual.pack.js';

vi.mock('@/core/db/prisma.js', () => ({ prisma: {} }));
import { ContextualAdviceService } from './contextual.service.js';

const receipt = {
  status: 'unknown' as const,
  importedAt: null,
  source: null,
  entryCount: null,
  scope: 'replacement_section' as const,
};
function equipment(key = 'Keqing', sets: string[] = []): CharacterEquipmentResponse {
  return {
    contractVersion: 1,
    character: {
      characterKey: key,
      level: 80,
      ascension: 6,
      constellation: 0,
      talents: { normal: 1, skill: 8, burst: 6 },
      talentBasis: 'stored_convention_unknown',
    },
    weapon: { state: 'unknown', item: null, reason: 'provenance_unknown' },
    provenance: {
      characters: { ...receipt, scope: 'merged_entries' },
      weapons: receipt,
      artifacts: receipt,
    },
    artifacts: Object.fromEntries(
      artifactSlots.map((slot, index) => [
        slot,
        sets[index]
          ? {
              state: 'recorded_assigned',
              item: {
                setKey: sets[index],
                slotKey: slot,
                level: 20,
                rarity: 5,
                mainStatKey: 'opaque',
                mainStatValue: null,
                subStats: [],
                locked: false,
              },
            }
          : { state: 'unrecorded', item: null, reason: 'no_recorded_assignment' },
      ]),
    ) as CharacterEquipmentResponse['artifacts'],
    unrecognizedSlots: [],
    artifactRelationsConsistent: true,
  };
}
const scenario = (extra: Record<string, unknown> = {}) =>
  contextualScenarioSchema.parse({ contractVersion: '2', ...extra });
const member = (
  characterKey: string,
  selection: 'owned' | 'hypothetical' = 'owned',
  ascension: number | null = 6,
): TeamMember => ({
  characterKey,
  selection,
  origin: selection === 'owned' ? 'recorded' : 'assumed',
  ascension: selection === 'owned' ? ascension : null,
});
const calculate = (
  key = 'Keqing',
  extra: Record<string, unknown> = {},
  sets: string[] = [],
  team = [member(key)],
) => calculateContextualAdvice(pack, equipment(key, sets), scenario(extra), team);
const card = (result: ReturnType<typeof calculate>, id: string) =>
  result.cards.find((entry) => entry.id === id)!;
const mh = Array(4).fill('MarechausseeHunter'),
  gt = Array(4).fill('GoldenTroupe'),
  vv = Array(4).fill('ViridescentVenerer');
describe('K2 multi-claim contextual evaluator', () => {
  it('retains lower/upper bounds for missing, unrecorded and inconsistent slots', () => {
    const partial = equipment('Keqing', mh.slice(0, 2));
    expect(setPieceBounds(partial, 'MarechausseeHunter')).toEqual({ min: 2, max: 5 });
    expect(card(calculate('Keqing', {}, mh.slice(0, 2)), 'mh-two-piece').eligibility).toBe('true');
    expect(card(calculate('Keqing', {}, mh.slice(0, 2)), 'mh-four-piece-stacks').eligibility).toBe(
      'unknown',
    );
    expect(
      card(
        calculate('Keqing', {}, [...mh.slice(0, 2), 'Other', 'Other', 'Other']),
        'mh-four-piece-stacks',
      ).eligibility,
    ).toBe('false');
    expect(setPieceBounds(equipment(), 'GoldenTroupe')).toEqual({ min: 0, max: 5 });
    partial.artifactRelationsConsistent = false;
    expect(setPieceBounds(partial, 'MarechausseeHunter')).toEqual({ min: 0, max: 5 });
  });
  it('keeps hypothetical exact pieces separate from recorded evidence and never mutates it', () => {
    const input = equipment();
    const copy = structuredClone(input);
    const result = calculateContextualAdvice(
      pack,
      input,
      scenario({ setExample: 'GoldenTroupe', examplePieces: '4' }),
      [member('Keqing')],
    );
    expect(result.setBounds[1]).toEqual({
      setKey: 'GoldenTroupe',
      recorded: { min: 0, max: 5 },
      modeled: { min: 4, max: 4 },
      origin: 'assumed',
    });
    expect(input).toEqual(copy);
    expect(
      card(calculate('Keqing', { setExample: 'GoldenTroupe' }), 'gt-two-piece').eligibility,
    ).toBe('unknown');
  });
  it.each(
    contextualSets.flatMap((setKey) =>
      ['0', '1', '2', '3', '4', '5', 'unknown'].map((count) => [setKey, count] as const),
    ),
  )(
    'keeps unspecified hypothetical slots bounded for %s=%s with complete traces and no mutation',
    (selected, count) => {
      const input = equipment('KaedeharaKazuha', [...mh, 'GoldenTroupe']);
      const before = structuredClone(input);
      const assumptions = scenario({ setExample: selected, examplePieces: count });
      const result = calculateContextualAdvice(pack, input, assumptions, [
        member('KaedeharaKazuha'),
      ]);
      for (const [index, setKey] of contextualSets.entries()) {
        const modeled =
          count === 'unknown'
            ? { min: 0, max: 5 }
            : setKey === selected
              ? { min: Number(count), max: Number(count) }
              : { min: 0, max: 5 - Number(count) };
        const origin = count === 'unknown' ? 'unknown' : 'assumed';
        expect(result.setBounds[index]).toEqual({
          setKey,
          recorded: setPieceBounds(before, setKey),
          modeled,
          origin,
        });
        const eligibility = modeled.min >= 2 ? 'true' : modeled.max < 2 ? 'false' : 'unknown';
        const id = ['mh-two-piece', 'gt-two-piece', 'vv-two-piece'][index];
        const component = card(result, id);
        const leaf = {
          op: 'atLeast',
          fact: `set.${setKey}`,
          value: modeled,
          expected: 2,
          origin,
          result: eligibility,
        };
        expect(component).toMatchObject({
          eligibility,
          applicability: eligibility,
          conclusion:
            eligibility === 'true'
              ? 'applies'
              : eligibility === 'false'
                ? 'inactive'
                : 'conditional',
          modeledAmount:
            eligibility === 'true'
              ? component.potential!.amount
              : eligibility === 'false'
                ? 0
                : null,
          sourceIds: pack.claims.find((claim) => claim.id === id)!.sourceIds,
        });
        expect(component.trace).toEqual([
          { ...leaf, path: 'eligibility' },
          { ...leaf, path: 'applicability.0' },
          { ...leaf, path: 'applicability.1' },
          {
            path: 'applicability',
            op: 'all',
            fact: null,
            value: null,
            expected: null,
            origin,
            result: eligibility,
          },
        ]);
        const explained = explainContextualAdvice(result).find((entry) => entry.id === id)!;
        if (eligibility === 'unknown') expect(explained.summary).toContain('Conditional');
      }
      expect(input).toEqual(before);
      expect(
        calculateContextualAdvice(pack, input, assumptions, [member('KaedeharaKazuha')]),
      ).toEqual(result);
    },
  );
  const baseFacts = buildContextualFacts(equipment(), scenario(), [member('Keqing')]).facts;
  const leaves: Record<string, ContextPredicate> = {
    true: { op: 'known', fact: 'set.GoldenTroupe' },
    false: { op: 'known', fact: 'role' },
    unknown: { op: 'equals', fact: 'role', value: 'on_field' },
  };
  for (const a of ['true', 'false', 'unknown'])
    for (const b of ['true', 'false', 'unknown'])
      it(`all/any ${a}/${b} with composite traces`, () => {
        const trace: Parameters<typeof evaluateContextPredicate>[3] = [];
        expect(
          evaluateContextPredicate(
            { op: 'all', args: [leaves[a], leaves[b]] },
            baseFacts,
            'root',
            trace,
          ),
        ).toBe(
          [a, b].includes('false') ? 'false' : [a, b].includes('unknown') ? 'unknown' : 'true',
        );
        expect(trace.at(-1)?.op).toBe('all');
        expect(trace).toHaveLength(3);
        expect(
          evaluateContextPredicate({ op: 'any', args: [leaves[a], leaves[b]] }, baseFacts),
        ).toBe([a, b].includes('true') ? 'true' : [a, b].includes('unknown') ? 'unknown' : 'false');
      });
  it.each(['true', 'false', 'unknown'])(
    'negates %s while retaining child and negation result',
    (value) => {
      const trace: Parameters<typeof evaluateContextPredicate>[3] = [];
      expect(
        evaluateContextPredicate({ op: 'not', arg: leaves[value] }, baseFacts, 'root', trace),
      ).toBe(value === 'unknown' ? 'unknown' : value === 'true' ? 'false' : 'true');
      expect(trace.map((entry) => entry.op)).toEqual([leaves[value].op, 'not']);
      expect(trace[0].result).toBe(value);
      expect(trace[1].path).toBe('root');
    },
  );
  it('evaluates contradictions and known-false distinctly from unknown facts', () => {
    expect(
      evaluateContextPredicate(
        { op: 'all', args: [leaves.true, { op: 'not', arg: leaves.true }, leaves.unknown] },
        baseFacts,
      ),
    ).toBe('false');
    const facts: Facts = { ...baseFacts, 'mh.hpChange': { value: false, origin: 'assumed' } };
    expect(
      evaluateContextPredicate({ op: 'equals', fact: 'mh.hpChange', value: true }, facts),
    ).toBe('false');
    expect(
      evaluateContextPredicate({ op: 'equals', fact: 'mh.hpChange', value: true }, baseFacts),
    ).toBe('unknown');
  });
  it.each([0, 1, 2, 3])('models only selected active MH stacks %s', (stacks) => {
    const result = calculate(
      'Keqing',
      { hpChange: 'yes', mhOnField: 'yes', mhStacks: String(stacks), mhWindow: 'within_5s' },
      mh,
    );
    expect(card(result, 'mh-four-piece-stacks')).toMatchObject({
      modeledAmount: stacks * 12,
      eligibility: 'true',
      potential: { amount: stacks * 12, maximum: 36, unit: 'crit_rate_percentage_points' },
    });
  });
  it.each([
    { hpChange: 'unknown' },
    { mhOnField: 'unknown' },
    { mhWindow: 'unknown' },
    { mhStacks: 'unknown' },
  ])('retains unknown MH activation %j', (extra) => {
    expect(
      card(
        calculate(
          'Keqing',
          { hpChange: 'yes', mhOnField: 'yes', mhStacks: '3', mhWindow: 'within_5s', ...extra },
          mh,
        ),
        'mh-four-piece-stacks',
      ),
    ).toMatchObject({ applicability: 'unknown', modeledAmount: null });
  });
  it.each([{ hpChange: 'no' }, { mhOnField: 'no' }, { mhWindow: 'expired' }])(
    'does not activate MH under contradicted triggers %j',
    (extra) => {
      expect(
        card(
          calculate(
            'Keqing',
            { hpChange: 'yes', mhOnField: 'yes', mhStacks: '3', mhWindow: 'within_5s', ...extra },
            mh,
          ),
          'mh-four-piece-stacks',
        ).modeledAmount,
      ).toBe(0);
    },
  );
  it.each([
    ['unknown', null],
    ['off_field', 25],
    ['returned_under_2s_with_bonus', 25],
    ['on_field_at_least_2s', 0],
  ])('separates GT conditional timing %s from base components', (gtField, amount) => {
    const result = calculate('Fischl', { gtField }, gt);
    expect(card(result, 'gt-two-piece').modeledAmount).toBe(20);
    expect(card(result, 'gt-four-piece-base').modeledAmount).toBe(25);
    expect(card(result, 'gt-four-piece-field').modeledAmount).toBe(amount);
  });
  const swirl = {
    swirl: 'yes',
    swirlElement: 'electro',
    targetElement: 'electro',
    vvOnField: 'yes',
    vvWindow: 'within_10s',
  };
  it('models VV matching ordinary Swirl resistance with its own unit, not damage', () => {
    expect(card(calculate('KaedeharaKazuha', swirl, vv), 'vv-four-piece-resistance')).toMatchObject(
      {
        applicability: 'true',
        modeledAmount: 40,
        potential: { unit: 'resistance_percentage_points', target: 'electro', durationSeconds: 10 },
      },
    );
    expect(
      card(calculate('KaedeharaKazuha', swirl, vv), 'vv-four-piece-swirl').potential?.unit,
    ).toBe('damage_bonus_percent');
  });
  it.each([
    { targetElement: 'hydro' },
    { swirlElement: 'dendro', targetElement: 'dendro' },
    { vvOnField: 'no' },
    { vvWindow: 'expired' },
    { swirl: 'no' },
  ])('does not guarantee VV resistance when %j', (extra) => {
    expect(
      card(calculate('KaedeharaKazuha', { ...swirl, ...extra }, vv), 'vv-four-piece-resistance')
        .modeledAmount,
    ).toBe(0);
  });
  it('does not infer a matching Swirl or ongoing uptime from member selection', () => {
    expect(
      card(
        calculate(
          'KaedeharaKazuha',
          { team: [{ characterKey: 'Keqing', selection: 'owned' }] },
          vv,
        ),
        'vv-four-piece-resistance',
      ).applicability,
    ).toBe('unknown');
  });
  it('changes role relevance for Fischl and retains Kazuha plunge relevance without talent deficits', () => {
    const off = explainContextualAdvice(calculate('Fischl', { role: 'off_field' }));
    const on = explainContextualAdvice(calculate('Fischl', { role: 'on_field' }));
    expect(off.find((entry) => entry.id === 'talent-oz-off-field')).toMatchObject({
      presentation: 'card',
      effect: { relevant: ['skill'] },
    });
    expect(on.find((entry) => entry.id === 'talent-on-field')).toMatchObject({
      presentation: 'card',
      effect: { relevant: ['normal', 'skill'] },
    });
    expect(off.find((entry) => entry.id === 'talent-oz-off-field')?.summary).toContain(
      'not automatically neglect',
    );
    expect(
      explainContextualAdvice(calculate('KaedeharaKazuha', { role: 'quickswap_support' })).find(
        (entry) => entry.id === 'talent-support-plunge',
      )?.summary,
    ).toContain('Plunging Attack');
  });
  it.each(['unknown', 'use', 'skip'])(
    'changes Kazuha qualitative Burst/energy context %s',
    (burst) => {
      const cards = explainContextualAdvice(
        calculate('KaedeharaKazuha', { role: 'quickswap_support', burst }),
      );
      const energy = cards.filter(
        (entry) => entry.topic === 'energy' && entry.presentation === 'card',
      );
      expect(energy).toHaveLength(1);
      expect(energy[0].effect).toMatchObject({ plan: burst });
      expect(energy[0].explanation).toContain('No personalized numeric ER target');
      expect(energy[0].modeledAmount).toBeNull();
    },
  );
  it('requires Fischl A4 unlock, Oz, selected reactor and reaction beyond membership', () => {
    const team = [member('Keqing'), member('Fischl')];
    const extra = {
      team: [{ characterKey: 'Fischl', selection: 'owned' }],
      activeCharacter: 'Keqing',
      oz: 'yes',
      electroReaction: 'yes',
    };
    expect(
      card(calculate('Keqing', extra, [], team), 'team-fischl-oz-reaction').applicability,
    ).toBe('true');
    expect(
      card(calculate('Keqing', { ...extra, oz: 'unknown' }, [], team), 'team-fischl-oz-reaction')
        .applicability,
    ).toBe('unknown');
    expect(
      card(
        calculate('Keqing', extra, [], [member('Keqing'), member('Fischl', 'owned', 3)]),
        'team-fischl-oz-reaction',
      ).applicability,
    ).toBe('false');
    expect(
      card(
        calculate('Keqing', { ...extra, team: [] }, [], [member('Keqing')]),
        'team-fischl-oz-reaction',
      ).applicability,
    ).toBe('false');
    const examples = [member('Keqing'), member('Fischl', 'hypothetical')];
    expect(
      card(
        calculate(
          'Keqing',
          { ...extra, team: [{ characterKey: 'Fischl', selection: 'hypothetical' }] },
          [],
          examples,
        ),
        'team-fischl-oz-reaction',
      ).applicability,
    ).toBe('unknown');
    expect(
      card(
        calculate(
          'Keqing',
          {
            ...extra,
            team: [{ characterKey: 'Fischl', selection: 'hypothetical' }],
            exampleFischlA4: 'unlocked',
          },
          [],
          examples,
        ),
        'team-fischl-oz-reaction',
      ).applicability,
    ).toBe('true');
  });
  it('evaluates all relevant claims in stable order, exposes origins and excludes unsupported claims', () => {
    const input = equipment();
    const assumptions = scenario({
      setExample: 'GoldenTroupe',
      examplePieces: '4',
      gtField: 'off_field',
    });
    const first = calculateContextualAdvice(pack, input, assumptions, [member('Keqing')]);
    const shuffled = { ...pack, claims: [...pack.claims].reverse() };
    expect(calculateContextualAdvice(shuffled, input, assumptions, [member('Keqing')])).toEqual(
      first,
    );
    expect(
      first.cards
        .find((entry) => entry.id === 'gt-four-piece-field')
        ?.trace.some((entry) => entry.origin === 'assumed' && entry.value === 'off_field'),
    ).toBe(true);
    expect(first.excluded).toHaveLength(1);
    expect(first.cards.some((entry) => entry.id === first.excluded[0].id)).toBe(false);
    const before = structuredClone(first);
    explainContextualAdvice(first);
    expect(first).toEqual(before);
  });
  it('normalizes member ordering/fingerprints and ignores unrelated routine/progression changes', async () => {
    const subject = equipment();
    const read = vi.fn(async () => [subject, equipment('Fischl'), equipment('KaedeharaKazuha')]);
    const service = new ContextualAdviceService({ read });
    const team = [
      { characterKey: 'Fischl', selection: 'owned' },
      { characterKey: 'KaedeharaKazuha', selection: 'owned' },
    ];
    const a = await service.read('owner', 'Keqing', {
      contractVersion: '2',
      team: JSON.stringify(team),
    });
    subject.character.level = 90;
    const b = await service.read('owner', 'Keqing', {
      contractVersion: '2',
      team: JSON.stringify([...team].reverse()),
    });
    expect(a).toEqual(b);
    expect(read).toHaveBeenLastCalledWith('owner', ['Fischl', 'KaedeharaKazuha', 'Keqing']);
    expect(
      (await service.read('owner', 'Keqing', { contractVersion: '2', role: 'on_field' }))
        .fingerprint,
    ).not.toBe(a.fingerprint);
  });
  it.each([
    { contractVersion: '1' },
    { contractVersion: '2', mhStacks: '4' },
    { contractVersion: '2', examplePieces: '4' },
    { contractVersion: '2', hpChange: ['yes', 'no'] },
    { contractVersion: '2', team: '{bad' },
    { contractVersion: '2', userId: 'foreign' },
  ])('rejects invalid/duplicate query shape %j', (query) =>
    expect(contextualQuerySchema.safeParse(query).success).toBe(false),
  );
});
